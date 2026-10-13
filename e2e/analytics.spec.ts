import { test, expect, type Page } from '@playwright/test'
import { gunzipSync } from 'node:zlib'

test.skip(
  process.env.ANALYTICS_E2E_LOCAL !== '1',
  'Requires the isolated local analytics build and intercepted ingestion',
)

type CapturedEvent = { event: string; properties: Record<string, unknown> }
async function interceptAnalytics(page: Page) {
  const events: CapturedEvent[] = []
  // The SDK filters automation via navigator.webdriver; emulate a normal visitor
  // only in this intercepted integration check. Production keeps bot filtering.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    Object.defineProperty(navigator, 'userAgentData', { get: () => undefined })
    Object.defineProperty(navigator, 'userAgent', {
      get: () =>
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    })
  })
  await page.route('**://*.posthog.com/**', async (route) => {
    const body = route.request().postDataBuffer()
    if (body?.length) {
      let json: string
      if (body[0] === 0x1f && body[1] === 0x8b)
        json = gunzipSync(body).toString()
      else if (body.toString().startsWith('data='))
        json = Buffer.from(
          new URLSearchParams(body.toString()).get('data')!,
          'base64',
        ).toString()
      else json = body.toString()
      const parsed = JSON.parse(json)
      for (const event of Array.isArray(parsed)
        ? parsed
        : (parsed.batch ?? [parsed])) {
        if (event.event) events.push(event)
      }
    }
    await route.fulfill({ json: { status: 1 } })
  })
  return events
}

test('reports standard SDK exceptions and an explicit setup check only after consent', async ({
  page,
}) => {
  test.setTimeout(60_000)
  const events = await interceptAnalytics(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Accept analytics' }).waitFor()
  await page.evaluate(() => {
    window.dispatchEvent(
      new ErrorEvent('error', {
        error: new Error('before consent private@example.com'),
      }),
    )
  })
  expect(events.filter((event) => event.event === '$exception')).toHaveLength(0)
  await page.getByRole('button', { name: 'Accept analytics' }).click()
  await expect
    .poll(() => events.some((event) => event.event === '$pageview'))
    .toBe(true)
  await page.evaluate(() => {
    const error = new TypeError('Synthetic browser failure')
    error.stack = `TypeError: Synthetic browser failure\n    at exampleFunction (${location.origin}/assets/example-123.js:12:34)`
    window.dispatchEvent(new ErrorEvent('error', { error }))
    window.dispatchEvent(new ErrorEvent('error', { error }))
    window.dispatchEvent(
      new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(),
        reason: new Error('Synthetic rejected promise'),
      }),
    )
  })
  await expect
    .poll(() => events.filter((event) => event.event === '$exception').length, {
      timeout: 10_000,
    })
    .toBe(2)
  const crashes = events.filter((event) => event.event === '$exception')
  expect(crashes.map((event) => event.properties.crash_source)).toEqual(
    expect.arrayContaining(['unhandled_error', 'unhandled_rejection']),
  )
  expect(
    crashes.every((event) => event.properties.$exception_level === 'error'),
  ).toBe(true)
  const exceptions = crashes.find(
    (event) => event.properties.crash_source === 'unhandled_error',
  )!.properties.$exception_list as {
    type: string
    value: string
    stacktrace: { frames: { filename: string; lineno: number }[] }
  }[]
  expect(exceptions[0].type).toBe('TypeError')
  expect(exceptions[0].value).toBe('Synthetic browser failure')
  expect(exceptions[0].stacktrace.frames[0].lineno).toBe(12)
  await page.evaluate(() =>
    window.dispatchEvent(new Event('qd:verify-error-tracking')),
  )
  await expect
    .poll(() => events.filter((event) => event.event === '$exception').length, {
      timeout: 10_000,
    })
    .toBe(3)
  expect(
    events.find((event) => event.properties.crash_source === 'verification')
      ?.properties.is_error_tracking_verification,
  ).toBe(true)
  await page.getByRole('button', { name: 'Cookie preferences' }).click()
  await page.getByRole('button', { name: 'Reject analytics' }).click()
  await page.evaluate(() =>
    window.dispatchEvent(
      new ErrorEvent('error', { error: new Error('after rejection') }),
    ),
  )
  await page.waitForTimeout(500)
  expect(events.filter((event) => event.event === '$exception')).toHaveLength(3)
})

