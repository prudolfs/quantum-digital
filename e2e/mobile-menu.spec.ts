import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('mobile menu dismisses outside, with Escape, and after navigation while trapping focus', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Mobile navigation only')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const toggle = page.locator('.mobile-menu-toggle')
  const dialog = page.getByRole('dialog', { name: 'Mobile navigation' })
  await toggle.tap()
  await expect(dialog).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  const panel = await page.locator('.mobile-menu-panel').boundingBox()
  expect(panel!.height).toBeLessThan(page.viewportSize()!.height)
  await page.locator('#main-content').evaluate((main) => main.focus())
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true)
  await dialog.getByRole('link', { name: 'Let’s talk' }).focus()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Close menu' })).toBeFocused()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({ path: 'test-results/mobile-menu.png' })
  await page
    .locator('.mobile-menu-overlay')
    .tap({ position: { x: 20, y: page.viewportSize()!.height - 20 } })
  await expect(dialog).not.toBeVisible()
  await expect(toggle).toBeFocused()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  await toggle.tap()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await toggle.tap()
  await dialog.getByRole('link', { name: 'About', exact: true }).tap()
  await expect(page).toHaveURL('/about')
  await expect(dialog).not.toBeVisible()
  await toggle.tap()
  await dialog.getByRole('link', { name: 'Work', exact: true }).tap()
  await expect(page).toHaveURL(/\/#work$/)
  await expect(dialog).not.toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'The work behind the words.' }),
  ).toBeVisible()
})

test('mobile menu fits narrow and short screens and closes when resized to desktop', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Mobile navigation only')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 480 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).tap()
  const dialog = page.getByRole('dialog', { name: 'Mobile navigation' })
  await expect(dialog).toBeVisible()
  expect(
    await dialog.evaluate((element) => element.scrollWidth <= innerWidth),
  ).toBe(true)
  const panel = await page.locator('.mobile-menu-panel').boundingBox()
  expect(panel!.height).toBeLessThanOrEqual(416)
  await page.setViewportSize({ width: 1280, height: 720 })
  await expect(dialog).not.toBeVisible()
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'About' }),
  ).toBeVisible()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('mobile navigation still works without JavaScript', async ({
  browser,
  isMobile,
  baseURL,
}) => {
  test.skip(!isMobile, 'Mobile navigation only')
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    baseURL,
  })
  const page = await context.newPage()
  await page.goto('/')
  await page.locator('.mobile-navigation-fallback summary').click()
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'About' })
    .click()
  await expect(page).toHaveURL('/about')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'working product.',
  )
  await context.close()
})
