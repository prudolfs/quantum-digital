import { env } from 'cloudflare:workers'
import { publicEnv } from '@/env'
import {
  requestKind,
  requestLimits,
  type RequestKind,
} from '../../shared/security'
import { assertSameOrigin, getSession, hash, intakeRequest } from './intake'

const localCounters = new Map<string, { count: number; until: number }>()
let compatibilityNotice = false

function consumeLocal(key: string, maximum: number, windowMs: number) {
  const now = Date.now()
  for (const [expiredKey, entry] of localCounters)
    if (entry.until <= now) localCounters.delete(expiredKey)
  const entry = localCounters.get(key) ?? { count: 0, until: now + windowMs }
  if (entry.count >= maximum)
    throw new Error('Too many requests. Please try again later.')
  entry.count++
  localCounters.set(key, entry)
}

export async function runSecurityOperation(
  request: Request,
  body: Record<string, unknown>,
) {
  try {
    await intakeRequest(body)
  } catch (error) {
    // Only a loopback development server can use legacy-backend compatibility.
    // Authentication/storage failures, production builds and remote origins fail closed.
    if (
      !(error instanceof Error) ||
      error.message !== 'INTAKE_OPERATION_UNAVAILABLE' ||
      !import.meta.env.DEV ||
      !['localhost', '127.0.0.1', '[::1]'].includes(
        new URL(request.url).hostname,
      )
    )
      throw error
    if (body.operation === 'request-rate') {
      const kind = body.kind as RequestKind
      if (!Object.hasOwn(requestLimits, kind)) throw error
      const { maximum, windowMs } = requestLimits[kind]
      consumeLocal(`request:${kind}:ip:${body.ipHash}`, maximum, windowMs)
      if (body.sessionHash)
        consumeLocal(
          `request:${kind}:session:${body.sessionHash}`,
          maximum,
          windowMs,
        )
    } else if (body.operation === 'generation-reserve') {
      if (env.AI_CHAT_ENABLED === 'false')
        throw new Error('ASSISTANT_PAUSED', { cause: error })
      const day = new Date().toISOString().slice(0, 10)
      try {
        consumeLocal(`generation:${day}`, 200, 86_400_000)
      } catch (quotaError) {
        throw new Error('AI_DAILY_LIMIT', { cause: quotaError })
      }
    } else throw error
    if (!compatibilityNotice) {
      compatibilityNotice = true
      console.warn(
        'Local security compatibility: backend needs the new limit operations. Using development-only in-memory limits until the backend is updated.',
      )
    }
  }
}

export async function protectRequest(
  request: Request,
): Promise<Response | null> {
  const kind = requestKind(new URL(request.url).pathname, request.method)
  if (!kind) return null
  if (request.method === 'POST') {
    try {
      assertSameOrigin(request)
    } catch {
      return new Response('Forbidden', { status: 403 })
    }
  }
  const length = Number(request.headers.get('Content-Length'))
  if (length > 64_000) return new Response('Request too large', { status: 413 })
  try {
    const session = getSession(request)
    await runSecurityOperation(request, {
      operation: 'request-rate',
      kind,
      ipHash: await hash(
        `${env.INTAKE_BRIDGE_SECRET}:${request.headers.get('CF-Connecting-IP') ?? 'local'}`,
      ),
      ...(session ? { sessionHash: await hash(session) } : {}),
    })
    return null
  } catch (error) {
    const limited =
      error instanceof Error && error.message.includes('Too many requests')
    if (!limited)
      console.error('API protection unavailable.', { category: 'storage' })
    return Response.json(
      { error: limited ? 'RATE_LIMIT' : 'ASSISTANT_UNAVAILABLE' },
      {
        status: limited ? 429 : 503,
        headers: {
          'Cache-Control': 'no-store',
          ...(limited ? { 'Retry-After': '60' } : {}),
        },
      },
    )
  }
}

export function securityHeaders(response: Response, production: boolean) {
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (production) {
    const connections = [
      publicEnv.VITE_CONVEX_URL,
      publicEnv.VITE_CONVEX_SITE_URL,
      publicEnv.VITE_POSTHOG_HOST,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => new URL(value).origin)
    const sockets = connections
      .filter((value) => value.endsWith('.convex.cloud'))
      .map((value) => value.replace('https:', 'wss:'))
    // SSR includes inline hydration scripts; a nonce-based script policy is future work.
    headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        `connect-src 'self' blob: https://challenges.cloudflare.com ${[...connections, ...sockets].join(' ')}`,
        'frame-src https://challenges.cloudflare.com',
        "worker-src 'self' blob:",
      ].join('; '),
    )
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
