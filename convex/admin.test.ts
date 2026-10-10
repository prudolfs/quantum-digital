// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import betterAuthTest from '@convex-dev/better-auth/test'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import schema from './schema'
import { api, components } from './_generated/api'
import { defaultContent } from '../shared/content-defaults'

const modules = import.meta.glob('./**/*.ts')
const setupKey = 'test-only-setup-key-with-over-32-characters'
const password = 'test-only-owner-password-123'
const setupInput = {
  email: 'owner@example.com',
  setupKey,
  password,
  confirmPassword: password,
}
function setup() {
  const t = convexTest(schema, modules)
  betterAuthTest.register(t)
  return t
}
async function ownerSession(
  t: ReturnType<typeof setup>,
  email = 'owner@example.com',
) {
  const user = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name: 'Owner',
        email,
        emailVerified: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  })
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'session',
      data: {
        userId: String(user._id),
        token: 'test-only-session',
        expiresAt: Date.now() + 3600_000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  })
  return t.withIdentity({
    subject: String(user._id),
    sessionId: String(session._id),
  })
}
beforeEach(() => {
  vi.stubEnv('ADMIN_OWNER_EMAIL', 'owner@example.com')
  vi.stubEnv('ADMIN_SETUP_KEY', setupKey)
  vi.stubEnv('SITE_URL', 'http://localhost:3000')
  vi.stubEnv(
    'BETTER_AUTH_SECRET',
    'test-only-auth-secret-with-over-32-characters',
  )
})
afterEach(() => vi.unstubAllEnvs())

it('requires the configured email, long key, and matching passwords without creating an account on failure', async () => {
  const t = setup()
  expect(await t.query(api.auth.setupStatus, {})).toMatchObject({
    setupAvailable: true,
    ownerExists: false,
  })
  for (const input of [
    { ...setupInput, setupKey: 'wrong-key-with-more-than-32-characters' },
    { ...setupInput, email: 'stranger@example.com' },
    { ...setupInput, confirmPassword: 'different-password-123' },
    { ...setupInput, password: 'short', confirmPassword: 'short' },
  ]) {
    await expect(t.mutation(api.auth.setupOwner, input)).rejects.toThrow()
    expect(
      await t.query(components.betterAuth.adapter.findOne, { model: 'user' }),
    ).toBeNull()
  }
  vi.stubEnv('ADMIN_SETUP_KEY', 'short')
  expect(await t.query(api.auth.setupStatus, {})).toMatchObject({
    setupAvailable: false,
  })
  await expect(t.mutation(api.auth.setupOwner, setupInput)).rejects.toThrow()
})

it('creates the owner once, hashes the password, and permits ordinary password sign-in with a session cookie', async () => {
  const t = setup()
  expect(
    await t.mutation(api.auth.setupOwner, {
      ...setupInput,
      email: 'OWNER@example.com',
    }),
  ).toEqual({ created: true })
  expect(await t.query(api.auth.setupStatus, {})).toMatchObject({
    setupAvailable: false,
    ownerExists: true,
  })
  await expect(t.mutation(api.auth.setupOwner, setupInput)).rejects.toThrow(
    'already complete',
  )
  const user = await t.query(components.betterAuth.adapter.findOne, {
    model: 'user',
  })
  expect(user).toMatchObject({
    email: 'owner@example.com',
    emailVerified: true,
  })
  const account = await t.query(components.betterAuth.adapter.findOne, {
    model: 'account',
  })
  expect(account?.password).toBeTruthy()
  expect(account?.password).not.toBe(password)
  const response = await t.fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
    },
    body: JSON.stringify({ email: setupInput.email, password }),
  })
  expect(response.status).toBe(200)
  expect(response.headers.get('set-cookie')).toContain('session_token')
  const wrong = await t.fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
    },
    body: JSON.stringify({
      email: setupInput.email,
      password: 'incorrect-password-123',
    }),
  })
  expect(wrong.ok).toBe(false)
  vi.stubEnv('ADMIN_SETUP_KEY', 'changed-key-still-over-32-characters')
  vi.stubEnv('ADMIN_OWNER_EMAIL', 'different@example.com')
  expect(await t.query(api.auth.setupStatus, {})).toMatchObject({
    setupAvailable: false,
  })
})

it('rejects public registration even before setup and never reopens setup for an existing account', async () => {
  const t = setup()
  const response = await t.fetch('/api/auth/sign-up/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
    },
    body: JSON.stringify({ name: 'Owner', email: setupInput.email, password }),
  })
  expect(response.ok).toBe(false)
  await ownerSession(t)
  expect(await t.query(api.auth.setupStatus, {})).toMatchObject({
    setupAvailable: false,
    ownerExists: true,
  })
  await expect(t.mutation(api.auth.setupOwner, setupInput)).rejects.toThrow(
    'already complete',
  )
})

