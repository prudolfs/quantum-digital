import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'

// Requires a fresh, isolated local deployment and a build pointing to ports 3310/3311.
// These test credentials are never used in the connected cloud project.
test('owner setup, explicit publication, unsaved changes, and subsequent sign-in', async ({
  page,
  request,
}, testInfo) => {
  test.skip(
    process.env.ADMIN_E2E_ISOLATED !== '1',
    'Run only against the isolated local admin test deployment.',
  )
  test.setTimeout(120_000)
  const backend = new ConvexHttpClient('http://127.0.0.1:3310')
  const setup = await backend.query(api.auth.setupStatus, {})
  expect(
    setup.setupAvailable,
    'Use a fresh isolated backend, never the cloud project',
  ).toBe(true)
  await page.goto('/admin')
  await expect(
    page.getByRole('heading', { name: 'Set up your owner account' }),
  ).toBeVisible()
  await page.getByLabel('Email', { exact: true }).fill('owner@example.com')
  await page
    .getByLabel('One-time setup key')
    .fill('incorrect-setup-key-over-32-characters')
  await page
    .getByLabel('Password', { exact: true })
    .fill('test-only-owner-password-123')
  await page.getByLabel('Confirm password').fill('test-only-owner-password-123')
  await page.getByRole('button', { name: 'Create owner account' }).click()
  await expect(page.getByRole('alert')).toContainText('Setup failed')
  await page
    .getByLabel('One-time setup key')
    .fill('test-only-setup-key-with-over-32-characters')
  await page.getByRole('button', { name: 'Create owner account' }).click()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page
    .getByRole('navigation', { name: 'Admin sections' })
    .getByRole('link', { name: 'Selected work' })
    .click()
  await page.getByRole('button', { name: 'Import current content' }).click()
  await expect(page.locator('.admin-record')).toHaveCount(6)
  await page.getByRole('link', { name: /Care Coordination/ }).click()
  await page.getByLabel('Title', { exact: true }).fill('Private changed title')
  await expect(
    page.getByRole('button', { name: 'Publish saved draft' }),
  ).toBeDisabled()
  page.once('dialog', (dialog) => dialog.dismiss())
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Services', exact: true })
    .click()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Private changed title',
  )
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(
    page.getByRole('button', { name: 'Publish saved draft' }),
  ).toBeEnabled()
  expect(
    (await backend.query(api.content.published, {}))?.caseStudies[0].title,
  ).toBe('Care Coordination')
  const before = await request.get('/work/care-coordination')
  expect(await before.text()).toContain('Care Coordination')
  await page.getByRole('button', { name: 'Publish saved draft' }).click()
  await expect(page.getByRole('status')).toContainText('Published.')
  expect(
    (await backend.query(api.content.published, {}))?.caseStudies[0].title,
  ).toBe('Private changed title')
  const after = await request.get('/work/care-coordination')
  expect(await after.text()).toContain('Private changed title')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Unpublish', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Unpublished.')
  expect((await request.get('/work/care-coordination')).status()).toBe(404)
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain(
    '/work/care-coordination',
  )
  await page.getByLabel('Title', { exact: true }).fill('Care Coordination')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(
    page.getByRole('button', { name: 'Publish saved draft' }),
  ).toBeEnabled()
  await page.getByRole('button', { name: 'Publish saved draft' }).click()
  await expect(page.getByRole('status')).toContainText('Published.')
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Services', exact: true })
    .click()
  await page.locator('.admin-record').first().click()
  await page.getByLabel('Title', { exact: true }).fill('Unsaved service change')
  page.once('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Site settings' })
    .click()
  await expect(
    page.getByRole('button', { name: 'Publish saved settings' }),
  ).toBeEnabled()
  await page.getByLabel('Public contact email').fill('contact@example.com')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(
    page.getByRole('button', { name: 'Publish saved settings' }),
  ).toBeEnabled()
  expect(
    (await backend.query(api.content.published, {}))?.settings.contactEmail,
  ).toBe('rudolfs.pukitis@proton.me')
  await page.getByRole('button', { name: 'Publish saved settings' }).click()
  await expect(page.getByRole('status')).toHaveText('Settings published.')
  expect(await (await request.get('/chat')).text()).toContain(
    'contact@example.com',
  )
  await page
    .getByLabel('Public contact email')
    .fill('rudolfs.pukitis@proton.me')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(
    page.getByRole('button', { name: 'Publish saved settings' }),
  ).toBeEnabled()
  await page.getByRole('button', { name: 'Publish saved settings' }).click()
  await expect(page.getByRole('status')).toHaveText('Settings published.')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: `test-results/admin-settings-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeVisible()
  await expect(page.getByLabel('One-time setup key')).toHaveCount(0)
  await page.getByLabel('Email', { exact: true }).fill('owner@example.com')
  await page
    .getByLabel('Password', { exact: true })
    .fill('test-only-owner-password-123')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
})

test('creates case-study and service drafts before explicitly publishing them', async ({
  page,
}) => {
  test.skip(
    process.env.ADMIN_E2E_ISOLATED !== '1',
    'Isolated local admin deployment only.',
  )
  test.setTimeout(90_000)
  const backend = new ConvexHttpClient('http://127.0.0.1:3310')
  await page.goto('/admin')
  await page.getByLabel('Email', { exact: true }).fill('owner@example.com')
  await page
    .getByLabel('Password', { exact: true })
    .fill('test-only-owner-password-123')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Selected work' })
    .click()
  await page.getByRole('link', { name: 'Create case study' }).click()
  for (const [label, value] of Object.entries({
    Title: 'Isolated test case',
    'URL slug': 'isolated-test-case',
    Category: 'Portfolio',
    Summary: 'A test case created in the isolated database.',
    'Your role': 'Engineering',
    Context: 'Test context',
    Challenge: 'Test challenge',
    Approach: 'Test approach',
    Delivery: 'Test delivery',
  }))
    await page.getByLabel(label, { exact: true }).fill(value)
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(
    page.getByRole('button', { name: 'Publish saved draft' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Publish saved draft' }),
  ).toBeEnabled()
  expect(
    (await backend.query(api.content.published, {}))?.caseStudies.some(
      (record) => record.slug === 'isolated-test-case',
    ),
  ).toBe(false)
  await page.getByRole('button', { name: 'Publish saved draft' }).click()
  await expect(page.getByRole('status')).toContainText('Published.')
  expect(
    (await backend.query(api.content.published, {}))?.caseStudies.some(
      (record) => record.slug === 'isolated-test-case',
    ),
  ).toBe(true)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Unpublish', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Unpublished.')
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Services', exact: true })
    .click()
  await page.getByRole('link', { name: 'Create service' }).click()
  for (const [label, value] of Object.entries({
    Title: 'Isolated test service',
    'Service ID': 'isolated-test-service',
    Category: 'Engineering',
    Description: 'A test service created in the isolated database.',
    'Supporting details': 'Test supporting details',
  }))
    await page.getByLabel(label, { exact: true }).fill(value)
  await page.getByLabel('Illustration').selectOption('ai')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(
    page.getByRole('button', { name: 'Publish saved draft' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Publish saved draft' }),
  ).toBeEnabled()
  expect(
    (await backend.query(api.content.published, {}))?.services.some(
      (record) => record.id === 'isolated-test-service',
    ),
  ).toBe(false)
  await page.getByRole('button', { name: 'Publish saved draft' }).click()
  await expect(page.getByRole('status')).toContainText('Published.')
  expect(
    (await backend.query(api.content.published, {}))?.services.find(
      (record) => record.id === 'isolated-test-service',
    )?.art,
  ).toBe('ai')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Unpublish', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Unpublished.')
})
