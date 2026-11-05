import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('branded sign-in is centered and requests a reset link', async ({
  page,
}, testInfo) => {
  let requestBody: unknown
  await page.route('**/api/auth/request-password-reset', async (route) => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({ json: { status: true } })
  })
  await page.goto('/admin')
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Quantum Digital home' }),
  ).toBeVisible()
  const panel = await page.locator('.admin-access').boundingBox()
  expect(panel).not.toBeNull()
  expect(
    Math.abs(panel!.x + panel!.width / 2 - page.viewportSize()!.width / 2),
  ).toBeLessThan(2)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath('sign-in.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Forgot password?' }).click()
  await expect(
    page.getByRole('heading', { name: 'Reset your password' }),
  ).toBeVisible()
  await page.getByLabel('Email', { exact: true }).fill('owner@example.com')
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByRole('status')).toContainText(
    'If that email belongs to the owner account',
  )
  expect(requestBody).toEqual({
    email: 'owner@example.com',
    redirectTo: `${new URL(page.url()).origin}/admin`,
  })
  await page.getByRole('button', { name: 'Back to sign in' }).click()
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
})

test('reset validates matching passwords and clears the token after success', async ({
  page,
}, testInfo) => {
  const resets: unknown[] = []
  await page.route('**/api/auth/reset-password', async (route) => {
    resets.push(route.request().postDataJSON())
    await route.fulfill({ json: { status: true } })
  })
  await page.goto('/admin?token=test-only-reset-token')
  await expect(
    page.getByRole('heading', { name: 'Choose a new password' }),
  ).toBeVisible()
  await page
    .getByLabel('New password', { exact: true })
    .fill('test-only-new-password')
  await page.getByLabel('Confirm password').fill('different-test-password')
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(page.getByRole('alert')).toContainText('passwords don’t match')
  expect(resets).toHaveLength(0)
  await page.getByLabel('Confirm password').fill('test-only-new-password')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath('reset-password.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Password updated')
  expect(new URL(page.url()).searchParams.has('token')).toBe(false)
  expect(resets).toEqual([
    { newPassword: 'test-only-new-password', token: 'test-only-reset-token' },
  ])
})

test('expired links and email failures offer a retry', async ({ page }) => {
  await page.route('**/api/auth/request-password-reset', (route) =>
    route.fulfill({ status: 503, json: { message: 'Email unavailable' } }),
  )
  await page.goto('/admin?error=INVALID_TOKEN')
  await expect(page.getByRole('alert')).toContainText('invalid or has expired')
  await page.getByLabel('Email', { exact: true }).fill('owner@example.com')
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'couldn’t be sent' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Send reset link' }),
  ).toBeEnabled()
})
