import { env, waitUntil } from 'cloudflare:workers'
import {
  convertToModelMessages,
  createGateway,
  streamText,
  stepCountIs,
  validateUIMessages,
  type UIMessage,
  consumeStream,
} from 'ai'
import { fetchPublishedContent } from './content'
import {
  chatInstructions,
  chatContext,
  conversationError,
  createChatTools,
} from './chat-policy'
import { chatLimits, type preparedInquirySchema } from '../../shared/chat'
import type { z } from 'zod'
import { verifyTurnstile } from './turnstile'
import {
  assertSameOrigin,
  getSession,
  hash,
  intakeAvailable,
  intakeRequest,
  readJson,
} from './intake'

const failure = (code: string, status: number, revision?: number) =>
  Response.json(
    { error: code },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...(revision === undefined
          ? {}
          : { 'X-QD-Revision': String(revision) }),
      },
    },
  )

export async function handleChat(request: Request) {
  try {
    assertSameOrigin(request)
  } catch {
    return new Response('Forbidden', { status: 403 })
  }
  if (!intakeAvailable()) return failure('ASSISTANT_UNAVAILABLE', 503)
  const session = getSession(request)
  if (!session) return failure('SESSION_EXPIRED', 401)
  const sessionHash = await hash(session)
  const tools = createChatTools({
    loadContent: fetchPublishedContent,
    prepareInquiry: (details) =>
      intakeRequest<z.infer<typeof preparedInquirySchema>>({
        operation: 'prepare',
        sessionHash,
        details,
      }),
  })
  let messages
  let revision = 0
  let generationRevision: number | undefined
  try {
    const body = await readJson(request)
    if (
      !body ||
      typeof body !== 'object' ||
      !('messages' in body) ||
      !Array.isArray(body.messages)
    )
      return failure('INVALID_CONVERSATION', 400)
    if (body.messages.length > chatLimits.messages)
      return failure('CONVERSATION_LIMIT', 413)
    messages = await validateUIMessages({ messages: body.messages, tools })
    const invalid = conversationError(messages)
    if (invalid)
      return failure(invalid, invalid === 'CONVERSATION_LIMIT' ? 413 : 400)
    if (
      !('revision' in body) ||
      !Number.isSafeInteger(body.revision) ||
      Number(body.revision) < 0
    )
      return failure('CONVERSATION_CHANGED', 409)
    revision = Number(body.revision)
    if (
      !(await verifyTurnstile(
        request,
        'turnstileToken' in body ? body.turnstileToken : undefined,
      ))
    )
      return failure('VERIFICATION_FAILED', 403)
  } catch (error) {
    return failure(
      error instanceof Error && error.message === 'Request too large'
        ? 'CONVERSATION_LIMIT'
        : 'INVALID_CONVERSATION',
      error instanceof Error && error.message === 'Request too large'
        ? 413
        : 400,
    )
  }
  try {
    await intakeRequest({
      operation: 'rate',
      ipHash: await hash(
        `${env.INTAKE_BRIDGE_SECRET}:${request.headers.get('CF-Connecting-IP') ?? 'local'}`,
      ),
    })
    const content = await fetchPublishedContent()
    const saved = await intakeRequest<{
      revision: number
      messages: UIMessage[]
    }>({
      operation: 'conversation-begin',
      sessionHash,
      revision,
      messages: JSON.stringify(messages),
    })
    revision = saved.revision
    generationRevision = revision
    messages = saved.messages
    const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY })
    const result = streamText({
      model: gateway(env.AI_MODEL!),
      system: `${chatInstructions}\nPublished context: ${JSON.stringify(chatContext(content))}`,
      messages: await convertToModelMessages(messages, {
        tools,
        ignoreIncompleteToolCalls: true,
      }),
      tools,
      stopWhen: stepCountIs(4),
      maxOutputTokens: 1000,
      maxRetries: 1,
      providerOptions:
        env.AI_MODEL === 'google/gemini-2.5-flash'
          ? { google: { thinkingConfig: { thinkingBudget: 0 } } }
          : undefined,
      abortSignal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(45_000),
      ]),
      onError: () =>
        console.error('Chat generation failed.', { model: env.AI_MODEL }),
    })
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: () => crypto.randomUUID(),
      headers: {
        'X-QD-Revision': String(revision),
        'Cache-Control': 'no-store',
      },
      onFinish: async ({ responseMessage }) => {
        await intakeRequest({
          operation: 'conversation-finish',
          sessionHash,
          revision,
          message: JSON.stringify(responseMessage),
        })
      },
      consumeSseStream: ({ stream }) =>
        waitUntil(
          consumeStream({ stream }).catch(() => {
            console.error('Chat persistence stream failed.')
          }),
        ),
      onError: () =>
        'The assistant couldn’t finish its response. Please retry.',
    })
  } catch (error) {
    if (generationRevision !== undefined) {
      try {
        await intakeRequest({
          operation: 'conversation-finish',
          sessionHash,
          revision: generationRevision,
        })
      } catch {
        console.error('Chat generation lease could not be released.')
      }
    }
    const code = error instanceof Error ? error.message : ''
    if (
      [
        'CONVERSATION_CHANGED',
        'CONVERSATION_BUSY',
        'CONVERSATION_LIMIT',
      ].includes(code)
    )
      return failure(code, code === 'CONVERSATION_LIMIT' ? 413 : 409)
    const limited =
      error instanceof Error && error.message.includes('Too many requests')
    console.error('Chat request failed.', {
      category: limited ? 'rate-limit' : 'unavailable',
    })
    return failure(
      limited ? 'RATE_LIMIT' : 'ASSISTANT_UNAVAILABLE',
      limited ? 429 : 503,
      generationRevision,
    )
  }
}
