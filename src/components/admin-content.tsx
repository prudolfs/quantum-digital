import { Link, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import type { FunctionReturnType } from 'convex/server'
import type { api } from '../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import {
  saveCaseStudy,
  saveService,
  publishCaseStudy,
  publishService,
  saveSiteSettings,
  publishSiteSettings,
} from '@/server/admin'
import {
  caseStudySchema,
  serviceSchema,
  siteSettingsSchema,
  serviceArt,
  type SiteSettings,
} from '../../shared/content'

export type AdminWorkspace = FunctionReturnType<typeof api.content.workspace>
type WorkRecord = AdminWorkspace['caseStudies'][number]
type ServiceRecord = AdminWorkspace['services'][number]
type EditorProps = {
  dirty: boolean
  onDirtyChange: (dirty: boolean) => void
  onFeedback: (message: string) => void
}

function publicationLabel(record: {
  publishedVersion?: number
  version: number
}) {
  if (record.publishedVersion === undefined) return 'Draft'
  return record.publishedVersion === record.version
    ? 'Published'
    : 'Published · draft changes'
}

export function ContentList({
  kind,
  records,
}: {
  kind: 'work' | 'services'
  records: (WorkRecord | ServiceRecord)[]
}) {
  const [filter, setFilter] = useState('')
  const visible = records.filter((record) =>
    record.draft.title.toLowerCase().includes(filter.toLowerCase()),
  )
  return (
    <>
      <div className="admin-list-toolbar">
        <label>
          Find {kind === 'work' ? 'a case study' : 'a service'}
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </label>
        <Button asChild>
          <Link
            to="/admin"
            search={{ section: kind, edit: 'new', status: 'all' }}
          >
            Create {kind === 'work' ? 'case study' : 'service'}
          </Link>
        </Button>
      </div>
      {visible.length === 0 ? (
        <p className="admin-empty">
          {records.length
            ? 'No matching records.'
            : 'No records yet. Create a draft to get started.'}
        </p>
      ) : (
        <div className="admin-record-list">
          {visible.map((record) => (
            <Link
              key={record._id}
              to="/admin"
              search={{ section: kind, edit: record._id, status: 'all' }}
              className="admin-record"
            >
              <span className="admin-record-status">
                {publicationLabel(record)}
              </span>
              <h2>{record.draft.title}</h2>
              <p>
                {'summary' in record.draft
                  ? record.draft.summary
                  : record.draft.description}
              </p>
              <span className="admin-record-meta">
                Order {record.sortOrder} · Edit record →
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

const workFields = [
  ['title', 'Title', 140],
  ['slug', 'URL slug', 100],
  ['category', 'Category', 100],
  ['summary', 'Summary', 600],
  ['role', 'Your role', 500],
  ['context', 'Context', 4000],
  ['challenge', 'Challenge', 4000],
  ['approach', 'Approach', 4000],
  ['delivery', 'Delivery', 4000],
  ['evidence', 'Engineering focus (optional)', 4000],
  ['repositoryUrl', 'Repository URL (optional)', 2048],
  ['demoUrl', 'Demo URL (optional)', 2048],
] as const
const serviceFields = [
  ['title', 'Title', 140],
  ['id', 'Service ID', 100],
  ['number', 'Display number', 4],
  ['theme', 'Category', 100],
  ['description', 'Description', 1000],
  ['detail', 'Supporting details', 300],
] as const

export function ContentEditor({
  kind,
  record,
  dirty,
  onDirtyChange,
  onFeedback,
}: EditorProps & {
  kind: 'work' | 'services'
  record?: WorkRecord | ServiceRecord
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<Record<string, unknown>>(() => ({
    ...(record?.draft ??
      (kind === 'work'
        ? { featured: true }
        : { number: '01', art: 'product' })),
  }))
  const [order, setOrder] = useState(record?.sortOrder ?? 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fields = kind === 'work' ? workFields : serviceFields

  async function save(event: FormEvent) {
    event.preventDefault()
    setError('')
    const input =
      kind === 'work'
        ? caseStudySchema.safeParse(draft)
        : serviceSchema.safeParse(draft)
    if (!input.success) {
      setError(
        input.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(' '),
      )
      return
    }
    setBusy(true)
    try {
      const shared = {
        id: record?._id,
        expectedVersion: record?.version,
        sortOrder: order,
      }
      const id =
        kind === 'work'
          ? await saveCaseStudy({
              data: { ...shared, content: caseStudySchema.parse(draft) },
            })
          : await saveService({
              data: { ...shared, content: serviceSchema.parse(draft) },
            })
      onDirtyChange(false)
      onFeedback('Draft saved. Publish when you’re ready to make it public.')
      await router.invalidate({ sync: true })
      if (!record)
        await router.navigate({
          to: '/admin',
          search: { section: kind, edit: id, status: 'all' },
        })
    } catch {
      setError(
        'The draft wasn’t saved. It may have changed elsewhere; reload before trying again.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function publish(makePublic: boolean) {
    if (!record || dirty) return
    if (
      !makePublic &&
      !window.confirm(
        'Unpublish this record? It will disappear from the website and assistant context.',
      )
    )
      return
    setBusy(true)
    setError('')
    try {
      const data = {
        id: record._id,
        expectedVersion: record.version,
        publish: makePublic,
      }
      if (kind === 'work') await publishCaseStudy({ data })
      else await publishService({ data })
      onFeedback(
        makePublic
          ? 'Published. The website and assistant will use this version.'
          : 'Unpublished. The draft is still available here.',
      )
      await router.invalidate({ sync: true })
    } catch {
      setError(
        'Publication wasn’t changed. The record may have changed elsewhere; reload and retry.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-editor">
      <Link
        to="/admin"
        search={{ section: kind, edit: '', status: 'all' }}
        className="text-link"
      >
        ← All {kind === 'work' ? 'case studies' : 'services'}
      </Link>
      <p className="admin-help">
        {record ? publicationLabel(record) : 'New draft'} · Saving keeps changes
        private until you publish.
      </p>
      {error && (
        <p role="alert" className="feedback-error">
          {error}
        </p>
      )}
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <div className="admin-field-grid">
            {fields.map(([name, label, maximum]) => {
              const long = [
                'summary',
                'context',
                'challenge',
                'approach',
                'delivery',
                'evidence',
                'description',
                'detail',
                'role',
              ].includes(name)
              const optional = [
                'evidence',
                'repositoryUrl',
                'demoUrl',
              ].includes(name)
              const props = {
                id: `editor-${name}`,
                name,
                value: String(draft[name] ?? ''),
                required: !optional,
                maxLength: maximum,
                onChange: (event: { target: { value: string } }) => {
                  setDraft((previous) => ({
                    ...previous,
                    [name]: event.target.value,
                  }))
                  onDirtyChange(true)
                },
              }
              return (
                <div
                  key={name}
                  className={
                    long ? 'admin-field admin-field--wide' : 'admin-field'
                  }
                >
                  <label htmlFor={props.id}>{label}</label>
                  {long ? (
                    <textarea
                      {...props}
                      rows={
                        name === 'summary' || name === 'description' ? 3 : 5
                      }
                    />
                  ) : (
                    <input
                      {...props}
                      type={name.endsWith('Url') ? 'url' : 'text'}
                    />
                  )}
                </div>
              )
            })}
            <div className="admin-field">
              <label htmlFor="editor-order">Display order</label>
              <input
                id="editor-order"
                type="number"
                min={0}
                max={9999}
                step={1}
                required
                value={order}
                onChange={(event) => {
                  setOrder(Number(event.target.value))
                  onDirtyChange(true)
                }}
              />
            </div>
            {kind === 'services' ? (
              <div className="admin-field">
                <label htmlFor="editor-art">Illustration</label>
                <select
                  id="editor-art"
                  value={String(draft.art)}
                  onChange={(event) => {
                    setDraft((previous) => ({
                      ...previous,
                      art: event.target.value,
                    }))
                    onDirtyChange(true)
                  }}
                >
                  {serviceArt.map((art) => (
                    <option value={art} key={art}>
                      {art}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={draft.featured === false}
                  onChange={(event) => {
                    setDraft((previous) => ({
                      ...previous,
                      featured: !event.target.checked,
                    }))
                    onDirtyChange(true)
                  }}
                />
                Also list this case study on About
              </label>
            )}
          </div>
          {kind === 'work' && (
            <p className="admin-help">
              Project links are optional. Changing a URL slug on publish changes
              the public case-study address.
            </p>
          )}
          <div className="admin-editor-actions">
            <Button type="submit">{busy ? 'Working…' : 'Save draft'}</Button>
            {record && (
              <Button
                type="button"
                variant="outline"
                disabled={dirty}
                onClick={() => void publish(true)}
              >
                Publish saved draft
              </Button>
            )}
            {record?.published && (
              <Button
                type="button"
                variant="outline"
                disabled={dirty}
                onClick={() => void publish(false)}
              >
                Unpublish
              </Button>
            )}
          </div>
          {dirty && (
            <p className="admin-help">
              Unsaved changes. Save the draft before publishing.
            </p>
          )}
        </fieldset>
      </form>
      {kind === 'work' &&
        record?.published &&
        'slug' in record.published.content && (
          <a
            className="text-link"
            href={`/work/${record.published.content.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            View published page ↗
          </a>
        )}
    </div>
  )
}

export function SettingsEditor({
  record,
  dirty,
  onDirtyChange,
  onFeedback,
}: EditorProps & { record: NonNullable<AdminWorkspace['settings']> }) {
  const router = useRouter()
  const [draft, setDraft] = useState<SiteSettings>(record.draft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fields = [
    ['homeTitle', 'Homepage title', 140],
    ['homeDescription', 'Search and sharing description', 300],
    ['heroDescription', 'Hero description', 1000],
    ['approachDescription', 'Approach description', 2000],
    ['contactEmail', 'Public contact email', 254],
  ] as const
  async function save(event: FormEvent) {
    event.preventDefault()
    const input = siteSettingsSchema.safeParse(draft)
    if (!input.success) {
      setError(input.error.issues.map((issue) => issue.message).join(' '))
      return
    }
    setBusy(true)
    setError('')
    try {
      await saveSiteSettings({
        data: { expectedVersion: record.version, content: input.data },
      })
      onDirtyChange(false)
      onFeedback('Settings draft saved. Publish to update the website.')
      await router.invalidate({ sync: true })
    } catch {
      setError(
        'Settings weren’t saved. They may have changed elsewhere; reload before trying again.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function publish() {
    setBusy(true)
    setError('')
    try {
      await publishSiteSettings({ data: { expectedVersion: record.version } })
      onFeedback('Settings published.')
      await router.invalidate({ sync: true })
    } catch {
      setError('Settings weren’t published. Reload and retry.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="admin-editor">
      <p className="admin-help">
        {record.publishedVersion === record.version
          ? 'Published settings'
          : 'Settings have draft changes'}
        . The owner sign-in email is managed in Convex; the public contact email
        below is separate.
      </p>
      {error && (
        <p role="alert" className="feedback-error">
          {error}
        </p>
      )}
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          {fields.map(([name, label, maximum]) => (
            <div className="admin-field" key={name}>
              <label htmlFor={`settings-${name}`}>{label}</label>
              {name === 'homeTitle' || name === 'contactEmail' ? (
                <input
                  id={`settings-${name}`}
                  type={name === 'contactEmail' ? 'email' : 'text'}
                  value={draft[name]}
                  required
                  maxLength={maximum}
                  onChange={(event) => {
                    setDraft((previous) => ({
                      ...previous,
                      [name]: event.target.value,
                    }))
                    onDirtyChange(true)
                  }}
                />
              ) : (
                <textarea
                  id={`settings-${name}`}
                  value={draft[name]}
                  required
                  maxLength={maximum}
                  rows={3}
                  onChange={(event) => {
                    setDraft((previous) => ({
                      ...previous,
                      [name]: event.target.value,
                    }))
                    onDirtyChange(true)
                  }}
                />
              )}
            </div>
          ))}
          <h2 className="section-title">Common questions</h2>
          {draft.questions.map((entry, index) => (
            <div className="admin-question" key={index}>
              <label htmlFor={`question-${index}`}>Question {index + 1}</label>
              <input
                id={`question-${index}`}
                value={entry.question}
                required
                maxLength={200}
                onChange={(event) => {
                  setDraft((previous) => ({
                    ...previous,
                    questions: previous.questions.map((question, i) =>
                      i === index
                        ? { ...question, question: event.target.value }
                        : question,
                    ),
                  }))
                  onDirtyChange(true)
                }}
              />
              <label htmlFor={`answer-${index}`}>Answer</label>
              <textarea
                id={`answer-${index}`}
                rows={3}
                value={entry.answer}
                required
                maxLength={2000}
                onChange={(event) => {
                  setDraft((previous) => ({
                    ...previous,
                    questions: previous.questions.map((question, i) =>
                      i === index
                        ? { ...question, answer: event.target.value }
                        : question,
                    ),
                  }))
                  onDirtyChange(true)
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraft((previous) => ({
                    ...previous,
                    questions: previous.questions.filter((_, i) => i !== index),
                  }))
                  onDirtyChange(true)
                }}
              >
                Remove question {index + 1}
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={draft.questions.length >= 20}
            onClick={() => {
              setDraft((previous) => ({
                ...previous,
                questions: [
                  ...previous.questions,
                  { question: '', answer: '' },
                ],
              }))
              onDirtyChange(true)
            }}
          >
            Add question
          </Button>
          <div className="admin-editor-actions">
            <Button type="submit">{busy ? 'Working…' : 'Save draft'}</Button>
            <Button
              type="button"
              variant="outline"
              disabled={dirty}
              onClick={() => void publish()}
            >
              Publish saved settings
            </Button>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
