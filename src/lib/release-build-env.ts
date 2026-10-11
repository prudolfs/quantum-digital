const keys = [
  'VITE_SITE_URL',
  'VITE_CONVEX_URL',
  'VITE_CONVEX_SITE_URL',
  'VITE_TURNSTILE_SITE_KEY',
] as const

/** Release settings come from Wrangler/CI, never ignored local .env files. */
export function releasePublicEnvironment(
  runtime: Record<string, unknown>,
  environment: Record<string, string | undefined>,
) {
  const values: Record<string, string> = {}
  for (const key of keys) {
    const value =
      environment[key] ??
      runtime[key] ??
      (key === 'VITE_SITE_URL'
        ? 'https://quantum-digital.pukitis-rudolfs.workers.dev'
        : undefined)
    if (typeof value !== 'string' || !value.trim())
      throw new Error(`Missing release setting: ${key}`)
    values[key] = value.trim()
  }
  for (const key of keys.filter(
    (setting) => setting !== 'VITE_TURNSTILE_SITE_KEY',
  )) {
    const url = new URL(values[key])
    if (
      url.protocol !== 'https:' ||
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
      throw new Error(`Release setting must use public HTTPS: ${key}`)
  }
  // The currently configured production widget uses a 0x key; official local
  // test keys must never replace it in a production browser bundle.
  if (!values.VITE_TURNSTILE_SITE_KEY.startsWith('0x'))
    throw new Error('Release requires the production Turnstile site key')
  const cloud = new URL(values.VITE_CONVEX_URL).hostname
  const site = new URL(values.VITE_CONVEX_SITE_URL).hostname
  if (
    cloud.endsWith('.convex.cloud') &&
    site.endsWith('.convex.site') &&
    cloud.replace('.convex.cloud', '') !== site.replace('.convex.site', '')
  )
    throw new Error('Release Convex URLs must reference the same deployment')
  for (const setting of ['VITE_POSTHOG_PROJECT_TOKEN', 'VITE_POSTHOG_HOST']) {
    const value = environment[setting] ?? runtime[setting]
    if (typeof value === 'string' && value.trim())
      values[setting] = value.trim()
  }
  if (
    Boolean(values.VITE_POSTHOG_PROJECT_TOKEN) !==
    Boolean(values.VITE_POSTHOG_HOST)
  )
    throw new Error('Configure both PostHog project token and host, or neither')
  if (values.VITE_POSTHOG_PROJECT_TOKEN) {
    if (!values.VITE_POSTHOG_PROJECT_TOKEN.startsWith('phc_'))
      throw new Error(
        'Use the public PostHog project token, never a personal API key',
      )
    if (new URL(values.VITE_POSTHOG_HOST).protocol !== 'https:')
      throw new Error('PostHog host must use HTTPS')
  }
  return values
}