test('tracks public navigation and inquiry outcomes without contact data or restored conversions', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(60_000)
  const events = await interceptAnalytics(page)
  const details = {
    name: 'Private Example',
    email: 'private@example.com',
    summary: 'Confidential project description for an inquiry.',
  }
  const draft = {
    draftId: 'private-draft',
    details,
    expiresAt: Date.now() + 3_600_000,
  }
  let restored = false
  const tool = {
    type: 'tool-prepareInquiry',
    toolCallId: 'private-call',
    state: 'output-available',
    input: details,
    output: draft,
  }
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({
      json: {
        available: true,
        messages: restored
          ? [{ id: 'assistant-private', role: 'assistant', parts: [tool] }]
          : [],
        receipts: restored ? { 'private-draft': 'saved' } : {},
      },
    }),
  )
  await page.route('**/api/chat', (route) => {
    const stream = [
      { type: 'start', messageId: 'assistant-private' },
      {
        type: 'tool-input-available',
        toolCallId: 'private-call',
        toolName: 'prepareInquiry',
        input: details,
      },
      {
        type: 'tool-output-available',
        toolCallId: 'private-call',
        output: draft,
      },
      { type: 'finish', finishReason: 'stop' },
    ]
    return route.fulfill({
      headers: {
        'Content-Type': 'text/event-stream',
        'x-vercel-ai-ui-message-stream': 'v1',
      },
      body:
        stream.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('') +
        'data: [DONE]\n\n',
    })
  })
  let submissions = 0
  await page.route('**/api/inquiries', (route) => {
    submissions++
    return route.fulfill(
      submissions === 1
        ? { status: 503, json: { saved: false, error: 'Please retry.' } }
        : { json: { saved: true, inquiryId: 'private-inquiry' } },
    )
  })
  const count = (name: string) =>
    events.filter((event) => event.event === name).length
  await page.goto('/about?utm_source=linkedin&utm_campaign=launch#intro')
  await expect(
    page.getByRole('dialog', { name: 'Analytics cookies' }),
  ).toBeVisible()
  expect(events).toEqual([])
  expect(
    (await page.context().cookies()).filter((cookie) =>
      cookie.name.startsWith('ph_'),
    ),
  ).toEqual([])
  await page
    .getByRole('button', { name: 'Accept analytics', exact: true })
    .click()
  await expect.poll(() => count('$pageview'), { timeout: 10_000 }).toBe(1)
  expect(events[0]!.properties.page_path).toBe('/about')
  expect(events[0]!.properties.$pathname).toBe('/about')
  expect(events[0]!.properties.$host).toBe(new URL(baseURL!).host)
  expect(events[0]!.properties.$raw_user_agent).toContain('Mozilla/5.0')
  expect(events[0]!.properties.$cookieless_mode).toBeUndefined()
  const visitor = events[0]!.properties.distinct_id
  const device = events[0]!.properties.$device_id
  expect(device).toMatch(
    /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
  )
  expect(device).toBe(visitor)
  const session = events[0]!.properties.$session_id
  expect(visitor).not.toContain('cookieless')
  expect(session).toMatch(
    /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
  )
  // Use the real client router, not a full document reload.
  await page
    .getByRole('link', { name: 'Let’s talk', exact: true })
    .last()
    .click()
  await expect(page).toHaveURL(`${baseURL}/chat`)
  await expect.poll(() => count('$pageview'), { timeout: 10_000 }).toBe(2)
  await page
    .getByRole('textbox', { name: 'Message the assistant' })
    .fill(details.summary)
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Review your inquiry' }),
  ).toBeVisible()
  await expect
    .poll(() => count('inquiry_reviewed'), { timeout: 10_000 })
    .toBe(1)
  expect(count('chat_started')).toBe(1)
  expect(count('inquiry_requested')).toBe(1)
  expect(count('inquiry_submitted')).toBe(0)
  await page.getByRole('button', { name: 'Confirm and submit inquiry' }).click()
  await expect(page.getByRole('alert')).toContainText('Please retry.')
  await expect
    .poll(() => count('inquiry_submission_failed'), { timeout: 10_000 })
    .toBe(1)
  expect(count('inquiry_submitted')).toBe(0)
  await page.getByRole('button', { name: 'Confirm and submit inquiry' }).click()
  await expect(
    page.getByText('Your inquiry is saved.', { exact: false }),
  ).toBeVisible()
  await expect
    .poll(() => count('inquiry_submitted'), { timeout: 10_000 })
    .toBe(1)
  expect(count('inquiry_submit_attempted')).toBe(2)
  restored = true
  await page.reload()
  await expect(
    page.getByText('Your inquiry is saved.', { exact: false }),
  ).toBeVisible()
  await expect.poll(() => count('$pageview'), { timeout: 10_000 }).toBe(3)
  for (const event of events.filter(
    (candidate) => candidate.event === '$pageview',
  )) {
    expect(event.properties.$pathname).toBe(event.properties.page_path)
    expect(new URL(event.properties.$current_url as string).pathname).toBe(
      event.properties.page_path,
    )
    expect(event.properties.$browser).toBeTruthy()
    expect(event.properties.$os).toBeTruthy()
    expect(event.properties.$device_type).toBeTruthy()
    expect(event.properties.$geoip_disable).not.toBe(true)
    expect(event.properties.$host).toBe(new URL(baseURL!).host)
    expect(event.properties.$raw_user_agent).toContain('Mozilla/5.0')
    expect(event.properties.distinct_id).toBe(visitor)
    expect(event.properties.$device_id).toBe(device)
    expect(event.properties.$session_id).toBe(session)
    expect(event.properties.$cookieless_mode).toBeUndefined()
  }
  expect(count('inquiry_requested')).toBe(1)
  expect(count('inquiry_reviewed')).toBe(1)
  expect(count('inquiry_submitted')).toBe(1)
  const aboutView = events.find(
    (event) =>
      event.event === '$pageview' && event.properties.page_path === '/about',
  )!
  expect(aboutView.properties.$current_url).toContain('utm_source=linkedin')
  expect(aboutView.properties.utm_source).toBe('linkedin')
  const payload = JSON.stringify(events)
  for (const value of [
    ...Object.values(details),
    draft.draftId,
    'private-inquiry',
  ])
    expect(payload).not.toContain(value)
  expect(
    (await page.context().cookies()).filter((cookie) =>
      cookie.name.startsWith('ph_'),
    ),
  ).not.toEqual([])
  const identityCookie = (await page.context().cookies()).find((cookie) =>
    cookie.name.endsWith('_posthog'),
  )!
  expect(JSON.parse(decodeURIComponent(identityCookie.value)).$device_id).toBe(
    device,
  )
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key.startsWith('ph_')),
    ),
  ).toEqual([])
})

