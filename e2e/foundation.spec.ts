import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('renders accessible navigation and supports the complete page round trip', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Build better products.',
  )
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'About' })
    .click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'working product.',
  )
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'About' }),
  ).toHaveAttribute('aria-current', 'page')
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Home', exact: true })
    .click()
  await expect(page).toHaveURL('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('returns a useful 404 with a working recovery link', async ({ page }) => {
  const response = await page.goto('/missing-page')
  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole('heading', { name: 'Page not found.' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Back to home' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Build better products.',
  )
})

test('serves readable pages and navigation without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Build better products.',
  )
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'About' })
    .click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'working product.',
  )
  await context.close()
})

test('honors reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const duration = await page
    .getByRole('link', { name: 'Get to know the approach' })
    .evaluate((element) => getComputedStyle(element).transitionDuration)
  expect(duration.split(',').every((value) => parseFloat(value) <= 0.001)).toBe(
    true,
  )
})
