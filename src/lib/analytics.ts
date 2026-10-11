import type { CaptureResult, PostHog } from 'posthog-js/dist/module.slim'
import { publicEnv } from '@/env'
import {
  getAnalyticsConsent,
  subscribeAnalyticsConsent,
} from '@/lib/analytics-consent'

export const analyticsConfigured = Boolean(
  publicEnv.VITE_POSTHOG_PROJECT_TOKEN && publicEnv.VITE_POSTHOG_HOST,
)

export type AnalyticsEvent =
  | '$pageview'
  | 'chat_started'
  | 'inquiry_requested'
  | 'inquiry_reviewed'
  | 'inquiry_submit_attempted'
  | 'inquiry_submitted'
  | 'inquiry_submission_failed'
export type AnalyticsSource = 'contact_form' | 'conversation'
const events = new Set<string>([
  '$pageview',
  'chat_started',
  'inquiry_requested',
  'inquiry_reviewed',
  'inquiry_submit_attempted',
  'inquiry_submitted',
  'inquiry_submission_failed',
])
const workSlugs = new Set([
  'care-coordination',
  'accounting-workflows',
  'research-workflow',
  'finance-document-assistant',
  'service-operations-copilot',
  'robotics-lab',
])
export function analyticsPath(pathname: string) {
  if (['/', '/about', '/chat', '/privacy'].includes(pathname)) return pathname
  if (pathname.startsWith('/work/')) {
    const slug = pathname.slice('/work/'.length)
    return workSlugs.has(slug) ? pathname : '/work/:slug'
  }
  return null
}

// Replace SDK-enriched properties: no query strings, referrers, form text,
// transcript/draft IDs, identities, or error messages leave the browser.
export function sanitizeAnalyticsEvent(event: CaptureResult | null) {
  if (!event || !events.has(event.event)) return null
  const path = event.properties.page_path
  if (typeof path !== 'string' || !analyticsPath(path)) return null
  const pagePath = analyticsPath(path)!
  const url = new URL(pagePath, publicEnv.VITE_SITE_URL)
  const properties: Record<string, unknown> = {
    page_path: pagePath,
    $current_url: url.href,
    $host: url.hostname,
    $pathname: pagePath,
    $process_person_profile: false,
    $geoip_disable: true,
  }
  // Browser metadata supports traffic classification. Never accept custom text.
  if (typeof navigator !== 'undefined' && navigator.userAgent)
    properties.$raw_user_agent = navigator.userAgent
  for (const key of ['token', 'distinct_id', '$lib', '$lib_version']) {
    if (typeof event.properties[key] === 'string')
      properties[key] = event.properties[key]
  }
  // Web Analytics needs the SDK's session UUID to aggregate cookie-mode visits.
  const session = event.properties.$session_id
  if (
    typeof session === 'string' &&
    /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
      session,
    )
  )
    properties.$session_id = session
  if (['contact_form', 'conversation'].includes(event.properties.source))
    properties.source = event.properties.source
  return { ...event, properties }
}

let client: Promise<PostHog | undefined> | undefined
let initialized: PostHog | undefined
export function analyticsAllowed() {
  if (typeof window === 'undefined') return false
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean }
  if (privacy.doNotTrack === '1' || privacy.globalPrivacyControl) return false
  // Local review and ordinary browser tests must not pollute the live project.
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(
    location.hostname,
  )
  return (
    !loopback || new URL(publicEnv.VITE_SITE_URL).origin === location.origin
  )
}
function allowed() {
  return analyticsAllowed() && getAnalyticsConsent() === 'accepted'
}
function getClient() {
  if (
    !allowed() ||
    !publicEnv.VITE_POSTHOG_PROJECT_TOKEN ||
    !publicEnv.VITE_POSTHOG_HOST
  )
    return Promise.resolve(undefined)
  client ??= import('posthog-js/dist/module.slim')
    .then(({ default: posthog }) => {
      // Consent can be withdrawn while the SDK is being imported.
      if (!allowed()) return undefined
      posthog.init(publicEnv.VITE_POSTHOG_PROJECT_TOKEN!, {
        api_host: publicEnv.VITE_POSTHOG_HOST,
        persistence: 'cookie',
        cookie_expiration: 180,
        cross_subdomain_cookie: false,
        secure_cookie: location.protocol === 'https:',
        opt_out_capturing_by_default: true,
        opt_out_persistence_by_default: true,
        opt_out_capturing_persistence_type: 'cookie',
        person_profiles: 'never',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_exceptions: false,
        capture_performance: false,
        capture_dead_clicks: false,
        rageclick: false,
        enable_heatmaps: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_conversations: true,
        disable_product_tours: true,
        disable_external_dependency_loading: true,
        advanced_disable_flags: true,
        save_campaign_params: false,
        save_referrer: false,
        respect_dnt: true,
        ip: false,
        before_send: sanitizeAnalyticsEvent,
      })
      initialized = posthog
      posthog.opt_in_capturing({ captureEventName: false })
      subscribeAnalyticsConsent(() => {
        if (allowed()) posthog.opt_in_capturing({ captureEventName: false })
        else posthog.opt_out_capturing()
      })
      return posthog
    })
    .catch(() => undefined)
    .finally(() => {
      if (!initialized) client = undefined
    })
  return client
}
export function captureAnalytics(
  event: AnalyticsEvent,
  source?: AnalyticsSource,
) {
  if (!allowed()) return
  const path = analyticsPath(location.pathname)
  if (!path) return
  // Take the route at the interaction time, even if SDK import finishes later.
  void getClient().then((posthog) => {
    try {
      if (!allowed()) return
      posthog?.capture(event, {
        page_path: path,
        ...(source ? { source } : {}),
      })
    } catch {
      // Analytics must never affect chat, navigation, or inquiry submission.
    }
  })
}
const captured = new Set<string>()
export function captureAnalyticsOnce(
  event: AnalyticsEvent,
  localId: string,
  source?: AnalyticsSource,
) {
  if (!allowed()) return
  const key = `${event}:${localId}`
  if (captured.has(key)) return
  captured.add(key)
  captureAnalytics(event, source)
}
