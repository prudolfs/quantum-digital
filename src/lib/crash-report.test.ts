import { expect, test } from 'vitest'
import { safeCrash, sanitizeExceptionList } from './crash-report'
test('keeps deployed script positions without messages, causes, external URLs or function names', () => {
  const error = new TypeError('private@example.com: confidential project')
  error.stack =
    'TypeError: private@example.com\n at privateName (https://example.com/assets/chat-123.js:12:34)\n at bad (https://evil.example/assets/evil.js:56:78)\n at page (https://example.com/chat?email=private:1:2)'
  const result = safeCrash(error, 'route_error', 'https://example.com')
  expect(result.name).toBe('TypeError')
  expect(result.message).toBe('route_error')
  expect(result.stack).toBe(
    'TypeError: route_error\n    at https://example.com/assets/chat-123.js:12:34',
  )
})
test('drops SDK breadcrumbs, source context, causes and unexpected exception metadata', () => {
  const value = [
    {
      type: 'TypeError',
      value: 'route_error',
      stacktrace: {
        frames: [
          {
            filename: 'https://example.com/assets/chat-123.js',
            lineno: 12,
            colno: 34,
            function: 'private@example.com',
            context_line: 'private project',
          },
          { filename: 'https://example.com/chat?private' },
          { filename: 'https://evil.example/assets/app.js' },
        ],
      },
      cause: 'private',
    },
  ]
  const safe = sanitizeExceptionList(
    value,
    'route_error',
    'https://example.com',
  )
  expect(JSON.stringify(safe)).not.toMatch(/private|evil|context_line|cause/)
  expect(safe?.[0].stacktrace.frames).toEqual([
    {
      filename: 'https://example.com/assets/chat-123.js',
      platform: 'javascript',
      lineno: 12,
      colno: 34,
    },
  ])
  expect(
    sanitizeExceptionList(
      [{ ...value[0], value: 'private error' }],
      'route_error',
      'https://example.com',
    ),
  ).toBeNull()
})
