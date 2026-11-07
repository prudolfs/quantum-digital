import { test, expect, type APIRequestContext } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { ConvexHttpClient } from 'convex/browser'
import { parseEnv } from 'node:util'
import { readFileSync } from 'node:fs'
import { api, internal } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import type {
  FunctionReference,
  FunctionArgs,
  FunctionReturnType,
} from 'convex/server'

test.skip(
  process.env.ADMIN_E2E_ISOLATED !== '1',
  'Disposable local Convex backend only.',
)
test.describe.configure({ mode: 'serial' })
let owner: ConvexHttpClient
let storageState: Awaited<ReturnType<APIRequestContext['storageState']>>
// The local fixture's admin credential may invoke internal seeding mutations.
type LocalAdmin = Omit<ConvexHttpClient, 'mutation'> & {
  setAdminAuth(key: string): void
  mutation<F extends FunctionReference<'mutation', 'public' | 'internal'>>(
    reference: F,
    args: FunctionArgs<F>,
  ): Promise<FunctionReturnType<F>>
}
const ids: Id<'inquiries'>[] = []
const fullBrief =
  'We need an operations workspace to coordinate requests across our warehouses, integrate the existing ERP, and remove manual spreadsheet updates. The first phase should cover inventory visibility, approvals, audit history, and a reliable import path. Keep the existing reporting process intact.'
const summary = {
  overview:
    'A warehouse team needs a shared operations workspace connected to its ERP.',
  requirements: ['Inventory visibility', 'Approval workflow and audit history'],
  constraints: ['Keep the existing ERP and reporting process'],
  nextSteps: ['Review the current workflow together'],
  openQuestions: ['Which ERP version is in use?'],
}

const dateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

test.beforeAll(async ({ request }) => {
  ids.length = 0
  const config = parseEnv(readFileSync('.env.inbox-e2e.local', 'utf8'))
  if (
    config.CONVEX_SELF_HOSTED_URL !== 'http://127.0.0.1:3310' ||
    !config.CONVEX_SELF_HOSTED_ADMIN_KEY
  )
    throw new Error('Use the disposable local backend.')
  const admin = new ConvexHttpClient(
    config.CONVEX_SELF_HOSTED_URL,
  ) as unknown as LocalAdmin
  admin.setAdminAuth(config.CONVEX_SELF_HOSTED_ADMIN_KEY)
  const status = await admin.query(api.auth.setupStatus, {})
  if (status.setupAvailable)
    await admin.mutation(api.auth.setupOwner, {
      email: 'owner@example.com',
      password: 'test-only-owner-password-123',
      confirmPassword: 'test-only-owner-password-123',
      setupKey: 'test-only-setup-key-with-over-32-characters',
    })
  const login = await request.post('/api/auth/sign-in/email', {
    headers: { Origin: 'http://127.0.0.1:3036' },
    data: {
      email: 'owner@example.com',
      password: 'test-only-owner-password-123',
    },
  })
  expect(login.ok()).toBe(true)
  storageState = await request.storageState()
  const token = await request.get('/api/auth/convex/token')
  owner = new ConvexHttpClient(config.CONVEX_SELF_HOSTED_URL)
  owner.setAuth((await token.json()).token)
  const names = [
    'Alex Reed',
    'Maya Patel',
    'Jonas Berg',
    'Sara Nilsson',
    'Tom Anders',
    'Nina Lewis',
    'Leo Martin',
    'Amelia Clark',
    'Oliver Grant',
    'Emma Wilson',
    'Liam Walker',
    'Sofia Evans',
    'Noah Harris',
    'Isla Carter',
    'Ben Collins',
    'Elena Martins',
  ]
  const run = crypto.randomUUID()
  for (const [index, name] of names.entries()) {
    const sessionHash = `inbox-e2e-${run}-${index}`
    const first = {
      id: `user-${index}`,
      role: 'user',
      parts: [{ type: 'text', text: fullBrief }],
    }
    const begun = await admin.mutation(internal.conversations.begin, {
      sessionHash,
      revision: 0,
      messages: JSON.stringify([first]),
    })
    await admin.mutation(internal.conversations.finish, {
      sessionHash,
      revision: begun.revision,
      message: JSON.stringify({
        id: `assistant-${index}`,
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'We discussed an ERP integration and a short workflow review. The exact ERP version is still unknown.',
          },
        ],
      }),
    })
    const draft = await admin.mutation(internal.inquiries.prepare, {
      sessionHash,
      details: {
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
        summary: fullBrief,
        timing: 'Next quarter',
        budget: 'EUR 10,000–20,000',
      },
    })
    const { inquiryId } = await admin.mutation(internal.inquiries.confirm, {
      sessionHash,
      draftId: draft.draftId,
    })
    ids.push(inquiryId)
    await owner.mutation(api.inquiries.updateStatus, {
      inquiryId,
      status: (['new', 'contacted', 'closed'] as const)[index % 3],
    })
  }
  await owner.mutation(api.inquiries.beginSummary, {
    inquiryId: ids.at(-1)!,
    requestId: 'e2e-summary',
  })
  await owner.mutation(api.inquiries.finishSummary, {
    inquiryId: ids.at(-1)!,
    requestId: 'e2e-summary',
    model: 'test-model',
    summary,
  })
})

