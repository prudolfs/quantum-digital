import { expect, test } from '@playwright/test'

for (const position of [
  { label: 'at the left edge', edge: 'left', index: 1 },
  { label: 'at the right edge', edge: 'right', index: 3 },
  { label: 'below its sticky position', edge: 'below', index: 0 },
] as const) {
  test(`a work card ${position.label} opens on the first mouse click`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop mouse focus regression.')
    await page.setViewportSize({ width: 1440, height: 1100 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const section = page.locator('#work')
    const row = section.locator('.horizontal-track')
    const card = row.locator('.work-card').nth(position.index)
    await expect(section).toHaveClass(/horizontal-section--pinned/)
    const scrollPosition = await card.evaluate((element, clippedEdge) => {
      const track = element.closest('.horizontal-track')!
      const runway = element.closest('.horizontal-section__runway')!
      const start =
        element.getBoundingClientRect().left -
        track.getBoundingClientRect().left +
        track.scrollLeft
      const width = element.getBoundingClientRect().width
      const offset =
        clippedEdge === 'left'
          ? start + width * 0.45
          : clippedEdge === 'right'
            ? start - track.clientWidth + width * 0.55
            : 0
      return {
        top:
          runway.getBoundingClientRect().top +
          scrollY -
          104 +
          offset -
          (clippedEdge === 'below' ? 120 : 0),
        offset,
      }
    }, position.edge)
    await page.evaluate((top) => scrollTo(0, top), scrollPosition.top)
    await expect
      .poll(() => row.evaluate((element) => element.scrollLeft))
      .toBeCloseTo(scrollPosition.offset, 0)
    await expect(card).toHaveCSS('opacity', '1')
    const cardBounds = (await card.boundingBox())!
    const rowBounds = (await row.boundingBox())!
    const x =
      (Math.max(cardBounds.x, rowBounds.x) +
        Math.min(
          cardBounds.x + cardBounds.width,
          rowBounds.x + rowBounds.width,
        )) /
      2
    const destination = await card.getAttribute('href')
    const before = await page.evaluate(() => scrollY)
    await page.mouse.move(x, cardBounds.y + cardBounds.height / 2)
    await page.mouse.down()
    // Keep the button down across frames: focus must not move the link away
    // from the pointer between mousedown and mouseup.
    await page.waitForTimeout(80)
    expect(await page.evaluate(() => scrollY)).toBeCloseTo(before, 0)
    expect(await row.evaluate((element) => element.scrollLeft)).toBeCloseTo(
      scrollPosition.offset,
      0,
    )
    await page.mouse.up()
    await expect(page).toHaveURL(destination!)
  })
}

test('keyboard focus still aligns the sticky work section and Enter opens the card', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop keyboard focus check.')
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const section = page.locator('#work')
  await expect(section).toHaveClass(/horizontal-section--pinned/)
  const row = section.locator('.horizontal-track')
  await row.focus()
  const start = await section
    .locator('.horizontal-section__runway')
    .evaluate((element) => element.getBoundingClientRect().top + scrollY - 104)
  await page.evaluate((top) => scrollTo(0, top - 120), start)
  await page.keyboard.press('Tab')
  const card = row.locator('.work-card').first()
  await expect(card).toBeFocused()
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(start, 0)
  const destination = await card.getAttribute('href')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(destination!)
})

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