it('guards the entire workspace and mutations with owner authorization', async () => {
  const t = setup()
  await expect(t.query(api.content.workspace, {})).rejects.toThrow(
    'Unauthorized',
  )
  await expect(t.mutation(api.content.initialize, {})).rejects.toThrow(
    'Unauthorized',
  )
  const stranger = await ownerSession(t, 'stranger@example.com')
  await expect(stranger.mutation(api.content.initialize, {})).rejects.toThrow(
    'Unauthorized',
  )
  await expect(
    t.mutation(api.content.saveCaseStudy, {
      content: defaultContent.caseStudies[0],
      sortOrder: 0,
    }),
  ).rejects.toThrow('Unauthorized')
  await expect(
    t.mutation(api.content.saveService, {
      content: defaultContent.services[0],
      sortOrder: 0,
    }),
  ).rejects.toThrow('Unauthorized')
  await expect(
    t.mutation(api.content.saveSettings, {
      expectedVersion: 1,
      content: defaultContent.settings,
    }),
  ).rejects.toThrow('Unauthorized')
  await expect(
    t.mutation(api.content.publishSettings, { expectedVersion: 1 }),
  ).rejects.toThrow('Unauthorized')
})

it('imports approved content once and keeps draft edits private until publication', async () => {
  const t = setup(),
    owner = await ownerSession(t)
  expect(await t.query(api.content.published, {})).toBeNull()
  await expect(
    owner.mutation(api.content.saveService, {
      content: defaultContent.services[0],
      sortOrder: 0,
    }),
  ).rejects.toThrow('Import')
  await owner.mutation(api.content.initialize, {})
  await owner.mutation(api.content.initialize, {})
  expect(await t.query(api.content.published, {})).toEqual(defaultContent)
  const workspace = await owner.query(api.content.workspace, {})
  const record = workspace.caseStudies[0]
  const content = {
    ...record.draft,
    title: 'Private draft title',
    slug: 'updated-care-coordination',
  }
  await owner.mutation(api.content.saveCaseStudy, {
    id: record._id,
    expectedVersion: 1,
    content,
    sortOrder: 99,
  })
  expect((await t.query(api.content.published, {}))?.caseStudies[0]).toEqual(
    record.draft,
  )
  await expect(
    owner.mutation(api.content.saveCaseStudy, {
      id: record._id,
      expectedVersion: 1,
      content,
      sortOrder: 0,
    }),
  ).rejects.toThrow('changed elsewhere')
  await expect(
    owner.mutation(api.content.setCaseStudyPublication, {
      id: record._id,
      expectedVersion: 1,
      publish: true,
    }),
  ).rejects.toThrow('changed elsewhere')
  await owner.mutation(api.content.setCaseStudyPublication, {
    id: record._id,
    expectedVersion: 2,
    publish: true,
  })
  const published = (await t.query(api.content.published, {}))!
  expect(published.caseStudies.at(-1)).toEqual(content)
  expect(
    published.caseStudies.some((item) => item.slug === record.draft.slug),
  ).toBe(false)
  await owner.mutation(api.content.setCaseStudyPublication, {
    id: record._id,
    expectedVersion: 3,
    publish: false,
  })
  expect(
    (await t.query(api.content.published, {}))?.caseStudies.some(
      (item) => item.slug === content.slug,
    ),
  ).toBe(false)
  expect(
    (await owner.query(api.content.workspace, {})).caseStudies.find(
      (item) => item._id === record._id,
    )?.draft,
  ).toEqual(content)
})

