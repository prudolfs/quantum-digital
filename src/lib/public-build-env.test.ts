import { describe, expect, it } from 'vitest'
import { publicBuildDefines } from './public-build-env'

describe('public build configuration', () => {
  it('includes Wrangler public defaults when the build environment is empty', () => {
    expect(
      publicBuildDefines(
        {
          VITE_CONVEX_URL: 'https://example.convex.cloud',
          VITE_CONVEX_SITE_URL: 'https://example.convex.site',
          VITE_TURNSTILE_SITE_KEY: 'public-site-key',
        },
        {},
      ),
    ).toEqual({
      'import.meta.env.VITE_CONVEX_URL': '"https://example.convex.cloud"',
      'import.meta.env.VITE_CONVEX_SITE_URL': '"https://example.convex.site"',
      'import.meta.env.VITE_TURNSTILE_SITE_KEY': '"public-site-key"',
    })
  })
  it('lets local and CI environment settings override defaults, including an explicit empty value', () => {
    expect(
      publicBuildDefines(
        {
          VITE_CONVEX_URL: 'https://production.convex.cloud',
          VITE_TURNSTILE_SITE_KEY: 'production-key',
        },
        { VITE_CONVEX_URL: '', VITE_TURNSTILE_SITE_KEY: 'local-test-key' },
      ),
    ).toEqual({
      'import.meta.env.VITE_CONVEX_URL': '""',
      'import.meta.env.VITE_TURNSTILE_SITE_KEY': '"local-test-key"',
    })
  })
  it('never copies runtime secrets or arbitrary variables into browser definitions', () => {
    expect(
      publicBuildDefines(
        {
          AI_GATEWAY_API_KEY: 'private',
          INTAKE_BRIDGE_SECRET: 'private',
          TURNSTILE_SECRET_KEY: 'private',
          VITE_UNREVIEWED_VALUE: 'private',
          AI_MODEL: 'provider/model',
        },
        { TURNSTILE_SECRET_KEY: 'private', VITE_UNREVIEWED_VALUE: 'private' },
      ),
    ).toEqual({})
  })
})
