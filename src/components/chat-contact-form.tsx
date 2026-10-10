import { useState, type FormEvent } from 'react'
import type { z } from 'zod'
import { contactFormSchema, preparedInquirySchema } from '../../shared/chat'
import { InquiryReview } from './inquiry-review'
import { Button } from './ui/button'

export type ContactDraft = z.infer<typeof preparedInquirySchema> & {
  receipt?: 'saved' | 'expired'
}
export function ChatContactForm({
  form,
  restoredDraft,
  active,
  busy,
  token,
  verified,
  onConsumeToken,
}: {
  form: z.infer<typeof contactFormSchema>
  restoredDraft?: ContactDraft
  active: boolean
  busy: boolean
  token: string
  verified: boolean
  onConsumeToken: () => void
}) {
  const [details, setDetails] = useState({
    name: '',
    email: '',
    summary: '',
    timing: '',
    budget: '',
    ...form.details,
    ...restoredDraft?.details,
  })
  const [draft, setDraft] = useState<ContactDraft | undefined>(restoredDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function prepare(event: FormEvent) {
    event.preventDefault()
    if (busy || saving || !active || !verified) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/inquiry-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactFormId: form.formId,
          details,
          turnstileToken: token,
        }),
      })
      const result = await response.json()
      const parsed = preparedInquirySchema.safeParse(result)
      if (!response.ok || !parsed.success)
        throw new Error(
          result.error ?? 'The draft could not be prepared. Please retry.',
        )
      setDraft(parsed.data)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Please retry.')
    } finally {
      setSaving(false)
      onConsumeToken()
    }
  }
  if (draft)
    return (
      <InquiryReview
        draft={draft}
        receipt={draft.receipt}
        active={active}
        busy={busy}
        onEdit={() => setDraft(undefined)}
      />
    )
  return (
    <section className="chat-contact-card" aria-label="Contact Rudolfs">
      <h2 className="section-title">Contact Rudolfs</h2>
      <p className="chat-note">
        Share a few details and Rudolfs can follow up by email. You’ll review
        your inquiry before sending it.
      </p>
      <form onSubmit={prepare}>
        <fieldset disabled={!active || busy || saving}>
          <label>
            Name
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={120}
              value={details.name}
              onChange={(event) =>
                setDetails({ ...details, name: event.target.value })
              }
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={details.email}
              onChange={(event) =>
                setDetails({ ...details, email: event.target.value })
              }
            />
          </label>
          <label>
            What would you like to discuss?
            <textarea
              name="summary"
              required
              minLength={20}
              maxLength={4000}
              rows={3}
              value={details.summary}
              onChange={(event) =>
                setDetails({ ...details, summary: event.target.value })
              }
            />
          </label>
          <div className="chat-contact-optional">
            <label>
              Timing (optional)
              <input
                name="timing"
                maxLength={200}
                value={details.timing}
                onChange={(event) =>
                  setDetails({ ...details, timing: event.target.value })
                }
              />
            </label>
            <label>
              Budget (optional)
              <input
                name="budget"
                maxLength={200}
                value={details.budget}
                onChange={(event) =>
                  setDetails({ ...details, budget: event.target.value })
                }
              />
            </label>
          </div>
          {error && (
            <p className="feedback-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={!verified}>
            {saving ? 'Preparing…' : 'Review inquiry'}
          </Button>
        </fieldset>
      </form>
      {!active && (
        <p className="chat-note">
          Continue with the latest contact form below.
        </p>
      )}
    </section>
  )
}
