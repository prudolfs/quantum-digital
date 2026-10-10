import { expect, test } from '@playwright/test'

test('vertical scrolling traverses fixed rows and releases at the end', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize({ width: isMobile ? 390 : 1440, height: 1100 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  for (const id of ['work']) {
    const section = page.locator(`#${id}`)
    const panel = section.locator('.horizontal-section__panel')
    const row = section.locator('.horizontal-track')
    await expect(section).toHaveClass(/horizontal-section--pinned/)
    const alignment = await section.locator('.work-card').evaluateAll((cards) =>
      cards.map((card) => {
        const bounds = card.getBoundingClientRect()
        return {
          height: bounds.height,
          title:
            card.querySelector('h3')!.getBoundingClientRect().top - bounds.top,
          description:
            card.querySelector('.body-copy')!.getBoundingClientRect().top -
            bounds.top,
          action:
            card.querySelector('.text-link')!.getBoundingClientRect().top -
            bounds.top,
        }
      }),
    )
    for (const card of alignment) {
      for (const key of ['height', 'title', 'description', 'action'] as const)
        expect(card[key]).toBeCloseTo(alignment[0]![key], 0)
    }
    const metrics = await section
      .locator('.horizontal-section__runway')
      .evaluate((element) => {
        const trackElement = element.querySelector('.horizontal-track')!
        return {
          start: element.getBoundingClientRect().top + scrollY - 104,
          distance: trackElement.scrollWidth - trackElement.clientWidth,
        }
      })
    await page.evaluate((y) => scrollTo(0, y), metrics.start + 40)
    await expect
      .poll(() => row.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(20)
    expect((await panel.boundingBox())!.y).toBeCloseTo(104, 0)
    const bounds = await row.boundingBox()
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1100)
    await page.mouse.move(bounds!.x + 50, bounds!.y + 50)
    await page.mouse.wheel(0, Math.min(150, metrics.distance / 2))
    await expect
      .poll(() => row.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(60)
    expect((await panel.boundingBox())!.y).toBeCloseTo(104, 0)
    await page.evaluate((y) => scrollTo(0, y), metrics.start + metrics.distance)
    await expect
      .poll(() =>
        row.evaluate((element) =>
          Math.abs(
            element.scrollLeft - (element.scrollWidth - element.clientWidth),
          ),
        ),
      )
      .toBeLessThan(2)
    await page.evaluate(
      (y) => scrollTo(0, y),
      metrics.start + metrics.distance + 160,
    )
    await expect
      .poll(async () => (await panel.boundingBox())!.y)
      .toBeLessThan(100)
    await page.evaluate((y) => scrollTo(0, y), metrics.start)
    await expect
      .poll(() => row.evaluate((element) => element.scrollLeft))
      .toBeLessThan(2)
    await row.focus()
    await page.keyboard.press('ArrowRight')
    await expect
      .poll(() => row.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(100)
    await page.evaluate((y) => scrollTo(0, y), metrics.start)
    await expect
      .poll(() => row.evaluate((element) => element.scrollLeft))
      .toBeLessThan(2)
    await page.screenshot({
      path: `test-results/${id}-row-${isMobile ? 'mobile' : 'desktop'}.png`,
    })
  }
  await expect(
    page.locator('#services .horizontal-section__panel'),
  ).toHaveCount(0)
  await expect(page.locator('#services .service-grid')).toHaveCSS(
    'display',
    'grid',
  )
})

test('reduced motion keeps complete cards reachable with native horizontal scrolling', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const section = page.locator('#work')
  await expect(section).not.toHaveClass(/horizontal-section--pinned/)
  const last = page.getByRole('link', { name: /Robotics Lab/ })
  await last.focus()
  await expect
    .poll(() =>
      section
        .locator('.horizontal-track')
        .evaluate((element) => element.scrollLeft),
    )
    .toBeGreaterThan(0)
  await last.click()
  await expect(page).toHaveURL('/work/robotics-lab')
})

test('FAQ opening and closing animate height smoothly', async ({ page }) => {
  await page.goto('/')
  const item = page.locator('.faq-list details').first()
  const summary = item.locator('summary')
  await summary.click()
  await expect(item).toHaveAttribute('open', '')
  await expect(item.locator('div')).toHaveCSS('opacity', '1')
  await summary.click()
  await expect(item).toHaveAttribute('open', '')
  await expect(item).not.toHaveAttribute('open')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await summary.click()
  await expect(item.locator('div')).toHaveCSS('opacity', '1')
})
