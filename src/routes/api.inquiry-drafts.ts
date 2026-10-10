import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { inquirySchema } from '../../shared/inquiry'
import {
  assertSameOrigin,
  getSession,
  hash,
  intakeRequest,
  readJson,
} from '@/server/intake'
import { verifyTurnstile } from '@/server/turnstile'

export const Route = createFileRoute('/api/inquiry-drafts')({
  server: {
    handlers: {
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
          const body = z
            .object({
              contactFormId: z.string().min(1).max(100),
              details: inquirySchema,
              turnstileToken: z.string().max(2048),
            })
            .strict()
            .parse(await readJson(request, 8000))
          if (!(await verifyTurnstile(request, body.turnstileToken)))
            return Response.json(
              { error: 'Please complete the security check and try again.' },
              { status: 403 },
            )
          const draft = await intakeRequest({
            operation: 'prepare',
            sessionHash: await hash(session),
            contactFormId: body.contactFormId,
            details: body.details,
          })
          return Response.json(draft, {
            headers: { 'Cache-Control': 'no-store' },
          })
        } catch {
          return Response.json(
            {
              error:
                'The draft could not be prepared. Please check your details and retry.',
            },
            { status: 400 },
          )
        }
      },
    },
  },
})
