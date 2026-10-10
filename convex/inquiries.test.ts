// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import betterAuthTest from '@convex-dev/better-auth/test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import schema from './schema'
import { api, components, internal } from './_generated/api'

const modules = import.meta.glob('./**/*.ts')
const details = {
  name: 'Visitor',
  email: 'VISITOR@example.com',
  summary: 'Build a product that automates our service coordination.',
  timing: 'This quarter',
}
function setup() {
  const t = convexTest(schema, modules)
  betterAuthTest.register(t)
  return t
}
async function ownerSession(
  t: ReturnType<typeof setup>,
  email = 'owner@example.com',
  verified = true,
  expiresAt = Date.now() + 3600_000,
) {
  const user = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name: 'Owner',
        email,
        emailVerified: verified,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  })
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'session',
      data: {
        userId: String(user._id),
        token: 'test-only-session',
        expiresAt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  })
  return t.withIdentity({
    subject: String(user._id),
    sessionId: String(session._id),
  })
}

beforeEach(() => {
  vi.stubEnv('ADMIN_OWNER_EMAIL', 'owner@example.com')
  vi.stubEnv('SITE_URL', 'http://localhost:3000')
  vi.stubEnv(
    'BETTER_AUTH_SECRET',
    'test-only-auth-secret-never-used-in-production',
  )
  vi.stubEnv(
    'INTAKE_BRIDGE_SECRET',
    'test-only-bridge-secret-never-used-in-production',
  )
})
afterEach(() => vi.unstubAllEnvs())

