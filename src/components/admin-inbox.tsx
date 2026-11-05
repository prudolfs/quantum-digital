import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { FunctionReturnType } from 'convex/server'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Copy,
  Inbox,
  LoaderCircle,
  Mail,
  MessageSquare,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { api } from '../../convex/_generated/api'
import type { InboxFilters, InquirySummary } from '../../shared/inquiry-admin'
import { inquiryStatuses } from '../../shared/inquiry'
import {
  changeInquiryStatus,
  deleteInquiry,
  loadInquiry,
  summarizeInquiry,
} from '@/server/admin'
import { AdminSelect } from '@/components/admin-select'
import { AdminConfirm } from '@/components/admin-confirm'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'

type InboxPage = FunctionReturnType<typeof api.inquiries.inbox>
type InquiryDetail = FunctionReturnType<typeof api.inquiries.detail>
type InquiryCard = InboxPage['page'][number]
const statusLabels = { new: 'New', contacted: 'Contacted', closed: 'Closed' }
const statusOptions = inquiryStatuses.map((value) => ({
  value,
  label: statusLabels[value],
}))
const dateTime = (time: number) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Riga',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(time)
const shortDate = (time: number) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Riga',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(time)
const calendarDate = (value?: string) =>
  value ? new Date(`${value}T12:00:00`) : undefined

function StatusBadge({ status }: { status: keyof typeof statusLabels }) {
  return (
    <Badge
      variant={
        status === 'new'
          ? 'default'
          : status === 'contacted'
            ? 'secondary'
            : 'outline'
      }
    >
      {statusLabels[status]}
    </Badge>
  )
}