test('does not track admin or send events when Global Privacy Control is enabled', async ({
  page,
}) => {
  const events = await interceptAnalytics(page)
  await page.goto('/admin')
  await page.waitForTimeout(3500)
  expect(events).toEqual([])
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }),
  )
  await page.goto('/about')
  await page.waitForTimeout(3500)
  expect(events).toEqual([])
})

test('tracks inline contact request, draft review and confirmed submission', async ({
  page,
}) => {
  test.setTimeout(60_000)
  const events = await interceptAnalytics(page)
  const details = {
    name: 'Inline Private',
    email: 'inline-private@example.com',
    summary: 'Build a confidential coordination application.',
  }
  const draft = {
    draftId: 'inline-private-draft',
    details,
    expiresAt: Date.now() + 3_600_000,
  }
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({ json: { available: true } }),
  )
  await page.route('**/api/chat', (route) => {
    const output = {
      formId: 'inline-private-form',
      details: { summary: details.summary },
    }
    const streamEvents = [
      { type: 'start', messageId: 'inline-assistant' },
      {
        type: 'tool-input-available',
        toolCallId: 'inline-call',
        toolName: 'requestContactDetails',
        input: output.details,
      },
      { type: 'tool-output-available', toolCallId: 'inline-call', output },
      { type: 'finish', finishReason: 'stop' },
    ]
    return route.fulfill({
      headers: {
        'Content-Type': 'text/event-stream',
        'x-vercel-ai-ui-message-stream': 'v1',
      },
      body:
        streamEvents
          .map((event) => `data: ${JSON.stringify(event)}\n\n`)
          .join('') + 'data: [DONE]\n\n',
    })
  })
  await page.route('**/api/inquiry-drafts', (route) =>
    route.fulfill({ json: draft }),
  )
  await page.route('**/api/inquiries', (route) =>
    route.fulfill({
      json: { saved: true, inquiryId: 'inline-private-inquiry' },
    }),
  )
  const count = (name: string) =>
    events.filter((event) => event.event === name).length
  await page.goto('/chat')
  const banner = page.getByRole('dialog', { name: 'Analytics cookies' })
  await expect(banner).toBeVisible()
  const bannerBounds = (await banner.boundingBox())!
  const composerBounds = (await page.locator('.chat-composer').boundingBox())!
  expect(bannerBounds.y + bannerBounds.height).toBeLessThan(composerBounds.y)
  await page
    .getByRole('button', { name: 'Accept analytics', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Contact Rudolfs', exact: true })
    .click()
  await expect(page.locator('.chat-contact-card')).toBeVisible()
  await expect
    .poll(() => count('inquiry_requested'), { timeout: 10_000 })
    .toBe(1)
  expect(count('inquiry_reviewed')).toBe(0)
  await page.getByLabel('Name', { exact: true }).fill(details.name)
  await page.getByLabel('Email', { exact: true }).fill(details.email)
  await page
    .getByRole('button', { name: 'Review inquiry', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Review your inquiry' }),
  ).toBeVisible()
  await expect
    .poll(() => count('inquiry_reviewed'), { timeout: 10_000 })
    .toBe(1)
  expect(count('inquiry_submitted')).toBe(0)
  await page.getByRole('button', { name: 'Confirm and submit inquiry' }).click()
  await expect
    .poll(() => count('inquiry_submitted'), { timeout: 10_000 })
    .toBe(1)
  for (const capturedEvent of events.filter((candidate) =>
    candidate.event.startsWith('inquiry_'),
  ))
    expect(capturedEvent.properties.source).toBe('contact_form')
  for (const value of Object.values(details))
    expect(JSON.stringify(events)).not.toContain(value)
  expect(
    (await page.context().cookies()).some((cookie) =>
      cookie.name.startsWith('ph_'),
    ),
  ).toBe(true)
})

test('rejects tracking, remembers consent, and clears cookies when consent is withdrawn', async ({
  page,
}) => {
  test.setTimeout(60_000)
  const events = await interceptAnalytics(page)
  await page.goto('/about')
  await page
    .getByRole('button', { name: 'Reject analytics', exact: true })
    .click()
  await page.waitForTimeout(3500)
  expect(events).toEqual([])
  expect(
    (await page.context().cookies()).filter((cookie) =>
      cookie.name.startsWith('ph_'),
    ),
  ).toEqual([])
  await page.reload()
  await expect(
    page.getByRole('dialog', { name: 'Analytics cookies' }),
  ).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Cookie preferences', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Accept analytics', exact: true })
    .click()
  await expect
    .poll(() => events.filter((event) => event.event === '$pageview').length, {
      timeout: 10_000,
    })
    .toBe(1)
  expect(
    (await page.context().cookies()).some((cookie) =>
      cookie.name.startsWith('ph_'),
    ),
  ).toBe(true)
  await page.goto('/privacy')
  await expect
    .poll(() => events.filter((event) => event.event === '$pageview').length, {
      timeout: 10_000,
    })
    .toBe(2)
  await page
    .getByRole('button', { name: 'Cookie preferences', exact: true })
    .first()
    .click()
  await page
    .getByRole('button', { name: 'Reject analytics', exact: true })
    .click()
  await expect
    .poll(
      async () =>
        (await page.context().cookies()).filter((cookie) =>
          cookie.name.startsWith('ph_'),
        ).length,
    )
    .toBe(0)
  await page.goto('/about')
  await page.waitForTimeout(3500)
  expect(events.filter((event) => event.event === '$pageview')).toHaveLength(2)
  await expect(
    page.getByRole('dialog', { name: 'Analytics cookies' }),
  ).toHaveCount(0)
})