describe('confirmed chat inquiries', () => {
  it('prepares a draft without submitting, then confirms exactly once', async () => {
    const t = setup()
    const draft = await t.mutation(internal.inquiries.prepare, {
      sessionHash: 'visitor-a',
      details,
    })
    expect(
      await t.run((ctx) => ctx.db.query('inquiries').collect()),
    ).toHaveLength(0)
    const first = await t.mutation(internal.inquiries.confirm, {
      sessionHash: 'visitor-a',
      draftId: draft.draftId,
    })
    const retry = await t.mutation(internal.inquiries.confirm, {
      sessionHash: 'visitor-a',
      draftId: draft.draftId,
    })
    expect(retry.inquiryId).toBe(first.inquiryId)
    const rows = await t.run((ctx) => ctx.db.query('inquiries').collect())
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      name: 'Visitor',
      email: 'visitor@example.com',
      source: 'chat',
      status: 'new',
    })
  })
  it('rejects confirmation from another visitor and expired drafts', async () => {
    const t = setup()
    const draft = await t.mutation(internal.inquiries.prepare, {
      sessionHash: 'visitor-a',
      details,
    })
    await expect(
      t.mutation(internal.inquiries.confirm, {
        sessionHash: 'visitor-b',
        draftId: draft.draftId,
      }),
    ).rejects.toThrow('unavailable')
    await t.run((ctx) =>
      ctx.db.patch(draft.draftId, { expiresAt: Date.now() - 1 }),
    )
    await expect(
      t.mutation(internal.inquiries.confirm, {
        sessionHash: 'visitor-a',
        draftId: draft.draftId,
      }),
    ).rejects.toThrow('expired')
    expect(
      await t.run((ctx) => ctx.db.query('inquiries').collect()),
    ).toHaveLength(0)
  })
  it.each([
    { ...details, email: 'invalid' },
    { ...details, summary: 'too short' },
    { ...details, name: '' },
  ])('validates details on the backend', async (invalid) => {
    const t = setup()
    await expect(
      t.mutation(internal.inquiries.prepare, {
        sessionHash: 'visitor-a',
        details: invalid,
      }),
    ).rejects.toThrow('check the inquiry')
    expect(
      await t.run((ctx) => ctx.db.query('inquiryDrafts').collect()),
    ).toHaveLength(0)
  })
  it('rejects unauthenticated reads and status updates', async () => {
    const t = setup()
    const draft = await t.mutation(internal.inquiries.prepare, {
      sessionHash: 'visitor-a',
      details,
    })
    const { inquiryId } = await t.mutation(internal.inquiries.confirm, {
      sessionHash: 'visitor-a',
      draftId: draft.draftId,
    })
    await expect(t.query(api.inquiries.list, {})).rejects.toThrow(
      'Unauthorized',
    )
    await expect(
      t.mutation(api.inquiries.updateStatus, { inquiryId, status: 'closed' }),
    ).rejects.toThrow('Unauthorized')
  })
  it('lets only the verified owner with a live session review and update inquiries', async () => {
    const t = setup()
    const draft = await t.mutation(internal.inquiries.prepare, {
      sessionHash: 'visitor-a',
      details,
    })
    const { inquiryId } = await t.mutation(internal.inquiries.confirm, {
      sessionHash: 'visitor-a',
      draftId: draft.draftId,
    })
    const owner = await ownerSession(t)
    expect(await owner.query(api.inquiries.list, {})).toHaveLength(1)
    await owner.mutation(api.inquiries.updateStatus, {
      inquiryId,
      status: 'contacted',
    })
    expect(
      await owner.query(api.inquiries.list, { status: 'new' }),
    ).toHaveLength(0)
    expect(
      await owner.query(api.inquiries.list, { status: 'contacted' }),
    ).toHaveLength(1)
    for (const invalid of [
      await ownerSession(setup(), 'stranger@example.com'),
      await ownerSession(setup(), 'owner@example.com', false),
      await ownerSession(setup(), 'owner@example.com', true, Date.now() - 1),
    ]) {
      await expect(invalid.query(api.inquiries.list, {})).rejects.toThrow(
        'Unauthorized',
      )
      await expect(
        invalid.mutation(api.inquiries.updateStatus, {
          inquiryId,
          status: 'closed',
        }),
      ).rejects.toThrow('Unauthorized')
    }
  })
  it('limits chat requests atomically', async () => {
    const t = setup()
    for (let i = 0; i < 30; i++)
      await t.mutation(internal.inquiries.checkChatRate, {
        ipHash: 'same-network',
      })
    await expect(
      t.mutation(internal.inquiries.checkChatRate, { ipHash: 'same-network' }),
    ).rejects.toThrow('Too many requests')
    await t.mutation(internal.inquiries.checkChatRate, {
      ipHash: 'other-network',
    })
  })
  it('refuses untrusted calls to the Worker-to-Convex intake bridge', async () => {
    const t = setup()
    const response = await t.fetch('/intake', {
      method: 'POST',
      body: JSON.stringify({ operation: 'prepare', details }),
    })
    expect(response.status).toBe(401)
    expect(
      await t.run((ctx) => ctx.db.query('inquiryDrafts').collect()),
    ).toHaveLength(0)
  })
  it('disables public registration even for the owner email', async () => {
    const t = setup()
    const response = await t.fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Owner',
        email: 'owner@example.com',
        password: 'test-only-password-123',
      }),
    })
    expect(response.ok).toBe(false)
  })
  it('removes expired drafts without deleting confirmed inquiries', async () => {
    const t = setup()
    const draft = await t.mutation(internal.inquiries.prepare, {
      sessionHash: 'visitor-a',
      details,
    })
    await t.mutation(internal.inquiries.confirm, {
      sessionHash: 'visitor-a',
      draftId: draft.draftId,
    })
    await t.run((ctx) =>
      ctx.db.patch(draft.draftId, { expiresAt: Date.now() - 1 }),
    )
    await t.mutation(internal.inquiries.prune, {})
    expect(
      await t.run((ctx) => ctx.db.query('inquiryDrafts').collect()),
    ).toHaveLength(0)
    expect(
      await t.run((ctx) => ctx.db.query('inquiries').collect()),
    ).toHaveLength(1)
  })
})
