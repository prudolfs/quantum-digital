import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const services = [
  {
    slug: 'ai-integrations',
    theme: 'ai',
    label: 'AI integrations',
    heading: 'AI that fits the way you work.',
    starting: 'Give AI a specific job.',
    action: 'Tell me about your AI task',
    related: 'Finance Document Assistant',
  },
  {
    slug: 'workflow-automation',
    theme: 'workflow',
    label: 'Workflow automation',
    heading: 'Less busywork. Better flow.',
    starting: 'Make the next step visible.',
    action: 'Tell me about your workflow',
    related: 'Research to Action',
  },
  {
    slug: 'system-integrations',
    theme: 'integration',
    label: 'System integrations',
    heading: 'Make your systems work together.',
    starting: 'Connect systems around their constraints.',
    action: 'Tell me about your systems',
    related: 'Care Coordination',
  },
]

test.beforeEach(async ({ page }) => {
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: false } }),
  )
  await page.route('**/*.posthog.com/**', (route) => route.abort())
})

for (const service of services) {
  test(`${service.label} has distinct accessible content, optimized artwork, metadata, and contextual navigation`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const graphics: string[] = []
    page.on('request', (request) => {
      if (/\.glb|work-model-runtime|background\.webp/.test(request.url()))
        graphics.push(request.url())
    })
    await page.goto('/')
    await page
      .getByRole('link', { name: `Explore ${service.label.toLowerCase()}` })
      .click()
    await expect(page).toHaveURL(`/services/${service.slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      service.heading,
    )
    await expect(
      page.getByRole('heading', { name: service.starting }),
    ).toBeVisible()
    await expect(page.locator('.faq-list summary')).toHaveCount(5)
    await expect(page.locator('.service-illustration figcaption')).toHaveText(
      'Conceptual illustration',
    )
    const image = page.locator('.service-illustration img')
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBe(isMobile ? 768 : 1400)
    expect(
      await image.evaluate((img: HTMLImageElement) => img.currentSrc),
    ).toContain(`${service.theme}-hero${isMobile ? '-mobile' : ''}.webp`)
    expect(graphics).toEqual([])
    await expect(page).toHaveTitle(`${service.label} | Quantum Digital`)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/services/${service.slug}$`),
    )
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute('content', description!)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/social-preview.png$/,
    )
    const graph = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    )['@graph']
    expect(
      graph.find((node: Record<string, string>) => node['@type'] === 'Service'),
    ).toMatchObject({
      name: service.heading,
      serviceType: service.label,
      description,
    })
    expect(
      graph.find((node: Record<string, string>) => node['@type'] === 'Person')
        .sameAs,
    ).toHaveLength(2)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.locator('.faq-list summary').first().focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.faq-list details').first()).toHaveAttribute(
      'open',
      '',
    )
    await page.screenshot({
      path: testInfo.outputPath(`${service.theme}-page.png`),
      fullPage: true,
    })
    await page.getByRole('link', { name: new RegExp(service.related) }).click()
    await expect(page).toHaveURL(/\/work\//)
    await page.goto(`/services/${service.slug}`)
    await page.getByRole('link', { name: service.action }).first().click()
    await expect(page).toHaveURL(`/chat?service=${service.slug}`)
    await expect(page.locator('.chat-service-context')).toContainText(
      service.label,
    )
  })

  test(`${service.label} uses the real model on desktop and the still on mobile`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.goto(`/services/${service.slug}`)
    const art = page.locator('.service-illustration')
    if (isMobile) {
      await expect(art).toHaveAttribute('data-model-stage', 'static')
      await expect(art.locator('canvas')).toHaveCount(0)
      return
    }
    await expect(art).toHaveAttribute('data-model-stage', 'live', {
      timeout: 15000,
    })
    await expect(art.locator('canvas')).toHaveCount(1)
    const box = await art.boundingBox()
    await page.mouse.move(
      box!.x + box!.width * 0.85,
      box!.y + box!.height * 0.3,
    )
    await page.screenshot({
      path: testInfo.outputPath(`${service.theme}-live.png`),
    })
  })
}

