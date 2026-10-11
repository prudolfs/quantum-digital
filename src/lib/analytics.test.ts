import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import type { CaptureResult } from 'posthog-js/dist/module.slim'
const sdk = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn() }))
vi.mock('posthog-js/dist/module.slim', () => ({ default: sdk }))
vi.mock('@/env', () => ({
  publicEnv: {
    VITE_SITE_URL: 'https://example.com',
    VITE_POSTHOG_PROJECT_TOKEN: 'phc_test_project',
    VITE_POSTHOG_HOST: 'https://eu.i.posthog.com',
  },
}))
beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubGlobal('window', {})
  vi.stubGlobal('location', {
    pathname: '/chat',
    origin: 'https://example.com',
    hostname: 'example.com',
  })
  vi.stubGlobal('navigator', { doNotTrack: '0' })
})
afterEach(() => vi.unstubAllGlobals())
it('drops unknown events and removes personal data, query strings, and SDK enrichment', async () => {
  const { sanitizeAnalyticsEvent } = await import('./analytics')
  const input = {
    uuid: '11111111-1111-4111-8111-111111111111',
    event: 'inquiry_submitted',
    properties: {
      page_path: '/chat',
      source: 'contact_form',
      token: 'phc_test',
      distinct_id: '$posthog_cookieless',
      email: 'private@example.com',
      name: 'Private name',
      summary: 'Confidential project',
      draftId: 'private-draft',
      $current_url: 'https://example.com/chat?email=private#secret',
      $referrer: 'https://private.example.com/path',
      $initial_referrer: 'private',
      $set: { email: 'private@example.com' },
      $device_id: 'persistent-id',
    },
  } as CaptureResult
  const result = sanitizeAnalyticsEvent(input)!
  expect(result.properties).toEqual({
    page_path: '/chat',
    source: 'contact_form',
    token: 'phc_test',
    distinct_id: '$posthog_cookieless',
    $current_url: 'https://example.com/chat',
    $process_person_profile: false,
    $geoip_disable: true,
    $cookieless_mode: true,
  })
  expect(sanitizeAnalyticsEvent({ ...input, event: '$autocapture' })).toBeNull()
  expect(
    sanitizeAnalyticsEvent({ ...input, properties: { page_path: '/admin' } }),
  ).toBeNull()
})
it('captures once without transmitting the local deduplication ID', async () => {
  const { captureAnalyticsOnce } = await import('./analytics')
  captureAnalyticsOnce('inquiry_submitted', 'private-draft', 'contact_form')
  captureAnalyticsOnce('inquiry_submitted', 'private-draft', 'contact_form')
  await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledTimes(1))
  expect(sdk.capture).toHaveBeenCalledWith('inquiry_submitted', {
    page_path: '/chat',
    source: 'contact_form',
  })
  expect(sdk.init).toHaveBeenCalledWith(
    'phc_test_project',
    expect.objectContaining({
      cookieless_mode: 'always',
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      person_profiles: 'never',
      advanced_disable_flags: true,
    }),
  )
})
it('does not initialize for private routes, normal local review, or privacy opt-outs', async () => {
  const { captureAnalytics } = await import('./analytics')
  vi.stubGlobal('location', {
    pathname: '/admin',
    hostname: 'example.com',
    origin: 'https://example.com',
  })
  captureAnalytics('$pageview')
  vi.stubGlobal('location', {
    pathname: '/chat',
    hostname: 'localhost',
    origin: 'http://localhost:3000',
  })
  captureAnalytics('$pageview')
  vi.stubGlobal('location', {
    pathname: '/chat',
    hostname: 'example.com',
    origin: 'https://example.com',
  })
  vi.stubGlobal('navigator', { doNotTrack: '1' })
  captureAnalytics('$pageview')
  vi.stubGlobal('navigator', { globalPrivacyControl: true })
  captureAnalytics('$pageview')
  expect(sdk.init).not.toHaveBeenCalled()
  expect(sdk.capture).not.toHaveBeenCalled()
})
it('analytics failures cannot interrupt an inquiry or navigation', async () => {
  sdk.capture.mockImplementationOnce(() => {
    throw new Error('Blocked analytics')
  })
  const { captureAnalytics } = await import('./analytics')
  expect(() => captureAnalytics('inquiry_submitted')).not.toThrow()
  await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledTimes(1))
})
