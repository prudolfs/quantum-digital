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
  await page.screenshot({
    path: 'test-results/chat-live-review.png',
    fullPage: true,
  })
  await testInfo.attach('live-chat-check', {
    contentType: 'text/plain',
    body: 'Live streamed case-study lookup and engagement explanations passed. A session-bound draft was prepared with synthetic details. No submission endpoint was called.',
  })
})
