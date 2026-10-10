import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('header fades out after clicking the logo home and leaving the header', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/about', { waitUntil: 'networkidle' })
  await page.evaluate(() => window.scrollTo(0, 300))
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0)
  const background = page.locator('.navigation-background')
  await expect(background).toHaveCSS('opacity', '1')
  const logo = page.getByRole('link', { name: 'Quantum Digital home' })
  if (isMobile) await logo.tap()
  else await logo.click()
  await expect(page).toHaveURL('/')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  if (!isMobile) await page.mouse.move(0, 200)
  await expect(background).toHaveCSS('opacity', '0')
})

test('header stays visible and reveals its background only on scroll or hover', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const background = page.locator('.navigation-background')
  const header = page.getByRole('banner')
  await expect(background).toHaveCSS('opacity', '0')
  if (!isMobile) {
    await page.locator('.navigation-surface').hover()
    await expect(background).toHaveCSS('opacity', '1')
    await page.mouse.move(0, 200)
    await expect(background).toHaveCSS('opacity', '0')
  }
  await header.getByRole('link', { name: 'Quantum Digital home' }).focus()
  await expect(background).toHaveCSS('opacity', '0')
  await page.getByRole('main').focus()
  await expect(background).toHaveCSS('opacity', '0')
  await page.evaluate(() => window.scrollTo(0, 1000))
  await expect(background).toHaveCSS('opacity', '1')
  expect((await header.boundingBox())?.y).toBe(0)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(background).toHaveCSS('opacity', '0')
})

test('work, services and full-page chat remain usable with reduced motion', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('[data-hero-fallback]').first()).toBeVisible()
  await expect(page.locator('.hero-shared-canvas')).toHaveCount(0)
  await page.getByRole('link', { name: 'Explore my work' }).click()
  await expect(page).toHaveURL(/#work$/)
  await expect(
    page.getByRole('heading', { name: /Finance Document Assistant/ }),
  ).toBeVisible()
  await expect(
    page.getByText('Conceptual illustration', { exact: true }),
  ).toHaveCount(4)
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click()
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Let’s talk' })
    .click()
  await expect(page).toHaveURL(/\/chat$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'your project.',
  )
  await expect(
    page.getByRole('heading', {
      name: 'The assistant is currently unavailable.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'Message the assistant' }),
  ).toBeDisabled()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('link', { name: 'Back to the website' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Put AI to work.',
  )
})

test('graphics failure preserves readable copy and working actions', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith('webgl')) return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.goto('/')
  await expect(page.locator('[data-hero-fallback]').first()).toBeVisible()
  await expect(page.locator('#hero-heading')).toHaveCSS('opacity', '1')
  await expect(page.locator('.hero-fluid-copy__description')).toHaveCSS(
    'opacity',
    '1',
  )
  await page
    .getByRole('link', { name: 'Tell me about your project' })
    .first()
    .click()
  await expect(page).toHaveURL(/\/chat$/)
  await expect(
    page.getByRole('heading', {
      name: 'The assistant is currently unavailable.',
    }),
  ).toBeVisible()
})

test('publishes canonical metadata and machine-readable navigation', async ({
  page,
  request,
  baseURL,
}) => {
  await page.goto('/about')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/about$/,
  )
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'About | Quantum Digital',
  )
  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  expect(await robots.text()).toContain('Disallow: /admin')
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  const xml = await sitemap.text()
  expect(xml).toContain(
    '<loc>https://quantum-digital.pukitis-rudolfs.workers.dev/chat</loc>',
  )
  expect(xml).toContain('/work/finance-document-assistant')
  expect(xml).not.toContain('/admin')
  expect((await request.get('/work/unapproved-project')).status()).toBe(404)
  expect(
    (await request.get(`${baseURL}/hero/targets/q-symbol.i16`)).status(),
  ).toBe(200)
})

test('public content fits narrow, tablet and wide layouts', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const hero = await page.locator('.hero-section').boundingBox()
    expect(hero?.x).toBe(0)
    expect(hero?.y).toBe(0)
    expect(hero?.width).toBe(width)
    expect(hero?.height).toBeGreaterThanOrEqual(960)
    const layout = await page.locator('.hero-layout').boundingBox()
    expect(layout?.y).toBe(0)
    expect(layout?.width).toBe(width)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    for (const illustration of await page.locator('.service-art').all()) {
      await illustration.scrollIntoViewIfNeeded()
      await expect(illustration).toHaveJSProperty('complete', true)
      await expect(illustration).toHaveJSProperty('naturalWidth', 880)
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    })
  }
})

