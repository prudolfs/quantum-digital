import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const stories: {
  slug: string
  art: string
  headline: string
  steps: number
  repository?: string
}[] = [
  {
    slug: 'research-workflow',
    art: 'research',
    headline: 'Research thatleads somewhere.',
    steps: 6,
  },
  {
    slug: 'service-operations-copilot',
    art: 'services',
    headline: 'Keep the joband the conversation.',
    steps: 4,
    repository: 'https://github.com/prudolfs/service-operations-copilot',
  },
  {
    slug: 'robotics-lab',
    art: 'robotics',
    headline: 'Build a world.See how robots move.',
    steps: 4,
    repository: 'https://github.com/prudolfs/robotics-lab',
  },
]

for (const story of stories) {
  test(`${story.slug} has reviewable evidence, correct links and accessible steps`, async ({
    page,
  }) => {
    const graphics: string[] = []
    page.on('request', (request) => {
      if (/\.glb|work-model-runtime/.test(request.url()))
        graphics.push(request.url())
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/work/${story.slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      story.headline,
    )
    await expect(page.locator('.work-steps button')).toHaveCount(story.steps)
    const last = page.locator('.work-steps button').last()
    await last.focus()
    await page.keyboard.press('Enter')
    await expect(last).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.work-steps li p')).toHaveCount(story.steps)
    if (story.repository)
      await expect(
        page.locator('.work-actions a[href^="https://"]'),
      ).toHaveAttribute('href', story.repository)
    else await expect(page.locator('main a[href^="https://"]')).toHaveCount(0)
    await expect(page.locator('.work-evidence-grid figure')).toHaveCount(
      story.slug === 'research-workflow' ? 4 : 2,
    )
    await expect(page.locator('.work-model')).toHaveAttribute(
      'data-model-stage',
      'static',
    )
    expect(graphics).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.locator('.work-context summary').first().click()
    await expect(
      page.getByRole('heading', { name: 'Delivery', exact: true }),
    ).toBeVisible()
    if (story.slug === 'robotics-lab') {
      await expect(page.locator('.work-applications > section')).toHaveCount(4)
      await expect(
        page.getByRole('heading', { name: 'Warehouse Demo', exact: true }),
      ).toBeVisible()
      await expect(
        page
          .locator('.work-application-status')
          .filter({ hasText: 'relocalization remains planned' }),
      ).toBeVisible()
    }
    const related = page.locator('.work-related a').first()
    const destination = await related.getAttribute('href')
    await related.click()
    await expect(page).toHaveURL(new RegExp(destination! + '$'))
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      story.headline,
    )
    await page.locator('.work-closing a').click()
    await expect(page).toHaveURL(/\/chat$/)
  })

  test(`${story.slug} keeps the poster when its model fails`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Touch devices use the still artwork.')
    await page.route(`**/${story.art}-hero.glb`, (route) =>
      route.fulfill({ status: 503, body: 'Unavailable' }),
    )
    await page.goto(`/work/${story.slug}`)
    await expect(page.locator('.work-model')).toHaveAttribute(
      'data-model-stage',
      'static',
    )
    await expect(page.locator('.work-model-poster')).toBeVisible()
    await expect(page.locator('.work-model canvas')).toHaveCount(0)
  })

  test(`${story.slug} stays complete without JavaScript`, async ({
    browser,
    baseURL,
  }, testInfo) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: testInfo.project.use.viewport,
    })
    const page = await context.newPage()
    await page.goto(`${baseURL}/work/${story.slug}`)
    await expect(page.locator('.work-model-poster')).toBeVisible()
    await expect(page.locator('.work-steps li p')).toHaveCount(story.steps)
    await page.locator('.work-context summary').first().click()
    await expect(
      page.getByRole('heading', { name: 'Context', exact: true }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await context.close()
  })

  test(`${story.slug} loads its real model and reacts to pointer movement`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Touch devices use the still artwork.')
    await page.goto(`/work/${story.slug}`)
    await expect(page.locator('.work-model')).toHaveAttribute(
      'data-model-stage',
      'live',
      { timeout: 15000 },
    )
    const host = page.locator('.work-model-canvas')
    await page.waitForTimeout(500)
    const before = Number(await host.getAttribute('data-model-frames'))
    const bounds = await host.boundingBox()
    await page.mouse.move(
      bounds!.x + bounds!.width * 0.8,
      bounds!.y + bounds!.height * 0.3,
    )
    await expect
      .poll(async () => Number(await host.getAttribute('data-model-frames')))
      .toBeGreaterThan(before)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(page.locator('.work-model')).toHaveAttribute(
      'data-model-stage',
      'static',
    )
    await expect(page.locator('.work-model canvas')).toHaveCount(0)
  })
}
