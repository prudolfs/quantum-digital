import {
  AdaptiveDpr,
  PerformanceMonitor,
  useDetectGPU,
} from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { Scene, WebGLRenderer } from 'three'
import { HeroFallback } from '@/components/hero-fallback'
import { createHeroScene } from '@/lib/hero-scene'
import {
  defaultHeroParameters,
  resolveHeroQuality,
  type HeroParameters,
  type HeroQualityProfile,
} from '@/lib/hero-config'

type Benchmark = {
  fps: number
  profile: HeroQualityProfile
  particleCount: number
}

class HeroErrorBoundary extends Component<
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

export default function PublicHeroExperience() {
  return <HeroExperience parameters={defaultHeroParameters} />
}

export function HeroExperience({
  parameters,
  inspector = false,
}: {
  parameters: HeroParameters
  inspector?: boolean
}) {
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null)
  return (
    <HeroErrorBoundary>
      <Suspense fallback={<HeroFallback />}>
        <CapabilityAwareHero
          parameters={parameters}
          onBenchmark={setBenchmark}
          benchmark={benchmark}
          showBenchmark={
            inspector ||
            new URLSearchParams(window.location.search).has('heroMetrics')
          }
        />
      </Suspense>
    </HeroErrorBoundary>
  )
}

function CapabilityAwareHero({
  parameters,
  onBenchmark,
  benchmark,
  showBenchmark,
}: {
  parameters: HeroParameters
  onBenchmark: (benchmark: Benchmark) => void
  benchmark: Benchmark | null
  showBenchmark: boolean
}) {
  const gpu = useDetectGPU()
  const reducedMotion = Boolean(useReducedMotion())
  const [degraded, setDegraded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [hasWebGL] = useState(() => {
    const context = document.createElement('canvas').getContext('webgl2')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(context)
  })
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [active, setActive] = useState(true)
  const [figure, setFigure] = useState<HTMLElement | null>(null)
  const bindFigure = useCallback((element: HTMLElement | null) => {
    setFigure(element)
    setHost(element?.closest<HTMLElement>('.hero-section') ?? element)
  }, [])
  const fail = useCallback(() => setFailed(true), [])
  const quality = resolveHeroQuality({
    gpuTier: degraded ? Math.min(gpu.tier, 1) : gpu.tier,
    isMobile: Boolean(gpu.isMobile),
    reducedMotion,
    parameters,
  })
  const isStatic = !hasWebGL || failed || quality.profile === 'static'
  useEffect(() => {
    if (isStatic || !figure) return
    const element = figure.closest<HTMLElement>('.hero-section') ?? figure
    let intersecting = true
    const update = () => setActive(intersecting && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = Boolean(entry?.isIntersecting)
      update()
    })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [isStatic, figure])
  if (isStatic) return <HeroFallback />
  return (
    <figure
      ref={bindFigure}
      className="hero-visual hero-visual--webgl"
      aria-label="Interactive Q symbol, robot, rocket and diamond particle sequence"
      data-hero-fps={benchmark?.fps}
      data-hero-particles={quality.particleCount}
      data-hero-profile={quality.profile}
      data-hero-active={active}
      data-hero-loading={!modelReady}
    >
      <AnimatePresence initial={false}>
        {!modelReady ? (
          <motion.div
            key="hero-preloader"
            className="hero-visual__preloader"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4 }}
          >
            <HeroFallback />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {host && figure
        ? createPortal(
            <div className="hero-shared-canvas" aria-hidden="true">
              <Canvas
                dpr={quality.dpr}
                frameloop={active ? 'always' : 'never'}
                gl={{ alpha: true, antialias: false }}
                fallback={null}
              >
                <PerformanceMonitor
                  flipflops={2}
                  onDecline={() => setDegraded(true)}
                />
                <AdaptiveDpr />
                <UnifiedHeroScene
                  host={host}
                  figure={figure}
                  parameters={parameters}
                  profile={
                    quality.profile as Exclude<HeroQualityProfile, 'static'>
                  }
                  count={quality.particleCount}
                  reducedMotion={reducedMotion}
                  active={active}
                  onError={fail}
                  onReady={setModelReady}
                />
                <FrameBenchmark
                  key={`${quality.profile}-${quality.particleCount}`}
                  particleCount={quality.particleCount}
                  profile={quality.profile}
                  onComplete={onBenchmark}
                />
              </Canvas>
            </div>,
            host,
          )
        : null}
      {showBenchmark ? (
        <div className="hero-visual__metrics">
          {quality.profile} · {quality.particleCount.toLocaleString()} particles
          {benchmark ? ` · ${benchmark.fps} fps` : ''}
        </div>
      ) : null}
    </figure>
  )
}

export function UnifiedHeroScene({
  host,
  figure,
  parameters,
  profile,
  count,
  reducedMotion,
  active,
  onError,
  onReady,
  effectsOnly = false,
}: {
  host: HTMLElement
  figure: HTMLElement
  parameters: HeroParameters
  profile: Exclude<HeroQualityProfile, 'static'>
  count: number
  reducedMotion: boolean
  active: boolean
  onError: () => void
  onReady: (ready: boolean) => void
  effectsOnly?: boolean
}) {
  const { gl, scene } = useThree()
  const runtime = useRef<ReturnType<typeof createHeroScene> | null>(null)
  const activeRef = useRef(active)
  useEffect(() => {
    onReady(false)
    try {
      runtime.current = createHeroScene({
        // R3F resolves the library’s older Three type declarations.
        renderer: gl as unknown as WebGLRenderer,
        scene: scene as unknown as Scene,
        host,
        figure,
        parameters,
        profile,
        count,
        reducedMotion,
        onError,
        onReady,
        effectsOnly,
      })
      runtime.current.setActive(activeRef.current)
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Hero scene unavailable', error)
      onError()
    }
    const lost = (event: Event) => {
      event.preventDefault()
      onError()
    }
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => {
      runtime.current?.dispose()
      runtime.current = null
      gl.domElement.removeEventListener('webglcontextlost', lost)
    }
  }, [
    gl,
    scene,
    host,
    figure,
    parameters,
    profile,
    count,
    reducedMotion,
    onError,
    onReady,
    effectsOnly,
  ])
  useEffect(() => {
    activeRef.current = active
    runtime.current?.setActive(active)
  }, [active])
  useFrame((_state, delta) => {
    try {
      runtime.current?.tick(delta)
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Hero scene unavailable', error)
      onError()
    }
  })
  return null
}

function FrameBenchmark({
  profile,
  particleCount,
  onComplete,
}: Omit<Benchmark, 'fps'> & { onComplete: (result: Benchmark) => void }) {
  const frameCount = useRef(0)
  const elapsed = useRef(0)
  const completed = useRef(false)
  useFrame((_state, delta) => {
    if (completed.current) return
    frameCount.current += 1
    elapsed.current += Math.min(delta, 0.1)
    if (elapsed.current >= 0.5) {
      completed.current = true
      onComplete({
        fps: Math.round(frameCount.current / elapsed.current),
        profile,
        particleCount,
      })
    }
  })
  return null
}
