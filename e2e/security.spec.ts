import { test, expect } from '@playwright/test'

test('production pages have security headers and render without CSP violations', async ({
  page,
}) => {
  const violations: string[] = []
  await page.addInitScript(() => {
    const browser = window as Window & { cspViolations?: string[] }
    browser.cspViolations = []
    document.addEventListener('securitypolicyviolation', (event) =>
      browser.cspViolations!.push(
        `${event.violatedDirective}: ${event.blockedURI}`,
      ),
    )
  })
  for (const path of [
    '/',
    '/about',
    '/services/ai-integrations',
    '/work/finance-document-assistant',
    '/chat',
  ]) {
    // Mock the private API: this check does not send inquiries or consume model credits.
    await page.route('**/api/chat-session', (route) =>
      route.fulfill({ json: { available: false, revision: 0, messages: [] } }),
    )
    const response = await page.goto(path)
    expect(response?.headers()['x-frame-options']).toBe('DENY')
    expect(response?.headers()['x-content-type-options']).toBe('nosniff')
    expect(response?.headers()['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    )
    await expect(page.locator('body')).not.toContainText(
      'This page could not load.',
    )
    await page.waitForTimeout(250)
    violations.push(
      ...(await page.evaluate(
        () =>
          (window as Window & { cspViolations?: string[] }).cspViolations ?? [],
      )),
    )
  }
  expect(violations).toEqual([])
})

test('rejects foreign-origin API mutations before accessing the backend', async ({
  request,
}) => {
  for (const path of [
    '/api/chat',
    '/api/chat-session',
    '/api/inquiry-drafts',
    '/api/inquiries',
    '/api/auth/sign-in/email',
  ]) {
    const response = await request.post(path, {
      headers: { Origin: 'https://other.example' },
      data: {},
    })
    expect(response.status()).toBe(403)
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
  }
})
