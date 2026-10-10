import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { caseFields, serviceFields, settingsFields } from './contentFields'

const fields = {
  name: v.string(),
  email: v.string(),
  summary: v.string(),
  timing: v.optional(v.string()),
  budget: v.optional(v.string()),
}

export default defineSchema({
  chatThreads: defineTable({
    sessionHash: v.string(),
    revision: v.number(),
    updatedAt: v.number(),
    expiresAt: v.number(),
    generatingUntil: v.optional(v.number()),
  })
    .index('by_session', ['sessionHash'])
    .index('by_expiresAt', ['expiresAt']),
  chatMessages: defineTable({
    threadId: v.id('chatThreads'),
    position: v.number(),
    message: v.string(),
  }).index('by_thread', ['threadId', 'position']),
  ownerSetup: defineTable({
    key: v.literal('owner'),
    email: v.string(),
    createdAt: v.number(),
  }).index('by_key', ['key']),
  contentState: defineTable({
    key: v.literal('site'),
    initializedAt: v.number(),
  }).index('by_key', ['key']),
  caseStudies: defineTable({
    draft: v.object(caseFields),
    sortOrder: v.number(),
    version: v.number(),
    updatedAt: v.number(),
    publishedVersion: v.optional(v.number()),
    published: v.optional(
      v.object({ content: v.object(caseFields), sortOrder: v.number() }),
    ),
  }).index('by_slug', ['draft.slug']),
  services: defineTable({
    draft: v.object(serviceFields),
    sortOrder: v.number(),
    version: v.number(),
    updatedAt: v.number(),
    publishedVersion: v.optional(v.number()),
    published: v.optional(
      v.object({ content: v.object(serviceFields), sortOrder: v.number() }),
    ),
  }).index('by_slug', ['draft.id']),
  siteSettings: defineTable({
    key: v.literal('site'),
    draft: v.object(settingsFields),
    published: v.object(settingsFields),
    version: v.number(),
    publishedVersion: v.number(),
    updatedAt: v.number(),
  }).index('by_key', ['key']),
  inquiryDrafts: defineTable({
    ...fields,
    sessionHash: v.string(),
    expiresAt: v.number(),
    inquiryId: v.optional(v.id('inquiries')),
    contactFormId: v.optional(v.string()),
  })
    .index('by_expiresAt', ['expiresAt'])
    .index('by_session_form', ['sessionHash', 'contactFormId']),
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
