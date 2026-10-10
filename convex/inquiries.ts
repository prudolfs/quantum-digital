import { ConvexError, v } from 'convex/values'
import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from './_generated/server'
import { authComponent } from './auth'
import { inquirySchema } from '../shared/inquiry'

const detailFields = {
  name: v.string(),
  email: v.string(),
  summary: v.string(),
  timing: v.optional(v.string()),
  budget: v.optional(v.string()),
}

async function requireOwner(ctx: QueryCtx | MutationCtx) {
  const user = await authComponent.safeGetAuthUser(ctx)
  const owner = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase()
  if (
    !user ||
    !owner ||
    user.email.toLowerCase() !== owner ||
    !user.emailVerified
  ) {
    throw new ConvexError('Unauthorized')
  }
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
  args: { sessionHash: v.string(), details: v.object(detailFields) },
  handler: async (ctx, { sessionHash, details }) => {
    const parsed = inquirySchema.safeParse(details)
    if (!parsed.success)
      throw new ConvexError('Please check the inquiry details.')
    await consumeRate(ctx, `draft:${sessionHash}`, 10, 3_600_000)
    const expiresAt = Date.now() + 3_600_000
    const draftId = await ctx.db.insert('inquiryDrafts', {
      ...parsed.data,
      sessionHash,
      expiresAt,
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
    await ctx.db.patch(draftId, { inquiryId })
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
    for (const draft of drafts) await ctx.db.delete(draft._id)
    const rates = await ctx.db
      .query('rateLimits')
      .withIndex('by_windowStart', (index) =>
        index.lt('windowStart', Date.now() - 86_400_000),
      )
      .take(200)
    for (const rate of rates) await ctx.db.delete(rate._id)
  },
})
