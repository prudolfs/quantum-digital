import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  analyticsAllowed,
  analyticsConfigured,
  analyticsPath,
  captureAnalytics,
  listenForAppCrashes,
} from '@/lib/analytics'
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeAnalyticsConsent,
} from '@/lib/analytics-consent'

export function AnalyticsPreferencesButton() {
  if (!analyticsConfigured) return null
  return (
    <button
      type="button"
      className="analytics-preferences-link"
      onClick={() =>
        window.dispatchEvent(new Event('qd:analytics-preferences'))
      }
    >
      Cookie preferences
    </button>
  )
}

export function SiteAnalytics() {
  useEffect(() => listenForAppCrashes(), [])
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const consent = useSyncExternalStore(
    subscribeAnalyticsConsent,
    getAnalyticsConsent,
    () => null,
  )
  const previous = useRef<string | undefined>(undefined)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const panel = useRef<HTMLElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const open = () => {
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      setPreferencesOpen(true)
    }
    window.addEventListener('qd:analytics-preferences', open)
    return () => window.removeEventListener('qd:analytics-preferences', open)
  }, [])
  useEffect(() => {
    if (preferencesOpen) panel.current?.focus()
  }, [preferencesOpen])
  useEffect(() => {
    if (consent !== 'accepted') {
      previous.current = undefined
      return
    }
    if (previous.current === pathname) return
    previous.current = pathname
    captureAnalytics('$pageview')
  }, [pathname, consent])
  const close = () => {
    setPreferencesOpen(false)
    if (returnFocus.current?.isConnected) returnFocus.current.focus()
  }
  const choose = (choice: 'accepted' | 'rejected') => {
    setAnalyticsConsent(choice)
    close()
  }
  if (!analyticsConfigured || consent === null || !analyticsPath(pathname))
    return null
  const available = analyticsAllowed()
  if (!preferencesOpen && (consent !== 'unknown' || !available)) return null
  return (
    <section
      ref={panel}
      tabIndex={-1}
      role="dialog"
      aria-labelledby="analytics-consent-title"
      className={`analytics-consent${pathname === '/chat' ? ' analytics-consent--chat' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && preferencesOpen) close()
      }}
    >
      <h2 id="analytics-consent-title">Analytics cookies</h2>
      <p>
        Allow cookies for website analytics and error reporting, including
        visitor locations, referral sources, and inquiry steps.{' '}
        <Link to="/privacy">Privacy details</Link>
      </p>
      {!available ? (
        <p>Your browser privacy settings currently disable analytics.</p>
      ) : null}
      <div className="analytics-consent-actions">
        <Button size="sm" variant="outline" onClick={() => choose('rejected')}>
          Reject analytics
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!available}
          onClick={() => choose('accepted')}
        >
          Accept analytics
        </Button>
        {preferencesOpen ? (
          <button
            type="button"
            className="analytics-preferences-link"
            onClick={close}
          >
            Close
          </button>
        ) : null}
      </div>
    </section>
  )
}
