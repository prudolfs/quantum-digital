import { test, expect } from '@playwright/test'
import { caseStudies } from '../src/content/site'

for (const study of caseStudies) {
  test(`${study.slug} uses FAQ styling and smooth keyboard disclosures`, async ({
    page,
  }) => {
    await page.goto(`/work/${study.slug}`)
    const section = page.locator('.work-context')
    await expect(
      section.getByRole('heading', { name: 'Behind the product.' }),
    ).toBeVisible()
    const item = section.locator('details').first()
    const summary = item.locator('summary')
    await expect(summary.locator('.faq-icon')).toBeVisible()
    await expect(summary).toHaveCSS('gap', '20px')
    await expect(item.locator('.body-copy')).toBeHidden()
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(item).toHaveAttribute('open', '')
    await expect(item.locator('.body-copy')).toHaveText(study.context)
    await expect(item.locator('.body-copy')).toBeVisible()
    await page.waitForTimeout(80)
    const during = await item
      .locator('div')
      .evaluate((element) => element.getBoundingClientRect().height)
    const natural = await item
      .locator('.body-copy')
      .evaluate((element) => element.getBoundingClientRect().height + 16)
    expect(during).toBeGreaterThan(0)
    expect(during).toBeLessThanOrEqual(natural + 1)
    await expect
      .poll(
        async () =>
          await item.locator('div').evaluate((element) => element.style.height),
      )
      .toBe('auto')
    await page.keyboard.press('Enter')
    await expect(item).not.toHaveAttribute('open', '')
    await expect(item.locator('.body-copy')).toBeHidden()
    const delivery = section.locator('details').filter({
      has: page.getByRole('heading', { name: 'Delivery', exact: true }),
    })
    await delivery.locator('summary').click()
    await expect(delivery.locator('.body-copy')).toHaveText(study.delivery)
  })

  test(`${study.slug} context disclosures still work without JavaScript`, async ({
    browser,
    baseURL,
  }, testInfo) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: testInfo.project.use.viewport,
    })
    const page = await context.newPage()
    await page.goto(`${baseURL}/work/${study.slug}`)
    const first = page.locator('.work-context details').first()
    await first.locator('summary').click()
    await expect(first.locator('.body-copy')).toHaveText(study.context)
    await expect(first.locator('.body-copy')).toBeVisible()
    await context.close()
  })
}
