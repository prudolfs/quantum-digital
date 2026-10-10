import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'
import { loadInbox, changeInquiryStatus } from '@/server/admin'
import { Button } from '@/components/ui/button'
import { inquiryStatuses } from '../../shared/inquiry'

export const Route = createFileRoute('/admin')({
  validateSearch: z.object({
    status: z.enum(['all', 'new', 'contacted', 'closed']).catch('all'),
  }),
  loaderDeps: ({ search }) => ({ status: search.status }),
  loader: ({ deps }) => loadInbox({ data: deps }),
  head: () => ({
    meta: [
      { title: 'Inquiry inbox | Quantum Digital' },
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
  const [busy, setBusy] = useState(false)

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const result = await authClient.signIn.email({
        email: String(form.get('email')),
        password: String(form.get('password')),
      })
      if (result.error)
        throw new Error('Sign-in failed. Please check your details.')
      await router.invalidate()
    } catch {
      setError('Sign-in failed. Please check your details or try again later.')
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
      await router.invalidate()
    } catch {
      setError('The status wasn’t updated. Please retry.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-page">
      <p className="eyebrow">Private admin</p>
      <h1 className="section-title">Inquiry inbox</h1>
      {error && (
        <p className="feedback-error" role="alert">
          {error}
        </p>
      )}
      {!data.signedIn ? (
        <div className="admin-signin">
          <p className="body-copy">
            Sign in with your owner account. Public registration is disabled.
          </p>
          {data.unavailable && (
            <p className="feedback-error" role="status">
              Admin access is unavailable until the backend and owner account
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
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={12}
              maxLength={128}
            />
            <Button type="submit" disabled={busy || data.unavailable}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      ) : (
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
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await authClient.signOut()
                  await router.invalidate()
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
                      dateTime={new Date(inquiry._creationTime).toISOString()}
                    >
                      {new Date(inquiry._creationTime).toLocaleString('en-GB', {
                        timeZone: 'Europe/Riga',
                      })}{' '}
                      (Riga)
                    </time>
                  </div>
                  <a className="text-link" href={`mailto:${inquiry.email}`}>
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
                        event.target.value as (typeof inquiryStatuses)[number],
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
      )}
    </section>
  )
}
