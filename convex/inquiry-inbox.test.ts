// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import betterAuthTest from '@convex-dev/better-auth/test'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import schema from './schema'
import { api, components, internal } from './_generated/api'
import { inboxDateBounds } from '../shared/inquiry-admin'

const modules = import.meta.glob('./**/*.ts')
const summary = {
  overview: 'A warehouse wants inventory automation.',
  requirements: ['Track stock'],
  constraints: ['Use the existing ERP'],
  nextSteps: ['Discuss an integration'],
  openQuestions: ['Which ERP version?'],
}
const details = {
  name: 'Visitor',
  email: 'visitor@example.com',
  summary: 'Build an inventory tool that integrates with our ERP.',
  budget: 'EUR 10,000',
}

beforeEach(() => {
  vi.stubEnv('ADMIN_OWNER_EMAIL', 'owner@example.com')
  vi.stubEnv('SITE_URL', 'http://localhost:3000')
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-only-secret-with-over-32-characters')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

async function setup(email = 'owner@example.com') {
  const t = convexTest(schema, modules)
  betterAuthTest.register(t)
  const user = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name: 'Owner',
        email,
        emailVerified: true,
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
        token: 'test-only-token',
        expiresAt: Date.now() + 30 * 86_400_000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  })
  const owner = t.withIdentity({
    subject: String(user._id),
    sessionId: String(session._id),
  })
  return { t, owner }
}

async function confirm(
  t: Awaited<ReturnType<typeof setup>>['t'],
  sessionHash = 'visitor-a',
) {
  const draft = await t.mutation(internal.inquiries.prepare, {
    sessionHash,
    details,
  })
  const receipt = await t.mutation(internal.inquiries.confirm, {
    sessionHash,
    draftId: draft.draftId,
  })
  return { ...receipt, draftId: draft.draftId }
}

async function chat(t: Awaited<ReturnType<typeof setup>>['t']) {
  const user = {
    id: 'user-1',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'Our ERP cannot track stock across warehouses. We need an integration.',
      },
    ],
  }
  const generation = await t.mutation(internal.conversations.begin, {
    sessionHash: 'visitor-a',
    revision: 0,
    messages: JSON.stringify([user]),
  })
  await t.mutation(internal.conversations.finish, {
    sessionHash: 'visitor-a',
    revision: generation.revision,
    message: JSON.stringify({
      id: 'assistant-1',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Which ERP and how many warehouses?' }],
    }),
  })
}

test('snapshots the whole visible chat on confirmation and preserves it after restart and expiry', async () => {
  const { t, owner } = await setup()
  await chat(t)
  const { inquiryId, draftId } = await confirm(t)
  await t.mutation(internal.inquiries.confirm, {
    sessionHash: 'visitor-a',
    draftId,
  })
  expect(
    await t.run((ctx) => ctx.db.query('inquiryConversations').collect()),
  ).toHaveLength(1)
  await t.mutation(internal.conversations.restart, { sessionHash: 'visitor-a' })
  const thread = await t.run((ctx) => ctx.db.query('chatThreads').first())
  await t.run((ctx) => ctx.db.patch(thread!._id, { expiresAt: Date.now() - 1 }))
  await t.mutation(internal.conversations.prune, {})
  const result = await owner.query(api.inquiries.detail, { inquiryId })
  expect(result.messages).toHaveLength(2)
  expect(result.messages[0].text).toContain('Our ERP')
  expect(result).not.toHaveProperty('sessionHash')
  const page = await owner.query(api.inquiries.inbox, {
    paginationOpts: { cursor: null, numItems: 12 },
  })
  expect(page.page[0]).not.toHaveProperty('messages')
})

test('paginates all matching inquiries in creation order and combines status with inclusive Riga dates', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-01T12:00:00Z'))
  const { t, owner } = await setup()
  const ids = []
  for (let index = 0; index < 5; index++) {
    vi.setSystemTime(new Date(`2026-11-0${index + 1}T12:00:00Z`))
    ids.push(
      await t.run((ctx) =>
        ctx.db.insert('inquiries', {
          ...details,
          name: `Visitor ${index}`,
          status: index % 2 ? 'contacted' : 'new',
          source: 'chat',
          updatedAt: Date.now(),
        }),
      ),
    )
  }
  const first = await owner.query(api.inquiries.inbox, {
    paginationOpts: { cursor: null, numItems: 2 },
  })
  expect(first.page.map((row) => row._id)).toEqual([ids[4], ids[3]])
  expect(first.isDone).toBe(false)
  const second = await owner.query(api.inquiries.inbox, {
    paginationOpts: { cursor: first.continueCursor, numItems: 2 },
  })
  expect(second.page.map((row) => row._id)).toEqual([ids[2], ids[1]])
  const filtered = await owner.query(api.inquiries.inbox, {
    status: 'new',
    ...inboxDateBounds('2026-11-02', '2026-11-04'),
    paginationOpts: { cursor: null, numItems: 12 },
  })
  expect(filtered.page.map((row) => row._id)).toEqual([ids[2]])
})