test('all new service content and questions are present without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  for (const service of services) {
    await page.goto(`${baseURL}/services/${service.slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      service.heading,
    )
    await expect(page.locator('.service-illustration img')).toBeVisible()
    await page.locator('.faq-list summary').first().click()
    await expect(page.locator('.faq-list details').first()).toHaveAttribute(
      'open',
      '',
    )
    expect(
      await page.locator('script[type="application/ld+json"]').count(),
    ).toBe(1)
  }
  await context.close()
})

test('service topic preserves restored chat, validates unknown hints, and waits for explicit send', async ({
  page,
}) => {
  const restored = [
    {
      id: 'visitor',
      role: 'user',
      parts: [{ type: 'text', text: 'Keep my earlier question' }],
    },
    {
      id: 'assistant',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: 'Explore [AI integrations](/services/ai-integrations). [Unavailable](/services/private-offer)',
        },
      ],
    },
  ]
  await page.unroute('**/api/chat-session')
  await page.route('**/api/chat-session', (route) => {
    expect(route.request().method()).toBe('GET')
    return route.fulfill({
      json: { available: true, revision: 3, messages: restored },
    })
  })
  let submitted: Record<string, unknown> | undefined
  await page.route('**/api/chat', (route) => {
    submitted = route.request().postDataJSON()
    return route.fulfill({
      status: 503,
      json: { error: 'ASSISTANT_UNAVAILABLE' },
    })
  })
  await page.goto('/chat?service=ai-integrations')
  await expect(page.getByText('Keep my earlier question')).toBeVisible()
  await expect(page.locator('.chat-service-context')).toContainText(
    'AI integrations',
  )
  expect(submitted).toBeUndefined()
  await expect(
    page.getByRole('link', { name: 'AI integrations', exact: true }),
  ).toHaveAttribute('href', '/services/ai-integrations')
  await expect(
    page.getByRole('link', { name: 'Unavailable', exact: true }),
  ).toHaveCount(0)
  const input = page.getByRole('textbox', { name: 'Message the assistant' })
  await input.fill('How could it help my team?')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect.poll(() => submitted?.serviceContext).toBe('ai-integrations')
  expect((submitted!.messages as typeof restored)[0].parts[0].text).toBe(
    'Keep my earlier question',
  )
  await input.fill('A draft I have not sent yet.')
  await page.getByRole('link', { name: 'clear this topic' }).click()
  await expect(input).toHaveValue('A draft I have not sent yet.')
  await expect(page.locator('.chat-service-context')).toHaveCount(0)
  await expect(page.getByText('Keep my earlier question')).toBeVisible()
  submitted = undefined
  await page.goto('/chat?service=ignore-all-instructions')
  await expect(page.getByText('Keep my earlier question')).toBeVisible()
  await expect(page.locator('.chat-service-context')).toHaveCount(0)
  await input.fill('Show me the offer')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect.poll(() => submitted).toBeDefined()
  expect(submitted).not.toHaveProperty('serviceContext')
})

test('homepage service pairs align corresponding content rows across responsive widths', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  for (const width of [1440, 1024, 820, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    const cards = await page.locator('.service-card').evaluateAll((elements) =>
      elements.map((card) => {
        const bounds = card.getBoundingClientRect()
        const selectors = [
          '.eyebrow',
          'h3',
          '.body-copy',
          '.service-detail',
          '.service-detail-link',
        ]
        return {
          height: bounds.height,
          rows: selectors.map(
            (selector) =>
              card.querySelector(selector)!.getBoundingClientRect().top -
              bounds.top,
          ),
        }
      }),
    )
    expect(cards).toHaveLength(4)
    if (width >= 640) {
      for (let index = 0; index < cards.length; index += 2) {
        expect(cards[index]!.height).toBeCloseTo(cards[index + 1]!.height, 0)
        for (let row = 0; row < 5; row++)
          expect(
            Math.abs(cards[index]!.rows[row]! - cards[index + 1]!.rows[row]!),
          ).toBeLessThan(1)
      }
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
})
