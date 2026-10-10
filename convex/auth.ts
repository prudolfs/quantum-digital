import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth/minimal'
import { APIError } from 'better-auth/api'
import { components } from './_generated/api'
import type { DataModel } from './_generated/dataModel'
import { internalAction } from './_generated/server'
import { v } from 'convex/values'
import authConfig from './auth.config'

export const authComponent = createClient<DataModel>(components.betterAuth)

export function createAuth(ctx: GenericCtx<DataModel>, provisionOwner = false) {
  const siteURL = process.env.SITE_URL
  const owner = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase()
  if (!siteURL || !owner || !process.env.BETTER_AUTH_SECRET)
    throw new Error('Admin authentication is not configured.')
  return betterAuth({
    appName: 'Quantum Digital Admin',
    baseURL: siteURL,
    basePath: '/api/auth',
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [siteURL],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !provisionOwner,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (user.email.trim().toLowerCase() !== owner)
              throw new APIError('FORBIDDEN', {
                message: 'This is a private admin area.',
              })
            return { data: { ...user, email: owner, emailVerified: true } }
          },
        },
      },
    },
    session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 60 },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 20,
      customRules: { '/sign-in/email': { window: 300, max: 5 } },
    },
    advanced: { useSecureCookies: new URL(siteURL).protocol === 'https:' },
    plugins: [convex({ authConfig })],
  })
}

// Only deploy credentials / the Convex dashboard can invoke this internal action.
// Public signup stays disabled, including for the owner email.
export const provisionOwner = internalAction({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    await createAuth(ctx, true).api.signUpEmail({
      body: {
        name: 'Rudolfs Pukitis',
        email: process.env.ADMIN_OWNER_EMAIL!,
        password,
      },
    })
    return { created: true }
  },
})
