import { motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { useRef } from 'react'

export function FaqItem({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  const controls = useAnimationControls()
  const reducedMotion = useReducedMotion()
  const expanded = useRef(false)
  const transitionId = useRef(0)
  return (
    <details>
      <summary
        onClick={(event) => {
          event.preventDefault()
          const details = event.currentTarget
            .parentElement as HTMLDetailsElement
          const wasOpen = details.open
          const opening = !expanded.current
          expanded.current = opening
          const operation = ++transitionId.current
          controls.stop()
          details.open = true
          if (opening && !wasOpen)
            controls.set({
              height: 0,
              opacity: reducedMotion ? 1 : 0,
              y: reducedMotion ? 0 : -8,
            })
          void controls
            .start({
              height: opening ? 'auto' : 0,
              opacity: opening ? 1 : 0,
              y: opening || reducedMotion ? 0 : -8,
              transition: {
                duration: reducedMotion ? 0 : 0.32,
                ease: [0.22, 1, 0.36, 1],
              },
            })
            .then(() => {
              if (
                operation === transitionId.current &&
                !expanded.current &&
                details.isConnected
              ) {
                details.open = false
                controls.set({ height: 'auto', opacity: 1, y: 0 })
              }
            })
        }}
      >
        <ChevronRight className="faq-icon" aria-hidden="true" />
        <span>{question}</span>
      </summary>
      <motion.div
        initial={false}
        animate={controls}
        style={{ overflow: 'hidden' }}
      >
        <p className="body-copy">{answer}</p>
      </motion.div>
    </details>
  )
}
