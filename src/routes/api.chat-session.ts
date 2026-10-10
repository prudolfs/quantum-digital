import { createFileRoute } from '@tanstack/react-router'
import { getSession, intakeAvailable } from '@/server/intake'

export const Route = createFileRoute('/api/chat-session')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const existing = getSession(request)
        const session =
          existing ??
          Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
            byte.toString(16).padStart(2, '0'),
          ).join('')
        const headers = new Headers({ 'Cache-Control': 'no-store' })
        if (!existing)
          headers.set(
            'Set-Cookie',
            `qd-intake=${session}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=3600${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
          )
        return Response.json({ available: intakeAvailable() }, { headers })
      },
    },
  },
})
