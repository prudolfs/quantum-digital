import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth/minimal'
import { APIError } from 'better-auth/api'
import { components } from './_generated/api'
import type { DataModel } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import authConfig from './auth.config'
import { setupOwnerSchema } from '../shared/content'

const digest = async (value: string) =>
  new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  )

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
      requireEmailVerification: false,
      autoSignIn: false,
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
      customRules: {
        '/sign-in/email': { window: 300, max: 5 },
        '/get-session': false,
        '/convex/token': false,
        '/convex/jwks': false,
      },
    },
    advanced: {
      useSecureCookies: new URL(siteURL).protocol === 'https:',
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
    },
    plugins: [convex({ authConfig })],
  })
}

export const setupStatus = query({
  args: {},
  handler: async (ctx) => {
    const configured = Boolean(
      process.env.ADMIN_OWNER_EMAIL &&
      process.env.SITE_URL &&
      process.env.BETTER_AUTH_SECRET,
    )
    if (!configured)
      return { configured: false, setupAvailable: false, ownerExists: false }
    const completed = await ctx.db
      .query('ownerSetup')
      .withIndex('by_key', (q) => q.eq('key', 'owner'))
      .unique()
    const existing = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'user',
    })
    return {
      configured,
      ownerExists: Boolean(completed || existing),
      setupAvailable:
        !completed &&
        !existing &&
        (process.env.ADMIN_SETUP_KEY?.length ?? 0) >= 32,
    }
  },
})

export const setupOwner = mutation({
  args: {
    email: v.string(),
    setupKey: v.string(),
    password: v.string(),
    confirmPassword: v.string(),
  },
  handler: async (ctx, input) => {
    const parsed = setupOwnerSchema.safeParse(input)
    const expected = process.env.ADMIN_SETUP_KEY
    const owner = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase()
    if (
      !parsed.success ||
      !expected ||
      expected.length < 32 ||
      parsed.data.email.toLowerCase() !== owner
    )
      throw new APIError('FORBIDDEN', {
        message: 'Owner setup is unavailable or the details are incorrect.',
      })
    const [provided, configured] = await Promise.all([
      digest(parsed.data.setupKey),
      digest(expected),
    ])
    let difference = 0
    for (let i = 0; i < provided.length; i++)
      difference |= provided[i]! ^ configured[i]!
    if (difference)
      throw new APIError('FORBIDDEN', {
        message: 'Owner setup is unavailable or the details are incorrect.',
      })
    const completed = await ctx.db
      .query('ownerSetup')
      .withIndex('by_key', (q) => q.eq('key', 'owner'))
      .unique()
    const existing = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'user',
    })
    if (completed || existing)
      throw new APIError('FORBIDDEN', {
        message: 'Owner setup is already complete.',
      })
    await createAuth(ctx, true).api.signUpEmail({
      body: {
        name: 'Site owner',
        email: owner!,
        password: parsed.data.password,
      },
    })
    await ctx.db.insert('ownerSetup', {
      key: 'owner',
      email: owner!,
      createdAt: Date.now(),
    })
    return { created: true }
  },
})
