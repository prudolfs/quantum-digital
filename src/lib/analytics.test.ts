import { beforeEach, afterEach, expect, test, vi } from 'vitest'
import type { CaptureResult } from 'posthog-js/dist/module.slim'
const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  captureException: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
}))
vi.mock('posthog-js/dist/module', () => ({ default: sdk }))
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
  const values = new Map<string, string>([
    ['qd-analytics-consent:v1', 'accepted'],
  ])
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
  vi.stubGlobal('location', {
    pathname: '/chat',
    origin: 'https://example.com',
    protocol: 'https:',
    hostname: 'example.com',
  })
  vi.stubGlobal('navigator', {
    doNotTrack: '0',
    userAgent: 'Mozilla/5.0 Test Browser',
  })
})
afterEach(() => vi.unstubAllGlobals())
test('tracks the reviewed service route without accepting arbitrary service paths', async () => {
  const { analyticsPath } = await import('./analytics')
  expect(analyticsPath('/services/product-development')).toBe(
    '/services/product-development',
  )
  expect(analyticsPath('/services/private-project')).toBeNull()
  for (const slug of [
    'ai-integrations',
    'workflow-automation',
    'system-integrations',
  ])
    expect(analyticsPath(`/services/${slug}`)).toBe(`/services/${slug}`)
})
test('drops unknown events and removes personal data, query strings, and SDK enrichment', async () => {
  const { sanitizeAnalyticsEvent } = await import('./analytics')
  const input = {
    uuid: '11111111-1111-4111-8111-111111111111',
    event: 'inquiry_submitted',
    properties: {
      page_path: '/chat',
      source: 'contact_form',
      token: 'phc_test',
      distinct_id: 'anonymous-visitor',
      email: 'private@example.com',
      name: 'Private name',
      summary: 'Confidential project',
      draftId: 'private-draft',
      $current_url: 'https://example.com/chat?email=private#secret',
      $referrer: 'https://private.example.com/path',
      $initial_referrer: 'private',
      $set: { email: 'private@example.com' },
      $device_id: '01960000-0000-7000-8000-000000000002',
      $session_id: '01960000-0000-7000-8000-000000000001',
      $cookieless_mode: true,
      $host: 'private.example.com',
      $pathname: '/chat?email=private@example.com',
      $raw_user_agent: 'private custom text',
    },
  } as CaptureResult
  const result = sanitizeAnalyticsEvent(input)!
  expect(result.properties).toEqual({
    page_path: '/chat',
    source: 'contact_form',
    token: 'phc_test',
    distinct_id: 'anonymous-visitor',
    $current_url: 'https://example.com/chat',
    $host: 'example.com',
    $pathname: '/chat',
    $raw_user_agent: 'Mozilla/5.0 Test Browser',
    $process_person_profile: false,
    $geoip_disable: true,
    $device_id: '01960000-0000-7000-8000-000000000002',
    $session_id: '01960000-0000-7000-8000-000000000001',
  })
  for (const device of ['private@example.com', null, 'persistent-id']) {
    expect(
      sanitizeAnalyticsEvent({
        ...input,
        properties: { ...input.properties, $device_id: device },
      })!.properties.$device_id,
    ).toBeUndefined()
  }
  expect(
    sanitizeAnalyticsEvent({
      ...input,
      properties: {
        ...input.properties,
        $device_id: '11111111-1111-4111-8111-111111111111',
      },
    })!.properties.$device_id,
  ).toBe('11111111-1111-4111-8111-111111111111')
  expect(sanitizeAnalyticsEvent({ ...input, event: '$autocapture' })).toBeNull()
  expect(
    sanitizeAnalyticsEvent({ ...input, properties: { page_path: '/admin' } }),
  ).toBeNull()
})
test('captures once without transmitting the local deduplication ID', async () => {
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
      persistence: 'cookie',
      opt_out_capturing_by_default: true,
      opt_out_persistence_by_default: true,
      cross_subdomain_cookie: false,
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      person_profiles: 'never',
      advanced_disable_flags: true,
    }),
  )
  expect(sdk.init.mock.calls[0]?.[1].cookieless_mode).toBeUndefined()
  expect(sdk.opt_in_capturing).toHaveBeenCalledWith({ captureEventName: false })
})
test('does not initialize for private routes, normal local review, or privacy opt-outs', async () => {
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
test('analytics failures cannot interrupt an inquiry or navigation', async () => {
  sdk.capture.mockImplementationOnce(() => {
    throw new Error('Blocked analytics')
  })
  const { captureAnalytics } = await import('./analytics')
  expect(() => captureAnalytics('inquiry_submitted')).not.toThrow()
  await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledTimes(1))
})

test('waits for consent, supports withdrawal, and ignores events before acceptance', async () => {
  const { setAnalyticsConsent } = await import('./analytics-consent')
  const { captureAnalytics, captureAnalyticsOnce } = await import('./analytics')
  setAnalyticsConsent('rejected')
  captureAnalytics('$pageview')
  captureAnalyticsOnce('inquiry_reviewed', 'draft')
  expect(sdk.init).not.toHaveBeenCalled()
  setAnalyticsConsent('accepted')
  captureAnalyticsOnce('inquiry_reviewed', 'draft')
  await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledTimes(1))
  setAnalyticsConsent('rejected')
  expect(sdk.opt_out_capturing).toHaveBeenCalledTimes(1)
  captureAnalytics('$pageview')
  expect(sdk.capture).toHaveBeenCalledTimes(1)
})

