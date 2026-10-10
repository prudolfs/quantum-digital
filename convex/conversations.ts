import { ConvexError, v } from 'convex/values'
import { internalMutation, type MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import type { UIMessage } from 'ai'
import { chatLimits } from '../shared/chat'

const retention = 30 * 86_400_000
const rows = (ctx: MutationCtx, threadId: Id<'chatThreads'>) =>
  ctx.db
    .query('chatMessages')
    .withIndex('by_thread', (q) => q.eq('threadId', threadId))
    .collect()
async function find(ctx: MutationCtx, sessionHash: string) {
  return ctx.db
    .query('chatThreads')
    .withIndex('by_session', (q) => q.eq('sessionHash', sessionHash))
    .unique()
}
async function clear(ctx: MutationCtx, thread: Doc<'chatThreads'>) {
  for (const row of await rows(ctx, thread._id)) await ctx.db.delete(row._id)
}
async function receipts(
  ctx: MutationCtx,
  sessionHash: string,
  messages: UIMessage[],
) {
  const result: Record<string, 'saved' | 'expired'> = {}
  for (const message of messages)
    for (const part of message.parts) {
      if (
        part.type !== 'tool-prepareInquiry' ||
        part.state !== 'output-available'
      )
        continue
      const output = part.output as { draftId?: string }
      if (!output?.draftId) continue
      const id = ctx.db.normalizeId('inquiryDrafts', output.draftId)
      const draft = id ? await ctx.db.get(id) : null
      if (draft?.sessionHash === sessionHash && draft.inquiryId)
        result[output.draftId] = 'saved'
      else if (
        !draft ||
        draft.sessionHash !== sessionHash ||
        draft.expiresAt <= Date.now()
      )
        result[output.draftId] = 'expired'
    }
  return result
}
async function contactDrafts(
  ctx: MutationCtx,
  sessionHash: string,
  messages: UIMessage[],
) {
  const result: Record<
    string,
    {
      draftId: string
      details: {
        name: string
        email: string
        summary: string
        timing?: string
        budget?: string
      }
      expiresAt: number
      receipt?: 'saved' | 'expired'
    }
  > = {}
  for (const message of messages)
    for (const part of message.parts) {
      if (
        part.type !== 'tool-requestContactDetails' ||
        part.state !== 'output-available'
      )
        continue
      const formId = (part.output as { formId?: string })?.formId
      if (!formId) continue
      const draft = await ctx.db
        .query('inquiryDrafts')
        .withIndex('by_session_form', (q) =>
          q.eq('sessionHash', sessionHash).eq('contactFormId', formId),
        )
        .order('desc')
        .first()
      if (!draft) continue
      result[formId] = {
        draftId: draft._id,
        details: {
          name: draft.name,
          email: draft.email,
          summary: draft.summary,
          ...(draft.timing ? { timing: draft.timing } : {}),
          ...(draft.budget ? { budget: draft.budget } : {}),
        },
        expiresAt: draft.expiresAt,
        ...(draft.inquiryId
          ? { receipt: 'saved' as const }
          : draft.expiresAt <= Date.now()
            ? { receipt: 'expired' as const }
            : {}),
      }
    }
  return result
}

export const load = internalMutation({
  args: { sessionHash: v.string() },
  handler: async (ctx, { sessionHash }) => {
    const thread = await find(ctx, sessionHash)
    if (!thread)
      return { revision: 0, messages: [], receipts: {}, generating: false }
    if (thread.expiresAt <= Date.now()) {
      await clear(ctx, thread)
      await ctx.db.delete(thread._id)
      return { revision: 0, messages: [], receipts: {}, generating: false }
    }
    const messages = (await rows(ctx, thread._id)).map(
      (row) => JSON.parse(row.message) as UIMessage,
    )
    const now = Date.now()
    await ctx.db.patch(thread._id, {
      updatedAt: now,
      expiresAt: now + retention,
    })
    return {
      revision: thread.revision,
      messages,
      receipts: await receipts(ctx, sessionHash, messages),
      contactDrafts: await contactDrafts(ctx, sessionHash, messages),
      generating: (thread.generatingUntil ?? 0) > now,
    }
  },
})

export const restart = internalMutation({
  args: { sessionHash: v.string() },
  handler: async (ctx, { sessionHash }) => {
    const thread = await find(ctx, sessionHash)
    if (!thread) return { revision: 0 }
    await clear(ctx, thread)
    const revision = thread.revision + 1
    await ctx.db.patch(thread._id, {
      revision,
      generatingUntil: undefined,
      updatedAt: Date.now(),
      expiresAt: Date.now() + retention,
    })
    return { revision }
  },
})

export const begin = internalMutation({
  args: { sessionHash: v.string(), revision: v.number(), messages: v.string() },
  handler: async (ctx, args) => {
    const incoming = JSON.parse(args.messages) as UIMessage[]
    const user = incoming.at(-1)
    if (
      !user ||
      user.role !== 'user' ||
      incoming.length > chatLimits.messages ||
      args.messages.length > chatLimits.conversationCharacters
    )
      throw new ConvexError('INVALID_CONVERSATION')
    let thread = await find(ctx, args.sessionHash)
    if (!thread) {
      if (args.revision !== 0 || incoming.length !== 1)
        throw new ConvexError('CONVERSATION_CHANGED')
      const id = await ctx.db.insert('chatThreads', {
        sessionHash: args.sessionHash,
        revision: 0,
        updatedAt: Date.now(),
        expiresAt: Date.now() + retention,
      })
      thread = (await ctx.db.get(id))!
    }
    if (thread.revision !== args.revision || thread.expiresAt <= Date.now())
      throw new ConvexError('CONVERSATION_CHANGED')
    if ((thread.generatingUntil ?? 0) > Date.now())
      throw new ConvexError('CONVERSATION_BUSY')
    const storedRows = await rows(ctx, thread._id)
    const stored = storedRows.map((row) => JSON.parse(row.message) as UIMessage)
    let previousUser = -1
    for (let i = 0; i < stored.length; i++)
      if (stored[i].role === 'user') previousUser = i
    const retry = previousUser >= 0 && stored[previousUser].id === user.id
    if (!retry && stored.some((message) => message.id === user.id))
      throw new ConvexError('INVALID_CONVERSATION')
    const history = retry ? stored.slice(0, previousUser) : stored
    if (
      incoming.length !== history.length + 1 ||
      history.some((message, i) => message.id !== incoming[i].id)
    )
      throw new ConvexError('CONVERSATION_CHANGED')
    // Client history cannot replace saved assistant messages or tool outputs.
    const messages = [...history, retry ? stored[previousUser] : user]
    if (JSON.stringify(messages).length > chatLimits.conversationCharacters)
      throw new ConvexError('CONVERSATION_LIMIT')
    for (const row of storedRows.slice(history.length))
      await ctx.db.delete(row._id)
    await ctx.db.insert('chatMessages', {
      threadId: thread._id,
      position: history.length,
      message: JSON.stringify(messages.at(-1)),
    })
    const revision = thread.revision + 1
    await ctx.db.patch(thread._id, {
      revision,
      generatingUntil: Date.now() + 65_000,
      updatedAt: Date.now(),
      expiresAt: Date.now() + retention,
    })
    return { revision, messages }
  },
})

export const finish = internalMutation({
  args: {
    sessionHash: v.string(),
    revision: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const thread = await find(ctx, args.sessionHash)
    // A late stream must never put messages back after restart.
    if (!thread || thread.revision !== args.revision || !thread.generatingUntil)
      return
    if (args.message) {
      if (args.message.length > 100_000)
        throw new ConvexError('CONVERSATION_LIMIT')
      const message = JSON.parse(args.message) as UIMessage
      if (message.role !== 'assistant')
        throw new ConvexError('INVALID_CONVERSATION')
      const existing = await rows(ctx, thread._id)
      await ctx.db.insert('chatMessages', {
        threadId: thread._id,
        position: existing.length,
        message: args.message,
      })
    }
    await ctx.db.patch(thread._id, {
      generatingUntil: undefined,
      updatedAt: Date.now(),
      expiresAt: Date.now() + retention,
    })
  },
})

export const prune = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query('chatThreads')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', Date.now()))
      .take(100)
    for (const thread of expired) {
      await clear(ctx, thread)
      await ctx.db.delete(thread._id)
    }
  },
})
