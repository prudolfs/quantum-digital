import { afterEach, expect, test, vi } from 'vitest'
vi.mock('cloudflare:workers', () => ({
  env: {
    AI_GATEWAY_API_KEY: 'test-key',
    AI_MODEL: 'test-model',
    INTAKE_BRIDGE_SECRET: 'test-only-secret-over-32-characters',
  },
}))
vi.mock('./turnstile', () => ({ verifyTurnstile: vi.fn(async () => true) }))
vi.mock('./content', () => ({ fetchPublishedContent: vi.fn(async () => ({})) }))
vi.mock('ai', async (original) => ({
  ...(await original<typeof import('ai')>()),
  streamText: vi.fn(),
  createGateway: vi.fn(),
}))
vi.mock('./intake', async (original) => ({
  ...(await original<typeof import('./intake')>()),
  intakeAvailable: () => true,
  intakeRequest: vi.fn(),
}))
import { handleChat } from './chat'
import { intakeRequest } from './intake'
import { streamText, createGateway } from 'ai'
afterEach(() => vi.resetAllMocks())
test.each(['AI_DAILY_LIMIT', 'ASSISTANT_PAUSED'])(
  'does not contact the AI provider when the shared reservation rejects with %s',
  async (code) => {
    const messages = [
      {
        id: 'user',
        role: 'user',
        parts: [{ type: 'text', text: 'Tell me about your work' }],
      },
    ]
    vi.mocked(intakeRequest).mockImplementation(async (body) => {
      if (body.operation === 'conversation-begin')
        return { revision: 1, messages }
      if (body.operation === 'generation-reserve') throw new Error(code)
      return { ok: true }
    })
    const result = await handleChat(
      new Request('https://example.com/api/chat', {
        method: 'POST',
        headers: {
          Origin: 'https://example.com',
          Cookie: `qd-intake=${'a'.repeat(64)}`,
        },
        body: JSON.stringify({ messages, revision: 0, turnstileToken: 'test' }),
      }),
    )
    expect(result.status).toBe(code === 'AI_DAILY_LIMIT' ? 429 : 503)
    expect(await result.json()).toMatchObject({
      error: code === 'AI_DAILY_LIMIT' ? code : 'ASSISTANT_UNAVAILABLE',
    })
    expect(createGateway).not.toHaveBeenCalled()
    expect(streamText).not.toHaveBeenCalled()
    expect(intakeRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'conversation-finish',
        revision: 1,
      }),
    )
  },
)
