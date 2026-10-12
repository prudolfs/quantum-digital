import { afterEach, expect, test, vi } from 'vitest'
vi.mock('cloudflare:workers', () => ({
  env: { INTAKE_BRIDGE_SECRET: 'test-only-secret' },
}))
vi.mock('@/env', () => ({
  publicEnv: { VITE_CONVEX_SITE_URL: 'https://example.convex.site' },
}))
import { intakeRequest } from './intake'
afterEach(() => vi.unstubAllGlobals())
test('recognizes an old bridge without treating authentication or storage errors as missing operations', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('Unknown operation', { status: 400 })),
  )
  await expect(intakeRequest({ operation: 'request-rate' })).rejects.toThrow(
    'INTAKE_OPERATION_UNAVAILABLE',
  )
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('Unauthorized', { status: 401 })),
  )
  await expect(
    intakeRequest({ operation: 'request-rate' }),
  ).rejects.not.toThrow('INTAKE_OPERATION_UNAVAILABLE')
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json({ error: 'Storage unavailable' }, { status: 400 }),
    ),
  )
  await expect(
    intakeRequest({ operation: 'request-rate' }),
  ).rejects.not.toThrow('INTAKE_OPERATION_UNAVAILABLE')
})
