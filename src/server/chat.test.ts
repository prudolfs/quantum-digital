import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('cloudflare:workers', () => ({
  env: {
    AI_GATEWAY_API_KEY: 'test-only-key',
    AI_MODEL: 'google/gemini-2.5-flash',
    INTAKE_BRIDGE_SECRET: 'test-only-bridge-secret-over-32-characters',
  },
}))
vi.mock('./content', () => ({ fetchPublishedContent: vi.fn() }))
vi.mock('./intake', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./intake')>()),
  intakeAvailable: () => true,
  intakeRequest: vi.fn(),
}))
import { handleChat } from './chat'
import { intakeRequest } from './intake'

const message = {
  id: 'user',
  role: 'user',
  parts: [{ type: 'text', text: 'Explain your work' }],
}
function request(messages: unknown, extra: Record<string, string> = {}) {
  return new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
      Cookie: `qd-intake=${'a'.repeat(64)}`,
      ...extra,
    },
    body: JSON.stringify({ messages, revision: 0 }),
  })
}
beforeEach(() => vi.clearAllMocks())
describe('chat request validation before provider or storage calls', () => {
  it('blocks unverified visitors before saving messages or requesting a model response', async () => {
    const response = await handleChat(request([message]))
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'VERIFICATION_FAILED' })
    expect(intakeRequest).not.toHaveBeenCalled()
  })
  it('rejects cross-origin requests and expired sessions', async () => {
    expect(
      (
        await handleChat(
          request([message], { Origin: 'https://other.example' }),
        )
      ).status,
    ).toBe(403)
    const expired = await handleChat(request([message], { Cookie: '' }))
    expect(expired.status).toBe(401)
    expect(await expired.json()).toEqual({ error: 'SESSION_EXPIRED' })
    expect(intakeRequest).not.toHaveBeenCalled()
  })
  it.each(
    [
      [],
      [{ ...message, role: 'system' }],
      [{ ...message, parts: [{ type: 'text', text: '   ' }] }],
      [
        {
          ...message,
          parts: [
            {
              type: 'file',
              mediaType: 'text/plain',
              url: 'https://example.com',
            },
          ],
        },
      ],
      [
        {
          ...message,
          parts: [
            { type: 'text', text: 'a'.repeat(1500) },
            { type: 'text', text: 'b'.repeat(1500) },
          ],
        },
      ],
    ].map((messages) => ({ messages })),
  )('rejects malformed or unsupported messages', async ({ messages }) => {
    expect((await handleChat(request(messages))).status).toBe(400)
    expect(intakeRequest).not.toHaveBeenCalled()
  })
  it('returns an actionable limit before charging for an oversized conversation', async () => {
    for (const messages of [
      Array.from({ length: 41 }, (_, i) => ({ ...message, id: String(i) })),
      [
        {
          id: 'huge',
          role: 'assistant',
          parts: [{ type: 'text', text: 'x'.repeat(32_000) }],
        },
        message,
      ],
    ]) {
      const response = await handleChat(request(messages))
      expect(response.status).toBe(413)
      expect(await response.json()).toEqual({ error: 'CONVERSATION_LIMIT' })
    }
    expect(intakeRequest).not.toHaveBeenCalled()
  })
})
