import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUp, Square, RotateCcw, MessageSquare } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { isToolUIPart, type UIMessage } from 'ai'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Button } from '@/components/ui/button'
import {
  InquiryReview,
  preparedInquirySchema,
} from '@/components/inquiry-review'
import { pageHead } from '@/lib/seo'
import { loadPublishedContent } from '@/server/content'
import { ChatText, ChatReference } from '@/components/chat-references'
import {
  chatLimits,
  starterPrompts,
  chatErrorNotice,
  caseStudyResultSchema,
  contactFormSchema,
} from '../../shared/chat'
import { profileLinks } from '@/content/site'
import { publicEnv } from '@/env'
import { ChatTurnstile } from '@/components/chat-turnstile'
import { portfolioLinks } from '@/content/professional-background'
import { ActionIcon } from '@/components/action-icon'
import { createConversationTransport } from '@/lib/chat-transport'
import {
  ChatContactForm,
  type ContactDraft,
} from '@/components/chat-contact-form'

export const Route = createFileRoute('/chat')({
  loader: () => loadPublishedContent(),
  head: () =>
    pageHead(
      'Let’s talk | Quantum Digital',
      'Tell Quantum Digital about your project through chat. Review and confirm an inquiry for Rudolfs to follow up by email.',
      '/chat',
    ),
  component: ChatPage,
})

