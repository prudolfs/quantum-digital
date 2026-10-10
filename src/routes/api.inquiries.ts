import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  assertSameOrigin,
  getSession,
  hash,
  intakeRequest,
  readJson,
} from '@/server/intake'

const confirmationSchema = z
  .object({ draftId: z.string().min(1).max(100), confirmed: z.literal(true) })
  .strict()

export const Route = createFileRoute('/api/inquiries')({
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
          return new Response('Conversation expired. Please restart.', {
            status: 401,
          })
        try {
          const body = confirmationSchema.parse(await readJson(request, 2000))
          const result = await intakeRequest<{ inquiryId: string }>({
            operation: 'confirm',
            sessionHash: await hash(session),
            draftId: body.draftId,
          })
          return Response.json(
            { saved: true, inquiryId: result.inquiryId },
            { headers: { 'Cache-Control': 'no-store' } },
          )
        } catch (error) {
          const limited =
            error instanceof Error &&
            error.message.includes('Too many requests')
          return Response.json(
            {
              saved: false,
              error: limited
                ? 'Too many requests. Please try again later.'
                : 'Your inquiry wasn’t saved. Please retry or ask the assistant to prepare a new draft.',
            },
            { status: limited ? 429 : 400 },
          )
        }
      },
    },
  },
})
