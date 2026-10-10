// Arrays below are fresh query results or newly collected publication snapshots.
/* eslint-disable unicorn/no-array-sort */
import { ConvexError, v } from 'convex/values'
import { mutation, query, type MutationCtx } from './_generated/server'
import { requireOwner } from './owner'
import { caseFields, serviceFields, settingsFields } from './contentFields'
import {
  caseStudySchema,
  serviceSchema,
  siteSettingsSchema,
} from '../shared/content'
import { defaultContent } from '../shared/content-defaults'

const checkOrder = (order: number) => {
  if (!Number.isInteger(order) || order < 0 || order > 9999)
    throw new ConvexError('Use a whole-number order from 0 to 9999.')
}
async function requireInitialized(ctx: MutationCtx) {
  if (
    !(await ctx.db
      .query('contentState')
      .withIndex('by_key', (q) => q.eq('key', 'site'))
      .unique())
  )
    throw new ConvexError('Import the current site content first.')
}
const checkVersion = (
  current: { version: number } | null,
  expected?: number,
) => {
  if (!current) throw new ConvexError('This record no longer exists.')
  if (current.version !== expected)
    throw new ConvexError(
      'This record changed elsewhere. Reload before saving.',
    )
}

const ordered = <
  T extends { published?: { content: unknown; sortOrder: number } },
>(
  rows: T[],
) =>
  rows
    .flatMap((row) => (row.published ? [row.published] : []))
    .sort((a, b) => a.sortOrder - b.sortOrder)

export const published = query({
  args: {},
  handler: async (ctx) => {
    const initialized = await ctx.db
      .query('contentState')
      .withIndex('by_key', (q) => q.eq('key', 'site'))
      .unique()
    if (!initialized) return null
    const [cases, services, settings] = await Promise.all([
      ctx.db.query('caseStudies').collect(),
      ctx.db.query('services').collect(),
      ctx.db
        .query('siteSettings')
        .withIndex('by_key', (q) => q.eq('key', 'site'))
        .unique(),
    ])
    if (!settings) throw new ConvexError('Site settings are unavailable.')
    return {
      caseStudies: ordered(cases).map(
        (entry) => entry.content as (typeof cases)[number]['draft'],
      ),
      services: ordered(services).map(
        (entry) => entry.content as (typeof services)[number]['draft'],
      ),
      settings: settings.published,
    }
  },
})

export const workspace = query({
  args: {},
  handler: async (ctx) => {
    const owner = await requireOwner(ctx)
    const [state, cases, services, settings] = await Promise.all([
      ctx.db
        .query('contentState')
        .withIndex('by_key', (q) => q.eq('key', 'site'))
        .unique(),
      ctx.db.query('caseStudies').collect(),
      ctx.db.query('services').collect(),
      ctx.db
        .query('siteSettings')
        .withIndex('by_key', (q) => q.eq('key', 'site'))
        .unique(),
    ])
    return {
      ownerEmail: owner.email,
      initialized: Boolean(state),
      caseStudies: cases.sort((a, b) => a.sortOrder - b.sortOrder),
      services: services.sort((a, b) => a.sortOrder - b.sortOrder),
      settings,
    }
  },
})

export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx)
    if (
      await ctx.db
        .query('contentState')
        .withIndex('by_key', (q) => q.eq('key', 'site'))
        .unique()
    )
      return { initialized: true }
    if (
      (await ctx.db.query('caseStudies').first()) ||
      (await ctx.db.query('services').first()) ||
      (await ctx.db.query('siteSettings').first())
    )
      throw new ConvexError(
        'Content already exists. Review the database before importing.',
      )
    const updatedAt = Date.now()
    for (const [sortOrder, draft] of defaultContent.caseStudies.entries()) {
      const content = caseStudySchema.parse(draft)
      await ctx.db.insert('caseStudies', {
        draft: content,
        sortOrder,
        version: 1,
        publishedVersion: 1,
        published: { content, sortOrder },
        updatedAt,
      })
    }
    for (const [sortOrder, draft] of defaultContent.services.entries()) {
      const content = serviceSchema.parse(draft)
      await ctx.db.insert('services', {
        draft: content,
        sortOrder,
        version: 1,
        publishedVersion: 1,
        published: { content, sortOrder },
        updatedAt,
      })
    }
    const settings = siteSettingsSchema.parse(defaultContent.settings)
    await ctx.db.insert('siteSettings', {
      key: 'site',
      draft: settings,
      published: settings,
      version: 1,
      publishedVersion: 1,
      updatedAt,
    })
    await ctx.db.insert('contentState', {
      key: 'site',
      initializedAt: updatedAt,
    })
    return { initialized: true }
  },
})

