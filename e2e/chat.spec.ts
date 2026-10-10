import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { caseStudies, engagements } from '../src/content/site'

function stream(events: Record<string, unknown>[]) {
  return (
    events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('') +
    'data: [DONE]\n\n'
  )
}
const textEvents = (text: string) => [
  { type: 'start', messageId: 'assistant-message' },
  { type: 'text-start', id: 'text' },
  { type: 'text-delta', id: 'text', delta: text },
  { type: 'text-end', id: 'text' },
]
const headers = {
  'Content-Type': 'text/event-stream',
  'x-vercel-ai-ui-message-stream': 'v1',
}

test('starter prompts show published case-study and engagement references with safe clickable text', async ({
  page,
}, testInfo) => {
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: true } }),
  )
  let requests = 0
  await page.route('**/api/chat', (route) => {
    requests++
    const body = route.request().postDataJSON()
    expect(body.messages.at(-1).parts[0].text).toBe(
      requests === 1
        ? 'Show me relevant work'
        : 'Let’s discuss working together',
    )
    const tool = requests === 1 ? 'getCaseStudy' : 'explainEngagements'
    const output =
      requests === 1
        ? {
            available: true,
            study: caseStudies[0],
            url: '/work/care-coordination',
          }
        : { engagements, url: '/#engagements' }
    return route.fulfill({
      headers,
      body: stream([
        ...textEvents(
          requests === 1
            ? '**Care Coordination** is relevant. [Read the example](/work/care-coordination), or explore [services](/#services). [Unknown link](https://invented.example) <script>alert(1)</script>'
            : 'Choose a focused project or ongoing engineering support.',
        ),
        {
          type: 'tool-input-available',
          toolCallId: `reference-${requests}`,
          toolName: tool,
          input: requests === 1 ? { slug: 'care-coordination' } : {},
        },
        {
          type: 'tool-output-available',
          toolCallId: `reference-${requests}`,
          output,
        },
        { type: 'finish', finishReason: 'stop' },
      ]),
    })
  })
  await page.goto('/chat')
  await expect(page.locator('.starter-prompts button')).toHaveCount(4)
  await expect(
    page.getByRole('button', { name: 'Send', exact: true }),
  ).toBeDisabled()
  await page
    .getByRole('button', { name: 'Show me relevant work', exact: true })
    .click()
  await expect(
    page.getByRole('complementary', { name: 'Referenced case study' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Read the example', exact: true }),
  ).toHaveAttribute('href', '/work/care-coordination')
  await expect(
    page.getByRole('link', { name: 'Unknown link', exact: true }),
  ).toHaveCount(0)
  await expect(page.locator('.chat-message__text strong')).toHaveText(
    'Care Coordination',
  )
  await expect(
    page.getByText('<script>alert(1)</script>', { exact: false }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Review your inquiry' }),
  ).toHaveCount(0)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: `test-results/chat-references-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await page
    .getByRole('link', { name: 'Read the case study', exact: false })
    .click()
  await expect(page).toHaveURL(/\/work\/care-coordination$/)
  await page.goto('/chat')
  await page
    .getByRole('button', {
      name: 'Let’s discuss working together',
      exact: true,
    })
    .click()
  await expect(
    page.getByRole('complementary', { name: 'Working together options' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Explore working together' }),
  ).toHaveAttribute('href', '/#engagements')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('stopping preserves partial text and clearing an active response starts a clean conversation', async ({
  page,
}) => {
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: true } }),
  )
  await page.addInitScript(() => {
    const original = window.fetch.bind(window)
    const state = {
      calls: [] as { messages: { parts: { text?: string }[] }[] }[],
      aborted: 0,
    }
    ;(window as unknown as { chatTest: typeof state }).chatTest = state
    // This helper must be serialized into the browser with the fixture.
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const encode = (event: Record<string, unknown>) =>
      new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
    window.fetch = async (input, options) => {
      if (!String(input).endsWith('/api/chat')) return original(input, options)
      state.calls.push(JSON.parse(String(options?.body)))
      const pending = state.calls.length === 1 || state.calls.length === 3
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              encode({
                type: 'start',
                messageId: `assistant-${state.calls.length}`,
              }),
            )
            controller.enqueue(encode({ type: 'text-start', id: 'answer' }))
            controller.enqueue(
              encode({
                type: 'text-delta',
                id: 'answer',
                delta: pending
                  ? 'A partial response that you can stop.'
                  : 'We can continue from here.',
              }),
            )
            if (pending)
              options?.signal?.addEventListener(
                'abort',
                () => {
                  state.aborted++
                  controller.error(new DOMException('Aborted', 'AbortError'))
                },
                { once: true },
              )
            else {
              controller.enqueue(encode({ type: 'text-end', id: 'answer' }))
              controller.enqueue(
                encode({ type: 'finish', finishReason: 'stop' }),
              )
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              controller.close()
            }
          },
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'x-vercel-ai-ui-message-stream': 'v1',
          },
        },
      )
    }
  })
  await page.goto('/chat')
  const input = page.getByRole('textbox', { name: 'Message the assistant' })
  await input.fill('Explain your work')
  await input.press('Enter')
  await expect(
    page.getByText('A partial response that you can stop.', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Stop', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Response stopped.')
  await input.fill('Continue, please')
  await input.press('Enter')
  await expect(
    page.getByText('We can continue from here.', { exact: true }),
  ).toBeVisible()
  await input.fill('Another question')
  await input.press('Enter')
  await expect(
    page.getByRole('button', { name: 'Stop', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Clear conversation' }).click()
  await expect(page.locator('.chat-message')).toHaveCount(0)
  await expect(input).toHaveValue('')
  await expect(page.locator('.starter-prompts button')).toHaveCount(4)
  const state = await page.evaluate(
    () =>
      (
        window as unknown as {
          chatTest: { calls: { messages: unknown[] }[]; aborted: number }
        }
      ).chatTest,
  )
  expect(state.aborted).toBe(2)
  expect(JSON.stringify(state.calls[1].messages)).toContain(
    'A partial response that you can stop.',
  )
  await page
    .getByRole('button', { name: 'Show me relevant work', exact: true })
    .click()
  await expect(
    page.getByText('We can continue from here.', { exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            chatTest: { calls: { messages: unknown[] }[] }
          }
        ).chatTest.calls[3].messages.length,
    ),
  ).toBe(1)
})

test('failed responses can be retried and length-limit errors point to a new conversation', async ({
  page,
}) => {
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: true } }),
  )
  let calls = 0
  await page.route('**/api/chat', (route) => {
    calls++
    return calls === 1
      ? route.fulfill({ status: 503, json: { error: 'ASSISTANT_UNAVAILABLE' } })
      : calls === 2
        ? route.fulfill({
            headers,
            body: stream([
              ...textEvents('The retry succeeded.'),
              { type: 'finish', finishReason: 'stop' },
            ]),
          })
        : route.fulfill({ status: 413, json: { error: 'CONVERSATION_LIMIT' } })
  })
  await page.goto('/chat')
  const input = page.getByRole('textbox', { name: 'Message the assistant' })
  await input.fill('Start with a product idea')
  await input.press('Enter')
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable')
  await page.getByRole('button', { name: 'Retry response' }).click()
  await expect(
    page.getByText('The retry succeeded.', { exact: true }),
  ).toBeVisible()
  await input.fill('A follow-up question')
  await input.press('Enter')
  await expect(page.getByRole('alert')).toContainText('length limit')
  await expect(
    page.getByRole('button', { name: 'Retry response' }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear conversation' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.locator('.starter-prompts button')).toHaveCount(4)
})

test('long conversations reach a readable limit and clear back to the starter prompts', async ({
  page,
}) => {
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: true } }),
  )
  let count = 0
  await page.route('**/api/chat', (route) => {
    count++
    return route.fulfill({
      headers,
      body: stream([
        { type: 'start', messageId: `long-${count}` },
        { type: 'text-start', id: 'text' },
        {
          type: 'text-delta',
          id: 'text',
          delta: `Response ${count}: ${'Useful information. '.repeat(55)}`,
        },
        { type: 'text-end', id: 'text' },
        ...(count === 20
          ? [
              {
                type: 'tool-input-available',
                toolCallId: 'last-draft',
                toolName: 'prepareInquiry',
                input: {
                  name: 'Test Visitor',
                  email: 'visitor@example.com',
                  summary: 'Test a coordination app with a review workflow.',
                },
              },
              {
                type: 'tool-output-available',
                toolCallId: 'last-draft',
                output: {
                  draftId: 'last-held-draft',
                  details: {
                    name: 'Test Visitor',
                    email: 'visitor@example.com',
                    summary: 'Test a coordination app with a review workflow.',
                  },
                  expiresAt: Date.now() + 3600_000,
                },
              },
            ]
          : []),
        { type: 'finish', finishReason: 'stop' },
      ]),
    })
  })
  await page.goto('/chat')
  const input = page.getByRole('textbox', { name: 'Message the assistant' })
  for (let i = 1; i <= 20; i++) {
    await input.fill(`Question ${i}`)
    await input.press('Enter')
    await expect(
      page.getByText(`Response ${i}:`, { exact: false }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Stop', exact: true }),
    ).toHaveCount(0)
    if (await input.isDisabled()) break
  }
  await expect(input).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Confirm and submit inquiry' }),
  ).toBeEnabled()
  await expect(
    page.getByRole('button', { name: 'Make changes' }),
  ).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('length limit')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.getByRole('button', { name: 'Clear conversation' }).click()
  await expect(input).toBeEnabled()
  await expect(page.locator('.chat-message')).toHaveCount(0)
})