it('keeps new records private, validates slugs and HTTPS links, and protects published slug uniqueness', async () => {
  const t = setup(),
    owner = await ownerSession(t)
  await owner.mutation(api.content.initialize, {})
  for (const content of [
    { ...defaultContent.caseStudies[0], slug: 'Invalid Slug' },
    {
      ...defaultContent.caseStudies[0],
      slug: 'new-case',
      repositoryUrl: 'javascript:alert(1)',
    },
    { ...defaultContent.caseStudies[0], slug: 'new-case', title: '' },
  ])
    await expect(
      owner.mutation(api.content.saveCaseStudy, { content, sortOrder: 0 }),
    ).rejects.toThrow('Check')
  await expect(
    owner.mutation(api.content.saveCaseStudy, {
      content: defaultContent.caseStudies[0],
      sortOrder: 0,
    }),
  ).rejects.toThrow('already used')
  const id = await owner.mutation(api.content.saveCaseStudy, {
    content: { ...defaultContent.caseStudies[0], slug: 'new-case' },
    sortOrder: 0,
  })
  expect((await t.query(api.content.published, {}))?.caseStudies).toHaveLength(
    6,
  )
  await expect(
    t.mutation(api.content.setCaseStudyPublication, {
      id,
      expectedVersion: 1,
      publish: true,
    }),
  ).rejects.toThrow('Unauthorized')
  await owner.mutation(api.content.setCaseStudyPublication, {
    id,
    expectedVersion: 1,
    publish: true,
  })
  expect((await t.query(api.content.published, {}))?.caseStudies).toHaveLength(
    7,
  )
  const old = (await owner.query(api.content.workspace, {})).caseStudies.find(
    (item) => item.draft.slug === defaultContent.caseStudies[0].slug,
  )!
  await owner.mutation(api.content.saveCaseStudy, {
    id: old._id,
    expectedVersion: old.version,
    content: { ...old.draft, slug: 'renamed-draft' },
    sortOrder: 1,
  })
  const duplicate = await owner.mutation(api.content.saveCaseStudy, {
    content: old.draft,
    sortOrder: 0,
  })
  await expect(
    owner.mutation(api.content.setCaseStudyPublication, {
      id: duplicate,
      expectedVersion: 1,
      publish: true,
    }),
  ).rejects.toThrow('public slug')
})

it('publishes services and settings explicitly and preserves truly empty published collections', async () => {
  const t = setup(),
    owner = await ownerSession(t)
  await owner.mutation(api.content.initialize, {})
  const workspace = await owner.query(api.content.workspace, {})
  const service = workspace.services[0]
  const updated = {
    ...service.draft,
    title: 'New service title',
    art: 'ai' as const,
  }
  await owner.mutation(api.content.saveService, {
    id: service._id,
    expectedVersion: 1,
    content: updated,
    sortOrder: 0,
  })
  expect((await t.query(api.content.published, {}))?.services[0]).toEqual(
    service.draft,
  )
  await expect(
    t.mutation(api.content.setServicePublication, {
      id: service._id,
      expectedVersion: 2,
      publish: true,
    }),
  ).rejects.toThrow('Unauthorized')
  await owner.mutation(api.content.setServicePublication, {
    id: service._id,
    expectedVersion: 2,
    publish: true,
  })
  expect((await t.query(api.content.published, {}))?.services[0]).toEqual(
    updated,
  )
  const settings = {
    ...workspace.settings!.draft,
    heroDescription: 'New public hero description',
    contactEmail: 'contact@example.com',
    questions: [{ question: 'New question?', answer: 'New answer.' }],
  }
  await owner.mutation(api.content.saveSettings, {
    expectedVersion: 1,
    content: settings,
  })
  expect((await t.query(api.content.published, {}))?.settings).toEqual(
    defaultContent.settings,
  )
  await expect(
    owner.mutation(api.content.publishSettings, { expectedVersion: 1 }),
  ).rejects.toThrow('changed elsewhere')
  await owner.mutation(api.content.publishSettings, { expectedVersion: 2 })
  expect((await t.query(api.content.published, {}))?.settings).toEqual(settings)
  for (const record of (await owner.query(api.content.workspace, {}))
    .caseStudies)
    await owner.mutation(api.content.setCaseStudyPublication, {
      id: record._id,
      expectedVersion: record.version,
      publish: false,
    })
  for (const record of (await owner.query(api.content.workspace, {})).services)
    await owner.mutation(api.content.setServicePublication, {
      id: record._id,
      expectedVersion: record.version,
      publish: false,
    })
  expect(await t.query(api.content.published, {})).toEqual({
    caseStudies: [],
    services: [],
    settings,
  })
})

it('limits repeated password attempts when the Cloudflare client-IP header is present', async () => {
  const t = setup()
  await t.mutation(api.auth.setupOwner, setupInput)
  for (let i = 0; i < 25; i++) {
    const session = await t.fetch('/api/auth/get-session', {
      headers: { 'cf-connecting-ip': '192.0.2.20' },
    })
    expect(session.status).toBe(200)
  }
  const attempt = () =>
    t.fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        'cf-connecting-ip': '192.0.2.20',
      },
      body: JSON.stringify({
        email: setupInput.email,
        password: 'incorrect-password-123',
      }),
    })
  for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401)
  expect((await attempt()).status).toBe(429)
})
