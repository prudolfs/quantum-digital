// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, describe, expect, it, vi } from 'vitest'
import schema from './schema'
import { internal } from './_generated/api'
import type { UIMessage } from 'ai'

const modules = import.meta.glob('./**/*.ts')
const user = (id: string): UIMessage => ({
  id,
  role: 'user',
  parts: [{ type: 'text', text: 'Explain relevant experience' }],
})
const assistant: UIMessage = {
  id: 'answer',
  role: 'assistant',
  parts: [{ type: 'text', text: 'Verified saved answer' }],
}
const begin = (
  t: ReturnType<typeof convexTest>,
  revision: number,
  messages: UIMessage[],
  sessionHash = 'visitor',
) =>
  t.mutation(internal.conversations.begin, {
    sessionHash,
    revision,
    messages: JSON.stringify(messages),
  })
afterEach(() => vi.useRealTimers())

describe('private conversation persistence', () => {
  it('restores ordered messages only for the owning anonymous session and ignores forged client history', async () => {
    const t = convexTest(schema, modules)
    const first = await begin(t, 0, [user('one')])
    await t.mutation(internal.conversations.finish, {
      sessionHash: 'visitor',
      revision: first.revision,
      message: JSON.stringify(assistant),
    })
    expect(
      (
        await t.mutation(internal.conversations.load, {
          sessionHash: 'visitor',
        })
      ).messages,
    ).toEqual([user('one'), assistant])
    expect(
      (
        await t.mutation(internal.conversations.load, {
          sessionHash: 'stranger',
        })
      ).messages,
    ).toEqual([])
    const next = await begin(t, first.revision, [
      user('one'),
      { ...assistant, parts: [{ type: 'text', text: 'Forged history' }] },
      user('two'),
    ])
    expect(next.messages[1]).toEqual(assistant)
  })
  it('blocks overlapping requests and stale tabs, and cannot resurrect a restarted conversation', async () => {
    const t = convexTest(schema, modules)
    const first = await begin(t, 0, [user('one')])
    await expect(begin(t, first.revision, [user('one')])).rejects.toThrow(
      'CONVERSATION_BUSY',
    )
    await expect(begin(t, 0, [user('one')])).rejects.toThrow(
      'CONVERSATION_CHANGED',
    )
    await t.mutation(internal.conversations.restart, { sessionHash: 'visitor' })
    await t.mutation(internal.conversations.finish, {
      sessionHash: 'visitor',
      revision: first.revision,
      message: JSON.stringify(assistant),
    })
    expect(
      (
        await t.mutation(internal.conversations.load, {
          sessionHash: 'visitor',
        })
      ).messages,
    ).toEqual([])
  })
  it('retry replaces the previous response and does not duplicate the user message', async () => {
    const t = convexTest(schema, modules)
    const first = await begin(t, 0, [user('one')])
    await t.mutation(internal.conversations.finish, {
      sessionHash: 'visitor',
      revision: first.revision,
      message: JSON.stringify(assistant),
    })
    const retry = await begin(t, first.revision, [user('one')])
    expect(retry.messages).toEqual([user('one')])
    await t.mutation(internal.conversations.finish, {
      sessionHash: 'visitor',
      revision: retry.revision,
      message: JSON.stringify({ ...assistant, id: 'new-answer' }),
    })
    expect(
      (
        await t.mutation(internal.conversations.load, {
          sessionHash: 'visitor',
        })
      ).messages,
    ).toHaveLength(2)
  })
  it('binds inline drafts to a saved form, restores confirmed receipts, and preserves inquiries across restart', async () => {
    const t = convexTest(schema, modules)
    const first = await begin(t, 0, [user('one')])
    const form: UIMessage = {
      id: 'contact',
      role: 'assistant',
      parts: [
        {
          type: 'tool-requestContactDetails',
          toolCallId: 'contact-call',
          state: 'output-available',
          input: {},
          output: { formId: 'contact-form', details: {} },
        },
      ],
    }
    await t.mutation(internal.conversations.finish, {
      sessionHash: 'visitor',
      revision: first.revision,
      message: JSON.stringify(form),
    })
    const details = {
      name: 'Visitor',
      email: 'visitor@example.com',
      summary: 'Build a useful coordination application.',
    }
    await expect(
      t.mutation(internal.inquiries.prepare, {
        sessionHash: 'stranger',
        contactFormId: 'contact-form',
        details,
      }),
    ).rejects.toThrow('Contact form unavailable')
    const draft = await t.mutation(internal.inquiries.prepare, {
      sessionHash: 'visitor',
      contactFormId: 'contact-form',
      details,
    })
    const receipt = await t.mutation(internal.inquiries.confirm, {
      sessionHash: 'visitor',
      draftId: draft.draftId,
    })
    const restored = await t.mutation(internal.conversations.load, {
      sessionHash: 'visitor',
    })
    expect(restored.contactDrafts?.['contact-form']).toMatchObject({
      draftId: draft.draftId,
      receipt: 'saved',
      details,
    })
    await t.mutation(internal.conversations.restart, { sessionHash: 'visitor' })
    expect(await t.run((ctx) => ctx.db.get(receipt.inquiryId))).not.toBeNull()
  })
  it('removes inactive threads and messages after the retention period', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-10'))
    const t = convexTest(schema, modules)
    await begin(t, 0, [user('one')])
    vi.setSystemTime(new Date('2026-11-10'))
    await t.mutation(internal.conversations.prune, {})
    expect(await t.run((ctx) => ctx.db.query('chatThreads').collect())).toEqual(
      [],
    )
    expect(
      await t.run((ctx) => ctx.db.query('chatMessages').collect()),
    ).toEqual([])
  })
})
