import { ConvexError, v } from 'convex/values'
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from './_generated/server'
import { requireOwner } from './owner'
import { inquirySchema } from '../shared/inquiry'
import type { UIMessage } from 'ai'

const detailFields = {
  name: v.string(),
  email: v.string(),
  summary: v.string(),
  timing: v.optional(v.string()),
  budget: v.optional(v.string()),
}

async function consumeRate(
  ctx: MutationCtx,
  key: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now()
  const record = await ctx.db
    .query('rateLimits')
    .withIndex('by_key', (index) => index.eq('key', key))
    .unique()
  if (!record)
    return void (await ctx.db.insert('rateLimits', {
      key,
      count: 1,
      windowStart: now,
    }))
  if (now - record.windowStart >= windowMs)
    return void (await ctx.db.patch(record._id, { count: 1, windowStart: now }))
  if (record.count >= limit)
    throw new ConvexError('Too many requests. Please try again later.')
  await ctx.db.patch(record._id, { count: record.count + 1 })
}

export const checkChatRate = internalMutation({
  args: { ipHash: v.string() },
  handler: async (ctx, { ipHash }) =>
    consumeRate(ctx, `chat:${ipHash}`, 30, 60_000),
})

export const prepare = internalMutation({
  args: {
    sessionHash: v.string(),
    details: v.object(detailFields),
    contactFormId: v.optional(v.string()),
  },
  handler: async (ctx, { sessionHash, details, contactFormId }) => {
    const parsed = inquirySchema.safeParse(details)
    if (!parsed.success)
      throw new ConvexError('Please check the inquiry details.')
    if (contactFormId) {
      const thread = await ctx.db
        .query('chatThreads')
        .withIndex('by_session', (q) => q.eq('sessionHash', sessionHash))
        .unique()
      const messages = thread
        ? await ctx.db
            .query('chatMessages')
            .withIndex('by_thread', (q) => q.eq('threadId', thread._id))
            .collect()
        : []
      const exists = messages.some((row) =>
        (JSON.parse(row.message) as UIMessage).parts.some(
          (part) =>
            part.type === 'tool-requestContactDetails' &&
            part.state === 'output-available' &&
            (part.output as { formId?: string })?.formId === contactFormId,
        ),
      )
      if (!thread || thread.expiresAt <= Date.now() || !exists)
        throw new ConvexError(
          'Contact form unavailable. Please reopen it in chat.',
        )
    }
    await consumeRate(ctx, `draft:${sessionHash}`, 10, 3_600_000)
    const expiresAt = Date.now() + 3_600_000
    const draftId = await ctx.db.insert('inquiryDrafts', {
      ...parsed.data,
      sessionHash,
      expiresAt,
      ...(contactFormId ? { contactFormId } : {}),
    })
    return { draftId, details: parsed.data, expiresAt }
  },
})

export const confirm = internalMutation({
  args: { sessionHash: v.string(), draftId: v.id('inquiryDrafts') },
  handler: async (ctx, { sessionHash, draftId }) => {
    const draft = await ctx.db.get(draftId)
    if (!draft || draft.sessionHash !== sessionHash)
      throw new ConvexError('Inquiry draft unavailable.')
    if (draft.inquiryId) return { inquiryId: draft.inquiryId }
    if (draft.expiresAt <= Date.now())
      throw new ConvexError(
        'This draft expired. Please ask the assistant to prepare it again.',
      )
    await consumeRate(ctx, `confirm:${sessionHash}`, 5, 3_600_000)
    const inquiryId = await ctx.db.insert('inquiries', {
      name: draft.name,
      email: draft.email,
      summary: draft.summary,
      ...(draft.timing ? { timing: draft.timing } : {}),
      ...(draft.budget ? { budget: draft.budget } : {}),
      source: 'chat',
      status: 'new',
      updatedAt: Date.now(),
    })
    await ctx.db.patch(draftId, {
      inquiryId,
      expiresAt: Date.now() + 30 * 86_400_000,
    })
    return { inquiryId }
  },
})

export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal('new'), v.literal('contacted'), v.literal('closed')),
    ),
  },
  handler: async (ctx, { status }) => {
    await requireOwner(ctx)
    return status
      ? ctx.db
          .query('inquiries')
          .withIndex('by_status', (index) => index.eq('status', status))
          .order('desc')
          .take(100)
      : ctx.db.query('inquiries').order('desc').take(100)
  },
})

export const updateStatus = mutation({
  args: {
    inquiryId: v.id('inquiries'),
    status: v.union(
      v.literal('new'),
      v.literal('contacted'),
      v.literal('closed'),
    ),
  },
  handler: async (ctx, { inquiryId, status }) => {
    await requireOwner(ctx)
    if (!(await ctx.db.get(inquiryId)))
      throw new ConvexError('Inquiry not found.')
    await ctx.db.patch(inquiryId, { status, updatedAt: Date.now() })
  },
})

export const prune = internalMutation({
  args: {},
  handler: async (ctx) => {
    const drafts = await ctx.db
      .query('inquiryDrafts')
      .withIndex('by_expiresAt', (index) => index.lt('expiresAt', Date.now()))
      .take(200)
    for (const draft of drafts) {
      const thread = draft.inquiryId
        ? await ctx.db
            .query('chatThreads')
            .withIndex('by_session', (q) =>
              q.eq('sessionHash', draft.sessionHash),
            )
            .unique()
        : null
      if (thread && thread.expiresAt > Date.now())
        await ctx.db.patch(draft._id, { expiresAt: thread.expiresAt })
      else await ctx.db.delete(draft._id)
    }
    const rates = await ctx.db
      .query('rateLimits')
      .withIndex('by_windowStart', (index) =>
        index.lt('windowStart', Date.now() - 86_400_000),
      )
      .take(200)
    for (const rate of rates) await ctx.db.delete(rate._id)
  },
})
