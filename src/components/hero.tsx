import { ActionIcon } from '@/components/action-icon'
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ArrowDown } from 'lucide-react'
import { ChatLink } from '@/components/chat-link'
import { HeroFallback } from '@/components/hero-fallback'
import { Button } from '@/components/ui/button'

const HeroExperience = lazy(() => import('@/components/hero-experience'))
const phrase = 'Put AI to work.'

class GraphicsBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <HeroFallback /> : this.props.children
  }
}

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const [enhance, setEnhance] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [copyReady, setCopyReady] = useState(false)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: ReturnType<typeof setTimeout> | undefined
    const update = () => {
      setEnhance(!motion.matches)
      if (motion.matches) {
        setReveal(false)
        setCopyReady(false)
        if (timer) clearTimeout(timer)
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        update()
        if (!motion.matches) {
          setReveal(true)
          timer = setTimeout(
            () => setCopyReady(true),
            (phrase.length - 1) * 50 + 300,
          )
        }
        observer.disconnect()
      },
      { rootMargin: '100px' },
    )
    if (root.current) observer.observe(root.current)
    motion.addEventListener('change', update)
    return () => {
      observer.disconnect()
      motion.removeEventListener('change', update)
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <section ref={root} className="hero-section" aria-labelledby="hero-heading">
      <div className="hero-layout">
        <div className="hero-copy" data-hero-copy-ready={copyReady}>
          <p className="eyebrow">
            <span className="status-dot" /> Product Engineering & Applied AI
          </p>
          <h1 id="hero-heading" className="hero-title">
            Build better
            <br className="hero-break" /> products.
            <br />
            <span className="hero-emphasis">
              <span className="sr-only">{phrase}</span>
              <span
                aria-hidden="true"
                className={reveal ? 'letter-reveal' : undefined}
              >
                {phrase.split(' ').map((word, wordIndex, words) => (
                  <span className="reveal-word" key={`${word}-${wordIndex}`}>
                    {Array.from(word).map((letter, index) => (
                      <span
                        key={index}
                        style={{
                          animationDelay: `${(words.slice(0, wordIndex).join(' ').length + (wordIndex ? 1 : 0) + index) * 0.05}s`,
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
          </h1>
          <p className="hero-fluid-copy__description body-copy">
            I help founders and product teams build software and put AI to work
            in their business. From new products to smarter workflows and
            integrations, I take ownership from architecture to deployment.
          </p>
          <div className="action-row hero-actions">
            <ChatLink />
            <Button asChild size="lg" variant="outline">
              <a href="#work">
                Explore my work <ActionIcon icon={ArrowDown} />
              </a>
            </Button>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-art__index" aria-hidden="true">
            <span>QD / 01</span>
            <span>Ideas → useful software</span>
          </div>
          <GraphicsBoundary>
            <Suspense fallback={<HeroFallback />}>
              {enhance ? <HeroExperience /> : <HeroFallback />}
            </Suspense>
          </GraphicsBoundary>
          <div className="hero-art__caption" aria-hidden="true">
            <span className="status-dot" /> Built to move things forward.
          </div>
        </div>
      </div>
      <div className="hero-footnote section-shell">
        <span>Independent practice. End-to-end ownership.</span>
        <a href="#services">
          See what we can build <ArrowDown aria-hidden="true" size={14} />
        </a>
      </div>
    </section>
  )
}
