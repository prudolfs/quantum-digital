import type { PostHog } from 'posthog-js/dist/module'
import { servicePageRoutes } from '../../shared/service-pages'
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
  | 'chat_off_topic_attempt'
  | 'inquiry_requested'
  | 'inquiry_reviewed'
  | 'inquiry_submit_attempted'
  | 'inquiry_submitted'
  | 'inquiry_submission_failed'
export type AnalyticsSource = 'contact_form' | 'conversation'
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
  if (
    Object.values(servicePageRoutes).some(
      (route) => pathname === `/services/${route.slug}`,
    )
  )
    return pathname
  if (pathname.startsWith('/work/')) {
    const slug = pathname.slice('/work/'.length)
    return workSlugs.has(slug) ? pathname : '/work/:slug'
  }
  return null
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
  client ??= import('posthog-js/dist/module')
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
        save_campaign_params: true,
        save_referrer: true,
        respect_dnt: true,
        ip: true,
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
        ...(event === 'chat_off_topic_attempt'
          ? { severity: 'warning', category: 'off_topic' }
          : {}),
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

export type CrashSource =
  | 'route_error'
  | 'unhandled_error'
  | 'unhandled_rejection'
  | 'verification'

let crashCount = 0
const reportedCrashes = new WeakSet<object>()
export function captureAppCrash(error: unknown, source: CrashSource) {
  if (!allowed() || crashCount >= 10 || !analyticsPath(location.pathname))
    return
  if (error instanceof Error && error.name === 'AbortError') return
  if (error && typeof error === 'object') {
    if (reportedCrashes.has(error)) return
    reportedCrashes.add(error)
  }
  crashCount++
  const path = analyticsPath(location.pathname)!
  void getClient().then((posthog) => {
    try {
      if (allowed())
        posthog?.captureException(error, {
          page_path: path,
          crash_source: source,
          ...(source === 'verification'
            ? { is_error_tracking_verification: true }
            : {}),
        })
    } catch {
      /* Crash reporting must never cause another crash. */
    }
  })
}

export function listenForAppCrashes() {
  const verify = () =>
    captureAppCrash(new Error('PostHog setup verification'), 'verification')
  const error = (event: ErrorEvent) => {
    if (event.error instanceof Error)
      captureAppCrash(event.error, 'unhandled_error')
  }
  const rejection = (event: PromiseRejectionEvent) => {
    if (event.reason instanceof Error)
      captureAppCrash(event.reason, 'unhandled_rejection')
  }
  window.addEventListener('error', error)
  window.addEventListener('unhandledrejection', rejection)
  window.addEventListener('qd:verify-error-tracking', verify)
  return () => {
    window.removeEventListener('error', error)
    window.removeEventListener('unhandledrejection', rejection)
    window.removeEventListener('qd:verify-error-tracking', verify)
  }
}
