import { test, expect } from '@playwright/test'

type WidgetCallbacks = {
  callback: (token: string) => void
  'before-interactive-callback': () => void
  'expired-callback': () => void
  'error-callback': () => void
  'timeout-callback': () => void
}
type VerificationWindow = Window & {
  verificationTest: { widgets: WidgetCallbacks[] }
}

test('completed verification clears the composer and renews safely', async ({
  page,
}) => {
  await page.route('**/api/chat-session', (route) =>
    route.fulfill({
      json: { available: true, verificationRequired: true, revision: 0 },
    }),
  )
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js*',
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `
        window.verificationTest = { widgets: [] };
        window.turnstile = {
          render(element, options) {
            const id = String(window.verificationTest.widgets.length);
            window.verificationTest.widgets.push(options);
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Verify visitor';
            button.onclick = () => options.callback('verified-' + id);
            element.append(button);
            options['before-interactive-callback']();
            return id;
          },
          remove() {
            document.querySelector('.chat-verification > div').replaceChildren();
          }
        };
      `,
      }),
  )
  await page.route('**/api/chat', (route) => {
    expect(route.request().postDataJSON().turnstileToken).toBe('verified-1')
    const events = [
      { type: 'start', messageId: 'verified-response' },
      { type: 'text-start', id: 'text' },
      {
        type: 'text-delta',
        id: 'text',
        delta: 'Ready to discuss your project.',
      },
      { type: 'text-end', id: 'text' },
      { type: 'finish', finishReason: 'stop' },
    ]
    return route.fulfill({
      headers: {
        'Content-Type': 'text/event-stream',
        'x-vercel-ai-ui-message-stream': 'v1',
      },
      body:
        events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('') +
        'data: [DONE]\n\n',
    })
  })
  await page.goto('/chat')
  const verification = page.locator('.chat-verification')
  const challenge = page.getByRole('button', { name: 'Verify visitor' })
  const composer = page.getByRole('textbox', { name: 'Message the assistant' })
  const send = page.getByRole('button', { name: 'Send', exact: true })
  await composer.fill('Tell me about your work')
  await expect(send).toBeDisabled()
  await challenge.click()
  await expect(verification).toBeHidden()
  await expect(send).toBeEnabled()
  // Keep the widget mounted so its expiration callbacks still work.
  await expect(verification.locator('button')).toHaveCount(1)
  await expect(composer).toBeVisible()
  await composer.fill('Tell me about your next project')

  await page.evaluate(() =>
    (window as unknown as VerificationWindow).verificationTest.widgets[0]![
      'expired-callback'
    ](),
  )
  await expect(verification).toBeVisible()
  await expect(send).toBeDisabled()
  await challenge.click()
  await expect(verification).toBeHidden()

  await page.evaluate(() =>
    (window as unknown as VerificationWindow).verificationTest.widgets[0]![
      'error-callback'
    ](),
  )
  await expect(verification.getByRole('alert')).toBeVisible()
  await expect(send).toBeDisabled()
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(verification.getByRole('alert')).toHaveCount(0)
  await challenge.click()
  await expect(verification).toBeHidden()
  await expect(send).toBeEnabled()
  // A removed widget must not replace the current token or reveal its panel.
  await page.evaluate(() =>
    (window as unknown as VerificationWindow).verificationTest.widgets[0]![
      'expired-callback'
    ](),
  )
  await expect(verification).toBeHidden()
  await expect(send).toBeEnabled()
  await send.click()
  await expect(page.getByText('Ready to discuss your project.')).toBeVisible()
  await expect(challenge).toBeVisible()
  await composer.fill('Another question')
  await expect(send).toBeDisabled()
  await challenge.click()
  await expect(verification).toBeHidden()
  await expect(send).toBeEnabled()
})
