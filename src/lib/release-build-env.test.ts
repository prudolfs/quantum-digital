import { expect, it } from 'vitest'
import { releasePublicEnvironment } from './release-build-env'

const configured = {
  VITE_CONVEX_URL: 'https://configured.convex.cloud',
  VITE_CONVEX_SITE_URL: 'https://configured.convex.site',
  VITE_TURNSTILE_SITE_KEY: '0xproduction-key',
  AI_GATEWAY_API_KEY: 'server-only',
}
it('uses approved Wrangler settings and excludes all runtime secrets', () => {
  const result = releasePublicEnvironment(configured, {})
  expect(result.VITE_SITE_URL).toBe(
    'https://quantum-digital.pukitis-rudolfs.workers.dev',
  )
  expect(result).not.toHaveProperty('AI_GATEWAY_API_KEY')
  expect(Object.keys(result)).toHaveLength(4)
})
it('honors explicit CI settings while requiring matching Convex deployments', () => {
  const result = releasePublicEnvironment(configured, {
    VITE_CONVEX_URL: 'https://release.convex.cloud',
    VITE_CONVEX_SITE_URL: 'https://release.convex.site',
  })
  expect(result.VITE_CONVEX_URL).toBe('https://release.convex.cloud')
  expect(() =>
    releasePublicEnvironment(configured, {
      VITE_CONVEX_SITE_URL: 'https://other.convex.site',
    }),
  ).toThrow('same deployment')
})
it('rejects the local testing widget and incomplete production configuration', () => {
  expect(() =>
    releasePublicEnvironment(configured, {
      VITE_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    }),
  ).toThrow('production Turnstile')
  expect(() =>
    releasePublicEnvironment(configured, { VITE_CONVEX_URL: '' }),
  ).toThrow('Missing release')
})
it('rejects loopback and HTTP release origins', () => {
  expect(() =>
    releasePublicEnvironment(configured, {
      VITE_SITE_URL: 'http://localhost:3000',
    }),
  ).toThrow('public HTTPS')
  expect(() =>
    releasePublicEnvironment(configured, {
      VITE_CONVEX_URL: 'http://127.0.0.1:3310',
    }),
  ).toThrow('public HTTPS')
})
