import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { ConvexHttpClient } from 'convex/browser'
import { z } from 'zod'
import { authUtilities } from './auth'
import { assertSameOrigin } from './intake'
import { publicEnv } from '@/env'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import {
  caseStudySchema,
  serviceSchema,
  siteSettingsSchema,
  setupOwnerSchema,
} from '../../shared/content'

export const loadAdmin = createServerFn({ method: 'GET' })
  .validator(
    z.object({ status: z.enum(['all', 'new', 'contacted', 'closed']) }),
  )
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
        auth.fetchAuthQuery(
          api.inquiries.list,
          data.status === 'all' ? {} : { status: data.status },
        ),
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
