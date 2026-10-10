import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('cloudflare:workers', () => ({
  env: { TURNSTILE_SECRET_KEY: 'test-private-secret' },
}))
import { verifyTurnstile } from './turnstile'
import { env } from 'cloudflare:workers'
const request = new Request(
  'https://quantum-digital.pukitis-rudolfs.workers.dev/api/chat',
)
afterEach(() => vi.unstubAllGlobals())
describe('Turnstile server verification', () => {
  it('accepts Cloudflare testing metadata only on loopback with the explicit dummy secret', async () => {
    const previous = env.TURNSTILE_SECRET_KEY
    try {
      env.TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA'
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          Response.json({
            success: true,
            hostname: 'example.com',
            metadata: { result_with_testing_key: true },
          }),
        ),
      )
      expect(
        await verifyTurnstile(
          new Request('http://127.0.0.1:3000/api/chat'),
          'XXXX.DUMMY.TOKEN.XXXX',
        ),
      ).toBe(true)
      expect(await verifyTurnstile(request, 'XXXX.DUMMY.TOKEN.XXXX')).toBe(
        false,
      )
    } finally {
      env.TURNSTILE_SECRET_KEY = previous
    }
  })
  it('rejects missing and oversized tokens without a verification request', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    expect(await verifyTurnstile(request, undefined)).toBe(false)
    expect(await verifyTurnstile(request, 'x'.repeat(2049))).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('requires successful validation, the expected hostname, and the chat action', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    for (const result of [
      { success: false },
      { success: true, hostname: 'other.example', action: 'chat' },
      {
        success: true,
        hostname: new URL(request.url).hostname,
        action: 'other',
      },
      {
        success: true,
        hostname: new URL(request.url).hostname,
        action: 'chat',
      },
    ]) {
      fetch.mockResolvedValue(Response.json(result))
      expect(await verifyTurnstile(request, 'token')).toBe(
        result.action === 'chat' &&
          result.hostname === new URL(request.url).hostname,
      )
    }
    expect(fetch.mock.calls.at(-1)?.[0]).toBe(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    )
  })
  it('fails closed when Siteverify is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await verifyTurnstile(request, 'token')).toBe(false)
  })
})
