import {
  createFileRoute,
  Link,
  useBlocker,
  useRouter,
} from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'
import {
  loadAdmin,
  setupOwner,
  initializeContent,
  changeInquiryStatus,
} from '@/server/admin'
import {
  ContentList,
  ContentEditor,
  SettingsEditor,
} from '@/components/admin-content'
import { Button } from '@/components/ui/button'
import { inquiryStatuses } from '../../shared/inquiry'

export const Route = createFileRoute('/admin')({
  validateSearch: z.object({
    status: z.enum(['all', 'new', 'contacted', 'closed']).catch('all'),
    section: z.enum(['inbox', 'work', 'services', 'settings']).catch('inbox'),
    edit: z.string().max(100).catch(''),
  }),
  loaderDeps: ({ search }) => ({ status: search.status }),
  loader: ({ deps }) => loadAdmin({ data: deps }),
  head: () => ({
    meta: [
      { title: 'Admin | Quantum Digital' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminPage,
})

function AdminPage() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  useBlocker({
    shouldBlockFn: () => {
      if (!dirty) return false
      if (!window.confirm('Discard your unsaved changes?')) return true
      setDirty(false)
      return false
    },
    enableBeforeUnload: dirty,
  })

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    let created = false
    try {
      const email = String(form.get('email'))
      const password = String(form.get('password'))
      if (!data.signedIn && data.setupAvailable) {
        await setupOwner({
          data: {
            email,
            password,
            confirmPassword: String(form.get('confirmPassword')),
            setupKey: String(form.get('setupKey')),
          },
        })
        created = true
      }
      const result = await authClient.signIn.email({ email, password })
      if (result.error) throw new Error('Sign-in failed')
      await router.invalidate({ sync: true })
    } catch {
      if (created) {
        setError(
          'Your account was created. Sign in with the email and password you just chose.',
        )
        await router.invalidate({ sync: true })
      } else
        setError(
          !data.signedIn && data.setupAvailable
            ? 'Setup failed. Check the configured email, setup key, and matching passwords (at least 12 characters).'
            : 'Sign-in failed. Please check your details or try again later.',
        )
    } finally {
      setBusy(false)
    }
  }

  async function update(
    inquiryId: string,
    status: (typeof inquiryStatuses)[number],
  ) {
    setBusy(true)
    setError('')
    try {
      await changeInquiryStatus({ data: { inquiryId, status } })
      await router.invalidate({ sync: true })
    } catch {
      setError('The status wasn’t updated. Please retry.')
    } finally {
      setBusy(false)
    }
  }

  async function initialize() {
    setBusy(true)
    setError('')
    try {
      await initializeContent()
      setFeedback(
        'Current content imported. You can now save drafts and publish changes.',
      )
      await router.invalidate({ sync: true })
    } catch {
      setError('Content wasn’t imported. Please retry.')
    } finally {
      setBusy(false)
    }
  }

  const titles = {
    inbox: 'Inquiry inbox',
    work: 'Selected work',
    services: 'Services',
    settings: 'Site settings',
  }
  return (
    <div className="admin-app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="admin-header">
        <Link to="/" className="brand-link">
          Quantum<span>Digital</span>
        </Link>
        {data.signedIn && (
          <div className="admin-account">
            <span>{data.workspace.ownerEmail}</span>
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                if (
                  dirty &&
                  !window.confirm('Discard your unsaved changes and sign out?')
                )
                  return
                setBusy(true)
                setError('')
                try {
                  const result = await authClient.signOut()
                  if (result.error) throw new Error('Sign-out failed')
                  setDirty(false)
                  await router.invalidate({ sync: true })
                } catch {
                  setError('Sign-out failed. Please retry.')
                } finally {
                  setBusy(false)
                }
              }}
            >
              Sign out
            </Button>
          </div>
        )}
      </header>
      {data.signedIn && (
        <nav className="admin-navigation" aria-label="Admin sections">
          {(['inbox', 'work', 'services', 'settings'] as const).map(
            (section) => (
              <Link
                key={section}
                to="/admin"
                search={{ section, status: 'all', edit: '' }}
                aria-current={search.section === section ? 'page' : undefined}
              >
                {titles[section]}
              </Link>
            ),
          )}
        </nav>
      )}
      <main id="main-content" tabIndex={-1} className="admin-page">
        <p className="eyebrow">Private admin</p>
        <h1 className="section-title">
          {data.signedIn
            ? titles[search.section]
            : data.setupAvailable
              ? 'Set up your owner account'
              : 'Inquiry inbox'}
        </h1>
        {error && (
          <p className="feedback-error" role="alert">
            {error}
          </p>
        )}
        {feedback && (
          <p className="admin-feedback" role="status">
            {feedback}
          </p>
        )}
        {!data.signedIn ? (
          <div className="admin-signin">
            <p className="body-copy">
              {data.setupAvailable
                ? 'Use the owner email and one-time setup key configured in Convex. Choose your password below. No email will be sent.'
                : 'Sign in with your owner account. Public registration is disabled.'}
            </p>
            {data.unavailable && (
              <p className="feedback-error" role="status">
                Admin access is unavailable until the backend and owner setup
                are configured.
              </p>
            )}
            <form onSubmit={signIn}>
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
              />
              {data.setupAvailable && (
                <>
                  <label htmlFor="admin-key">One-time setup key</label>
                  <input
                    id="admin-key"
                    name="setupKey"
                    type="password"
                    autoComplete="off"
                    required
                    minLength={32}
                    maxLength={256}
                  />
                </>
              )}
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete={
                  data.setupAvailable ? 'new-password' : 'current-password'
                }
                required
                minLength={12}
                maxLength={128}
              />
              {data.setupAvailable && (
                <>
                  <label htmlFor="admin-confirm">Confirm password</label>
                  <input
                    id="admin-confirm"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                  />
                </>
              )}
              <Button type="submit" disabled={busy || data.unavailable}>
                {busy
                  ? 'Please wait…'
                  : data.setupAvailable
                    ? 'Create owner account'
                    : 'Sign in'}
              </Button>
            </form>
          </div>
        ) : (
          <>
            {search.section === 'inbox' ? (
              <>
                <div className="inbox-toolbar">
                  <label htmlFor="inbox-status">Show inquiries</label>
                  <select
                    id="inbox-status"
                    value={search.status}
                    onChange={(event) =>
                      router.navigate({
                        to: '/admin',
                        search: {
                          ...search,
                          status: event.target.value as typeof search.status,
                        },
                      })
                    }
                  >
                    <option value="all">All</option>
                    {inquiryStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="chat-note">
                  Most recent 100 matching inquiries. Submitted through chat.
                </p>
                {data.inquiries.length === 0 ? (
                  <p className="body-copy inbox-empty">No inquiries yet.</p>
                ) : (
                  <div className="inquiry-list">
                    {data.inquiries.map((inquiry) => (
                      <article key={inquiry._id} className="inquiry-card">
                        <div className="inquiry-card__heading">
                          <h2>{inquiry.name}</h2>
                          <time
                            dateTime={new Date(
                              inquiry._creationTime,
                            ).toISOString()}
                          >
                            {new Date(inquiry._creationTime).toLocaleString(
                              'en-GB',
                              {
                                timeZone: 'Europe/Riga',
                              },
                            )}{' '}
                            (Riga)
                          </time>
                        </div>
                        <a
                          className="text-link"
                          href={`mailto:${inquiry.email}`}
                        >
                          {inquiry.email}
                        </a>
                        <p className="inquiry-summary">{inquiry.summary}</p>
                        {inquiry.timing && <p>Timing: {inquiry.timing}</p>}
                        {inquiry.budget && <p>Budget: {inquiry.budget}</p>}
                        <label htmlFor={`status-${inquiry._id}`}>Status</label>
                        <select
                          id={`status-${inquiry._id}`}
                          value={inquiry.status}
                          disabled={busy}
                          onChange={(event) =>
                            void update(
                              inquiry._id,
                              event.target
                                .value as (typeof inquiryStatuses)[number],
                            )
                          }
                        >
                          {inquiryStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : !data.workspace.initialized ? (
              <div className="admin-empty">
                <p>
                  Import the current approved content to start editing. The
                  website will keep the same published content.
                </p>
                <Button disabled={busy} onClick={() => void initialize()}>
                  {busy ? 'Importing…' : 'Import current content'}
                </Button>
              </div>
            ) : search.section === 'settings' ? (
              data.workspace.settings && (
                <SettingsEditor
                  key={data.workspace.settings.version}
                  record={data.workspace.settings}
                  dirty={dirty}
                  onDirtyChange={setDirty}
                  onFeedback={setFeedback}
                />
              )
            ) : (
              (() => {
                const kind = search.section
                const records =
                  kind === 'work'
                    ? data.workspace.caseStudies
                    : data.workspace.services
                const record = records.find((item) => item._id === search.edit)
                if (!search.edit)
                  return <ContentList kind={kind} records={records} />
                if (search.edit !== 'new' && !record)
                  return (
                    <p className="admin-empty">
                      Record not found. Choose a record from the list.
                    </p>
                  )
                return (
                  <ContentEditor
                    key={`${kind}:${search.edit}:${record?.version ?? 0}`}
                    kind={kind}
                    record={record}
                    dirty={dirty}
                    onDirtyChange={setDirty}
                    onFeedback={setFeedback}
                  />
                )
              })()
            )}
          </>
        )}
      </main>
    </div>
  )
}
