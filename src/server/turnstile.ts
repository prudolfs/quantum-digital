import { env } from 'cloudflare:workers'

export async function verifyTurnstile(request: Request, token: unknown) {
  const hostname = new URL(request.url).hostname
  const testingSecret =
    env.TURNSTILE_SECRET_KEY === '1x0000000000000000000000000000000AA'
  if (testingSecret && !['localhost', '127.0.0.1'].includes(hostname))
    return false
  if (
    !env.TURNSTILE_SECRET_KEY ||
    typeof token !== 'string' ||
    !token ||
    token.length > 2048
  )
    return false
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          ...(request.headers.get('CF-Connecting-IP')
            ? { remoteip: request.headers.get('CF-Connecting-IP') }
            : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      },
    )
    const result = (await response.json()) as {
      success?: boolean
      hostname?: string
      action?: string
      metadata?: { result_with_testing_key?: boolean }
    }
    const localTest =
      ['localhost', '127.0.0.1'].includes(hostname) &&
      testingSecret &&
      token === 'XXXX.DUMMY.TOKEN.XXXX'
    if (localTest)
      return (
        response.ok &&
        result.success === true &&
        result.metadata?.result_with_testing_key === true
      )
    return (
      response.ok &&
      result.success === true &&
      result.hostname === hostname &&
      result.action === 'chat'
    )
  } catch {
    return false
  }
}
