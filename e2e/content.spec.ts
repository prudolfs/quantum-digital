import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('abstract case studies can be read without exposing project links', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const firstQuestion = page.locator('.faq-list summary').first()
  await firstQuestion.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.faq-list .body-copy').first()).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  for (const title of [
    'Care Coordination',
    'Accounting with AI Assistance',
    'Research to Action',
  ]) {
    await page.getByRole('link', { name: new RegExp(title) }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    for (const heading of [
      'Context',
      'Challenge',
      'Approach',
      'Delivery',
      'Engineering focus',
    ]) {
      await expect(
        page.getByRole('heading', { name: heading, exact: true }),
      ).toBeVisible()
    }
    const header = page.locator('.case-study > header')
    await expect(header.getByRole('link')).toHaveCount(0)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.getByRole('link', { name: 'Selected work', exact: true }).click()
  }
  await page.goto('/about')
  await expect(
    page.getByRole('heading', {
      name: 'Different industries. Connected engineering.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Service Operations Copilot' }),
  ).toHaveAttribute('href', '/work/service-operations-copilot')
  await expect(
    page.getByRole('link', { name: 'Robotics Lab' }),
  ).toHaveAttribute('href', '/work/robotics-lab')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('client questions remain usable without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(`${baseURL}/`)
  const question = page.locator('.faq-list summary').filter({
    hasText: 'Can we start with an idea rather than a specification?',
  })
  const answer = page
    .locator('.faq-list .body-copy')
    .filter({ hasText: 'Yes. We can start with who the product is for' })
  await expect(answer).toBeHidden()
  await question.focus()
  await page.keyboard.press('Enter')
  await expect(answer).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'What are you working towards?' }),
  ).toBeVisible()
  await context.close()
})
