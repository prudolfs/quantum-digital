import { expect, test } from '@playwright/test'

const path = '/services/product-development'
const model = '.service-illustration'

test('baked service model preserves the poster while loading, moves real geometry, and rests when idle or hidden', async ({
  page,
  isMobile,
}, testInfo) => {
  test.skip(isMobile, 'Touch devices retain the still.')
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  let release!: () => void
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/services/product/product-hero.glb', async (route) => {
    await hold
    await route.continue()
  })
  await page.goto(path)
  await expect(page.locator(model)).toHaveAttribute(
    'data-model-stage',
    'loading',
  )
  await expect(page.locator(`${model} picture`)).toHaveCSS('opacity', '1')
  const boxBefore = await page
    .locator(`${model} .work-model-host`)
    .boundingBox()
  release()
  await expect(page.locator(model)).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15_000 },
  )
  await page.waitForTimeout(500)
  const host = page.locator(`${model} .work-model-host`)
  const box = await host.boundingBox()
  expect(box?.width).toBe(boxBefore?.width)
  expect(box?.height).toBe(boxBefore?.height)
  const neutral = await host.screenshot({
    path: testInfo.outputPath('neutral.png'),
  })
  const frames = () =>
    page
      .locator(`${model} .work-model-canvas`)
      .getAttribute('data-model-frames')
  const idle = await frames()
  await page.waitForTimeout(300)
  expect(await frames()).toBe(idle)
  await page.mouse.move(box!.x + box!.width * 0.85, box!.y + box!.height * 0.3)
  await expect
    .poll(async () => Number(await frames()))
    .toBeGreaterThan(Number(idle))
  await page.waitForTimeout(700)
  const moved = await host.screenshot({
    path: testInfo.outputPath('pointer.png'),
  })
  expect(moved.equals(neutral)).toBe(false)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  const hidden = await frames()
  await host.dispatchEvent('pointermove', {
    pointerType: 'mouse',
    clientX: box!.x + 20,
    clientY: box!.y + 20,
  })
  await page.waitForTimeout(300)
  expect(await frames()).toBe(hidden)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect
    .poll(async () => Number(await frames()))
    .toBeGreaterThan(Number(hidden))
  await page.locator('.site-footer').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  const offscreen = await frames()
  await page.waitForTimeout(300)
  expect(await frames()).toBe(offscreen)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator(model)).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  await expect(page.locator(`${model} canvas`)).toHaveCount(0)
  expect(errors).toEqual([])
})

for (const constraint of ['saveData', '3g', 'low-memory']) {
  test(`${constraint} skips the service model, runtime, and background`, async ({
    page,
  }) => {
    await page.addInitScript((setting) => {
      if (setting === 'low-memory')
        Object.defineProperty(navigator, 'deviceMemory', {
          configurable: true,
          value: 2,
        })
      else
        Object.defineProperty(navigator, 'connection', {
          configurable: true,
          value:
            setting === '3g' ? { effectiveType: '3g' } : { saveData: true },
        })
    }, constraint)
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.goto(path)
    await expect(page.locator(model)).toHaveAttribute(
      'data-model-stage',
      'static',
    )
    expect(
      requests.filter((url) =>
        /\.glb|work-model-runtime|product-background/.test(url),
      ),
    ).toEqual([])
    await expect(page.locator(`${model} picture`)).toHaveCSS('opacity', '1')
  })
}

test('mobile keeps the service artwork and does not fetch model assets', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Mobile-specific source and runtime check.')
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.goto(path)
  await expect(page.locator(model)).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  await expect
    .poll(() =>
      page
        .locator(`${model} img`)
        .evaluate((image: HTMLImageElement) => image.currentSrc),
    )
    .toContain('product-hero-mobile.webp')
  expect(
    requests.filter((url) =>
      /\.glb|work-model-runtime|product-background/.test(url),
    ),
  ).toEqual([])
})

for (const asset of ['product-hero.glb', 'product-background.webp']) {
  test(`failed ${asset} keeps the rendered service illustration`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Touch devices do not load model assets.')
    await page.route(`**/${asset}`, (route) =>
      route.fulfill({ status: 503, body: 'Unavailable' }),
    )
    await page.goto(path)
    await expect(page.locator(model)).toHaveAttribute(
      'data-model-stage',
      'static',
    )
    await expect(page.locator(`${model} picture`)).toHaveCSS('opacity', '1')
    await expect(page.locator(`${model} canvas`)).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
}

test('unavailable graphics and context loss preserve the service content and poster', async ({
  page,
  isMobile,
  browser,
  baseURL,
}) => {
  test.skip(isMobile, 'Touch devices do not probe graphics.')
  await page.goto(path)
  await expect(page.locator(model)).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15_000 },
  )
  await page
    .locator(`${model} canvas`)
    .evaluate((canvas) =>
      (canvas as HTMLCanvasElement)
        .getContext('webgl2')
        ?.getExtension('WEBGL_lose_context')
        ?.loseContext(),
    )
  await expect(page.locator(model)).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  await expect(page.locator(`${model} picture`)).toHaveCSS('opacity', '1')
  const context = await browser.newContext()
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      return String(args[0]).startsWith('webgl')
        ? null
        : original.apply(this, args)
    } as typeof original
  })
  const fallback = await context.newPage()
  let modelRequests = 0
  fallback.on('request', (request) => {
    if (request.url().endsWith('.glb')) modelRequests++
  })
  await fallback.goto(`${baseURL}${path}`)
  await expect(fallback.locator(model)).toHaveAttribute(
    'data-model-stage',
    'static',
  )
  expect(modelRequests).toBe(0)
  await context.close()
})

test('service and work navigation replace their viewers without retaining an old canvas', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop lifecycle check.')
  await page.goto(path)
  await expect(page.locator(model)).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15_000 },
  )
  await page
    .locator('.work-related')
    .getByRole('link', { name: /Care Coordination/ })
    .click()
  await expect(page).toHaveURL(/\/work\/care-coordination$/)
  await expect(page.locator('.work-model')).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15_000 },
  )
  await expect(page.locator('.work-model-poster')).toHaveAttribute(
    'src',
    '/work/care/care-hero.webp',
  )
  await expect(page.locator('.work-model canvas')).toHaveCount(1)
  await page.getByRole('link', { name: 'Selected work', exact: true }).click()
  await page.getByRole('link', { name: 'Explore product development' }).click()
  await expect(page.locator(model)).toHaveAttribute(
    'data-model-stage',
    'live',
    { timeout: 15_000 },
  )
  await expect(page.locator('.work-model-poster')).toHaveAttribute(
    'src',
    '/services/product/product-hero.webp',
  )
  await expect(page.locator('.work-model canvas')).toHaveCount(1)
})
