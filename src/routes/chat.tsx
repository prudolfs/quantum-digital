import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Send, Square, RotateCcw } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isToolUIPart } from 'ai'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
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
} from '../../shared/chat'
import { profileLinks } from '@/content/site'
import { publicEnv } from '@/env'

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
    transport: new DefaultChatTransport({ api: '/api/chat' }),
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
  const atLimit =
    messages.length >= chatLimits.messages ||
    JSON.stringify(messages).length >= chatLimits.conversationCharacters
  const failure = error ? chatErrorNotice(error.message) : null
  const activeDraft = messages
    .flatMap((message) =>
      message.parts.filter(
        (part) =>
          isToolUIPart(part) &&
          part.type === 'tool-prepareInquiry' &&
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
      ...studies.flatMap((study) =>
        [study.repositoryUrl, study.demoUrl].filter((url): url is string =>
          Boolean(url),
        ),
      ),
    ])
  }, [caseStudies, contactEmail, messages])
  useEffect(() => {
    const abort = new AbortController()
    fetch('/api/chat-session', { signal: abort.signal })
      .then((response) => response.json())
      .then((result: { available?: boolean }) =>
        setAvailability(result.available ? 'ready' : 'unavailable'),
      )
      .catch(() => {
        if (!abort.signal.aborted) setAvailability('unavailable')
      })
    return () => abort.abort()
  }, [])
  useEffect(() => {
    const onScroll = () => {
      followLatest.current =
        (latest.current?.getBoundingClientRect().top ?? 0) <
        window.innerHeight + 160
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    if (followLatest.current && (messages.length || busy))
      latest.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, busy])
  async function send(text: string) {
    if (
      !text.trim() ||
      busy ||
      reconnecting ||
      atLimit ||
      availability !== 'ready'
    )
      return
    followLatest.current = true
    setResponseNotice(null)
    clearError()
    await sendMessage({ text: text.trim() })
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!input.trim() || busy || atLimit) return
    const text = input
    setInput('')
    await send(text)
  }
  async function clearConversation() {
    setReconnecting(true)
    await stop()
    setMessages([])
    clearError()
    setInput('')
    setResponseNotice(null)
    followLatest.current = true
    try {
      const response = await fetch('/api/chat-session')
      const result = (await response.json()) as { available?: boolean }
      setAvailability(response.ok && result.available ? 'ready' : 'unavailable')
    } catch {
      setAvailability('unavailable')
    } finally {
      setReconnecting(false)
    }
  }
  return (
    <section className="chat-page chat-page--live">
      <Link to="/" className="text-link">
        <ArrowLeft aria-hidden="true" size={16} /> Back to the website
      </Link>
      <header className="chat-header">
        <p className="eyebrow">Quantum Digital / AI project assistant</p>
        <h1 className="marketing-title">
          Let’s talk about <span>your project.</span>
        </h1>
        <p className="body-copy">
          Start with what you want to build or improve. I’ll help you explore
          the offer and prepare an inquiry for Rudolfs.
        </p>
      </header>
      <p className="chat-privacy">
        You’re chatting with an AI assistant. A request is submitted only after
        you review the details and click confirm.{' '}
        <Link to="/privacy">How your information is used</Link>
      </p>
      {availability === 'unavailable' && (
        <div className="chat-unavailable" role="status">
          <h2 className="section-title">
            The assistant is currently unavailable.
          </h2>
          <p className="body-copy">
            You can still browse the work and services, or email{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. No inquiry
            has been submitted.
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
                part.type === 'tool-prepareInquiry' &&
                part.state === 'output-available'
              ) {
                const parsed = preparedInquirySchema.safeParse(part.output)
                return parsed.success ? (
                  <InquiryReview
                    key={part.toolCallId}
                    draft={parsed.data}
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
                  <p key={part.toolCallId} className="chat-note" role="status">
                    {part.type === 'tool-prepareInquiry'
                      ? 'Preparing details for your review…'
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
      {messages.length === 0 && availability === 'ready' && (
        <div className="starter-prompts">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              disabled={busy || reconnecting}
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
              disabled={atLimit || reconnecting}
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
              disabled={busy || reconnecting || atLimit}
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
          This conversation has reached its length limit. Clear it to start a
          new conversation.
        </p>
      )}
      <form className="chat-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="chat-message">
          Message the assistant
        </label>
        <textarea
          id="chat-message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            availability === 'loading'
              ? 'Connecting…'
              : 'Tell me what you’re working on…'
          }
          maxLength={chatLimits.inputCharacters}
          rows={3}
          disabled={availability !== 'ready' || atLimit || reconnecting}
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
          <span className="chat-note">
            Name and email can come later. Timing and budget are optional.
          </span>
          {busy ? (
            <Button variant="outline" type="button" onClick={() => void stop()}>
              <Square size={14} aria-hidden="true" /> Stop
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={
                !input.trim() ||
                availability !== 'ready' ||
                atLimit ||
                reconnecting
              }
            >
              Send <Send size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </form>
      {messages.length > 0 && (
        <Button
          variant="outline"
          type="button"
          disabled={reconnecting}
          onClick={() => void clearConversation()}
        >
          <RotateCcw size={16} aria-hidden="true" />{' '}
          {reconnecting ? 'Reconnecting…' : 'Clear conversation'}
        </Button>
      )}
      <noscript>
        <p className="body-copy">
          Chat requires JavaScript. You can email {contactEmail} or browse the
          website.
        </p>
      </noscript>
    </section>
  )
}
