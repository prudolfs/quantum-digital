import { expect, test } from 'vitest'
import {
  inboxDateBounds,
  readableConversation,
} from '../../shared/inquiry-admin'

test('date filters cover inclusive Riga calendar dates across daylight-saving changes', () => {
  const spring = inboxDateBounds('2026-03-29', '2026-03-29')
  expect(new Date(spring.from!).toISOString()).toBe('2026-03-28T22:00:00.000Z')
  expect(new Date(spring.to!).toISOString()).toBe('2026-03-29T21:00:00.000Z')
  expect(spring.to! - spring.from!).toBe(23 * 3600_000)
  const autumn = inboxDateBounds('2026-10-25', '2026-10-25')
  expect(autumn.to! - autumn.from!).toBe(25 * 3600_000)
  expect(() => inboxDateBounds('2026-11-06', '2026-11-05')).toThrow('end date')
})

test('saved chat snapshots keep visible user and assistant text without hidden reasoning or tools', () => {
  expect(
    readableConversation([
      {
        message: JSON.stringify({
          role: 'user',
          parts: [
            { type: 'text', text: 'Our warehouse needs an inventory tool.' },
          ],
        }),
      },
      {
        message: JSON.stringify({
          role: 'assistant',
          parts: [
            { type: 'reasoning', text: 'private reasoning' },
            { type: 'text', text: 'What systems do you use?' },
            {
              type: 'tool-prepareInquiry',
              output: { secret: 'not part of the transcript' },
            },
          ],
        }),
      },
      { message: 'invalid json' },
      {
        message: JSON.stringify({
          role: 'system',
          parts: [{ type: 'text', text: 'private prompt' }],
        }),
      },
    ]),
  ).toEqual([
    { role: 'user', text: 'Our warehouse needs an inventory tool.' },
    { role: 'assistant', text: 'What systems do you use?' },
  ])
})
