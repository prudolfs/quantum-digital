import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: false } }),
  )
  await page.route('**/*.posthog.com/**', (route) => route.abort())
})

test('product service is reachable, responsive, accessible, and uses optimized static artwork', async ({
  page,
  isMobile,
}, testInfo) => {
  const modelRequests: string[] = []
  page.on('request', (request) => {
    if (/\.glb|work-model-runtime/.test(request.url()))
      modelRequests.push(request.url())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('link', { name: 'Explore product development' }).click()
  await expect(page).toHaveURL(/\/services\/product-development$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'A product, from the ground up.',
  )
  await expect(page.locator('.service-illustration figcaption')).toHaveText(
    'Conceptual illustration',
  )
  const illustration = page.locator('.service-illustration img')
  await expect
    .poll(() =>
      illustration.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBe(isMobile ? 768 : 1400)
  expect(
    await illustration.evaluate((image: HTMLImageElement) => image.currentSrc),
  ).toContain(isMobile ? 'product-hero-mobile.webp' : 'product-hero.webp')
  expect(modelRequests).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  const question = page.locator('.faq-list summary').first()
  await question.focus()
  await page.keyboard.press('Enter')
  await expect(question.locator('..')).toHaveAttribute('open', '')
  await expect(
    question.locator('..').getByText(/Yes. We can begin/),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('product-service.png'),
    fullPage: true,
  })
  await page.getByRole('link', { name: /Care Coordination/ }).click()
  await expect(page).toHaveURL(/\/work\/care-coordination$/)
  await page.goto('/services/product-development')
  await page
    .getByRole('link', { name: 'Tell me about your product' })
    .first()
    .click()
  await expect(page).toHaveURL(/\/chat\?service=product-development$/)
})

test('service metadata, sitemap, unknown routes, and direct loads remain correct', async ({
  page,
}) => {
  await page.goto('/services/product-development')
  await expect(page).toHaveTitle('Product development | Quantum Digital')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/services\/product-development$/,
  )
  const sitemap = await page.request.get('/sitemap.xml')
  expect(await sitemap.text()).toContain('/services/product-development')
  for (const slug of [
    'ai-integrations',
    'workflow-automation',
    'system-integrations',
  ])
    expect(await sitemap.text()).toContain(`/services/${slug}`)
  const missing = await page.goto('/services/missing-service')
  expect(missing?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'not found',
  )
})

test('service content, native questions, and hero work without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(`${baseURL}/services/product-development`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.locator('.faq-list summary').first().click()
  await expect(page.getByText(/Yes. We can begin/)).toBeVisible()
  await expect(page.locator('.service-illustration img')).toBeVisible()
  await context.close()
})