test.afterAll(async () => {
  for (const inquiryId of ids)
    await owner
      ?.mutation(api.inquiries.remove, { inquiryId })
      .catch(() => undefined)
})

test.beforeEach(async ({ page }) => {
  await page.context().addCookies(storageState.cookies)
  await page.goto('/admin')
  await expect(
    page.getByRole('heading', { name: 'Inquiry inbox', exact: true }),
  ).toBeVisible()
})

test('paginates compact cards, shows full details and saved summaries, and updates status', async ({
  page,
}, info) => {
  await expect(page.getByTestId('inquiry-card')).toHaveCount(12)
  await expect(
    page.getByRole('button', { name: 'Previous', exact: true }),
  ).toBeDisabled()
  await expect(page.getByTestId('inquiry-card').first()).not.toContainText(
    'Keep the existing reporting process intact',
  )
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({ path: info.outputPath('inbox.png'), fullPage: true })
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByTestId('inquiry-card')).toHaveCount(4)
  await page.getByRole('button', { name: 'Previous', exact: true }).click()
  await expect(page.getByTestId('inquiry-card')).toHaveCount(12)
  await page
    .getByTestId('inquiry-card')
    .first()
    .getByRole('button', { name: 'View inquiry' })
    .click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(fullBrief, { exact: true })).toBeVisible()
  await expect(
    dialog.getByText(summary.overview, { exact: true }),
  ).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: info.outputPath('inquiry-details.png'),
    fullPage: false,
  })
  await dialog.getByRole('tab', { name: 'Conversation (2)' }).click()
  await expect(
    dialog.getByText('We discussed an ERP integration', { exact: false }),
  ).toBeVisible()
  await dialog.getByRole('tab', { name: 'Inquiry', exact: true }).click()
  await dialog.getByRole('combobox', { name: 'Inquiry status' }).click()
  await page.getByRole('option', { name: 'Contacted', exact: true }).click()
  await expect(page.getByText('Status updated.', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Filter inquiries by status' })
    .click()
  await page.getByRole('option', { name: 'Contacted', exact: true }).click()
  await expect(page.getByTestId('inquiry-card')).toHaveCount(6)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})

test('filters by calendar dates and supports cancelling and confirming deletion', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Filter by date: Any date' }).click()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const to = new Date(now.getFullYear(), now.getMonth() - 1, 2)
  await page.getByRole('button', { name: /previous month/i }).click()
  await page
    .locator(`button[data-day="${from.toLocaleDateString('en-US')}"]`)
    .click()
  await page
    .locator(`button[data-day="${to.toLocaleDateString('en-US')}"]`)
    .click()
  await page.getByRole('button', { name: 'Apply dates' }).click()
  await expect(page.getByText('No inquiries match these filters')).toBeVisible()
  expect(new URL(page.url()).searchParams.get('from')).toBe(dateString(from))
  expect(new URL(page.url()).searchParams.get('to')).toBe(dateString(to))
  await page.getByRole('button', { name: 'Clear filters' }).click()
  const card = page.getByTestId('inquiry-card').first()
  const title = await card.locator('h2').innerText()
  await card
    .getByRole('button', { name: `Delete inquiry from ${title}` })
    .click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Cancel', exact: true })
    .click()
  await expect(
    page.getByTestId('inquiry-card').first().locator('h2'),
  ).toHaveText(title)
  await card
    .getByRole('button', { name: `Delete inquiry from ${title}` })
    .click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete inquiry', exact: true })
    .click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(
    page.getByText('Inquiry deleted.', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: title, exact: true }),
  ).toHaveCount(0)
  await expect(
    owner.query(api.inquiries.detail, { inquiryId: ids.at(-1)! }),
  ).rejects.toThrow('not found')
})

test('offers summary generation and preserves inquiry details when the provider is unavailable', async ({
  page,
}) => {
  await page
    .getByTestId('inquiry-card')
    .first()
    .getByRole('button', { name: 'View inquiry' })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Generate summary' }).click()
  await expect(
    page.getByText(
      'The conversation summary couldn’t be generated. Please try again.',
      { exact: true },
    ),
  ).toBeVisible()
  await expect(dialog.getByText(fullBrief, { exact: true })).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: 'Generate summary' }),
  ).toBeEnabled()
})

test('keyboard users can dismiss a nested select before closing the inquiry and return to its card', async ({
  page,
}) => {
  const open = page
    .getByTestId('inquiry-card')
    .first()
    .getByRole('button', { name: 'View inquiry' })
  await open.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  const status = dialog.getByRole('combobox', { name: 'Inquiry status' })
  await status.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expect(dialog).toBeVisible()
  await expect(status).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(open).toBeFocused()
})
