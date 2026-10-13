import { expect, test } from '@playwright/test'

test('all selected-work detail pages load 3D and respond to touch on mobile', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Mobile viewer check.')
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const slug of [
    'care-coordination',
    'accounting-workflows',
    'research-workflow',
    'finance-document-assistant',
    'service-operations-copilot',
    'robotics-lab',
  ]) {
    await page.goto(`/work/${slug}`)
    const host = page.locator('.work-model-canvas')
    await host.scrollIntoViewIfNeeded()
    await expect(page.locator('.work-model')).toHaveAttribute(
      'data-model-stage',
      'live',
      { timeout: 15_000 },
    )
    await expect(host.locator('canvas')).toHaveCount(1)
    const frames = Number(await host.getAttribute('data-model-frames'))
    const box = await host.boundingBox()
    await page.touchscreen.tap(
      box!.x + box!.width * 0.85,
      box!.y + box!.height * 0.3,
    )
    await expect
      .poll(async () => Number(await host.getAttribute('data-model-frames')))
      .toBeGreaterThan(frames)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
  expect(errors).toEqual([])
})
