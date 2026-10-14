import { expect, test } from '@playwright/test'

test('work, service, and privacy pages reveal their own content', async ({
  page,
}) => {
  for (const [url, selector] of [
    ['/work/finance-document-assistant', '.work-decisions > li'],
    ['/services/product-development', '.service-process > li'],
    ['/privacy', '.case-study > section'],
  ]) {
    await page.goto(url)
    const content = page.locator(selector).last()
    await expect(content).toHaveCSS('opacity', '0')
    await content.scrollIntoViewIfNeeded()
    await expect(content).toHaveCSS('opacity', '1')
    await expect(content).toHaveCSS('transform', 'none')
  }
})

test('reveals cards once and removes transforms after settling', async ({
  page,
}) => {
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: false } }),
  )
  await page.goto('/about')
  const entry = page.locator('.about-journey > li').last()
  await expect(entry).toHaveCSS('opacity', '0')
  await entry.scrollIntoViewIfNeeded()
  await expect(entry).toHaveCSS('opacity', '1')
  await expect(entry).toHaveCSS('transform', 'none')
  await page.evaluate(() => scrollTo(0, 0))
  await expect(entry).toHaveCSS('opacity', '1')
  await entry.scrollIntoViewIfNeeded()
  await expect(entry).toHaveCSS('opacity', '1')
  await expect(entry).toHaveCSS('transform', 'none')

  // A client navigation gets its own reveals, without carrying hidden styles.
  await page.locator('.work-closing a[href="/chat"]').click()
  await expect(page).toHaveURL('/chat')
  await expect(page.locator('.chat-page')).toHaveCSS('opacity', '1')
  await expect(page.locator('.chat-page')).toHaveCSS('transform', 'none')
  await page.getByRole('link', { name: 'Quantum Digital home' }).click()
  await expect(page).toHaveURL('/')
  const service = page.locator('.service-card').last()
  await expect(service).toHaveCSS('opacity', '0')
  await service.scrollIntoViewIfNeeded()
  await expect(service).toHaveCSS('opacity', '1')
  await expect(service).toHaveCSS('transform', 'none')
})

test('reduced motion and keyboard focus keep offscreen content readable', async ({
  page,
}) => {
  await page.goto('/about')
  const card = page.locator('.about-explorations > a').last()
  await expect(card).toHaveCSS('opacity', '0')
  await card.focus()
  await expect(card).toHaveCSS('opacity', '1')
  await expect(card).toHaveCSS('transform', 'none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.about-journey > li').last()).toHaveCSS(
    'opacity',
    '1',
  )
  await expect(page.locator('.about-journey > li').last()).toHaveCSS(
    'transform',
    'none',
  )
  await page.goto('/work/finance-document-assistant')
  await expect(page.locator('.work-decisions > li').last()).toHaveCSS(
    'opacity',
    '1',
  )
  await expect(page.locator('.work-decisions > li').last()).toHaveCSS(
    'transform',
    'none',
  )
})

test('chat messages and tool results settle without replaying on form updates', async ({
  page,
}) => {
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: true } }),
  )
  await page.route('**/api/chat', (route) => {
    const events = [
      { type: 'start', messageId: 'reveal-check' },
      {
        type: 'tool-input-available',
        toolCallId: 'contact',
        toolName: 'requestContactDetails',
        input: {},
      },
      {
        type: 'tool-output-available',
        toolCallId: 'contact',
        output: { formId: 'reveal-form', details: {} },
      },
      { type: 'finish', finishReason: 'stop' },
    ]
    return route.fulfill({
      headers: {
        'Content-Type': 'text/event-stream',
        'x-vercel-ai-ui-message-stream': 'v1',
      },
      body:
        events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('') +
        'data: [DONE]\n\n',
    })
  })
  await page.goto('/chat')
  await expect(page.locator('.chat-header')).toHaveCSS('opacity', '1')
  await expect(page.locator('.chat-header')).toHaveCSS('transform', 'none')
  await expect(page.locator('.chat-page')).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Contact Rudolfs' }).click()
  await expect(
    page.getByRole('textbox', { name: 'Name', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.chat-tool-reveal')).toHaveCSS('transform', 'none')
  await expect
    .poll(() =>
      page
        .locator('.chat-page')
        .evaluate((element) => element.getAnimations({ subtree: true }).length),
    )
    .toBe(0)
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Animation check')
  expect(
    await page
      .locator('.chat-page')
      .evaluate((element) => element.getAnimations({ subtree: true }).length),
  ).toBe(0)
})
