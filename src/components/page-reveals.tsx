import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { inView } from 'motion'
import { animate } from 'motion/mini'

// Animate content, rather than layout containers: sticky tracks, full-width
// patterns, and interactive 3D/hero effects keep their original geometry.
const revealTargets = [
  '[data-page-reveal]',
  '.section-intro',
  '.approach-copy',
  '.work-card',
  '.service-card',
  '.engagement-card',
  '.work-empty',
  '.work-hero-grid > div:first-child',
  '.work-facts > div',
  '.about-intro-note',
  '.work-section-intro',
  '.work-applications > section',
  '.work-steps > li',
  '.work-evidence-grid > figure',
  '.work-decisions > li',
  '.service-process > li',
  '.work-related > a',
  '.about-journey > li',
  '.about-practice-grid > section',
  '.about-explorations > a',
  '.faq-list > details',
  '.work-closing',
  '.case-study > header',
  '.case-study > .display-title',
  '.case-study > section',
  '.case-study > footer',
  '.conversation-copy > .body-copy',
  '.conversation-copy > .action-row',
].join(',')

export function PageReveals() {
  // Wait for the destination content to commit, rather than the pending URL.
  const pathname = useRouterState({
    select: (state) => state.resolvedLocation?.pathname,
  })
  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/admin')) return
    const root = document.getElementById('main-content')
    if (!root) return
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const chat = pathname === '/chat'
    const candidates = Array.from(
      root.querySelectorAll<HTMLElement>(chat ? '.chat-header' : revealTargets),
    )
    // Avoid multiplying opacity and movement when a target contains another.
    const targets = candidates.filter(
      (element) =>
        !candidates.some(
          (other) => other !== element && other.contains(element),
        ),
    )
    const cleanup: Array<() => void> = []
    const revealImmediately = new Map<HTMLElement, () => void>()
    const start = () => {
      if (preference.matches) return
      for (const element of targets) {
        const opacity = element.style.opacity
        const transform = element.style.transform
        let control: ReturnType<typeof animate> | undefined
        let shown = false
        const restore = () => {
          element.style.opacity = opacity
          element.style.transform = transform
        }
        const show = () => {
          if (shown) return
          shown = true
          const siblings = Array.from(
            element.parentElement?.children ?? [],
          ).filter((child) => targets.includes(child as HTMLElement))
          const delay = chat
            ? 0
            : Math.min(Math.max(0, siblings.indexOf(element)), 3) * 0.07
          control = animate(
            element,
            {
              opacity: [0, 1],
              transform: [`translateY(${chat ? 16 : 24}px)`, 'translateY(0px)'],
            },
            {
              duration: chat ? 0.55 : 0.7,
              delay,
              ease: [0.22, 1, 0.36, 1],
            },
          )
          // Wait for both native property tweens before removing their styles.
          // This leaves text without a persistent compositing transform.
          void control.then(restore)
        }
        element.style.opacity = '0'
        // The observer measures the original layout, without a hidden offset.
        const stop = chat ? undefined : inView(element, show, { amount: 0.12 })
        if (chat) show()
        revealImmediately.set(element, () => {
          shown = true
          control?.stop()
          restore()
        })
        cleanup.push(() => {
          stop?.()
          control?.stop()
          restore()
        })
      }
    }
    const reset = () => {
      cleanup.splice(0).forEach((dispose) => dispose())
      revealImmediately.clear()
    }
    // Turning reduced motion on also finishes any pending/active reveals.
    const preferenceChanged = () => {
      if (preference.matches) reset()
    }
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return
      for (const [element, show] of revealImmediately) {
        if (element.contains(event.target)) show()
      }
    }
    start()
    preference.addEventListener('change', preferenceChanged)
    root.addEventListener('focusin', focus)
    return () => {
      reset()
      preference.removeEventListener('change', preferenceChanged)
      root.removeEventListener('focusin', focus)
    }
  }, [pathname])
  return null
}
