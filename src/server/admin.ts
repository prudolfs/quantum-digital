import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { ConvexHttpClient } from 'convex/browser'
import { z } from 'zod'
import { authUtilities } from './auth'
import { assertSameOrigin } from './intake'
import { publicEnv } from '@/env'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { inboxFiltersSchema, inboxDateBounds } from '../../shared/inquiry-admin'
import { generateInquirySummary } from './inquiry-summary'
import { env } from 'cloudflare:workers'
import {
  caseStudySchema,
  serviceSchema,
  siteSettingsSchema,
  setupOwnerSchema,
} from '../../shared/content'

export const loadAdmin = createServerFn({ method: 'GET' })
  .validator(inboxFiltersSchema)
  .handler(async ({ data }) => {
    const auth = authUtilities()
    if (!auth || !publicEnv.VITE_CONVEX_URL)
      return {
        signedIn: false as const,
        unavailable: true,
        setupAvailable: false,
      }
    try {
      const status = await new ConvexHttpClient(
        publicEnv.VITE_CONVEX_URL,
      ).query(api.auth.setupStatus, {})
      const token = await auth.getToken()
      if (!token)
        return {
          signedIn: false as const,
          unavailable:
            !status.configured ||
            (!status.ownerExists && !status.setupAvailable),
          setupAvailable: status.setupAvailable,
        }
      const [workspace, inquiries] = await Promise.all([
        auth.fetchAuthQuery(api.content.workspace, {}),
        auth.fetchAuthQuery(api.inquiries.inbox, {
          ...(data.status === 'all' ? {} : { status: data.status }),
          ...inboxDateBounds(data.from, data.to),
          paginationOpts: { numItems: 12, cursor: data.cursor ?? null },
        }),
      ])
      return {
        signedIn: true as const,
        unavailable: false,
        setupAvailable: false,
        workspace,
        inquiries,
      }
    } catch {
      return {
        signedIn: false as const,
        unavailable: true,
        setupAvailable: false,
      }
    }
  })

async function ownerAuth() {
  assertSameOrigin(getRequest())
  const auth = authUtilities()
  if (!auth || !(await auth.getToken())) throw new Error('Unauthorized')
  return auth
}

export const setupOwner = createServerFn({ method: 'POST' })
  .validator(setupOwnerSchema)
  .handler(async ({ data }) => {
    assertSameOrigin(getRequest())
    if (!publicEnv.VITE_CONVEX_URL)
      throw new Error('Admin setup is unavailable.')
    return new ConvexHttpClient(publicEnv.VITE_CONVEX_URL).mutation(
      api.auth.setupOwner,
      data,
    )
  })

export const initializeContent = createServerFn({ method: 'POST' }).handler(
  async () => (await ownerAuth()).fetchAuthMutation(api.content.initialize, {}),
)

export const saveCaseStudy = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().optional(),
      expectedVersion: z.number().optional(),
      content: caseStudySchema,
      sortOrder: z.number().int().min(0).max(9999),
    }),
  )
  .handler(async ({ data }) =>
    (await ownerAuth()).fetchAuthMutation(api.content.saveCaseStudy, {
      ...data,
      id: data.id as Id<'caseStudies'> | undefined,
    }),
  )

export const saveService = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().optional(),
      expectedVersion: z.number().optional(),
      content: serviceSchema,
      sortOrder: z.number().int().min(0).max(9999),
    }),
  )
  .handler(async ({ data }) =>
    (await ownerAuth()).fetchAuthMutation(api.content.saveService, {
      ...data,
      id: data.id as Id<'services'> | undefined,
    }),
  )

const publicationSchema = z.object({
  id: z.string(),
  expectedVersion: z.number(),
  publish: z.boolean(),
})
export const publishCaseStudy = createServerFn({ method: 'POST' })
  .validator(publicationSchema)
  .handler(async ({ data }) =>
    (await ownerAuth()).fetchAuthMutation(api.content.setCaseStudyPublication, {
      ...data,
      id: data.id as Id<'caseStudies'>,
    }),
  )
export const publishService = createServerFn({ method: 'POST' })
  .validator(publicationSchema)
  .handler(async ({ data }) =>
    (await ownerAuth()).fetchAuthMutation(api.content.setServicePublication, {
      ...data,
      id: data.id as Id<'services'>,
    }),
  )

export const saveSiteSettings = createServerFn({ method: 'POST' })
  .validator(
    z.object({ expectedVersion: z.number(), content: siteSettingsSchema }),
  )
  .handler(async ({ data }) =>
    (await ownerAuth()).fetchAuthMutation(api.content.saveSettings, data),
  )
export const publishSiteSettings = createServerFn({ method: 'POST' })
  .validator(z.object({ expectedVersion: z.number() }))
  .handler(async ({ data }) =>
    (await ownerAuth()).fetchAuthMutation(api.content.publishSettings, data),
  )

export const changeInquiryStatus = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      inquiryId: z.string().min(1).max(100),
      status: z.enum(['new', 'contacted', 'closed']),
    }),
  )
  .handler(async ({ data }) => {
    await (
      await ownerAuth()
    ).fetchAuthMutation(api.inquiries.updateStatus, {
      inquiryId: data.inquiryId as Id<'inquiries'>,
      status: data.status,
    })
    return { updated: true }
  })

const inquiryIdSchema = z.object({ inquiryId: z.string().min(1).max(100) })

export const loadInquiry = createServerFn({ method: 'POST' })
  .validator(inquiryIdSchema)
  .handler(async ({ data }) =>
    (await ownerAuth()).fetchAuthQuery(api.inquiries.detail, {
      inquiryId: data.inquiryId as Id<'inquiries'>,
    }),
  )

export const deleteInquiry = createServerFn({ method: 'POST' })
  .validator(inquiryIdSchema)
  .handler(async ({ data }) =>
    (await ownerAuth()).fetchAuthMutation(api.inquiries.remove, {
      inquiryId: data.inquiryId as Id<'inquiries'>,
    }),
  )

export const summarizeInquiry = createServerFn({ method: 'POST' })
  .validator(inquiryIdSchema)
  .handler(async ({ data }) => {
    const auth = await ownerAuth()
    const inquiryId = data.inquiryId as Id<'inquiries'>
    if (!env.AI_GATEWAY_API_KEY || !env.AI_MODEL)
      throw new Error('Conversation summaries are temporarily unavailable.')
    const requestId = crypto.randomUUID()
    const reservation = await auth.fetchAuthMutation(
      api.inquiries.beginSummary,
      { inquiryId, requestId },
    )
    if (reservation.cached) return reservation.summary
    try {
      const summary = await generateInquirySummary(reservation, {
        apiKey: env.AI_GATEWAY_API_KEY,
        model: env.AI_MODEL,
      })
      return await auth.fetchAuthMutation(api.inquiries.finishSummary, {
        inquiryId,
        requestId,
        summary,
        model: env.AI_MODEL,
      })
    } catch {
      await auth
        .fetchAuthMutation(api.inquiries.cancelSummary, {
          inquiryId,
          requestId,
        })
        .catch(() => undefined)
      throw new Error(
        'The conversation summary couldn’t be generated. Please try again.',
      )
    }
  })
