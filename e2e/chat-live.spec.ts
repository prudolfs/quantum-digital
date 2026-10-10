import { test, expect } from '@playwright/test'

// Explicit opt-in: these calls use Gateway credits and create only an expiring draft.
// The test never clicks confirmation or calls the inquiry submission endpoint.
test('live Gateway streams published work, engagement tools, and an unsubmitted inquiry draft', async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.LIVE_CHAT !== '1' ||
      testInfo.project.name !== 'desktop-chromium',
    'Enable LIVE_CHAT=1 for the single live provider smoke test.',
  )
  test.setTimeout(180_000)
  const submissions: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/inquiries'))
      submissions.push(request.url())
  })
  await page.goto('/chat')
  const input = page.getByRole('textbox', { name: 'Message the assistant' })
  await expect(input).toBeEnabled()
  await input.fill(
    'Please take a closer look at the Care Coordination case study. Look it up by slug care-coordination and explain the engineering briefly.',
  )
  await expect(
    page.getByRole('button', { name: 'Send', exact: true }),
  ).toBeEnabled({ timeout: 30_000 })
  await input.press('Enter')
  await expect(
    page.getByRole('complementary', { name: 'Referenced case study' }),
  ).toBeVisible({ timeout: 60_000 })
  await expect(
    page.getByRole('button', { name: 'Stop', exact: true }),
  ).toHaveCount(0, { timeout: 60_000 })
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Read the case study', exact: false }),
  ).toHaveAttribute('href', '/work/care-coordination')
  await input.fill(
    'What are the options for working together? Please explain the published engagement options.',
  )
  await expect(
    page.getByRole('button', { name: 'Send', exact: true }),
  ).toBeEnabled({ timeout: 30_000 })
  await input.press('Enter')
  await expect(
    page.getByRole('complementary', { name: 'Working together options' }),
  ).toBeVisible({ timeout: 60_000 })
  await expect(
    page.getByRole('button', { name: 'Stop', exact: true }),
  ).toHaveCount(0, { timeout: 60_000 })
  await input.fill(
    'I would like to prepare an inquiry for review. My name is Phase Five Test and my email is phase-five-test@example.com. The project is a test prototype for service coordination with practical AI summaries and human review. Timing and budget should be left out. Please prepare the draft now; I will review it before choosing whether to submit.',
  )
  await expect(
    page.getByRole('button', { name: 'Send', exact: true }),
  ).toBeEnabled({ timeout: 30_000 })
  await input.press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Review your inquiry' }),
  ).toBeVisible({ timeout: 60_000 })
  await expect(
    page.getByRole('button', { name: 'Stop', exact: true }),
  ).toHaveCount(0, { timeout: 60_000 })
  await expect(
    page.getByText('phase-five-test@example.com', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Confirm and submit inquiry' }),
  ).toBeEnabled()
  await expect(
    page.getByText('Your inquiry is saved.', { exact: false }),
  ).toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(submissions).toEqual([])
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Review your inquiry' }),
  ).toBeVisible()
  await expect(page.locator('.chat-message')).toHaveCount(6)
  await page.getByRole('button', { name: 'Restart chat' }).click()
  await expect(page.locator('.chat-message')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Contact Rudolfs', exact: true }),
  ).toBeEnabled({ timeout: 30_000 })
  await page
    .getByRole('button', { name: 'Contact Rudolfs', exact: true })
    .click()
  await expect(
    page.getByRole('textbox', { name: 'Name', exact: true }),
  ).toBeVisible({ timeout: 60_000 })
  await expect(
    page.getByRole('button', { name: 'Stop', exact: true }),
  ).toHaveCount(0, { timeout: 60_000 })
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Chat Refinement Test')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('chat-refinement-test@example.com')
  await page
    .getByRole('textbox', { name: 'What would you like to discuss?' })
    .fill('Build a test coordination app with human-reviewed AI summaries.')
  await expect(
    page.getByRole('button', { name: 'Review inquiry' }),
  ).toBeEnabled({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Review inquiry' }).click()
  await expect(
    page.getByRole('heading', { name: 'Review your inquiry' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByText('chat-refinement-test@example.com', { exact: true }),
  ).toBeVisible()
  expect(submissions).toEqual([])
  await page.screenshot({
    path: 'test-results/chat-live-review.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Restart chat' }).click()
  await expect(page.locator('.chat-message')).toHaveCount(0)
  await testInfo.attach('live-chat-check', {
    contentType: 'text/plain',
    body: 'Live Turnstile verification, Gateway streaming, case-study/engagement tools, Convex restoration after reload, restart, and tool-rendered contact form draft preparation passed. Synthetic drafts only; no submission endpoint was called.',
  })
})
