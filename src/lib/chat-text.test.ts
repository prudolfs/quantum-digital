import { expect, it } from 'vitest'
import { chatTextParts } from './chat-text'
import { chatErrorNotice } from '../../shared/chat'

it('links only approved references while keeping emphasis and ordinary text readable', () => {
  expect(
    chatTextParts(
      'See **the example**: [Care Coordination](/work/care-coordination).',
      new Set(['/work/care-coordination']),
    ),
  ).toEqual([
    { type: 'text', text: 'See ' },
    { type: 'strong', text: 'the example' },
    { type: 'text', text: ': ' },
    {
      type: 'link',
      text: 'Care Coordination',
      href: '/work/care-coordination',
    },
    { type: 'text', text: '.' },
  ])
})
it('does not activate invented links, scripts, admin links, or HTML supplied by model text', () => {
  for (const href of [
    'https://invented.example',
    'javascript:alert',
    '/admin',
    '/work/private-draft',
  ])
    expect(chatTextParts(`[Click](${href})`, new Set())).toEqual([
      { type: 'text', text: 'Click' },
    ])
  expect(chatTextParts('<img src=x onerror=alert(1)>', new Set())).toEqual([
    { type: 'text', text: '<img src=x onerror=alert(1)>' },
  ])
})
it('keeps unfinished streaming markup as text and gives actionable limit and session messages', () => {
  expect(chatTextParts('See [Care](/work/ca', new Set())).toEqual([
    { type: 'text', text: 'See [Care](/work/ca' },
  ])
  expect(chatErrorNotice('CONVERSATION_LIMIT')).toMatchObject({ retry: false })
  expect(chatErrorNotice('SESSION_EXPIRED')).toMatchObject({ retry: false })
  expect(chatErrorNotice('RATE_LIMIT')).toMatchObject({ retry: true })
})
