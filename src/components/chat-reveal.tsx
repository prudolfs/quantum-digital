import { useEffect, useRef, type ReactNode } from 'react'
import { animate } from 'motion/mini'

export function ChatReveal({
  children,
  as: Tag = 'div',
  className,
  entrance = true,
}: {
  children: ReactNode
  as?: 'article' | 'div'
  className?: string
  entrance?: boolean
}) {
  const host = useRef<HTMLElement | null>(null)
  // Capture the initial choice: streamed text/form updates never replay it.
  const shouldAnimate = useRef(entrance)
  useEffect(() => {
    const element = host.current
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    if (!element || !shouldAnimate.current || preference.matches) return
    const opacity = element.style.opacity
    const transform = element.style.transform
    const restore = () => {
      element.style.opacity = opacity
      element.style.transform = transform
    }
    const control = animate(
      element,
      {
        opacity: [0, 1],
        transform: ['translateY(12px)', 'translateY(0px)'],
      },
      { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
    )
    void control.then(restore)
    const finish = () => {
      control.stop()
      restore()
    }
    const changed = () => {
      if (preference.matches) finish()
    }
    preference.addEventListener('change', changed)
    return () => {
      finish()
      preference.removeEventListener('change', changed)
    }
  }, [])
  return (
    <Tag
      ref={(element) => {
        host.current = element
      }}
      className={className}
    >
      {children}
    </Tag>
  )
}
