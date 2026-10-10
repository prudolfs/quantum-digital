import { ConvexError } from 'convex/values'
import type { QueryCtx, MutationCtx } from './_generated/server'
import { authComponent } from './auth'

export async function requireOwner(ctx: QueryCtx | MutationCtx) {
  const user = await authComponent.safeGetAuthUser(ctx)
  const owner = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase()
  if (
    !user ||
    !owner ||
    user.email.toLowerCase() !== owner ||
    !user.emailVerified
  )
    throw new ConvexError('Unauthorized')
  return user
}
