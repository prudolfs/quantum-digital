import { expect, test } from '@playwright/test'

test('fluid text survives repeated viewport resize without reloading', async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'Live desktop resizing crosses the mobile layout breakpoints',
  )
  test.setTimeout(90_000)
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
  page.on('console', (message) => {
    if (
      /INVALID_VALUE|INVALID_OPERATION|texSubImage|texStorage|Texture size/i.test(
        message.text(),
      )
    )
      errors.push(message.text())
  })
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await expect(page.locator('.hero-visual--webgl')).toHaveAttribute(
    'data-hero-loading',
    'false',
    { timeout: 20_000 },
  )
  const metrics = async () => {
    const title = page.locator('#hero-heading')
    await expect(title).toHaveCSS('opacity', '0')
    const screenshot = await page.screenshot({
      clip: (await title.boundingBox())!,
    })
    return page.evaluate(async (image) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${image}`)).blob(),
      )
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')!
      context.drawImage(bitmap, 0, 0)
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data
      let ink = 0
      for (let i = 0; i < pixels.length; i += 4) {
        if (
          (pixels[i]! > 120 && pixels[i + 1]! > 170 && pixels[i + 2]! > 170) ||
          (pixels[i]! < 50 && pixels[i + 1]! > 90 && pixels[i + 2]! > 150)
        )
          ink++
      }
      bitmap.close()
      return ink
    }, screenshot.toString('base64'))
  }
  const initial = await metrics()
  expect(initial).toBeGreaterThan(1000)
  for (const width of [390, 1024, 768, 1440]) {
    await page.setViewportSize({ width, height: 1100 })
    await expect
      .poll(() =>
        page
          .locator('.hero-shared-canvas canvas')
          .evaluate((canvas) =>
            Math.round(canvas.getBoundingClientRect().width),
          ),
      )
      .toBe(width)
    await expect(page.locator('.hero-copy')).toHaveClass(
      /hero-fluid-copy--ready/,
    )
    await page.waitForTimeout(150)
    expect(await metrics()).toBeGreaterThan(1000)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
  }
  // Back at the original width, the rendered text must have the same ink area.
  // A stale GPU allocation otherwise clips or stretches it despite correct DOM bounds.
  const restored = await metrics()
  expect(restored / initial).toBeGreaterThan(0.98)
  expect(restored / initial).toBeLessThan(1.02)
  expect(errors).toEqual([])
})
