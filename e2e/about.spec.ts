import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('About explains the career journey, contributions and current work accessibly', async ({
  page,
}) => {
  const optional: string[] = []
  page.on('request', (request) => {
    if (/about-hero.glb|work-model-runtime/.test(request.url()))
      optional.push(request.url())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/about')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'I’m Rudolfs.Product to engineering.',
  )
  await expect(page.locator('.about-journey li')).toHaveCount(5)
  await expect(
    page.locator('.about-contribution').filter({
      hasText: 'Team contributions · leadership on selected projects',
    }),
  ).toBeVisible()
  await expect(
    page.locator('.about-contribution').filter({
      hasText: 'Team contribution · frontend and full-stack development',
    }),
  ).toBeVisible()
  await expect(page.locator('.about-practice-grid > section')).toHaveCount(4)
  await expect(page.locator('.about-explorations > a')).toHaveCount(3)
  await page.getByRole('link', { name: 'Explore the journey' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#experience$/)
  const profiles = page.locator('.about-profile-links')
  await expect(profiles.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/prudolfs',
  )
  await expect(
    profiles.getByRole('link', { name: 'LinkedIn' }),
  ).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/rudolfs-pukitis-33027a154',
  )
  expect(optional).toEqual([])
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page
    .locator('.about-explorations')
    .getByRole('link', { name: /Robotics Lab/ })
    .click()
  await expect(page).toHaveURL(/\/work\/robotics-lab$/)
  await page.goBack()
  await page
    .locator('.about-closing')
    .getByRole('link', { name: 'Tell me about your project' })
    .click()
  await expect(page).toHaveURL(/\/chat$/)
})

test('About retains the complete journey and actions without JavaScript', async ({
  browser,
  baseURL,
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: testInfo.project.use.viewport,
  })
  const page = await context.newPage()
  await page.goto(`${baseURL}/about`)
  await expect(page.locator('.work-model-poster')).toBeVisible()
  await expect(page.locator('.about-journey li')).toHaveCount(5)
  await page.getByRole('link', { name: 'Explore the journey' }).click()
  await expect(page).toHaveURL(/#experience$/)
  await expect(page.locator('.about-explorations > a')).toHaveCount(3)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await context.close()
})

test('About loads the real workbench and responds to pointer movement', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Touch devices use the still artwork.')
  await page.goto('/about')
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15000 },
  )
  const canvas = page.locator('.work-model-canvas')
  await page.waitForTimeout(500)
  const frames = Number(await canvas.getAttribute('data-model-frames'))
  const bounds = await canvas.boundingBox()
  await page.mouse.move(
    bounds!.x + bounds!.width * 0.8,
    bounds!.y + bounds!.height * 0.3,
  )
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-model-frames')))
    .toBeGreaterThan(frames)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  await expect(page.locator('.work-model canvas')).toHaveCount(0)
})

test('About keeps its illustration and career text when graphics are unavailable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith('webgl')) return null
      return original.apply(this, args)
    } as typeof original
  })
  await page.goto('/about')
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  await expect(page.locator('.work-model-poster')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Leading teams through delivery.' }),
  ).toBeVisible()
})
