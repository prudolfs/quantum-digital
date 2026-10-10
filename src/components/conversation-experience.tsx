import { useDetectGPU } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { UnifiedHeroScene } from '@/components/hero-experience'
import { defaultHeroParameters, resolveHeroQuality } from '@/lib/hero-config'

export default function ConversationExperience({
  host,
}: {
  host: HTMLElement
}) {
  const gpu = useDetectGPU()
  const reducedMotion = Boolean(useReducedMotion())
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(false)
  const [effectsReady, setEffectsReady] = useState(false)
  const fail = useCallback(() => setFailed(true), [])
  const quality = resolveHeroQuality({
    gpuTier: gpu.tier,
    isMobile: Boolean(gpu.isMobile),
    reducedMotion,
    parameters: defaultHeroParameters,
  })

  useEffect(() => {
    let visible = false
    const update = () => setActive(visible && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      update()
    })
    observer.observe(host)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [host])

  if (failed || quality.profile === 'static') return null
  return (
    <div
      className="conversation-canvas"
      aria-hidden="true"
      data-effects-ready={effectsReady}
    >
      <Canvas
        dpr={quality.dpr}
        frameloop={active ? 'always' : 'never'}
        gl={{ alpha: true, antialias: false }}
        fallback={null}
      >
        <UnifiedHeroScene
          host={host}
          figure={host}
          parameters={defaultHeroParameters}
          profile={quality.profile}
          count={quality.particleCount}
          reducedMotion={reducedMotion}
          active={active}
          onError={fail}
          onReady={setEffectsReady}
          effectsOnly
        />
      </Canvas>
    </div>
  )
}
