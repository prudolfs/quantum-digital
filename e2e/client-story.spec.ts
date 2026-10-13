import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('client navigation replaces each live model and keeps its poster during loading', async ({
  page,
}) => {
  await page.goto('/work/care-coordination')
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15000 },
  )
  let release!: () => void
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/accounting-hero.glb', async (route) => {
    await hold
    await route.continue()
  })
  await page
    .locator('.work-related')
    .getByRole('link', { name: /Accounting with AI Assistance/ })
    .click()
  await expect(page).toHaveURL(/\/work\/accounting-workflows$/)
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'loading',
  )
  await expect(page.locator('.work-model picture')).toHaveCSS('opacity', '1')
  await expect(page.locator('.work-model-poster')).toHaveAttribute(
    'src',
    '/work/accounting/accounting-hero.webp',
  )
  release()
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15000 },
  )
  await page
    .locator('.work-related')
    .getByRole('link', { name: /Finance Document Assistant/ })
    .click()
  await expect(page).toHaveURL(/\/work\/finance-document-assistant$/)
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15000 },
  )
  await expect(page.locator('.work-model-poster')).toHaveAttribute(
    'src',
    '/work/finance/finance-hero.webp',
  )
  await expect(page.locator('.work-model canvas')).toHaveCount(1)
})

for (const [slug, headline, art] of [
  ['care-coordination', 'One request.Everyone connected.', 'care'],
  ['accounting-workflows', 'From a receipt.To the next step.', 'accounting'],
]) {
  test(`${slug} discloses its reconstructions and supports keyboard review`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/work/${slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(headline)
    await expect(page.locator('.work-model-poster')).toHaveAttribute(
      'src',
      `/work/${art}/${art}-hero.webp`,
    )
    await expect(page.locator('.work-model')).toHaveAttribute(
      'data-model-stage',
      'static',
    )
    await expect(page.locator('main a[href^="https://"]')).toHaveCount(0)
    await expect(page.locator('.work-evidence-grid figcaption')).toHaveCount(2)
    for (const caption of await page
      .locator('.work-evidence-grid figcaption')
      .allTextContents())
      expect(caption).toContain('Reconstructed workflow')
    const third = page.locator('.work-steps button').nth(2)
    await third.focus()
    await page.keyboard.press('Enter')
    await expect(third).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.work-steps li p')).toHaveCount(4)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({
      path: `test-results/${art}-${testInfo.project.name}.png`,
      fullPage: true,
    })
  })

  test(`${slug} has a complete static fallback without JavaScript`, async ({
    browser,
    baseURL,
  }, testInfo) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: testInfo.project.use.viewport,
    })
    const page = await context.newPage()
    await page.goto(`${baseURL}/work/${slug}`)
    await expect(page.locator('.work-model-poster')).toBeVisible()
    await page.locator('.work-context summary').first().click()
    await expect(
      page.getByRole('heading', { name: 'Delivery', exact: true }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await context.close()
  })
}
