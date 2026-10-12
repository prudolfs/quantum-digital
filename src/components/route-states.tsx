import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'

export function LoadingState() {
  const reducedMotion = useReducedMotion()
  return (
    <section
      className="state-panel state-panel--loading"
      role="status"
      aria-live="polite"
    >
      <motion.div
        className="loading-spinner"
        aria-hidden="true"
        initial={{ rotate: 0 }}
        animate={{ rotate: reducedMotion ? 0 : 360 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 1.1, repeat: Infinity, ease: 'linear' }
        }
      >
        <LoaderCircle size={36} strokeWidth={1.5} />
      </motion.div>
      <p className="eyebrow">One moment</p>
      <h1 className="section-title">Loading the page…</h1>
    </section>
  )
}

export function ErrorState({ reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <section className="state-panel" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="section-title">This page could not load.</h1>
      <p className="body-copy">Try again or return to the homepage.</p>
      <div className="action-row">
        <Button
          onClick={async () => {
            await router.invalidate()
            reset()
          }}
        >
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </section>
  )
}

export function NotFoundState() {
  return (
    <section className="state-panel">
      <p className="eyebrow">404</p>
      <h1 className="section-title">Page not found.</h1>
      <p className="body-copy">
        The page may have moved, or the address may be incorrect.
      </p>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </section>
  )
}
