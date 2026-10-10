import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const details = {
  name: 'Alex Founder',
  email: 'alex@example.com',
  summary: 'Build a service coordination app with AI summaries and review.',
  timing: 'This quarter',
}
function assistantStream() {
  const events = [
    { type: 'start', messageId: 'assistant-review' },
    { type: 'text-start', id: 'review-text' },
    {
      type: 'text-delta',
      id: 'review-text',
      delta: 'Here are your inquiry details. Review them before confirming.',
    },
    { type: 'text-end', id: 'review-text' },
    {
      type: 'tool-input-available',
      toolCallId: 'prepare-1',
      toolName: 'prepareInquiry',
      input: details,
    },
    {
      type: 'tool-output-available',
      toolCallId: 'prepare-1',
      output: {
        draftId: 'test-draft',
        details,
        expiresAt: Date.now() + 3600_000,
      },
    },
    { type: 'finish', finishReason: 'stop' },
  ]
  return (
    events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('') +
    'data: [DONE]\n\n'
  )
}

test('chat requires explicit confirmation, retains the draft on failure, and shows only a successful receipt', async ({
  page,
}, testInfo) => {
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: true } }),
  )
  await page.route('**/api/chat', (route) =>
    route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'x-vercel-ai-ui-message-stream': 'v1',
      },
      body: assistantStream(),
    }),
  )
  let submissions = 0
  await page.route('**/api/inquiries', async (route) => {
    submissions++
    expect(route.request().postDataJSON()).toEqual({
      draftId: 'test-draft',
      confirmed: true,
    })
    await route.fulfill(
      submissions === 1
        ? {
            status: 503,
            json: {
              saved: false,
              error: 'Storage is temporarily unavailable. Please retry.',
            },
          }
        : { json: { saved: true, inquiryId: 'saved-inquiry' } },
    )
  })
  await page.goto('/chat')
  const input = page.getByRole('textbox', { name: 'Message the assistant' })
  await expect(input).toBeEnabled()
  await input.fill(
    'I want to send my project inquiry. My name is Alex and email is alex@example.com.',
  )
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Review your inquiry' }),
  ).toBeVisible()
  await expect(
    page.getByText('alex@example.com', { exact: true }),
  ).toBeVisible()
  expect(submissions).toBe(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: `test-results/chat-review-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Confirm and submit inquiry' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Storage is temporarily unavailable.',
  )
  await expect(
    page.getByText('Your inquiry is saved.', { exact: false }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Confirm and submit inquiry' }).click()
  await expect(
    page.getByText('Your inquiry is saved.', { exact: false }),
  ).toBeVisible()
  expect(submissions).toBe(2)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'Restart chat' }).click()
  await expect(
    page.getByRole('heading', { name: 'Review your inquiry' }),
  ).toHaveCount(0)
})

test('rejects cross-origin and unconfirmed submission requests', async ({
  request,
}) => {
  expect(
    (
      await request.post('/api/inquiries', {
        headers: { Origin: 'https://other-site.example' },
        data: { draftId: 'forged', confirmed: true },
      })
    ).status(),
  ).toBe(403)
  await request.get('/api/chat-session')
  expect(
    (
      await request.post('/api/inquiries', {
        headers: { Origin: 'http://127.0.0.1:3000' },
        data: { draftId: 'forged', confirmed: false },
      })
    ).status(),
  ).toBe(400)
})

test('admin never reveals inquiry data to an unauthenticated visitor', async ({
  page,
}) => {
  await page.goto('/admin')
  await expect(
    page.getByRole('heading', {
      name: /Inquiry inbox|Set up your owner account/,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /^(Sign in|Create owner account)$/ }),
  ).toBeVisible()
  await expect(page.locator('.inquiry-card')).toHaveCount(0)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow',
  )
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('case studies and professional profile links match the supplied references', async ({
  page,
}) => {
  await page.goto('/work/finance-document-assistant')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Finance Document Assistant',
  )
  for (const heading of ['Context', 'Challenge', 'Approach', 'Delivery'])
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Repository', exact: false }),
  ).toHaveAttribute('href', 'https://github.com/prudolfs/fin-doc-assistant')
  await expect(
    page.getByRole('contentinfo').getByRole('link', { name: 'GitHub' }),
  ).toHaveAttribute('href', 'https://github.com/prudolfs')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
