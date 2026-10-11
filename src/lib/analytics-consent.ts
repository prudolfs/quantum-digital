export type AnalyticsConsent = 'unknown' | 'accepted' | 'rejected'
export const ANALYTICS_CONSENT_KEY = 'qd-analytics-consent:v1'
let memory: AnalyticsConsent = 'unknown'
const listeners = new Set<() => void>()

function parse(value: string | null): AnalyticsConsent {
  return value === 'accepted' || value === 'rejected' ? value : 'unknown'
}
export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return 'unknown'
  try {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY)
    return stored ? parse(stored) : memory
  } catch {
    return memory
  }
}
function storageChanged(event: StorageEvent) {
  if (event.key !== ANALYTICS_CONSENT_KEY && event.key !== null) return
  memory = parse(event.newValue)
  for (const listener of listeners) listener()
}
export function subscribeAnalyticsConsent(listener: () => void) {
  listeners.add(listener)
  if (typeof window !== 'undefined')
    window.addEventListener('storage', storageChanged)
  return () => {
    listeners.delete(listener)
    if (!listeners.size && typeof window !== 'undefined')
      window.removeEventListener('storage', storageChanged)
  }
}
export function setAnalyticsConsent(
  choice: Exclude<AnalyticsConsent, 'unknown'>,
) {
  memory = choice
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, choice)
  } catch {
    // A blocked preference store must not prevent choosing or using the site.
  }
  for (const listener of listeners) listener()
}
