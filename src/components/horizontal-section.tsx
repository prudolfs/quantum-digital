import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMotionValueEvent, useScroll } from 'motion/react'

const pinTop = 104

export function HorizontalSection({
  id,
  heading,
  className = '',
  children,
}: {
  id: string
  heading: string
  className?: string
  children: ReactNode
}) {
  const runway = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLElement | null>(null)
  const [layout, setLayout] = useState({
    pinned: false,
    distance: 0,
    height: 0,
  })
  const { scrollY } = useScroll()
  const sync = () => {
    if (!layout.pinned || !track.current || !runway.current) return
    track.current.scrollLeft = Math.max(
      0,
      Math.min(
        layout.distance,
        pinTop - runway.current.getBoundingClientRect().top,
      ),
    )
  }
  useMotionValueEvent(scrollY, 'change', sync)

  useEffect(() => {
    const element = panel.current
    const row = element?.querySelector<HTMLElement>('.horizontal-track')
    if (!element || !row) return
    track.current = row
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let disposed = false
    const updateEdges = () => {
      row.style.setProperty('--scroll-left', `${Math.max(0, row.scrollLeft)}px`)
      row.style.setProperty(
        '--scroll-right',
        `${Math.max(0, row.scrollWidth - row.clientWidth - row.scrollLeft)}px`,
      )
    }
    const measure = () => {
      if (disposed) return
      const height = element.getBoundingClientRect().height
      const distance = Math.max(0, row.scrollWidth - row.clientWidth)
      updateEdges()
      const pinned =
        !reduced.matches && distance > 0 && height + pinTop + 24 <= innerHeight
      setLayout((previous) =>
        previous.pinned === pinned &&
        previous.distance === distance &&
        previous.height === height
          ? previous
          : { pinned, distance, height },
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    observer.observe(row)
    window.addEventListener('resize', measure)
    row.addEventListener('scroll', updateEdges, { passive: true })
    reduced.addEventListener('change', measure)
    document.fonts.ready.then(measure)
    measure()
    return () => {
      disposed = true
      observer.disconnect()
      window.removeEventListener('resize', measure)
      row.removeEventListener('scroll', updateEdges)
      reduced.removeEventListener('change', measure)
    }
  }, [])
  useEffect(sync, [layout])

  return (
    <section
      id={id}
      aria-labelledby={heading}
      className={`marketing-section horizontal-section ${className}${layout.pinned ? ' horizontal-section--pinned' : ''}`}
    >
      <div
        ref={runway}
        className="horizontal-section__runway"
        style={{
          height: layout.pinned ? layout.height + layout.distance : undefined,
        }}
      >
        <div
          ref={panel}
          className="horizontal-section__panel"
          style={{ top: layout.pinned ? pinTop : undefined }}
          onKeyDown={(event) => {
            if (
              !layout.pinned ||
              event.target !== track.current ||
              !runway.current ||
              !track.current
            )
              return
            const direction =
              event.key === 'ArrowRight'
                ? 1
                : event.key === 'ArrowLeft'
                  ? -1
                  : 0
            if (!direction) return
            event.preventDefault()
            const pageWidth =
              track.current.clientWidth +
              parseFloat(getComputedStyle(track.current).columnGap)
            const next = Math.max(
              0,
              Math.min(
                layout.distance,
                track.current.scrollLeft + direction * pageWidth,
              ),
            )
            window.scrollTo({
              top:
                runway.current.getBoundingClientRect().top +
                scrollY.get() -
                pinTop +
                next,
              behavior: 'instant',
            })
          }}
          onFocusCapture={(event) => {
            if (
              !layout.pinned ||
              !track.current?.contains(event.target) ||
              event.target === track.current
            )
              return
            requestAnimationFrame(() => {
              if (!runway.current || !track.current) return
              window.scrollTo({
                top:
                  runway.current.getBoundingClientRect().top +
                  window.scrollY -
                  pinTop +
                  track.current.scrollLeft,
                behavior: 'instant',
              })
            })
          }}
        >
          {children}
        </div>
      </div>
    </section>
  )
}
