import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { authComponent, createAuth } from './auth'

const http = httpRouter()
authComponent.registerRoutes(http, createAuth)

http.route({
  path: '/intake',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.INTAKE_BRIDGE_SECRET
    if (
      !secret ||
      secret.length < 32 ||
      request.headers.get('Authorization') !== `Bearer ${secret}`
    ) {
      return new Response('Unauthorized', { status: 401 })
    }
    try {
      const body = await request.json()
      let result
      switch (body.operation) {
        case 'rate':
          result = await ctx.runMutation(internal.inquiries.checkChatRate, {
            ipHash: body.ipHash,
          })
          break
        case 'prepare':
          result = await ctx.runMutation(internal.inquiries.prepare, {
            sessionHash: body.sessionHash,
            details: body.details,
          })
          break
        case 'confirm':
          result = await ctx.runMutation(internal.inquiries.confirm, {
            sessionHash: body.sessionHash,
            draftId: body.draftId,
          })
          break
        default:
          return new Response('Unknown operation', { status: 400 })
      }
      return Response.json(result ?? { ok: true }, {
        headers: { 'Cache-Control': 'no-store' },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const limited = message.includes('Too many requests')
      return Response.json(
        {
          error: limited
            ? 'Too many requests. Please try again later.'
            : 'The inquiry could not be processed. Please retry.',
        },
        { status: limited ? 429 : 400 },
      )
    }
  }),
})
export default http