test('does not initialize after consent is withdrawn during the SDK import', async () => {
  const { setAnalyticsConsent } = await import('./analytics-consent')
  const { captureAnalytics } = await import('./analytics')
  captureAnalytics('$pageview')
  setAnalyticsConsent('rejected')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(sdk.init).not.toHaveBeenCalled()
  setAnalyticsConsent('accepted')
  captureAnalytics('$pageview')
  await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledTimes(1))
})

test('reports a scrubbed crash once and stops on consent withdrawal', async () => {
  const { captureAppCrash } = await import('./analytics')
  const { setAnalyticsConsent } = await import('./analytics-consent')
  const error = new Error('private@example.com confidential chat')
  setAnalyticsConsent('rejected')
  captureAppCrash(error, 'route_error')
  expect(sdk.captureException).not.toHaveBeenCalled()
  setAnalyticsConsent('accepted')
  captureAppCrash(error, 'route_error')
  captureAppCrash(error, 'unhandled_error')
  await vi.waitFor(() => expect(sdk.captureException).toHaveBeenCalledTimes(1))
  expect(sdk.captureException.mock.calls[0][0].message).toBe('route_error')
  expect(sdk.captureException.mock.calls[0][1]).toEqual({
    page_path: '/chat',
    crash_source: 'route_error',
  })
  expect(sdk.captureException.mock.calls[0][0].stack).not.toContain('private')
  setAnalyticsConsent('rejected')
  captureAppCrash(new Error('another'), 'unhandled_rejection')
  expect(sdk.captureException).toHaveBeenCalledTimes(1)
})

test('allows only the minimal exception structure through the final event filter', async () => {
  const { sanitizeAnalyticsEvent } = await import('./analytics')
  const result = sanitizeAnalyticsEvent({
    event: '$exception',
    properties: {
      page_path: '/chat',
      crash_source: 'route_error',
      $exception_list: [
        { type: 'Error', value: 'route_error', stacktrace: { frames: [] } },
      ],
      $exception_message: 'private@example.com',
      $exception_steps: ['chat text'],
      $exception_personURL: 'private',
    },
  } as unknown as CaptureResult)
  expect(result?.event).toBe('$exception')
  expect(result?.properties.$exception_list).toHaveLength(1)
  expect(JSON.stringify(result)).not.toMatch(
    /private|chat text|exception_steps|exception_personURL/,
  )
})
