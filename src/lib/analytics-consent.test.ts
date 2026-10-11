import { afterEach, beforeEach, expect, it, vi } from 'vitest'
beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllGlobals())
it('remembers a choice for this page when storage is unavailable', async () => {
  vi.stubGlobal('window', {
    localStorage: {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
    },
  })
  const { getAnalyticsConsent, setAnalyticsConsent } =
    await import('./analytics-consent')
  expect(getAnalyticsConsent()).toBe('unknown')
  expect(() => setAnalyticsConsent('rejected')).not.toThrow()
  expect(getAnalyticsConsent()).toBe('rejected')
})
it('notifies subscribers when another tab withdraws consent', async () => {
  let stored = 'accepted'
  const add = vi.fn()
  const remove = vi.fn()
  vi.stubGlobal('window', {
    localStorage: { getItem: () => stored },
    addEventListener: add,
    removeEventListener: remove,
  })
  const {
    getAnalyticsConsent,
    subscribeAnalyticsConsent,
    ANALYTICS_CONSENT_KEY,
  } = await import('./analytics-consent')
  const listener = vi.fn()
  const unsubscribe = subscribeAnalyticsConsent(listener)
  expect(getAnalyticsConsent()).toBe('accepted')
  stored = 'rejected'
  add.mock.calls[0]![1]({ key: ANALYTICS_CONSENT_KEY, newValue: 'rejected' })
  expect(listener).toHaveBeenCalledOnce()
  expect(getAnalyticsConsent()).toBe('rejected')
  unsubscribe()
  expect(remove).toHaveBeenCalledWith('storage', add.mock.calls[0]![1])
})