test('conversation types once on entry and remains readable without graphics or motion', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      options?: unknown,
    ) {
      if (kind.includes('webgl')) return null
      return Reflect.apply(original, this, [kind, options])
    } as typeof original
  })
  await page.goto('/')
  const section = page.locator('#conversation')
  const copy = page.locator('.conversation-copy')
  await section.scrollIntoViewIfNeeded()
  await expect(copy).toHaveAttribute('data-typing-complete', 'false')
  await expect(copy).toHaveAttribute('data-typing-complete', 'true')
  await expect(copy).toHaveAttribute('data-hero-copy-ready', 'true')
  await expect(
    page.getByRole('heading', { name: 'What are you working towards?' }),
  ).toBeVisible()
  await page.locator('.hero-section').scrollIntoViewIfNeeded()
  await section.scrollIntoViewIfNeeded()
  await expect(copy).toHaveAttribute('data-typing-complete', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await section.scrollIntoViewIfNeeded()
  await expect(copy).toHaveAttribute('data-typing-complete', 'true')
  await expect(page.locator('.conversation-canvas')).toHaveCount(0)
  await expect(page.locator('#conversation-heading')).toHaveCSS('opacity', '1')
})

test('shared renderer cycles all shapes, pauses offscreen and restores HTML after context loss', async ({
  page,
}) => {
  test.setTimeout(65_000)
  // Exercise real shaders with Chromium's software WebGL. The production GPU
  // detector correctly blocklists SwiftShader; mask only that renderer name.
  await page.addInitScript(() => {
    for (const prototype of [
      WebGLRenderingContext.prototype,
      WebGL2RenderingContext.prototype,
    ]) {
      const original = prototype.getParameter
      prototype.getParameter = function (parameter: number) {
        return parameter === 0x9246
          ? 'test renderer'
          : original.call(this, parameter)
      }
    }
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Shader'))
      errors.push(message.text())
  })
  await page.goto('/')
  const visual = page.locator('.hero-visual--webgl')
  await expect(visual).toHaveAttribute('data-hero-loading', 'false', {
    timeout: 20_000,
  })
  await expect(visual).toHaveAttribute('data-hero-shape', 'q-symbol')
  const heroBounds = await page.locator('.hero-section').boundingBox()
  const canvasBounds = await page.locator('.hero-shared-canvas').boundingBox()
  expect(canvasBounds).toEqual(heroBounds)
  expect(canvasBounds?.x).toBe(0)
  expect(canvasBounds?.y).toBe(0)
  const finePointer = await page.evaluate(
    () =>
      matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)')
        .matches,
  )
  if (finePointer)
    expect(
      await page
        .locator('.hero-actions')
        .evaluate(
          (element) => element.getBoundingClientRect().bottom <= innerHeight,
        ),
    ).toBe(true)
  await expect(page.locator('#hero-heading')).toHaveCSS(
    'opacity',
    finePointer ? '0' : '1',
  )
  await page.screenshot({
    path: `test-results/hero-${finePointer ? 'desktop' : 'mobile'}.png`,
  })
  await expect(visual).toHaveAttribute('data-hero-shape', 'robot', {
    timeout: 12_000,
  })
  await expect(visual).toHaveAttribute('data-hero-shape', 'rocket', {
    timeout: 12_000,
  })
  await expect(visual).toHaveAttribute('data-hero-shape', 'diamond', {
    timeout: 12_000,
  })
  await expect(visual).toHaveAttribute('data-hero-shape', 'q-symbol', {
    timeout: 12_000,
  })
  await page.locator('#conversation').scrollIntoViewIfNeeded()
  await expect(visual).toHaveAttribute('data-hero-active', 'false')
  await expect(page.locator('.conversation-canvas')).toHaveAttribute(
    'data-effects-ready',
    'true',
  )
  await expect(page.locator('.conversation-copy')).toHaveAttribute(
    'data-typing-complete',
    'true',
  )
  const conversationCanvas = page.locator('.conversation-canvas canvas')
  expect(await conversationCanvas.boundingBox()).toEqual(
    await page.locator('#conversation').boundingBox(),
  )
  await expect(page.locator('#conversation-heading')).toHaveCSS(
    'opacity',
    finePointer ? '0' : '1',
  )
  if (finePointer) {
    const bounds = await page.locator('#conversation-heading').boundingBox()
    await page.mouse.move(bounds!.x + 40, bounds!.y + 30)
    await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + 45, {
      steps: 12,
    })
  }
  await page.screenshot({
    path: `test-results/conversation-${finePointer ? 'desktop' : 'mobile'}.png`,
  })
  await conversationCanvas.evaluate((canvas) =>
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
  )
  await expect(page.locator('.conversation-canvas')).toHaveCount(0)
  await expect(page.locator('#conversation-heading')).toHaveCSS('opacity', '1')
  await page.locator('.hero-section').scrollIntoViewIfNeeded()
  await expect(visual).toHaveAttribute('data-hero-active', 'true')
  await page
    .locator('.hero-shared-canvas canvas')
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
    )
  await expect(page.locator('.hero-shared-canvas')).toHaveCount(0)
  await expect(page.locator('#hero-heading')).toHaveCSS('opacity', '1')
  await expect(page.locator('.hero-fluid-copy__description')).toHaveCSS(
    'opacity',
    '1',
  )
  await expect(page.locator('[data-hero-fallback]').first()).toBeVisible()
  expect(errors).toEqual([])
})
