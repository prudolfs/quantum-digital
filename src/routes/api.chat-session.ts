import { createFileRoute } from '@tanstack/react-router'
import {
  assertSameOrigin,
  getSession,
  hash,
  intakeAvailable,
  intakeRequest,
} from '@/server/intake'
import { publicEnv } from '@/env'
import { env } from 'cloudflare:workers'

export const Route = createFileRoute('/api/chat-session')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const existing = getSession(request)
        const session =
          existing ??
          Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
            byte.toString(16).padStart(2, '0'),
          ).join('')
        const headers = new Headers({ 'Cache-Control': 'no-store' })
        headers.set(
          'Set-Cookie',
          `qd-intake=${session}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=2592000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
        )
        try {
          const conversation = await intakeRequest<Record<string, unknown>>({
            operation: 'conversation-load',
            sessionHash: await hash(session),
          })
          return Response.json(
            {
              available:
                intakeAvailable() &&
                Boolean(
                  publicEnv.VITE_TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY,
                ),
              verificationRequired: true,
              ...conversation,
            },
            { headers },
          )
        } catch {
          return Response.json({ available: false }, { status: 503, headers })
        }
      },
      POST: async ({ request }) => {
        try {
          assertSameOrigin(request)
        } catch {
          return new Response('Forbidden', { status: 403 })
        }
        const session = getSession(request)
        if (!session)
          return new Response('Conversation expired.', { status: 401 })
        try {
          const result = await intakeRequest({
            operation: 'conversation-restart',
            sessionHash: await hash(session),
          })
          return Response.json(result, {
            headers: { 'Cache-Control': 'no-store' },
          })
        } catch {
          return Response.json(
            { error: 'Conversation could not be restarted. Please retry.' },
            { status: 503 },
          )
        }
      },
    },
  },
})