export const saveCaseStudy = mutation({
  args: {
    id: v.optional(v.id('caseStudies')),
    expectedVersion: v.optional(v.number()),
    content: v.object(caseFields),
    sortOrder: v.number(),
  },
  handler: async (ctx, { id, expectedVersion, content, sortOrder }) => {
    await requireOwner(ctx)
    await requireInitialized(ctx)
    checkOrder(sortOrder)
    const parsed = caseStudySchema.safeParse(content)
    if (!parsed.success)
      throw new ConvexError(
        'Check the required case-study fields, lengths, slug, and HTTPS links.',
      )
    const current = id ? await ctx.db.get(id) : null
    if (id) checkVersion(current, expectedVersion)
    const duplicate = await ctx.db
      .query('caseStudies')
      .withIndex('by_slug', (q) => q.eq('draft.slug', parsed.data.slug))
      .unique()
    if (duplicate && duplicate._id !== id)
      throw new ConvexError('This case-study slug is already used.')
    if (!id && (await ctx.db.query('caseStudies').take(100)).length >= 100)
      throw new ConvexError('Use up to 100 case studies.')
    const record = {
      draft: parsed.data,
      sortOrder,
      updatedAt: Date.now(),
      version: (current?.version ?? 0) + 1,
    }
    if (id) {
      await ctx.db.patch(id, record)
      return id
    }
    return ctx.db.insert('caseStudies', record)
  },
})

export const saveService = mutation({
  args: {
    id: v.optional(v.id('services')),
    expectedVersion: v.optional(v.number()),
    content: v.object(serviceFields),
    sortOrder: v.number(),
  },
  handler: async (ctx, { id, expectedVersion, content, sortOrder }) => {
    await requireOwner(ctx)
    await requireInitialized(ctx)
    checkOrder(sortOrder)
    const parsed = serviceSchema.safeParse(content)
    if (!parsed.success)
      throw new ConvexError(
        'Check the required service fields and illustration.',
      )
    const current = id ? await ctx.db.get(id) : null
    if (id) checkVersion(current, expectedVersion)
    const duplicate = await ctx.db
      .query('services')
      .withIndex('by_slug', (q) => q.eq('draft.id', parsed.data.id))
      .unique()
    if (duplicate && duplicate._id !== id)
      throw new ConvexError('This service ID is already used.')
    if (!id && (await ctx.db.query('services').take(40)).length >= 40)
      throw new ConvexError('Use up to 40 services.')
    const record = {
      draft: parsed.data,
      sortOrder,
      updatedAt: Date.now(),
      version: (current?.version ?? 0) + 1,
    }
    if (id) {
      await ctx.db.patch(id, record)
      return id
    }
    return ctx.db.insert('services', record)
  },
})

export const setCaseStudyPublication = mutation({
  args: {
    id: v.id('caseStudies'),
    expectedVersion: v.number(),
    publish: v.boolean(),
  },
  handler: async (ctx, { id, expectedVersion, publish }) => {
    await requireOwner(ctx)
    await requireInitialized(ctx)
    const current = await ctx.db.get(id)
    checkVersion(current, expectedVersion)
    if (!current) return
    if (publish) {
      const rows = await ctx.db.query('caseStudies').collect()
      if (
        rows.some(
          (row) =>
            row._id !== id &&
            row.published?.content.slug === current.draft.slug,
        )
      )
        throw new ConvexError('This public slug is already used.')
      caseStudySchema.parse(current.draft)
    }
    const version = current.version + 1
    await ctx.db.patch(id, {
      version,
      updatedAt: Date.now(),
      publishedVersion: publish ? version : undefined,
      published: publish
        ? { content: current.draft, sortOrder: current.sortOrder }
        : undefined,
    })
  },
})

export const setServicePublication = mutation({
  args: {
    id: v.id('services'),
    expectedVersion: v.number(),
    publish: v.boolean(),
  },
  handler: async (ctx, { id, expectedVersion, publish }) => {
    await requireOwner(ctx)
    await requireInitialized(ctx)
    const current = await ctx.db.get(id)
    checkVersion(current, expectedVersion)
    if (!current) return
    if (publish) {
      const rows = await ctx.db.query('services').collect()
      if (
        rows.some(
          (row) =>
            row._id !== id && row.published?.content.id === current.draft.id,
        )
      )
        throw new ConvexError('This public service ID is already used.')
      serviceSchema.parse(current.draft)
    }
    const version = current.version + 1
    await ctx.db.patch(id, {
      version,
      updatedAt: Date.now(),
      publishedVersion: publish ? version : undefined,
      published: publish
        ? { content: current.draft, sortOrder: current.sortOrder }
        : undefined,
    })
  },
})

export const saveSettings = mutation({
  args: { expectedVersion: v.number(), content: v.object(settingsFields) },
  handler: async (ctx, { expectedVersion, content }) => {
    await requireOwner(ctx)
    await requireInitialized(ctx)
    const current = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', 'site'))
      .unique()
    checkVersion(current, expectedVersion)
    const parsed = siteSettingsSchema.safeParse(content)
    if (!parsed.success)
      throw new ConvexError(
        'Check the settings fields, contact email, and questions.',
      )
    await ctx.db.patch(current!._id, {
      draft: parsed.data,
      version: current!.version + 1,
      updatedAt: Date.now(),
    })
  },
})

export const publishSettings = mutation({
  args: { expectedVersion: v.number() },
  handler: async (ctx, { expectedVersion }) => {
    await requireOwner(ctx)
    await requireInitialized(ctx)
    const current = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', 'site'))
      .unique()
    checkVersion(current, expectedVersion)
    const version = current!.version + 1
    await ctx.db.patch(current!._id, {
      published: siteSettingsSchema.parse(current!.draft),
      version,
      publishedVersion: version,
      updatedAt: Date.now(),
    })
  },
})
