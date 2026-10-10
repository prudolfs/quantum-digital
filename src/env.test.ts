import { describe, expect, it } from 'vitest'
import { parsePublicEnvironment } from './env'

describe('public environment', () => {
  it('uses the supplied public domain without requiring a backend', () => {
    expect(parsePublicEnvironment({})).toEqual({
      VITE_SITE_URL: 'https://quantum-digital.pukitis-rudolfs.workers.dev',
    })
    expect(
      parsePublicEnvironment({ VITE_CONVEX_URL: '', VITE_CONVEX_SITE_URL: '' })
        .VITE_CONVEX_URL,
    ).toBeUndefined()
  })
  it('accepts HTTPS Convex endpoints and loopback development endpoints', () => {
    expect(
      parsePublicEnvironment({
        VITE_CONVEX_URL: 'https://example.convex.cloud',
        VITE_CONVEX_SITE_URL: 'https://example.convex.site',
      }).VITE_CONVEX_URL,
    ).toBe('https://example.convex.cloud')
    expect(
      parsePublicEnvironment({
        VITE_CONVEX_URL: 'http://127.0.0.1:3210',
        VITE_CONVEX_SITE_URL: 'http://127.0.0.1:3211',
      }).VITE_CONVEX_SITE_URL,
    ).toBe('http://127.0.0.1:3211')
  })
  it.each(['not-a-url', 'javascript:alert(1)', 'http://example.com'])(
    'rejects an unsafe backend URL: %s',
    (value) => {
      expect(() => parsePublicEnvironment({ VITE_CONVEX_URL: value })).toThrow()
    },
  )
  it('rejects non-HTTP site URLs', () => {
    expect(() =>
      parsePublicEnvironment({ VITE_SITE_URL: 'ftp://example.com' }),
    ).toThrow()
  })
})
