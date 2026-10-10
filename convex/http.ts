import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { authComponent, createAuth } from './auth'

const http = httpRouter()
authComponent.registerRoutesLazy(http, createAuth)

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
        case 'conversation-load':
          result = await ctx.runMutation(internal.conversations.load, {
            sessionHash: body.sessionHash,
          })
          break
        case 'conversation-restart':
          result = await ctx.runMutation(internal.conversations.restart, {
            sessionHash: body.sessionHash,
          })
          break
        case 'conversation-begin':
          result = await ctx.runMutation(internal.conversations.begin, {
            sessionHash: body.sessionHash,
            revision: body.revision,
            messages: body.messages,
          })
          break
        case 'conversation-finish':
          result = await ctx.runMutation(internal.conversations.finish, {
            sessionHash: body.sessionHash,
            revision: body.revision,
            ...(body.message ? { message: body.message } : {}),
          })
          break
        case 'rate':
          result = await ctx.runMutation(internal.inquiries.checkChatRate, {
            ipHash: body.ipHash,
          })
          break
        case 'prepare':
          result = await ctx.runMutation(internal.inquiries.prepare, {
            sessionHash: body.sessionHash,
            details: body.details,
            ...(body.contactFormId
              ? { contactFormId: body.contactFormId }
              : {}),
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
      const conversationError = [
        'CONVERSATION_CHANGED',
        'CONVERSATION_BUSY',
        'CONVERSATION_LIMIT',
        'INVALID_CONVERSATION',
      ].find((code) => message.includes(code))
      return Response.json(
        {
          error:
            conversationError ??
            (limited
              ? 'Too many requests. Please try again later.'
              : 'The inquiry could not be processed. Please retry.'),
        },
        { status: limited ? 429 : 400 },
      )
    }
  }),
})
export default http
