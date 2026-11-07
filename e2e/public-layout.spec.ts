import { expect, test, type Locator, type Page } from '@playwright/test'
import { caseStudies } from '../src/content/site'
import { servicePageRoutes } from '../shared/service-pages'

async function centered(page: Page, locator: Locator) {
  await expect(locator).toBeVisible()
  const bounds = (await locator.boundingBox())!
  expect(
    Math.abs(bounds.x + bounds.width / 2 - page.viewportSize()!.width / 2),
  ).toBeLessThanOrEqual(2)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: false } }),
  )
})

test('public page containers remain centered', async ({ page }) => {
  for (const [path, selector] of [
    ['/', '.hero-layout'],
    ['/about', '.work-hero > .section-shell'],
    ['/privacy', '.case-study'],
    ...caseStudies.map((study) => [
      `/work/${study.slug}`,
      '.work-hero > .section-shell',
    ]),
    ...Object.values(servicePageRoutes).map((service) => [
      `/services/${service.slug}`,
      '.work-hero > .section-shell',
    ]),
    ['/chat', '.chat-content'],
  ]) {
    await page.goto(path!)
    await centered(page, page.locator(selector!))
  }
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'The assistant is currently unavailable.' }),
  ).toBeVisible()
  await centered(page, page.locator('.chat-unavailable'))
})

test('missing public pages center their message and recovery action', async ({
  page,
}) => {
  for (const path of [
    '/missing-page',
    '/work/missing-work',
    '/services/missing-service',
  ]) {
    expect((await page.goto(path))?.status()).toBe(404)
    const panel = page.locator('.state-panel')
    await centered(page, panel)
    await expect(panel).toHaveCSS('text-align', 'center')
    await centered(page, panel.getByRole('link', { name: 'Back to home' }))
  }
})

test('a delayed page centers its preloader before rendering content', async ({
  page,
  isMobile,
}) => {
  await page.goto('/')
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/_serverFn/**', async (route) => {
    await gate
    await route.continue()
  })
  try {
    if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click()
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'About', exact: true })
      .click()
    const panel = page.locator('.state-panel--loading')
    await centered(page, panel)
    await centered(page, panel.locator('.loading-spinner'))
    await expect(panel).toHaveCSS('text-align', 'center')
  } finally {
    release()
  }
  await expect(page.locator('.state-panel')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Product to engineering.',
  )
})

test('a failed page centers its error and recovery actions', async ({
  page,
  isMobile,
}) => {
  await page.goto('/')
  await page.route('**/_serverFn/**', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Test-only page failure' }),
    }),
  )
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click()
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'About', exact: true })
    .click()
  const panel = page.locator('.state-panel[role=alert]')
  await centered(page, panel)
  await expect(panel).toHaveCSS('text-align', 'center')
  await centered(page, panel.locator('.action-row'))
  await page.unroute('**/_serverFn/**')
  await panel.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Product to engineering.',
  )
})
