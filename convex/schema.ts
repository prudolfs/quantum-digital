import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const fields = {
  name: v.string(),
  email: v.string(),
  summary: v.string(),
  timing: v.optional(v.string()),
  budget: v.optional(v.string()),
}

export default defineSchema({
  inquiryDrafts: defineTable({
    ...fields,
    sessionHash: v.string(),
    expiresAt: v.number(),
    inquiryId: v.optional(v.id('inquiries')),
  }).index('by_expiresAt', ['expiresAt']),
  inquiries: defineTable({
    ...fields,
    source: v.literal('chat'),
    status: v.union(
      v.literal('new'),
      v.literal('contacted'),
      v.literal('closed'),
    ),
    updatedAt: v.number(),
  }).index('by_status', ['status']),
  rateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    windowStart: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_windowStart', ['windowStart']),
})
