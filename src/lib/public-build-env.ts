const publicKeys = [
  'VITE_SITE_URL',
  'VITE_CONVEX_URL',
  'VITE_CONVEX_SITE_URL',
  'VITE_TURNSTILE_SITE_KEY',
] as const

export function publicBuildDefines(
  runtimeVariables: Record<string, unknown>,
  buildEnvironment: Record<string, string>,
) {
  const definitions: Record<string, string> = {}
  for (const key of publicKeys) {
    const value = buildEnvironment[key] ?? runtimeVariables[key]
    if (value === undefined) continue
    if (typeof value !== 'string')
      throw new Error(`Public build setting ${key} must be a string.`)
    definitions[`import.meta.env.${key}`] = JSON.stringify(value)
  }
  return definitions
}
