// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import betterAuthTest from '@convex-dev/better-auth/test'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import schema from './schema'
import { api, components } from './_generated/api'

const modules = import.meta.glob('./**/*.ts')
const email = 'owner@example.com'
const password = 'test-only-original-password'
const newPassword = 'test-only-replacement-password'
const headers = {
  'Content-Type': 'application/json',
  Origin: 'http://localhost:3000',
}
let mail: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubEnv('ADMIN_OWNER_EMAIL', email)
  vi.stubEnv('ADMIN_SETUP_KEY', 'test-only-setup-key-over-32-characters')
  vi.stubEnv('SITE_URL', 'http://localhost:3000')
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-only-auth-secret-over-32-characters')
  vi.stubEnv('RESEND_API_KEY', 're_test_only')
  vi.stubEnv('ADMIN_EMAIL_FROM', 'Quantum Digital <admin@example.com>')
  vi.stubEnv('ADMIN_PASSWORD_RESET_EMAIL', email)
  mail = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ id: 'test-mail' })))
  vi.stubGlobal('fetch', mail)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

async function setup() {
  const t = convexTest(schema, modules)
  betterAuthTest.register(t)
  await t.mutation(api.auth.setupOwner, {
    email,
    password,
    confirmPassword: password,
    setupKey: 'test-only-setup-key-over-32-characters',
  })
  return t
}

function post(
  t: Awaited<ReturnType<typeof setup>>,
  path: string,
  body: object,
) {
  return t.fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

async function requestLink(t: Awaited<ReturnType<typeof setup>>) {
  const response = await post(t, 'request-password-reset', {
    email,
    redirectTo: 'http://localhost:3000/admin',
  })
  expect(response.status).toBe(200)
  const payload = JSON.parse(mail.mock.calls.at(-1)![1].body)
  expect(payload.to).toEqual([email])
  expect(payload.from).toBe('Quantum Digital <admin@example.com>')
  const url = new URL(payload.text.match(/http:\/\/\S+/)[0])
  const token = url.pathname.split('/').at(-1)!
  return { token, url }
}

it('emails a single-use reset link, changes the password, and revokes existing sessions', async () => {
  const t = await setup()
  expect((await post(t, 'sign-in/email', { email, password })).ok).toBe(true)
  expect(
    await t.query(components.betterAuth.adapter.findOne, { model: 'session' }),
  ).not.toBeNull()
  const { token, url } = await requestLink(t)
  expect(mail.mock.calls[0][0]).toBe('https://api.resend.com/emails')
  const redirect = await t.fetch(`${url.pathname}${url.search}`)
  expect(redirect.status).toBe(302)
  expect(redirect.headers.get('location')).toContain(`/admin?token=${token}`)
  expect(
    (await post(t, 'reset-password', { token, newPassword: 'short' })).ok,
  ).toBe(false)
  expect((await post(t, 'reset-password', { token, newPassword })).ok).toBe(
    true,
  )
  expect(
    await t.query(components.betterAuth.adapter.findOne, { model: 'session' }),
  ).toBeNull()
  expect(
    (await post(t, 'reset-password', { token, newPassword: password })).ok,
  ).toBe(false)
  expect((await post(t, 'sign-in/email', { email, password })).ok).toBe(false)
  expect(
    (await post(t, 'sign-in/email', { email, password: newPassword })).ok,
  ).toBe(true)
})

it('rejects expired tokens and off-site callbacks without changing the password', async () => {
  const t = await setup()
  expect(
    (
      await post(t, 'request-password-reset', {
        email,
        redirectTo: 'https://other.example/reset',
      })
    ).ok,
  ).toBe(false)
  expect(mail).not.toHaveBeenCalled()
  const { token } = await requestLink(t)
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'verification',
      where: [{ field: 'identifier', value: `reset-password:${token}` }],
      update: { expiresAt: Date.now() - 1000 },
    },
  })
  expect((await post(t, 'reset-password', { token, newPassword })).ok).toBe(
    false,
  )
  expect((await post(t, 'sign-in/email', { email, password })).ok).toBe(true)
})

it('returns a generic response for an unknown email without sending mail', async () => {
  const t = await setup()
  const unknown = await post(t, 'request-password-reset', {
    email: 'stranger@example.com',
    redirectTo: 'http://localhost:3000/admin',
  })
  expect(unknown.status).toBe(200)
  expect(mail).not.toHaveBeenCalled()
  await requestLink(t)
  const known = await post(t, 'request-password-reset', {
    email,
    redirectTo: 'http://localhost:3000/admin',
  })
  expect(await unknown.json()).toEqual(await known.json())
})

it('fails safely when email delivery is unavailable', async () => {
  const t = await setup()
  mail.mockResolvedValue(new Response('provider unavailable', { status: 503 }))
  // Better Auth deliberately keeps the response generic on provider failure.
  expect((await post(t, 'request-password-reset', { email })).status).toBe(200)
  expect((await post(t, 'sign-in/email', { email, password })).ok).toBe(true)
  vi.stubEnv('RESEND_API_KEY', '')
  expect((await post(t, 'request-password-reset', { email })).ok).toBe(false)
})

it('sends recovery to the configured mailbox while preserving the owner login', async () => {
  const t = await setup()
  vi.stubEnv('ADMIN_PASSWORD_RESET_EMAIL', 'recovery@example.com')
  const response = await post(t, 'request-password-reset', {
    email,
    redirectTo: 'http://localhost:3000/admin',
    recipient: 'attacker@example.com',
  })
  expect(response.ok).toBe(true)
  const payload = JSON.parse(mail.mock.calls.at(-1)![1].body)
  expect(payload.to).toEqual(['recovery@example.com'])
  const url = new URL(payload.text.match(/http:\/\/\S+/)[0])
  const token = url.pathname.split('/').at(-1)!
  expect((await post(t, 'reset-password', { token, newPassword })).ok).toBe(
    true,
  )
  expect(
    (await post(t, 'sign-in/email', { email, password: newPassword })).ok,
  ).toBe(true)
  expect(
    (
      await post(t, 'sign-in/email', {
        email: 'recovery@example.com',
        password: newPassword,
      })
    ).ok,
  ).toBe(false)
  expect(
    await t.query(components.betterAuth.adapter.findOne, { model: 'user' }),
  ).toMatchObject({ email })
  mail.mockClear()
  expect(
    (await post(t, 'request-password-reset', { email: 'recovery@example.com' }))
      .ok,
  ).toBe(true)
  expect(mail).not.toHaveBeenCalled()
})
