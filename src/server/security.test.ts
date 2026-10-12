import { afterEach, beforeEach, expect, test, vi } from 'vitest'
vi.mock('cloudflare:workers', () => ({
  env: { INTAKE_BRIDGE_SECRET: 'test-only-secret' },
}))
vi.mock('./intake', async (original) => ({
  ...(await original<typeof import('./intake')>()),
  intakeRequest: vi.fn(),
}))
import { intakeRequest } from './intake'
import {
  protectRequest,
  runSecurityOperation,
  securityHeaders,
} from './security'
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(intakeRequest).mockResolvedValue({ ok: true })
})
afterEach(() => vi.unstubAllEnvs())
test.each([
  ['/api/chat', 'POST', 'chat'],
  ['/api/chat-session', 'GET', 'session'],
  ['/api/chat-session', 'POST', 'restart'],
  ['/api/inquiry-drafts', 'POST', 'draft'],
  ['/api/inquiries', 'POST', 'confirm'],
  ['/api/auth/sign-in/email', 'POST', 'auth'],
])(
  'protects %s %s before handling its body or verification',
  async (path, method, kind) => {
    const request = new Request(`https://example.com${path}`, {
      method,
      headers: {
        Origin: 'https://example.com',
        'CF-Connecting-IP': '192.0.2.1',
        Cookie: `qd-intake=${'a'.repeat(64)}`,
      },
    })
    expect(await protectRequest(request)).toBeNull()
    expect(intakeRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'request-rate',
        kind,
        ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        sessionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    )
    expect(JSON.stringify(vi.mocked(intakeRequest).mock.calls)).not.toContain(
      '192.0.2.1',
    )
  },
)
test('does not apply database limits to public pages', async () => {
  expect(
    await protectRequest(new Request('https://example.com/about')),
  ).toBeNull()
  expect(intakeRequest).not.toHaveBeenCalled()
})
test('rejects cross-origin mutations before database access', async () => {
  expect(
    (
      await protectRequest(
        new Request('https://example.com/api/chat', {
          method: 'POST',
          headers: { Origin: 'https://evil.example' },
        }),
      )
    )?.status,
  ).toBe(403)
  expect(intakeRequest).not.toHaveBeenCalled()
})
test('returns a retryable 429 without leaking backend errors', async () => {
  vi.mocked(intakeRequest).mockRejectedValue(
    new Error('Too many requests. private details'),
  )
  const result = await protectRequest(
    new Request('https://example.com/api/chat-session'),
  )
  expect(result?.status).toBe(429)
  expect(result?.headers.get('Retry-After')).toBe('60')
  expect(await result?.json()).toEqual({ error: 'RATE_LIMIT' })
})
test('preserves cookies and streaming bodies while adding security headers', async () => {
  const result = securityHeaders(
    new Response('stream', {
      headers: { 'Set-Cookie': 'qd-intake=test; HttpOnly' },
    }),
    true,
  )
  expect(await result.text()).toBe('stream')
  expect(result.headers.get('Set-Cookie')).toContain('HttpOnly')
  expect(result.headers.get('Content-Security-Policy')).toContain(
    "frame-ancestors 'none'",
  )
  expect(result.headers.get('Content-Security-Policy')).toContain(
    'https://challenges.cloudflare.com',
  )
  expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff')
  expect(
    securityHeaders(new Response(), false).headers.has(
      'Content-Security-Policy',
    ),
  ).toBe(false)
})

test('legacy-backend compatibility keeps loopback development request limits active', async () => {
  vi.stubEnv('DEV', true)
  vi.mocked(intakeRequest).mockRejectedValue(
    new Error('INTAKE_OPERATION_UNAVAILABLE'),
  )
  const request = new Request('http://localhost:3000/api/chat-session', {
    method: 'POST',
    headers: { Origin: 'http://localhost:3000' },
  })
  for (let i = 0; i < 10; i++) expect(await protectRequest(request)).toBeNull()
  expect((await protectRequest(request))?.status).toBe(429)
})

test.each([
  [false, 'http://localhost:3000', 'INTAKE_OPERATION_UNAVAILABLE'],
  [true, 'https://example.com', 'INTAKE_OPERATION_UNAVAILABLE'],
  [true, 'http://localhost:3000', 'Unauthorized'],
  [
    true,
    'http://localhost:3000',
    'The inquiry could not be processed. Please retry.',
  ],
])(
  'fails closed outside loopback development or for real backend failures (%s, %s, %s)',
  async (development, origin, code) => {
    vi.stubEnv('DEV', development)
    vi.mocked(intakeRequest).mockRejectedValue(new Error(code))
    expect(
      (await protectRequest(new Request(`${origin}/api/chat-session`)))?.status,
    ).toBe(503)
  },
)

test('legacy-backend compatibility still enforces the local generation allowance', async () => {
  vi.stubEnv('DEV', true)
  vi.mocked(intakeRequest).mockRejectedValue(
    new Error('INTAKE_OPERATION_UNAVAILABLE'),
  )
  const request = new Request('http://localhost:3000/api/chat')
  for (let i = 0; i < 200; i++)
    await runSecurityOperation(request, { operation: 'generation-reserve' })
  await expect(
    runSecurityOperation(request, { operation: 'generation-reserve' }),
  ).rejects.toThrow('AI_DAILY_LIMIT')
})
