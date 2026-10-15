import { beforeEach, afterEach, expect, test, vi } from 'vitest'
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
      ip: true,
      save_campaign_params: true,
      save_referrer: true,
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

test('reports the original crash once and stops on consent withdrawal', async () => {
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
  expect(sdk.captureException.mock.calls[0][0]).toBe(error)
  expect(sdk.captureException.mock.calls[0][1]).toEqual({
    page_path: '/chat',
    crash_source: 'route_error',
  })
  setAnalyticsConsent('rejected')
  captureAppCrash(new Error('another'), 'unhandled_rejection')
  expect(sdk.captureException).toHaveBeenCalledTimes(1)
})

test('uses standard SDK metadata without a property filter', async () => {
  const { captureAnalytics } = await import('./analytics')
  captureAnalytics('$pageview')
  await vi.waitFor(() => expect(sdk.init).toHaveBeenCalledTimes(1))
  const configuration = sdk.init.mock.calls[0][1]
  expect(configuration.before_send).toBeUndefined()
  expect(configuration.ip).toBe(true)
  expect(configuration.save_referrer).toBe(true)
  expect(configuration.save_campaign_params).toBe(true)
})

test('explicit verification reports a labelled exception after acceptance', async () => {
  const { listenForAppCrashes } = await import('./analytics')
  const cleanup = listenForAppCrashes()
  const entry = vi
    .mocked(window.addEventListener)
    .mock.calls.find(([name]) => name === 'qd:verify-error-tracking')!
  const listener = entry[1] as EventListener
  listener(new Event('qd:verify-error-tracking'))
  await vi.waitFor(() => expect(sdk.captureException).toHaveBeenCalledTimes(1))
  expect(sdk.captureException.mock.calls[0][0].message).toBe(
    'PostHog setup verification',
  )
  expect(sdk.captureException.mock.calls[0][1]).toMatchObject({
    crash_source: 'verification',
    is_error_tracking_verification: true,
  })
  cleanup()
})

test('off-topic warnings are consent-gated, deduplicated, and separate from crashes', async () => {
  const { setAnalyticsConsent } = await import('./analytics-consent')
  const { captureAnalyticsOnce } = await import('./analytics')
  setAnalyticsConsent('rejected')
  captureAnalyticsOnce('chat_off_topic_attempt', 'private-response-id')
  expect(sdk.capture).not.toHaveBeenCalled()
  setAnalyticsConsent('accepted')
  captureAnalyticsOnce('chat_off_topic_attempt', 'private-response-id')
  captureAnalyticsOnce('chat_off_topic_attempt', 'private-response-id')
  await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledTimes(1))
  expect(sdk.capture).toHaveBeenCalledWith('chat_off_topic_attempt', {
    page_path: '/chat',
    severity: 'warning',
    category: 'off_topic',
  })
  expect(sdk.captureException).not.toHaveBeenCalled()
})