test('locks generation, rejects stale results, caches saved summaries, and releases failed requests', async () => {
  const { t, owner } = await setup()
  await chat(t)
  const { inquiryId } = await confirm(t)
  const first = await owner.mutation(api.inquiries.beginSummary, {
    inquiryId,
    requestId: 'first',
  })
  expect(first.cached).toBe(false)
  await expect(
    owner.mutation(api.inquiries.beginSummary, {
      inquiryId,
      requestId: 'second',
    }),
  ).rejects.toThrow('already being generated')
  await owner.mutation(api.inquiries.cancelSummary, {
    inquiryId,
    requestId: 'first',
  })
  await owner.mutation(api.inquiries.beginSummary, {
    inquiryId,
    requestId: 'retry',
  })
  await expect(
    owner.mutation(api.inquiries.finishSummary, {
      inquiryId,
      requestId: 'first',
      summary,
      model: 'test-model',
    }),
  ).rejects.toThrow('changed')
  await owner.mutation(api.inquiries.finishSummary, {
    inquiryId,
    requestId: 'retry',
    summary,
    model: 'test-model',
  })
  expect(
    await owner.mutation(api.inquiries.beginSummary, {
      inquiryId,
      requestId: 'cached',
    }),
  ).toEqual({ cached: true, summary })
  expect(
    (await owner.query(api.inquiries.detail, { inquiryId })).summary,
  ).toEqual(summary)
  expect(
    (
      await owner.query(api.inquiries.inbox, {
        paginationOpts: { cursor: null, numItems: 12 },
      })
    ).page[0].hasSummary,
  ).toBe(true)
})

test('deletes the inquiry, submitted drafts, and saved chat copy without resurrecting an in-flight summary', async () => {
  const { t, owner } = await setup()
  await chat(t)
  const { inquiryId, draftId } = await confirm(t)
  await owner.mutation(api.inquiries.beginSummary, {
    inquiryId,
    requestId: 'pending',
  })
  await owner.mutation(api.inquiries.remove, { inquiryId })
  await expect(
    owner.mutation(api.inquiries.finishSummary, {
      inquiryId,
      requestId: 'pending',
      summary,
      model: 'test-model',
    }),
  ).rejects.toThrow('changed')
  expect(await t.run((ctx) => ctx.db.get(inquiryId))).toBeNull()
  expect(await t.run((ctx) => ctx.db.get(draftId))).toBeNull()
  expect(
    await t.run((ctx) => ctx.db.query('inquiryConversations').collect()),
  ).toHaveLength(0)
  // Original anonymous chat still follows its own retention policy.
  expect(
    await t.run((ctx) => ctx.db.query('chatThreads').collect()),
  ).toHaveLength(1)
})

test('reports unavailable legacy chats without pretending to summarize an unrelated conversation', async () => {
  const { t, owner } = await setup()
  await chat(t)
  const { inquiryId } = await confirm(t)
  await t.run(async (ctx) => {
    const row = await ctx.db.query('inquiryConversations').first()
    await ctx.db.delete(row!._id)
  })
  expect(
    (await owner.query(api.inquiries.detail, { inquiryId })).messages,
  ).toHaveLength(2)
  await t.mutation(internal.conversations.restart, { sessionHash: 'visitor-a' })
  expect(
    (await owner.query(api.inquiries.detail, { inquiryId })).messages,
  ).toHaveLength(0)
  await expect(
    owner.mutation(api.inquiries.beginSummary, {
      inquiryId,
      requestId: 'legacy',
    }),
  ).rejects.toThrow('no longer available')
})

test('guards inbox, details, deletion, and summary mutations with owner authorization', async () => {
  const { t, owner } = await setup('stranger@example.com')
  const { inquiryId } = await confirm(t)
  for (const client of [t, owner]) {
    await expect(
      client.query(api.inquiries.inbox, {
        paginationOpts: { cursor: null, numItems: 12 },
      }),
    ).rejects.toThrow('Unauthorized')
    await expect(
      client.query(api.inquiries.detail, { inquiryId }),
    ).rejects.toThrow('Unauthorized')
    await expect(
      client.mutation(api.inquiries.remove, { inquiryId }),
    ).rejects.toThrow('Unauthorized')
    await expect(
      client.mutation(api.inquiries.beginSummary, {
        inquiryId,
        requestId: 'x',
      }),
    ).rejects.toThrow('Unauthorized')
    await expect(
      client.mutation(api.inquiries.finishSummary, {
        inquiryId,
        requestId: 'x',
        summary,
        model: 'test-model',
      }),
    ).rejects.toThrow('Unauthorized')
    await expect(
      client.mutation(api.inquiries.cancelSummary, {
        inquiryId,
        requestId: 'x',
      }),
    ).rejects.toThrow('Unauthorized')
  }
})
