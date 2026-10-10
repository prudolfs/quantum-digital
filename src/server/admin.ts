import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authUtilities } from './auth'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export const loadInbox = createServerFn({ method: 'GET' })
  .validator(
    z.object({ status: z.enum(['all', 'new', 'contacted', 'closed']) }),
  )
  .handler(async ({ data }) => {
    const auth = authUtilities()
    if (!auth)
      return { signedIn: false as const, unavailable: true, inquiries: [] }
    try {
      const token = await auth.getToken()
      if (!token)
        return { signedIn: false as const, unavailable: false, inquiries: [] }
      const inquiries = await auth.fetchAuthQuery(
        api.inquiries.list,
        data.status === 'all' ? {} : { status: data.status },
      )
      return { signedIn: true as const, unavailable: false, inquiries }
    } catch {
      return { signedIn: false as const, unavailable: true, inquiries: [] }
    }
  })

export const changeInquiryStatus = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      inquiryId: z.string().min(1).max(100),
      status: z.enum(['new', 'contacted', 'closed']),
    }),
  )
  .handler(async ({ data }) => {
    const auth = authUtilities()
    if (!auth || !(await auth.getToken())) throw new Error('Unauthorized')
    await auth.fetchAuthMutation(api.inquiries.updateStatus, {
      inquiryId: data.inquiryId as Id<'inquiries'>,
      status: data.status,
    })
    return { updated: true }
  })