function ChatPage() {
  const {
    caseStudies,
    settings: { contactEmail },
  } = Route.useLoaderData()
  const [availability, setAvailability] = useState<
    'loading' | 'ready' | 'unavailable'
  >('loading')
  const [input, setInput] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [verificationRequired, setVerificationRequired] = useState(false)
  const [verificationAttempt, setVerificationAttempt] = useState(0)
  const [receipts, setReceipts] = useState<Record<string, 'saved' | 'expired'>>(
    {},
  )
  const [contactDrafts, setContactDrafts] = useState<
    Record<string, ContactDraft>
  >({})
  const [sessionVersion, setSessionVersion] = useState(0)
  const [restoringResponse, setRestoringResponse] = useState(false)
  const [restartError, setRestartError] = useState('')
  const textarea = useRef<HTMLTextAreaElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const [connection] = useState(() =>
    createConversationTransport(() => {
      setVerificationToken('')
      setVerificationAttempt((value) => value + 1)
    }),
  )
  const onVerificationToken = useCallback(
    (value: string) => {
      connection.setToken(value)
      setVerificationToken(value)
    },
    [connection],
  )
  const consumeToken = connection.consumeToken
  const [reconnecting, setReconnecting] = useState(false)
  const [responseNotice, setResponseNotice] = useState<{
    id: string
    text: string
  } | null>(null)
  const followLatest = useRef(true)
  const latest = useRef<HTMLDivElement>(null)
  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    stop,
    setMessages,
    clearError,
  } = useChat({
    transport: connection.transport,
    onFinish: ({ message, isAbort, finishReason }) => {
      if (isAbort)
        setResponseNotice({
          id: message.id,
          text: 'Response stopped. Continue the conversation or retry this response.',
        })
      else if (finishReason === 'length')
        setResponseNotice({
          id: message.id,
          text: 'The response reached its length limit. Ask the assistant to continue.',
        })
    },
  })
  const busy = status === 'submitted' || status === 'streaming'
  const verified = !verificationRequired || Boolean(verificationToken)
  const conversationSize = JSON.stringify(messages).length
  const atLimit =
    messages.length >= chatLimits.messages ||
    conversationSize >= chatLimits.conversationCharacters
  const failure = error ? chatErrorNotice(error.message) : null
  const activeDraft = messages
    .flatMap((message) =>
      message.parts.filter(
        (part) =>
          isToolUIPart(part) &&
          (part.type === 'tool-prepareInquiry' ||
            part.type === 'tool-requestContactDetails') &&
          part.state === 'output-available',
      ),
    )
    .at(-1)
  const allowedLinks = useMemo(() => {
    const studies = [...caseStudies]
    for (const message of messages)
      for (const part of message.parts) {
        if (
          isToolUIPart(part) &&
          part.type === 'tool-getCaseStudy' &&
          part.state === 'output-available'
        ) {
          const result = caseStudyResultSchema.safeParse(part.output)
          if (result.success && result.data.available)
            studies.push(result.data.study)
        }
      }
    const paths = [
      '/',
      '/about',
      '/#work',
      '/#services',
      '/#engagements',
      '/privacy',
      ...studies.map((study) => `/work/${study.slug}`),
    ]
    return new Set([
      ...paths,
      ...paths.map((path) => new URL(path, publicEnv.VITE_SITE_URL).href),
      `mailto:${contactEmail}`,
      ...profileLinks.map((profile) => profile.url),
      ...portfolioLinks,
      ...studies.flatMap((study) =>
        [study.repositoryUrl, study.demoUrl].filter((url): url is string =>
          Boolean(url),
        ),
      ),
    ])
  }, [caseStudies, contactEmail, messages])
  useEffect(() => {
    if (sessionVersion > 0) followLatest.current = true
    const abort = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    async function restore() {
      try {
        const response = await fetch('/api/chat-session', {
          signal: abort.signal,
        })
        const result = (await response.json()) as {
          available?: boolean
          revision?: number
          messages?: UIMessage[]
          receipts?: Record<string, 'saved' | 'expired'>
          contactDrafts?: Record<string, ContactDraft>
          generating?: boolean
          verificationRequired?: boolean
        }
        if (abort.signal.aborted) return
        connection.setRevision(result.revision ?? 0)
        setMessages(result.messages ?? [])
        setReceipts(result.receipts ?? {})
        setContactDrafts(result.contactDrafts ?? {})
        setVerificationRequired(Boolean(result.verificationRequired))
        setRestoringResponse(Boolean(result.generating))
        setAvailability(
          response.ok && result.available ? 'ready' : 'unavailable',
        )
        if (result.generating) timer = setTimeout(() => void restore(), 1500)
      } catch {
        if (!abort.signal.aborted) setAvailability('unavailable')
      }
    }
    void restore()
    return () => {
      abort.abort()
      clearTimeout(timer)
    }
  }, [setMessages, sessionVersion, connection])
  useEffect(() => {
    const element = textarea.current
    if (!element) return
    element.style.height = input ? 'auto' : '44px'
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`
  }, [input])
  useEffect(() => {
    if (followLatest.current && (conversationSize > 2 || busy))
      latest.current?.scrollIntoView({ block: 'nearest' })
  }, [conversationSize, busy])
  async function send(text: string) {
    if (
      !text.trim() ||
      busy ||
      reconnecting ||
      atLimit ||
      availability !== 'ready' ||
      restoringResponse ||
      !verified
    )
      return
    followLatest.current = true
    setResponseNotice(null)
    clearError()
    await sendMessage({ text: text.trim() })
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (
      !input.trim() ||
      busy ||
      atLimit ||
      restoringResponse ||
      !verified ||
      availability !== 'ready'
    )
      return
    const text = input
    setInput('')
    await send(text)
  }
  async function clearConversation() {
    setReconnecting(true)
    setRestartError('')
    await stop()
    try {
      const response = await fetch('/api/chat-session', { method: 'POST' })
      if (!response.ok)
        throw new Error(
          'The conversation couldn’t be restarted. Please try again.',
        )
      const result = (await response.json()) as { revision?: number }
      connection.setRevision(result.revision ?? 0)
      setMessages([])
      setReceipts({})
      setContactDrafts({})
      clearError()
      setInput('')
      setResponseNotice(null)
      setRestoringResponse(false)
      followLatest.current = true
      onVerificationToken('')
      setVerificationAttempt((value) => value + 1)
      setSessionVersion((value) => value + 1)
    } catch (restartFailure) {
      setRestartError(
        restartFailure instanceof Error
          ? restartFailure.message
          : 'Please retry restarting the conversation.',
      )
    } finally {
      setReconnecting(false)
    }
  }
  return (
    <main className="chat-page chat-page--live" id="main-content">
      {messages.length > 0 && (
        <h1 className="sr-only">Chat with Quantum Digital</h1>
      )}
      <div
        className="chat-background section-pattern section-pattern--hexagons"
        aria-hidden="true"
      />
      <header className="chat-topbar section-shell">
        <div className="chat-topbar-surface navigation-surface">
          <Link to="/" className="brand-link" aria-label="Quantum Digital home">
            <img src="/hero/q-symbol.svg" width="24" height="24" alt="" />
            Quantum<span>Digital</span>
          </Link>
          <div className="chat-topbar-actions">
            <button
              className="chat-contact-action"
              type="button"
              aria-label="Contact Rudolfs"
              title="Contact Rudolfs"
              disabled={
                busy ||
                reconnecting ||
                restoringResponse ||
                !verified ||
                atLimit ||
                availability !== 'ready'
              }
              onClick={() =>
                void send(
                  'I’d like to contact Rudolfs directly. Please open the contact details form.',
                )
              }
            >
              <span>Contact Rudolfs</span>
              <ActionIcon icon={MessageSquare} />
            </button>
            <button
              className="chat-restart"
              title="Restart chat"
              type="button"
              aria-label="Restart chat"
              disabled={reconnecting || availability === 'loading'}
              onClick={() => void clearConversation()}
            >
              <span>{reconnecting ? 'Restarting…' : 'Restart chat'}</span>
              <ActionIcon icon={RotateCcw} />
            </button>
          </div>
        </div>
      </header>
      <div
        className="chat-scroll"
        ref={scroller}
        onScroll={() => {
          const element = scroller.current
          if (element)
            followLatest.current =
              element.scrollHeight - element.scrollTop - element.clientHeight <
              160
        }}
      >
        <div className="chat-content">
          {messages.length === 0 && (
            <header className="chat-header">
              <p className="eyebrow">Quantum Digital / AI project assistant</p>
              <h1 className="marketing-title">
                Let’s talk about <span>your project.</span>
              </h1>
              <p className="body-copy">
                Start with what you want to build or improve. I’ll help you
                explore the offer and prepare an inquiry for Rudolfs.
              </p>
            </header>
          )}
          <p className="chat-privacy">
            You’re chatting with an AI assistant. A request is submitted only
            after you review the details and click confirm.{' '}
            <Link to="/privacy">How your information is used</Link>
          </p>
          {availability === 'unavailable' && (
            <div className="chat-unavailable" role="status">
              <h2 className="section-title">
                The assistant is currently unavailable.
              </h2>
              <p className="body-copy">
                You can still browse the work and services, or email{' '}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. No
                inquiry has been submitted.
              </p>
            </div>
          )}
          <div
            className="chat-messages"
            role="log"
            aria-label="Conversation"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {messages.map((message) => (
              <article
                className={`chat-message chat-message--${message.role}`}
                key={message.id}
              >
                <p className="chat-message__author">
                  {message.role === 'user' ? 'You' : 'AI assistant'}
                </p>
                {message.parts.map((part, index) => {
                  if (part.type === 'text')
                    return message.role === 'assistant' ? (
                      <ChatText
                        key={index}
                        text={part.text}
                        allowedLinks={allowedLinks}
                      />
                    ) : (
                      <p className="chat-message__text" key={index}>
                        {part.text}
                      </p>
                    )
                  if (
                    isToolUIPart(part) &&
                    part.type === 'tool-requestContactDetails' &&
                    part.state === 'output-available'
                  ) {
                    const parsed = contactFormSchema.safeParse(part.output)
                    return parsed.success ? (
                      <ChatContactForm
                        key={part.toolCallId}
                        form={parsed.data}
                        restoredDraft={contactDrafts[parsed.data.formId]}
                        active={Boolean(
                          activeDraft &&
                          isToolUIPart(activeDraft) &&
                          activeDraft.toolCallId === part.toolCallId,
                        )}
                        busy={busy || reconnecting || restoringResponse}
                        token={verificationToken}
                        verified={verified}
                        onConsumeToken={consumeToken}
                      />
                    ) : null
                  }
                  if (
                    isToolUIPart(part) &&
                    part.type === 'tool-prepareInquiry' &&
                    part.state === 'output-available'
                  ) {
                    const parsed = preparedInquirySchema.safeParse(part.output)
                    return parsed.success ? (
                      <InquiryReview
                        key={part.toolCallId}
                        draft={parsed.data}
                        receipt={receipts[parsed.data.draftId]}
                        active={
                          activeDraft &&
                          isToolUIPart(activeDraft) &&
                          activeDraft.toolCallId === part.toolCallId
                        }
                        busy={busy || reconnecting}
                        canEdit={!atLimit}
                        onEdit={() =>
                          void send(
                            'I want to change the inquiry details before submitting. Please ask what I would like to change.',
                          )
                        }
                      />
                    ) : null
                  }
                  if (isToolUIPart(part) && part.state === 'output-available')
                    return (
                      <ChatReference
                        key={part.toolCallId}
                        name={part.type}
                        output={part.output}
                        allowedLinks={allowedLinks}
                      />
                    )
                  if (
                    isToolUIPart(part) &&
                    (part.state === 'input-streaming' ||
                      part.state === 'input-available')
                  )
                    return (
                      <p
                        key={part.toolCallId}
                        className="chat-note"
                        role="status"
                      >
                        {part.type === 'tool-prepareInquiry'
                          ? 'Preparing details for your review…'
                          : part.type === 'tool-requestContactDetails'
                            ? 'Opening the contact form…'
                            : 'Looking up the published details…'}
                      </p>
                    )
                  if (isToolUIPart(part) && part.state === 'output-error')
                    return (
                      <p key={index} className="feedback-error">
                        {part.type === 'tool-prepareInquiry'
                          ? 'The inquiry draft couldn’t be prepared. Please retry.'
                          : 'The published details couldn’t be loaded. Please retry.'}
                      </p>
                    )
                  return null
                })}
              </article>
            ))}
            {status === 'submitted' && (
              <p className="chat-note" role="status">
                The assistant is thinking…
              </p>
            )}
            <div ref={latest} />
          </div>
          {restoringResponse && (
            <p className="chat-note" role="status">
              Restoring the assistant’s response…
            </p>
          )}
          {messages.length === 0 && availability === 'ready' && (
            <div className="starter-prompts">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  disabled={
                    busy || reconnecting || restoringResponse || !verified
                  }
                  onClick={() => void send(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          {responseNotice &&
            messages.at(-1)?.id === responseNotice.id &&
            !busy &&
            !error && (
              <div className="chat-response-notice" role="status">
                <p>{responseNotice.text}</p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={atLimit || reconnecting || !verified}
                  onClick={() => {
                    setResponseNotice(null)
                    followLatest.current = true
                    void regenerate()
                  }}
                >
                  Retry response
                </Button>
              </div>
            )}
          {failure && (
            <div className="feedback-error" role="alert">
              <p>{failure.text}</p>
              <p className="chat-note">
                No inquiry is submitted by a chat response or a chat error.
              </p>
              {failure.retry && (
                <Button
                  variant="outline"
                  disabled={busy || reconnecting || atLimit || !verified}
                  onClick={() => {
                    clearError()
                    setResponseNotice(null)
                    followLatest.current = true
                    void regenerate()
                  }}
                >
                  Retry response
                </Button>
              )}
            </div>
          )}
          {atLimit && !failure && (
            <p className="chat-note" role="status">
              This conversation has reached its length limit. Clear it to start
              a new conversation.
            </p>
          )}
          {restartError && (
            <p className="feedback-error" role="alert">
              {restartError}
            </p>
          )}
        </div>
      </div>
      <div className="chat-dock">
        {verificationRequired && publicEnv.VITE_TURNSTILE_SITE_KEY && (
          <ChatTurnstile
            siteKey={publicEnv.VITE_TURNSTILE_SITE_KEY}
            attempt={verificationAttempt}
            onToken={onVerificationToken}
          />
        )}
        <form className="chat-composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="chat-message">
            Message the assistant
          </label>
          <textarea
            id="chat-message"
            ref={textarea}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              availability === 'loading'
                ? 'Connecting…'
                : 'Tell me what you’re working on…'
            }
            maxLength={chatLimits.inputCharacters}
            rows={1}
            disabled={
              availability !== 'ready' ||
              atLimit ||
              reconnecting ||
              restoringResponse
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault()
                void submit(event)
              }
            }}
          />
          <div className="chat-composer__actions">
            {busy ? (
              <Button
                className="chat-send"
                variant="outline"
                type="button"
                aria-label="Stop"
                onClick={() => void stop()}
              >
                <Square size={16} aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="chat-send"
                aria-label="Send"
                disabled={
                  !input.trim() ||
                  availability !== 'ready' ||
                  atLimit ||
                  reconnecting ||
                  restoringResponse ||
                  !verified
                }
              >
                <ArrowUp size={20} aria-hidden="true" />
              </Button>
            )}
          </div>
        </form>
        <p className="chat-dock-note">
          AI assistant · Your inquiry is sent only after you confirm.
        </p>
      </div>
      <noscript>
        <p className="body-copy">
          Chat requires JavaScript. You can email {contactEmail} or browse the
          website.
        </p>
      </noscript>
    </main>
  )
}
