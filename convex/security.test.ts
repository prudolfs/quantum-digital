// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, expect, test, vi } from 'vitest'
import schema from './schema'
import { internal } from './_generated/api'
import { requestLimits } from '../shared/security'
const modules = import.meta.glob('./**/*.ts')
afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

test.each(Object.keys(requestLimits) as (keyof typeof requestLimits)[])(
  'limits %s even when a visitor rotates cookies',
  async (kind) => {
    const t = convexTest(schema, modules)
    for (let i = 0; i < requestLimits[kind].maximum; i++)
      await t.mutation(internal.inquiries.checkRequestRate, {
        kind,
        ipHash: 'network',
        sessionHash: `session-${i}`,
      })
    await expect(
      t.mutation(internal.inquiries.checkRequestRate, {
        kind,
        ipHash: 'network',
        sessionHash: 'new-cookie',
      }),
    ).rejects.toThrow('Too many requests')
    await t.mutation(internal.inquiries.checkRequestRate, {
      kind,
      ipHash: 'other-network',
    })
  },
)
test('limits a session across changing networks and allows requests after the window', async () => {
  vi.useFakeTimers()
  const t = convexTest(schema, modules)
  for (let i = 0; i < 10; i++)
    await t.mutation(internal.inquiries.checkRequestRate, {
      kind: 'restart',
      ipHash: `network-${i}`,
      sessionHash: 'visitor',
    })
  await expect(
    t.mutation(internal.inquiries.checkRequestRate, {
      kind: 'restart',
      ipHash: 'another-network',
      sessionHash: 'visitor',
    }),
  ).rejects.toThrow('Too many requests')
  vi.advanceTimersByTime(60_000)
  await t.mutation(internal.inquiries.checkRequestRate, {
    kind: 'restart',
    ipHash: 'another-network',
    sessionHash: 'visitor',
  })
})
test('caps generations site-wide and starts a new allowance on the next UTC day', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-12T23:59:00Z'))
  vi.stubEnv('AI_CHAT_DAILY_LIMIT', '2')
  const t = convexTest(schema, modules)
  await t.mutation(internal.inquiries.reserveGeneration, {})
  await t.mutation(internal.inquiries.reserveGeneration, {})
  await expect(
    t.mutation(internal.inquiries.reserveGeneration, {}),
  ).rejects.toThrow('AI_DAILY_LIMIT')
  vi.advanceTimersByTime(60_000)
  await t.mutation(internal.inquiries.reserveGeneration, {})
})
test.each(['0', '-1', '2.5', 'oops', '10001'])(
  'fails closed for invalid daily limit %s',
  async (limit) => {
    vi.stubEnv('AI_CHAT_DAILY_LIMIT', limit)
    const t = convexTest(schema, modules)
    await expect(
      t.mutation(internal.inquiries.reserveGeneration, {}),
    ).rejects.toThrow('ASSISTANT_PAUSED')
  },
)
test('pauses generation without deleting stored conversations or inquiries', async () => {
  vi.stubEnv('AI_CHAT_ENABLED', 'false')
  const t = convexTest(schema, modules)
  await expect(
    t.mutation(internal.inquiries.reserveGeneration, {}),
  ).rejects.toThrow('ASSISTANT_PAUSED')
  expect(
    await t.mutation(internal.conversations.load, { sessionHash: 'visitor' }),
  ).toMatchObject({ messages: [] })
})
test('does not expose rate counters or generation reservations through the public bridge', async () => {
  vi.stubEnv(
    'INTAKE_BRIDGE_SECRET',
    'test-only-bridge-secret-over-32-characters',
  )
  const t = convexTest(schema, modules)
  for (const operation of [
    'request-rate',
    'generation-reserve',
    'conversation-load',
  ]) {
    const result = await t.fetch('/intake', {
      method: 'POST',
      body: JSON.stringify({ operation, sessionHash: 'visitor' }),
    })
    expect(result.status).toBe(401)
  }
  expect(await t.run((ctx) => ctx.db.query('rateLimits').collect())).toEqual([])
})

test('the authenticated bridge reports the daily cap separately from per-visitor rate limits', async () => {
  const secret = 'test-only-bridge-secret-over-32-characters'
  vi.stubEnv('INTAKE_BRIDGE_SECRET', secret)
  vi.stubEnv('AI_CHAT_DAILY_LIMIT', '1')
  const t = convexTest(schema, modules)
  const reserve = () =>
    t.fetch('/intake', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operation: 'generation-reserve' }),
    })
  expect((await reserve()).status).toBe(200)
  const limited = await reserve()
  expect(limited.status).toBe(429)
  expect(await limited.json()).toEqual({ error: 'AI_DAILY_LIMIT' })
  vi.stubEnv('AI_CHAT_ENABLED', 'false')
  expect(await (await reserve()).json()).toEqual({ error: 'ASSISTANT_PAUSED' })
})
