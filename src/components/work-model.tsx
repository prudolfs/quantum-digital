import { useEffect, useRef, useState } from 'react'
import type { ModelController } from '@/lib/work-model-runtime'
import { motion, useReducedMotion } from 'motion/react'
import { financeModelArt, type WorkModelArt } from '@/lib/work-model-config'

type Connection = { saveData?: boolean }

export function WorkModel({
  art = financeModelArt,
  className = '',
}: {
  art?: WorkModelArt
  className?: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState('poster')
  const reduced = useReducedMotion()
  useEffect(() => {
    const element = host.current
    if (!element) return
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )
    const connection = (navigator as Navigator & { connection?: Connection })
      .connection
    const abort = new AbortController()
    let runtime: ModelController | undefined
    let idle: number | undefined
    let timeout: number | undefined
    let visible = true
    const lastPointer = { x: 0, y: 0 }
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
        if (art.backgroundPoster) {
          const response = await fetch(art.backgroundPoster, {
            signal: abort.signal,
          })
          if (!response.ok) throw new Error('Model background unavailable')
          const bitmap = await createImageBitmap(await response.blob())
          bitmap.close()
        }
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
          runtime.setPointer(lastPointer.x, lastPointer.y)
        }
      } catch {
        if (!abort.signal.aborted) fallback()
      }
    }
    const schedule = () => {
      if (motionPreference.matches || connection?.saveData) {
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
      if (motionPreference.matches) fallback()
    }
    const point = (event: PointerEvent) => {
      const bounds = element.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      lastPointer.x = Math.max(
        -0.5,
        Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5),
      )
      lastPointer.y = Math.max(
        -0.5,
        Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5),
      )
      runtime?.setPointer(lastPointer.x, lastPointer.y)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') point(event)
    }
    const touch = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen')
        point(event)
    }
    const leave = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      lastPointer.x = lastPointer.y = 0
      runtime?.setPointer(0, 0)
    }
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerleave', leave)
    // Passive page-wide touch tracking retains the last pose without capturing gestures.
    window.addEventListener('pointerdown', touch, { passive: true })
    window.addEventListener('pointermove', touch, { passive: true })
    document.addEventListener('visibilitychange', visibility)
    motionPreference.addEventListener('change', preference)
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
      window.removeEventListener('pointerdown', touch)
      window.removeEventListener('pointermove', touch)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('load', schedule)
      motionPreference.removeEventListener('change', preference)
    }
  }, [art])
  return (
    <figure className={`work-model ${className}`} data-model-stage={stage}>
      <div
        className="work-model-host"
        style={{
          aspectRatio: `${art.width} / ${art.height}`,
          backgroundImage:
            (stage === 'loading' || stage === 'live') && art.backgroundPoster
              ? `url(${art.backgroundPoster})`
              : undefined,
          backgroundSize: '100% 100%',
        }}
      >
        <motion.picture
          initial={false}
          animate={{ opacity: stage === 'live' ? 0 : 1 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
        >
          <source
            media={`(max-width:${art.mobileBreakpoint ?? 700}px)`}
            srcSet={art.mobilePoster}
          />
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