export function AdminInbox({
  page,
  filters,
}: {
  page: InboxPage
  filters: InboxFilters
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<InquiryCard | null>(null)
  const [deleting, setDeleting] = useState<InquiryCard | null>(null)
  const [history, setHistory] = useState<(string | undefined)[]>([])
  const [busy, setBusy] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>(
    filters.from
      ? { from: calendarDate(filters.from), to: calendarDate(filters.to) }
      : undefined,
  )

  async function navigate(next: InboxFilters) {
    setBusy(true)
    try {
      await router.navigate({
        to: '/admin',
        search: { section: 'inbox', edit: '', ...next },
      })
    } catch {
      toast.error('The inbox couldn’t be loaded. Please retry.')
    } finally {
      setBusy(false)
    }
  }
  async function remove() {
    if (!deleting || deleteBusy) return
    setDeleteBusy(true)
    try {
      await deleteInquiry({ data: { inquiryId: deleting._id } })
      if (selected?._id === deleting._id) setSelected(null)
      setDeleting(null)
      toast.success('Inquiry deleted.')
      // Return to the newest page when deleting the last row of an older page.
      if (page.page.length === 1 && filters.cursor)
        await navigate({ ...filters, cursor: undefined })
      else await router.invalidate({ sync: true })
    } catch {
      toast.error('The inquiry wasn’t deleted. Please retry.')
    } finally {
      setDeleteBusy(false)
    }
  }
  const dateLabel = filters.from
    ? `${format(calendarDate(filters.from)!, 'd MMM yyyy')}${filters.to && filters.to !== filters.from ? ` – ${format(calendarDate(filters.to)!, 'd MMM yyyy')}` : ''}`
    : 'Any date'

  return (
    <div className="admin-inbox" aria-busy={busy}>
      <div className="inbox-heading">
        <p>Review project requests, read the conversation, and follow up.</p>
        <span>Dates in Riga time</span>
      </div>
      <FieldGroup className="inbox-filters">
        <Field>
          <FieldLabel htmlFor="inbox-status">Status</FieldLabel>
          <AdminSelect
            id="inbox-status"
            label="Filter inquiries by status"
            value={filters.status}
            options={[
              { value: 'all', label: 'All statuses' },
              ...statusOptions,
            ]}
            disabled={busy}
            onChange={(value) => {
              void navigate({
                ...filters,
                status: value as InboxFilters['status'],
                cursor: undefined,
              })
            }}
          />
        </Field>
        <Field>
          <FieldLabel>Submitted</FieldLabel>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={busy}
                aria-label={`Filter by date: ${dateLabel}`}
              >
                <CalendarDays data-icon="inline-start" />
                {dateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="start"
              aria-label="Submission date range"
            >
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                defaultMonth={range?.from}
                numberOfMonths={1}
              />
              <div className="flex justify-between gap-3 p-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRange(undefined)
                    setCalendarOpen(false)
                    void navigate({
                      ...filters,
                      from: undefined,
                      to: undefined,
                      cursor: undefined,
                    })
                  }}
                >
                  Clear dates
                </Button>
                <Button
                  size="sm"
                  disabled={!range?.from}
                  onClick={() => {
                    if (!range?.from) return
                    setCalendarOpen(false)
                    void navigate({
                      ...filters,
                      from: format(range.from, 'yyyy-MM-dd'),
                      to: format(range.to ?? range.from, 'yyyy-MM-dd'),
                      cursor: undefined,
                    })
                  }}
                >
                  Apply dates
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </Field>
        {(filters.status !== 'all' || filters.from || filters.to) && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => void navigate({ status: 'all' })}
          >
            <X data-icon="inline-start" />
            Clear filters
          </Button>
        )}
      </FieldGroup>
      {page.page.length ? (
        <>
          <div className="inbox-list-meta">
            <span>
              {page.page.length}{' '}
              {page.page.length === 1 ? 'inquiry' : 'inquiries'} on this page
            </span>
            <span>Newest first</span>
          </div>
          <div className="inbox-grid">
            {page.page.map((inquiry) => (
              <Card
                key={inquiry._id}
                className="flex min-w-0 flex-col"
                data-testid="inquiry-card"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={inquiry.status} />
                    <time
                      className="inbox-date"
                      dateTime={new Date(inquiry._creationTime).toISOString()}
                    >
                      {shortDate(inquiry._creationTime)}
                    </time>
                  </div>
                  <CardTitle>
                    <h2 className="inbox-name">{inquiry.name}</h2>
                  </CardTitle>
                  <CardDescription>
                    <a href={`mailto:${inquiry.email}`} className="inbox-email">
                      {inquiry.email}
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="inbox-preview">{inquiry.summary}</p>
                  <dl className="inbox-quick-facts">
                    <div>
                      <dt>Timing</dt>
                      <dd>{inquiry.timing || 'Not specified'}</dd>
                    </div>
                    <div>
                      <dt>Budget</dt>
                      <dd>{inquiry.budget || 'Not specified'}</dd>
                    </div>
                  </dl>
                </CardContent>
                <CardFooter className="justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelected(inquiry)}
                  >
                    View inquiry
                    <ArrowUpRight data-icon="inline-end" />
                  </Button>
                  <div className="flex items-center gap-2">
                    {inquiry.hasSummary && (
                      <span
                        className="inbox-summary-indicator"
                        title="Conversation summary saved"
                      >
                        <Sparkles aria-hidden="true" />
                        <span className="sr-only">AI summary available</span>
                      </span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete inquiry from ${inquiry.name}`}
                      onClick={() => setDeleting(inquiry)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>
              {filters.status !== 'all' || filters.from
                ? 'No inquiries match these filters'
                : 'Your inbox is clear'}
            </EmptyTitle>
            <EmptyDescription>
              {filters.status !== 'all' || filters.from
                ? 'Try another date range or show all statuses.'
                : 'Confirmed project inquiries will appear here.'}
            </EmptyDescription>
          </EmptyHeader>
          {(filters.status !== 'all' || filters.from || filters.cursor) && (
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => void navigate({ status: 'all' })}
              >
                Show all inquiries
              </Button>
            </EmptyContent>
          )}
        </Empty>
      )}
      <Pagination aria-label="Inquiry pagination" className="mt-6 justify-end">
        <PaginationContent>
          <PaginationItem>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !filters.cursor}
              onClick={() => {
                const previous = history.at(-1)
                setHistory((items) => items.slice(0, -1))
                void navigate({ ...filters, cursor: previous })
              }}
            >
              Previous
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || page.isDone}
              onClick={() => {
                setHistory((items) => [...items, filters.cursor])
                void navigate({ ...filters, cursor: page.continueCursor })
              }}
            >
              Next
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      {selected && (
        <InquiryDialog
          key={selected._id}
          selected={selected}
          onClose={() => setSelected(null)}
          onDelete={() => {
            if (selected) setDeleting(selected)
          }}
        />
      )}
      <AdminConfirm
        open={Boolean(deleting)}
        title="Delete this inquiry?"
        description={`Permanently delete ${deleting?.name ?? 'this visitor'}’s inquiry, saved conversation copy, and AI summary. This cannot be undone.`}
        action="Delete inquiry"
        destructive
        busy={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </div>
  )
}

function SummaryContent({ summary }: { summary: InquirySummary }) {
  const sections = [
    ['Requirements', summary.requirements],
    ['Constraints', summary.constraints],
    ['Next steps', summary.nextSteps],
    ['Open questions', summary.openQuestions],
  ] as const
  return (
    <div className="inquiry-ai-summary">
      <p>{summary.overview}</p>
      {sections
        .filter(([, items]) => items.length)
        .map(([title, items]) => (
          <section key={title}>
            <h4>{title}</h4>
            <ul>
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  )
}

function InquiryDialog({
  selected,
  onClose,
  onDelete,
}: {
  selected: InquiryCard
  onClose: () => void
  onDelete: () => void
}) {
  const router = useRouter()
  const [detail, setDetail] = useState<InquiryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [request, setRequest] = useState({ inquiryId: selected._id })
  const id = selected._id
  useEffect(() => {
    let active = true
    loadInquiry({ data: request })
      .then((result) => {
        if (active) setDetail(result)
      })
      .catch(() => {
        if (active) setError('This inquiry couldn’t be loaded. Please retry.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [request])

  async function updateStatus(status: string) {
    if (!id || !detail) return
    setWorking(true)
    try {
      await changeInquiryStatus({
        data: {
          inquiryId: id,
          status: status as (typeof inquiryStatuses)[number],
        },
      })
      setDetail({
        ...detail,
        inquiry: {
          ...detail.inquiry,
          status: status as (typeof inquiryStatuses)[number],
          updatedAt: Date.now(),
        },
      })
      await router.invalidate()
      toast.success('Status updated.')
    } catch {
      toast.error('The status wasn’t updated. Please retry.')
    } finally {
      setWorking(false)
    }
  }
  async function summarize() {
    if (!id || !detail || summarizing) return
    setSummarizing(true)
    try {
      const summary = await summarizeInquiry({ data: { inquiryId: id } })
      setDetail((current) =>
        current?.inquiry._id === id
          ? { ...current, summary, summarizedAt: Date.now() }
          : current,
      )
      await router.invalidate()
      toast.success('Conversation summary saved.')
    } catch {
      toast.error(
        'The conversation summary couldn’t be generated. Please try again.',
      )
    } finally {
      setSummarizing(false)
    }
  }

  return (
    <Dialog
      open={Boolean(selected)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 p-0">
        <DialogHeader className="gap-2 px-6 pb-5 pt-6 pr-12">
          <DialogTitle>{selected?.name ?? 'Inquiry'}</DialogTitle>
          <DialogDescription>
            Submitted {selected ? dateTime(selected._creationTime) : ''} · Riga
            time
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-[min(68dvh,44rem)]">
          <div className="p-6">
            {loading && (
              <div className="flex flex-col gap-4" aria-label="Loading inquiry">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setError('')
                    setLoading(true)
                    setRequest({ inquiryId: id })
                  }}
                >
                  Retry
                </Button>
              </Alert>
            )}
            {detail && !loading && (
              <>
                <div className="inquiry-contact">
                  <a
                    className="text-link"
                    href={`mailto:${detail.inquiry.email}`}
                  >
                    {detail.inquiry.email}
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Copy email address"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(detail.inquiry.email)
                        .then(() => setCopied(true))
                        .catch(() =>
                          toast.error('The email address couldn’t be copied.'),
                        )
                    }}
                  >
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
                <Tabs defaultValue="details" className="mt-5">
                  <TabsList>
                    <TabsTrigger value="details">Inquiry</TabsTrigger>
                    <TabsTrigger value="conversation">
                      Conversation ({detail.messages.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="mt-6">
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="inquiry-status">Status</FieldLabel>
                        <AdminSelect
                          id="inquiry-status"
                          label="Inquiry status"
                          value={detail.inquiry.status}
                          options={statusOptions}
                          disabled={working}
                          onChange={(value) => void updateStatus(value)}
                        />
                      </Field>
                    </FieldGroup>
                    <section className="inquiry-detail-section">
                      <div className="inquiry-summary-heading">
                        <h3>
                          <Sparkles aria-hidden="true" />
                          Conversation summary
                        </h3>
                        {!detail.summary && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={summarizing || !detail.messages.length}
                            onClick={() => void summarize()}
                          >
                            {summarizing ? (
                              <LoaderCircle
                                className="animate-spin"
                                data-icon="inline-start"
                              />
                            ) : (
                              <Sparkles data-icon="inline-start" />
                            )}
                            {summarizing ? 'Summarizing…' : 'Generate summary'}
                          </Button>
                        )}
                      </div>
                      {detail.summary ? (
                        <>
                          <SummaryContent summary={detail.summary} />
                          <p className="inquiry-note">
                            AI-generated
                            {detail.summarizedAt
                              ? ` on ${shortDate(detail.summarizedAt)}`
                              : ''}
                            . Check the conversation for context.
                          </p>
                        </>
                      ) : (
                        <p className="inquiry-note">
                          {detail.messages.length
                            ? 'Create a concise recap of the full saved conversation: requirements, constraints, next steps, and open questions.'
                            : 'The original conversation is unavailable for this inquiry. Its submitted project brief is shown below.'}
                        </p>
                      )}
                    </section>
                    <Separator className="my-6" />
                    <section className="inquiry-detail-section">
                      <h3>Project brief</h3>
                      <p className="inquiry-full-text">
                        {detail.inquiry.summary}
                      </p>
                    </section>
                    <dl className="inquiry-detail-facts">
                      <div>
                        <dt>Timing</dt>
                        <dd>{detail.inquiry.timing || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt>Budget</dt>
                        <dd>{detail.inquiry.budget || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt>Source</dt>
                        <dd>Website chat</dd>
                      </div>
                      <div>
                        <dt>Last updated</dt>
                        <dd>{dateTime(detail.inquiry.updatedAt)}</dd>
                      </div>
                    </dl>
                  </TabsContent>
                  <TabsContent value="conversation" className="mt-6">
                    {detail.messages.length ? (
                      <>
                        <p className="inquiry-note">
                          A saved copy of the conversation up to submission.
                          Later messages aren’t included.
                        </p>
                        <dl className="inquiry-transcript">
                          {detail.messages.map((message, index) => (
                            <div key={index}>
                              <dt>
                                {message.role === 'user'
                                  ? detail.inquiry.name
                                  : 'Quantum Digital assistant'}
                              </dt>
                              <dd>{message.text}</dd>
                            </div>
                          ))}
                        </dl>
                      </>
                    ) : (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <MessageSquare />
                          </EmptyMedia>
                          <EmptyTitle>Conversation unavailable</EmptyTitle>
                          <EmptyDescription>
                            This older inquiry has no retained conversation. The
                            submitted project details are still available.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </ScrollArea>
        <Separator />
        <div className="inquiry-dialog-actions">
          <Button variant="ghost" disabled={working} onClick={onDelete}>
            <Trash2 data-icon="inline-start" />
            Delete inquiry
          </Button>
          <Button asChild>
            <a href={`mailto:${selected?.email ?? ''}`}>
              <Mail data-icon="inline-start" />
              Reply by email
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
