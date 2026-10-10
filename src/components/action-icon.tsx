import { useEffect, useRef, useState } from 'react'
import { hover } from 'motion'
import { motion, useReducedMotion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

export function ActionIcon({ icon: Icon }: { icon: LucideIcon }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [hovered, setHovered] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const control = ref.current?.closest('a, button')
    if (!control) return
    return hover(control, () => {
      setHovered(true)
      return () => setHovered(false)
    })
  }, [])

  return (
    <motion.span
      ref={ref}
      className="action-icon"
      aria-hidden="true"
      initial={false}
      animate={{ scale: hovered && !reducedMotion ? 1.2 : 1 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 400, damping: 24 }
      }
    >
      <Icon />
    </motion.span>
  )
}
