import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { animate } from 'motion/react'
import { Link } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'
import { ActionIcon } from '@/components/action-icon'
import { ChatLink } from '@/components/chat-link'
import { Button } from '@/components/ui/button'

const Experience = lazy(() => import('@/components/conversation-experience'))
const phrase = 'working towards?'

class EffectsBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function ConversationSection() {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [enhance, setEnhance] = useState(false)
  const [typed, setTyped] = useState(phrase.length)
  const [copyReady, setCopyReady] = useState(false)
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    let started = false
    let control: ReturnType<typeof animate> | undefined
    const update = () => {
      if (preference.matches) {
        control?.stop()
        setEnhance(false)
        setTyped(phrase.length)
        setCopyReady(false)
      } else if (started) {
        setEnhance(true)
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started) return
        started = true
        observer.disconnect()
        if (preference.matches) return
        setEnhance(true)
        setTyped(0)
        control = animate(0, phrase.length, {
          duration: phrase.length * 0.065,
          ease: 'linear',
          onUpdate: (value) => setTyped(Math.floor(value)),
          onComplete: () => {
            setTyped(phrase.length)
            setCopyReady(true)
          },
        })
      },
      { threshold: 0.25 },
    )
    if (host) observer.observe(host)
    preference.addEventListener('change', update)
    return () => {
      observer.disconnect()
      control?.stop()
      preference.removeEventListener('change', update)
    }
  }, [host])

  return (
    <section
      ref={setHost}
      id="conversation"
      className="conversation-section section-pattern section-pattern--hexagons"
      aria-labelledby="conversation-heading"
    >
      <div
        className="section-shell conversation-copy"
        data-hero-copy-ready={copyReady}
        data-typing-complete={typed === phrase.length}
      >
        <p className="eyebrow">A good place to start</p>
        <h2 id="conversation-heading" className="marketing-title">
          What are you
          <br />
          <span>
            <span className="sr-only">{phrase}</span>
            <span aria-hidden="true">
              {phrase.split(' ').map((word, wordIndex, words) => (
                <span className="reveal-word" key={word}>
                  {Array.from(word).map((letter, index) => (
                    <span
                      key={index}
                      style={{
                        opacity:
                          index + (wordIndex ? words[0]!.length + 1 : 0) < typed
                            ? 1
                            : 0,
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                  {wordIndex < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </span>
          </span>
        </h2>
        <p className="body-copy">
          Bring the idea, the workflow, or the problem you’re trying to solve.
          Let’s talk about what building it could look like.
        </p>
        <div className="action-row">
          <ChatLink />
          <Button asChild variant="outline" size="lg">
            <Link to="/chat">
              Visit the chat page <ActionIcon icon={MessageSquare} />
            </Link>
          </Button>
        </div>
      </div>
      {enhance && host ? (
        <EffectsBoundary>
          <Suspense fallback={null}>
            <Experience host={host} />
          </Suspense>
        </EffectsBoundary>
      ) : null}
    </section>
  )
}
