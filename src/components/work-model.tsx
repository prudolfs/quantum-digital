import { useEffect, useRef, useState } from 'react'
import type { ModelController } from '@/lib/work-model-runtime'
import { motion, useReducedMotion } from 'motion/react'
import { financeModelArt, type WorkModelArt } from '@/lib/work-model-config'

type Connection = { saveData?: boolean; effectiveType?: string }

export function WorkModel({ art = financeModelArt }: { art?: WorkModelArt }) {
  const host = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState('poster')
  const reduced = useReducedMotion()
  useEffect(() => {
    const element = host.current
    if (!element) return
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )
    const pointer = window.matchMedia('(pointer: coarse)')
    const connection = (navigator as Navigator & { connection?: Connection })
      .connection
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory
    const abort = new AbortController()
    let runtime: ModelController | undefined
    let idle: number | undefined
    let timeout: number | undefined
    let visible = true
    const fallback = () => {
      abort.abort()
      runtime?.dispose()
      runtime = undefined
      setStage('static')
    }
    const ready = () => {
      if (abort.signal.aborted) return
      clearTimeout(timeout)
      setStage('live')
    }
    const start = async () => {
      if (abort.signal.aborted) return
      setStage('loading')
      timeout = window.setTimeout(fallback, 10_000)
      try {
        const { mountWorkModel } = await import('@/lib/work-model-runtime')
        if (abort.signal.aborted) return
        const loaded = await mountWorkModel(element, {
          art,
          signal: abort.signal,
          onReady: ready,
          onFailure: fallback,
        })
        if (abort.signal.aborted) loaded.dispose()
        else {
          runtime = loaded
          runtime.setActive(visible && !document.hidden)
        }
      } catch {
        if (!abort.signal.aborted) fallback()
      }
    }
    const schedule = () => {
      if (
        motionPreference.matches ||
        pointer.matches ||
        connection?.saveData ||
        /(^|-)2g|3g/.test(connection?.effectiveType ?? '') ||
        (memory !== undefined && memory < 4)
      ) {
        setStage('static')
        return
      }
      if ('requestIdleCallback' in window)
        idle = window.requestIdleCallback(() => void start(), { timeout: 1500 })
      else void start()
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      runtime?.setActive(visible && !document.hidden)
    })
    observer.observe(element)
    const visibility = () => runtime?.setActive(visible && !document.hidden)
    const preference = () => {
      if (motionPreference.matches || pointer.matches) fallback()
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const bounds = element.getBoundingClientRect()
      runtime?.setPointer(
        (event.clientX - bounds.left) / bounds.width - 0.5,
        (event.clientY - bounds.top) / bounds.height - 0.5,
      )
    }
    const leave = () => runtime?.setPointer(0, 0)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerleave', leave)
    document.addEventListener('visibilitychange', visibility)
    motionPreference.addEventListener('change', preference)
    pointer.addEventListener('change', preference)
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })
    return () => {
      abort.abort()
      runtime?.dispose()
      observer.disconnect()
      clearTimeout(timeout)
      if (idle !== undefined) window.cancelIdleCallback(idle)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('load', schedule)
      motionPreference.removeEventListener('change', preference)
      pointer.removeEventListener('change', preference)
    }
  }, [art])
  return (
    <figure className="work-model" data-model-stage={stage}>
      <div
        className="work-model-host"
        style={{ aspectRatio: `${art.width} / ${art.height}` }}
      >
        <motion.picture
          initial={false}
          animate={{ opacity: stage === 'live' ? 0 : 1 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
        >
          <source media="(max-width:700px)" srcSet={art.mobilePoster} />
          <img
            className="work-model-poster"
            src={art.poster}
            width={art.width}
            height={art.height}
            fetchPriority="high"
            alt={art.alt}
          />
        </motion.picture>
        <motion.div
          ref={host}
          className="work-model-canvas"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: stage === 'live' ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
        />
      </div>
      <figcaption>
        {art.caption ?? 'Conceptual illustration · synthetic values'}
      </figcaption>
    </figure>
  )
}
