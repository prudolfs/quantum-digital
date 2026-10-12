export const crashSources = [
  'route_error',
  'unhandled_error',
  'unhandled_rejection',
] as const
export type CrashSource = (typeof crashSources)[number]
const errorNames = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
])

export function safeCrash(error: unknown, source: CrashSource, origin: string) {
  const name =
    error instanceof Error && errorNames.has(error.name) ? error.name : 'Error'
  const safe = new Error(source)
  safe.name = name
  const frames: string[] = []
  if (error instanceof Error && typeof error.stack === 'string') {
    for (const line of error.stack.split('\n').slice(0, 30)) {
      const match = line.match(
        /(https?:\/\/[^\s()]+\/assets\/[A-Za-z0-9_.-]+\.js):(\d+):(\d+)/,
      )
      if (!match || new URL(match[1]).origin !== origin) continue
      frames.push(`    at ${match[1]}:${match[2]}:${match[3]}`)
      if (frames.length === 10) break
    }
  }
  // Do not send the original message, causes, function names, or arbitrary URLs.
  safe.stack = `${name}: ${source}\n${frames.join('\n')}`
  return safe
}

export function sanitizeExceptionList(
  value: unknown,
  source: unknown,
  origin: string,
) {
  if (!crashSources.includes(source as CrashSource) || !Array.isArray(value))
    return null
  const exception = value[0]
  if (
    !exception ||
    !errorNames.has(exception.type) ||
    exception.value !== source
  )
    return null
  const frames = Array.isArray(exception.stacktrace?.frames)
    ? exception.stacktrace.frames
    : []
  return [
    {
      type: exception.type,
      value: source,
      mechanism: { type: 'generic', handled: source === 'route_error' },
      stacktrace: {
        type: 'raw',
        frames: frames
          .slice(0, 10)
          .flatMap((frame: Record<string, unknown>) => {
            if (typeof frame.filename !== 'string') return []
            try {
              const url = new URL(frame.filename)
              if (
                url.origin !== origin ||
                url.search ||
                url.hash ||
                !/^\/assets\/[A-Za-z0-9_.-]+\.js$/.test(url.pathname)
              )
                return []
              return [
                {
                  filename: url.href,
                  platform: 'javascript',
                  ...(Number.isSafeInteger(frame.lineno)
                    ? { lineno: frame.lineno }
                    : {}),
                  ...(Number.isSafeInteger(frame.colno)
                    ? { colno: frame.colno }
                    : {}),
                },
              ]
            } catch {
              return []
            }
          }),
      },
    },
  ]
}
