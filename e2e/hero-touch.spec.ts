import { expect, test } from '@playwright/test'

test('mobile touch drives fluid text and gold trails without blocking scrolling or chat', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Touch interaction uses the mobile device profile')
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
  await page.goto('/')
  await expect(page.locator('.hero-visual--webgl')).toHaveAttribute(
    'data-hero-loading',
    'false',
    { timeout: 20_000 },
  )
  await expect(page.locator('.hero-copy')).toHaveAttribute(
    'data-hero-copy-ready',
    'true',
  )
  await expect(page.locator('.hero-copy')).not.toHaveClass(
    /hero-fluid-copy--ready/,
  )
  await expect(page.locator('#hero-heading')).toHaveCSS('opacity', '1')
  const title = page.locator('#hero-heading')
  const bounds = (await title.boundingBox())!
  const before = await page.screenshot({ clip: bounds })
  const y = bounds.y + bounds.height / 2
  // Synthetic touches verify that even cancelable events remain unprevented.
  for (let i = 0; i <= 12; i++) {
    const prevented = await title.evaluate(
      (element, point) => {
        const touch = new Touch({
          identifier: 1,
          target: element,
          clientX: point.x,
          clientY: point.y,
        })
        const event = new TouchEvent(point.start ? 'touchstart' : 'touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
        })
        element.dispatchEvent(event)
        return event.defaultPrevented
      },
      { x: bounds.x + 60 + i * 10, y, start: i === 0 },
    )
    expect(prevented).toBe(false)
    await page.waitForTimeout(16)
  }
  // Keep the finger moving during capture: software GPU screenshots can take
  // longer than the short-lived trail itself.
  const trail = await title.evaluate(
    (element, point) => {
      let step = 0
      return window.setInterval(() => {
        const touch = new Touch({
          identifier: 1,
          target: element,
          clientX: point.x + Math.sin(step++ / 2) * 55,
          clientY: point.y,
        })
        element.dispatchEvent(
          new TouchEvent('touchmove', {
            bubbles: true,
            touches: [touch],
            targetTouches: [touch],
            changedTouches: [touch],
          }),
        )
      }, 20)
    },
    { x: bounds.x + 150, y },
  )
  await expect(title).toHaveCSS('opacity', '0')
  await expect
    .poll(
      async () => {
        const after = await page.screenshot({
          clip: bounds,
          path: 'test-results/mobile-fluid-touch.png',
        })
        const gold = await page.evaluate(
          async (images) => {
            const counts = []
            for (const image of images) {
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
              let count = 0
              for (let i = 0; i < pixels.length; i += 4) {
                if (
                  pixels[i]! > 80 &&
                  pixels[i]! > pixels[i + 1]! * 1.1 &&
                  pixels[i + 1]! > pixels[i + 2]! * 1.4
                )
                  count++
              }
              counts.push(count)
              bitmap.close()
            }
            return counts
          },
          [before.toString('base64'), after.toString('base64')],
        )
        return gold[1]! - gold[0]!
      },
      { timeout: 15_000, intervals: [100, 200, 500] },
    )
    .toBeGreaterThan(10)
  await page.evaluate((timer) => clearInterval(timer), trail)
  await title.dispatchEvent('touchend', { bubbles: true })
  await expect(title).toHaveCSS('opacity', '1', { timeout: 10_000 })
  await expect(page.locator('.hero-copy')).not.toHaveClass(
    /hero-fluid-copy--ready/,
  )
  // Native browser touches prove the effect does not capture the scrolling gesture.
  const client = await page.context().newCDPSession(page)
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 30, y: 650 }],
  })
  for (let i = 1; i <= 10; i++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 30, y: 650 - i * 35 }],
    })
    await page.waitForTimeout(20)
  }
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  })
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100)
  await page.locator('.hero-actions a[href="/chat"]').tap()
  await expect(page).toHaveURL(/\/chat$/)
})
