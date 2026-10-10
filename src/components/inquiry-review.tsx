import { useState } from 'react'
import type { z } from 'zod'
import { preparedInquirySchema } from '../../shared/chat'
export { preparedInquirySchema } from '../../shared/chat'
import { Button } from '@/components/ui/button'

type PreparedInquiry = z.infer<typeof preparedInquirySchema>

export function InquiryReview({
  draft,
  onEdit,
  active = true,
  busy = false,
  canEdit = true,
}: {
  draft: PreparedInquiry
  onEdit: () => void
  active?: boolean
  busy?: boolean
  canEdit?: boolean
}) {
  const [status, setStatus] = useState<
    'review' | 'saving' | 'saved' | 'editing'
  >('review')
  const [error, setError] = useState('')
  async function confirm() {
    setStatus('saving')
    setError('')
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.draftId, confirmed: true }),
      })
      const result = (await response.json()) as {
        saved?: boolean
        inquiryId?: string
        error?: string
      }
      if (!response.ok || !result.saved || !result.inquiryId)
        throw new Error(
          result.error ?? 'Your inquiry wasn’t saved. Please retry.',
        )
      setStatus('saved')
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Your inquiry wasn’t saved. Please retry.',
      )
      setStatus('review')
    }
  }
  return (
    <section className="inquiry-review" aria-label="Review your inquiry">
      <h2 className="section-title">Review your inquiry</h2>
      <dl>
        <dt>Name</dt>
        <dd>{draft.details.name}</dd>
        <dt>Email</dt>
        <dd>{draft.details.email}</dd>
        <dt>Project</dt>
        <dd>{draft.details.summary}</dd>
        {draft.details.timing && (
          <>
            <dt>Timing</dt>
            <dd>{draft.details.timing}</dd>
          </>
        )}
        {draft.details.budget && (
          <>
            <dt>Budget</dt>
            <dd>{draft.details.budget}</dd>
          </>
        )}
      </dl>
      {status === 'saved' ? (
        <p className="feedback-success" role="status">
          Your inquiry is saved. Rudolfs can review it and reply to the email
          above.
        </p>
      ) : !active ? (
        <p className="chat-note">
          An updated draft is shown below. Review the latest details before
          confirming.
        </p>
      ) : status === 'editing' ? (
        <p className="chat-note">
          This draft wasn’t submitted. Continue the conversation to make
          changes.
        </p>
      ) : (
        <>
          <p className="chat-note">
            Nothing has been submitted yet. Confirm to send these details to
            Rudolfs.
          </p>
          {error && (
            <p className="feedback-error" role="alert">
              {error}
            </p>
          )}
          <div className="action-row">
            <Button
              disabled={status === 'saving' || busy}
              onClick={() => void confirm()}
            >
              {status === 'saving'
                ? 'Submitting…'
                : 'Confirm and submit inquiry'}
            </Button>
            <Button
              variant="outline"
              disabled={status === 'saving' || busy || !canEdit}
              onClick={() => {
                setStatus('editing')
                onEdit()
              }}
            >
              Make changes
            </Button>
          </div>
          {!canEdit && (
            <p className="chat-note">
              To change these details, clear the conversation and prepare a new
              draft.
            </p>
          )}
        </>
      )}
    </section>
  )
}
