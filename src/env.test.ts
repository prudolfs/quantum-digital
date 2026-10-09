import { describe, expect, it } from 'vitest'
import { parsePublicEnvironment } from './env'

describe('public environment', () => {
  it('runs without a booking or backend configuration', () => {
    expect(parsePublicEnvironment({})).toEqual({
      VITE_SITE_URL: 'http://localhost:3000',
    })
    expect(
      parsePublicEnvironment({ VITE_BOOKING_URL: '', VITE_CONVEX_URL: '' })
        .VITE_CONVEX_URL,
    ).toBeUndefined()
  })

  it('accepts configured HTTPS service URLs', () => {
    expect(
      parsePublicEnvironment({
        VITE_BOOKING_URL: 'https://calendar.proton.me/example',
      }).VITE_BOOKING_URL,
    ).toBe('https://calendar.proton.me/example')
  })

  it.each(['not-a-url', 'javascript:alert(1)', 'http://example.com'])(
    'rejects an unsafe booking URL: %s',
    (value) => {
      expect(() =>
        parsePublicEnvironment({ VITE_BOOKING_URL: value }),
      ).toThrow()
    },
  )

  it('rejects non-HTTP site URLs and insecure backend URLs', () => {
    expect(() =>
      parsePublicEnvironment({ VITE_SITE_URL: 'ftp://example.com' }),
    ).toThrow()
    expect(() =>
      parsePublicEnvironment({ VITE_CONVEX_URL: 'http://example.com' }),
    ).toThrow()
  })
})
