import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const path = '/work/finance-document-assistant'

test('finance story stays readable with reduced motion and its walkthrough works by keyboard', async ({
  page,
}, testInfo) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Ask the question.See the evidence.',
  )
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  await expect(page.locator('.work-steps li')).toHaveCount(4)
  await page.getByRole('button', { name: '03 Ask a question.' }).focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('button', { name: '03 Ask a question.' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.work-steps li p')).toHaveCount(4)
  await page.getByRole('link', { name: 'See inside the product' }).click()
  await expect(
    page.getByRole('heading', { name: 'The source stays in the picture.' }),
  ).toBeVisible()
  await expect(
    page.getByText('Actual application capture · prepared demo answers', {
      exact: true,
    }),
  ).toBeVisible()
  await page.locator('.work-context summary').first().click()
  await expect(
    page.getByRole('heading', { name: 'Context', exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect(
    requests.filter((url) => /finance-hero.glb|work-model-runtime/.test(url)),
  ).toEqual([])
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur()
    window.scrollTo(0, 0)
  })
  await page.screenshot({
    path: `test-results/finance-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await page.getByRole('link', { name: 'Discuss a document workflow' }).click()
  await expect(page).toHaveURL(/\/chat$/)
})

test('finance keeps the complete story and native disclosures without JavaScript', async ({
  browser,
  baseURL,
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: testInfo.project.use.viewport,
  })
  const page = await context.newPage()
  await page.goto(`${baseURL}${path}`)
  await expect(page.locator('.work-model-poster')).toBeVisible()
  await expect(page.locator('.work-steps li p')).toHaveCount(4)
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

test('saving data skips the optional runtime and model', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true },
      configurable: true,
    }),
  )
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.goto(path)
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  expect(
    requests.filter((url) => /finance-hero.glb|work-model-runtime/.test(url)),
  ).toEqual([])
})

test('missing graphics keeps the fallback instead of loading the model', async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'Touch devices use the rendered poster without probing graphics.',
  )
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
  let modelRequests = 0
  page.on('request', (request) => {
    if (request.url().endsWith('finance-hero.glb')) modelRequests++
  })
  await page.goto(path)
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  await expect(page.locator('.work-model-poster')).toBeVisible()
  expect(modelRequests).toBe(0)
})

test('failed model loading returns to the rendered illustration', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Touch devices use the poster.')
  await page.route('**/finance-hero.glb', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  )
  await page.goto(path)
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  await expect(page.locator('.work-model-poster')).toBeVisible()
  await expect(page.locator('.work-model canvas')).toHaveCount(0)
})

test('live model waits behind the poster, rests when idle and pauses offscreen', async ({
  page,
  isMobile,
}, testInfo) => {
  test.skip(isMobile, 'Touch devices use the poster.')
  let release!: () => void
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/finance-hero.glb', async (route) => {
    await hold
    await route.continue()
  })
  await page.goto(path)
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'loading',
  )
  await expect(page.locator('.work-model-poster')).toHaveCSS('opacity', '1')
  release()
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15_000 },
  )
  await page.waitForTimeout(500)
  const frames = () =>
    page.locator('.work-model-canvas').getAttribute('data-model-frames')
  const idle = await frames()
  await page.waitForTimeout(300)
  expect(await frames()).toBe(idle)
  const bounds = await page.locator('.work-model-host').boundingBox()
  await page.mouse.move(
    bounds!.x + bounds!.width * 0.8,
    bounds!.y + bounds!.height * 0.3,
  )
  await expect
    .poll(async () => Number(await frames()))
    .toBeGreaterThan(Number(idle))
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: `test-results/finance-live-${testInfo.project.name}.png`,
  })
  await page.locator('.site-footer').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  const offscreen = await frames()
  await page.waitForTimeout(300)
  expect(await frames()).toBe(offscreen)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  await expect(page.locator('.work-model canvas')).toHaveCount(0)
})

test('graphics context loss restores the poster', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Touch devices use the poster.')
  await page.goto(path)
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15_000 },
  )
  await page
    .locator('.work-model canvas')
    .evaluate((canvas) =>
      (canvas as HTMLCanvasElement)
        .getContext('webgl2')
        ?.getExtension('WEBGL_lose_context')
        ?.loseContext(),
    )
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  await expect(page.locator('.work-model-poster')).toBeVisible()
})

test('a stalled model times out without hiding the source illustration', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Touch devices use the poster.')
  let release!: () => void
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/finance-hero.glb', async (route) => {
    await hold
    await route.fulfill({ status: 503, body: 'Unavailable' }).catch(() => {})
  })
  await page.goto(path)
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'loading',
  )
  await expect(page.locator('.work-model-poster')).toBeVisible()
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'static',
    { timeout: 12_000 },
  )
  await expect(page.locator('.work-model canvas')).toHaveCount(0)
  release()
})
