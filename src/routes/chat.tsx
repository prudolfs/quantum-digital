import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Send, Square, RotateCcw } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isToolUIPart } from 'ai'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  InquiryReview,
  preparedInquirySchema,
} from '@/components/inquiry-review'
import { pageHead } from '@/lib/seo'
import { loadPublishedContent } from '@/server/content'

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
    settings: { contactEmail },
  } = Route.useLoaderData()
  const [availability, setAvailability] = useState<
    'loading' | 'ready' | 'unavailable'
  >('loading')
  const [input, setInput] = useState('')
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
  } = useChat({ transport: new DefaultChatTransport({ api: '/api/chat' }) })
  const busy = status === 'submitted' || status === 'streaming'
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
    if (messages.length || busy)
      latest.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, busy])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!input.trim() || busy || availability !== 'ready') return
    const text = input.trim()
    setInput('')
    await sendMessage({ text })
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
                return (
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
                    onEdit={() =>
                      void sendMessage({
                        text: 'I want to change the inquiry details before submitting. Please ask what I would like to change.',
                      })
                    }
                  />
                ) : null
              }
              if (isToolUIPart(part) && part.state === 'output-error')
                return (
                  <p key={index} className="feedback-error">
                    The inquiry draft couldn’t be prepared. Please retry.
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
          {[
            'I have an idea for a product',
            'I want to use AI or automate a workflow',
            'Show me relevant work',
            'I’d like to discuss working together',
          ].map((prompt) => (
            <button
              key={prompt}
              disabled={busy}
              onClick={() => void sendMessage({ text: prompt })}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
      {error && (
        <div className="feedback-error" role="alert">
          <p>
            The assistant couldn’t finish its response. Your inquiry hasn’t been
            submitted by this error.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              clearError()
              void regenerate()
            }}
          >
            Retry response
          </Button>
        </div>
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
          maxLength={2000}
          rows={3}
          disabled={availability !== 'ready'}
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
              disabled={!input.trim() || availability !== 'ready'}
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
          onClick={() => {
            void stop()
            setMessages([])
            clearError()
            setInput('')
          }}
        >
          <RotateCcw size={16} aria-hidden="true" /> Clear conversation
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
