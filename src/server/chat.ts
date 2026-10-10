import { env } from 'cloudflare:workers'
import {
  convertToModelMessages,
  createGateway,
  streamText,
  stepCountIs,
  validateUIMessages,
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
import {
  assertSameOrigin,
  getSession,
  hash,
  intakeAvailable,
  intakeRequest,
  readJson,
} from './intake'

const failure = (code: string, status: number) =>
  Response.json(
    { error: code },
    { status, headers: { 'Cache-Control': 'no-store' } },
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
      onError: () =>
        'The assistant couldn’t finish its response. Please retry.',
    })
  } catch (error) {
    const limited =
      error instanceof Error && error.message.includes('Too many requests')
    console.error('Chat request failed.', {
      category: limited ? 'rate-limit' : 'unavailable',
    })
    return failure(
      limited ? 'RATE_LIMIT' : 'ASSISTANT_UNAVAILABLE',
      limited ? 429 : 503,
    )
  }
}
