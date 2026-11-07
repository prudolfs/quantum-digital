import { createFileRoute, useBlocker, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'
import { loadAdmin, setupOwner, initializeContent } from '@/server/admin'
import {
  ContentList,
  ContentEditor,
  SettingsEditor,
} from '@/components/admin-content'
import { Button } from '@/components/ui/button'
import { inboxFiltersSchema } from '../../shared/inquiry-admin'
import { BrandLink } from '@/components/brand-link'
import { AdminAccess } from '@/components/admin-access'
import { AdminInbox } from '@/components/admin-inbox'
import { AdminConfirm } from '@/components/admin-confirm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Route = createFileRoute('/admin')({
  validateSearch: inboxFiltersSchema.extend({
    section: z.enum(['inbox', 'work', 'services', 'settings']).catch('inbox'),
    edit: z.string().max(100).catch(''),
    token: z.string().min(1).max(256).optional().catch(undefined),
    error: z.literal('INVALID_TOKEN').optional().catch(undefined),
  }),
  loaderDeps: ({ search }) => ({
    status: search.status,
    from: search.from,
    to: search.to,
    cursor: search.cursor,
  }),
  loader: ({ deps }) => loadAdmin({ data: deps }),
  head: () => ({
    meta: [
      { title: 'Admin | Quantum Digital' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'referrer', content: 'no-referrer' },
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
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const showAccess = !data.signedIn || Boolean(search.token || search.error)
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    withResolver: true,
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

  async function signOut() {
    setBusy(true)
    setError('')
    try {
      const result = await authClient.signOut()
      if (result.error) throw new Error('Sign-out failed')
      setDirty(false)
      setConfirmSignOut(false)
      await router.invalidate({ sync: true })
    } catch {
      setError('Sign-out failed. Please retry.')
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
    <div className={showAccess ? 'admin-app admin-app--access' : 'admin-app'}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="admin-header">
        <BrandLink />
        {!showAccess && data.signedIn && (
          <div className="admin-account">
            <span>{data.workspace.ownerEmail}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => {
                if (dirty) setConfirmSignOut(true)
                else void signOut()
              }}
            >
              Sign out
            </Button>
          </div>
        )}
      </header>
      <Tabs
        value={search.section}
        className="contents"
        onValueChange={(section) =>
          void router.navigate({
            to: '/admin',
            search: {
              section: section as typeof search.section,
              status: 'all',
              edit: '',
            },
          })
        }
      >
        {!showAccess && data.signedIn && (
          <nav className="admin-navigation" aria-label="Admin sections">
            <TabsList aria-label="Admin sections" activateOnFocus={false}>
              {(['inbox', 'work', 'services', 'settings'] as const).map(
                (section) => (
                  <TabsTrigger key={section} value={section}>
                    {titles[section]}
                  </TabsTrigger>
                ),
              )}
            </TabsList>
          </nav>
        )}
        <main id="main-content" tabIndex={-1} className="admin-page">
          {!showAccess && (
            <>
              <h1 className="admin-title">{titles[search.section]}</h1>
            </>
          )}
          {!showAccess && error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {feedback && (
            <Alert role="status" className="mt-5">
              <AlertDescription>{feedback}</AlertDescription>
            </Alert>
          )}
          {showAccess ? (
            <AdminAccess
              setupAvailable={data.setupAvailable}
              unavailable={data.unavailable}
              busy={busy}
              error={error}
              token={search.token}
              invalidToken={search.error === 'INVALID_TOKEN'}
              onSignIn={signIn}
            />
          ) : data.signedIn ? (
            <TabsContent value={search.section}>
              {search.section === 'inbox' ? (
                <AdminInbox
                  key={`${search.status}:${search.from ?? ''}:${search.to ?? ''}`}
                  page={data.inquiries}
                  filters={search}
                />
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
                  const record = records.find(
                    (item) => item._id === search.edit,
                  )
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
            </TabsContent>
          ) : null}
        </main>
      </Tabs>
      <Toaster />
      <AdminConfirm
        open={blocker.status === 'blocked'}
        title="Discard unsaved changes?"
        description="Your changes haven’t been saved. Leave this page and discard them?"
        action="Discard changes"
        destructive
        onCancel={() => blocker.reset?.()}
        onConfirm={() => {
          setDirty(false)
          blocker.proceed?.()
        }}
      />
      <AdminConfirm
        open={confirmSignOut}
        title="Discard changes and sign out?"
        description="Your unsaved changes will be lost."
        action="Sign out"
        busy={busy}
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => void signOut()}
      />
    </div>
  )
}
