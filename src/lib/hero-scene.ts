import { animate } from 'motion/react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  LinearFilter,
  Mesh,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector4,
  type Scene,
  type WebGLRenderer,
} from 'three'
import { FluidSimulation } from 'three-fluid-fx'
import type { HeroParameters, HeroQualityProfile } from '@/lib/hero-config'
import { paintHeroText } from '@/lib/hero-fluid-text'
import { HERO_SHAPE_ORDER, loadHeroShapeTargets } from '@/lib/hero-shape-assets'
import * as shaders from '@/lib/hero-scene-shaders'

type HeroSceneOptions = {
  renderer: WebGLRenderer
  scene: Scene
  host: HTMLElement
  figure: HTMLElement
  parameters: HeroParameters
  profile: Exclude<HeroQualityProfile, 'static'>
  count: number
  reducedMotion: boolean
  onReady: (ready: boolean) => void
  onError: () => void
  effectsOnly?: boolean
}

/** One fluid field and renderer serve the copy, four morph targets, and cursor. */
export function createHeroScene({
  renderer,
  scene,
  host,
  figure,
  parameters: p,
  profile,
  count,
  reducedMotion,
  onError,
  onReady,
  effectsOnly = false,
}: HeroSceneOptions) {
  const abort = new AbortController()
  const fluid = new FluidSimulation(
    renderer as unknown as ConstructorParameters<typeof FluidSimulation>[0],
    {
      profile,
      splatForce: p.fluid.force,
      splatRadius: p.fluid.radius,
      densityDissipation: p.fluid.dissipation,
      dyeDissipation: p.fluid.dissipation,
      velocityDissipation: Math.min(0.985, p.fluid.dissipation),
      curlStrength: p.fluid.curl,
      enableVorticity: p.fluid.curl > 0,
      bfecc: false,
      reflectWalls: false,
    },
  )
  fluid.enableDye = true
  const css = getComputedStyle(host)
  const color = (token: string, fallback: string) =>
    new Color(css.getPropertyValue(token).trim() || fallback)
  const shared = {
    uVelocity: { value: fluid.velocityTexture },
    uDye: { value: fluid.dyeTexture },
    uTime: { value: 0 },
    uCanvas: { value: new Vector2(1, 1) },
    uDpr: { value: renderer.getPixelRatio() },
    uGlow: { value: p.appearance.glowIntensity },
    uGold: { value: color('--color-portal-gold', '#F5B85B') },
    uAmber: { value: color('--color-portal-amber', '#C47B35') },
    uCore: { value: color('--color-portal-core', '#FFF0BD') },
    uInteraction: {
      value:
        p.fluid.enabled && !reducedMotion ? p.motion.interactionStrength : 0,
    },
  }
  const textCanvas = document.createElement('canvas')
  const textTexture = new CanvasTexture(textCanvas)
  textTexture.colorSpace = SRGBColorSpace
  textTexture.generateMipmaps = false
  textTexture.minFilter = textTexture.magFilter = LinearFilter
  const textMaterial = new ShaderMaterial({
    vertexShader: shaders.fullscreenVertex,
    fragmentShader: shaders.textFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      ...shared,
      uText: { value: textTexture },
      uPointer: { value: new Vector2(-10, -10) },
      uAspect: { value: 1 },
    },
  })
  const plane = new PlaneGeometry(2, 2)
  const text = new Mesh(plane, textMaterial)
  text.renderOrder = 3
  text.frustumCulled = false
  text.visible = false
  const overlayMaterial = new ShaderMaterial({
    vertexShader: shaders.fullscreenVertex,
    fragmentShader: shaders.overlayFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: shared,
  })
  const overlay = new Mesh(plane, overlayMaterial)
  overlay.frustumCulled = false
  overlay.visible = p.fluid.enabled && !reducedMotion
  const positions = new BufferAttribute(new Float32Array(count * 3), 3)
  const next = new BufferAttribute(new Float32Array(count * 3), 3)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', positions)
  geometry.setAttribute('aNext', next)
  geometry.setAttribute(
    'aSeed',
    new BufferAttribute(
      Float32Array.from({ length: count }, (_, i) => (i * 0.61803398875) % 1),
      1,
    ),
  )
  const shapeMaterial = new ShaderMaterial({
    vertexShader: shaders.shapeVertex,
    fragmentShader: shaders.shapeFragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    uniforms: {
      ...shared,
      uMorph: { value: 0 },
      uRect: { value: new Vector4() },
      uIdle: { value: reducedMotion ? 0 : p.motion.idleSpeed },
      uSize: { value: p.scene.particleSize * 245 },
      uSizeRange: { value: new Vector2(1, 2) },
      uMid: { value: color('--color-portal-cyan', '#398FFF') },
      uPrimary: {
        value:
          p.appearance.primaryColor.toLowerCase() === '#00aeef'
            ? color('--color-portal-blue', '#007BFF')
            : new Color(p.appearance.primaryColor),
      },
      uSecondary: {
        value:
          p.appearance.secondaryColor.toLowerCase() === '#cce9fa'
            ? color('--color-portal-ice', '#AFD7FF')
            : new Color(p.appearance.secondaryColor),
      },
      uOpacity: { value: 0 },
    },
  })
  const shapes = new Points(geometry, shapeMaterial)
  shapes.frustumCulled = false
  shapes.renderOrder = 1
  shapes.visible = false
  // Cursor particles share the quality budget, reserving at most 10% of it.
  const cursorCount = Math.max(24, Math.floor(count * 0.1))
  const cursorGeometry = new BufferGeometry()
  const cursorPositions = new BufferAttribute(
    new Float32Array(cursorCount * 3),
    3,
  )
  const born = new BufferAttribute(new Float32Array(cursorCount).fill(-100), 1)
  cursorGeometry.setAttribute('position', cursorPositions)
  cursorGeometry.setAttribute('aBorn', born)
  cursorGeometry.setAttribute(
    'aSeed',
    new BufferAttribute(
      Float32Array.from(
        { length: cursorCount },
        (_, i) => (i * 0.754877666) % 1,
      ),
      1,
    ),
  )
  const cursorMaterial = new ShaderMaterial({
    vertexShader: shaders.cursorVertex,
    fragmentShader: shaders.cursorFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: shared,
  })
  const cursor = new Points(cursorGeometry, cursorMaterial)
  cursor.frustumCulled = false
  cursor.renderOrder = 2
  cursor.visible = overlay.visible
  geometry.setDrawRange(0, count - cursorCount)
  scene.add(overlay, shapes, cursor, text)

  let disposed = false
  let active = true
  let clock = 0
  let cursorIndex = 0
  let lastPointer: { x: number; y: number; time: number } | null = null
  let control: ReturnType<typeof animate> | undefined
  let revealControl: ReturnType<typeof animate> | undefined
  let resizeNeeded = true
  let index = 0
  let pendingCopy = false
  const copy = host.querySelector<HTMLElement>(
    effectsOnly ? '.conversation-copy' : '.hero-copy',
  )
  const heading = copy?.querySelector<HTMLElement>(
    effectsOnly ? '#conversation-heading' : '#hero-heading',
  )
  const description = copy?.querySelector<HTMLElement>(
    '.hero-fluid-copy__description',
  )
  const finePointer = window.matchMedia('(pointer: fine)')
  const mobileParticles = window.matchMedia('(max-width: 639px)')
  const desktopText = window.matchMedia(
    '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
  )

  const showDOM = () => {
    copy?.classList.remove('hero-fluid-copy--ready')
    text.visible = false
    pendingCopy = false
  }
  const resize = () => {
    if (disposed) return
    const rect = host.getBoundingClientRect()
    const target = figure.getBoundingClientRect()
    const width = Math.max(1, rect.width),
      height = Math.max(1, rect.height)
    shared.uCanvas.value.set(width, height)
    shared.uDpr.value = renderer.getPixelRatio()
    shapeMaterial.uniforms.uSizeRange!.value.set(
      mobileParticles.matches ? 0.7 : 1,
      mobileParticles.matches ? 1.4 : 2,
    )
    fluid.resize(width, height)
    const scale =
      Math.min(target.width, target.height) *
      0.42 *
      Math.min(1.3, 4.8 / p.scene.cameraZ)
    shapeMaterial.uniforms.uRect!.value.set(
      target.left - rect.left + target.width / 2,
      height - (target.top - rect.top + target.height / 2),
      scale,
      scale,
    )
    textMaterial.uniforms.uAspect!.value = width / height
    showDOM()
    if (
      heading &&
      (description || effectsOnly) &&
      copy?.dataset.heroCopyReady === 'true' &&
      desktopText.matches &&
      !reducedMotion &&
      p.fluid.enabled
    ) {
      paintHeroText(
        textCanvas,
        host,
        description ? [heading, description] : [heading],
        Math.min(renderer.getPixelRatio(), 1.5),
        width,
        height,
      )
      textTexture.needsUpdate = true
      text.visible = true
      pendingCopy = true
    }
    resizeNeeded = false
  }
  // Hide the DOM paint only after the matching texture has actually been drawn.
  text.onAfterRender = () => {
    if (pendingCopy && active) {
      copy?.classList.add('hero-fluid-copy--ready')
      pendingCopy = false
    }
  }
  const scheduleResize = () => {
    resizeNeeded = true
    showDOM()
  }
  const observer = new ResizeObserver(scheduleResize)
  observer.observe(host)
  observer.observe(figure)
  if (copy) observer.observe(copy)
  if (heading) observer.observe(heading)
  if (description) observer.observe(description)
  const mutation = new MutationObserver(scheduleResize)
  if (copy)
    mutation.observe(copy, {
      attributes: true,
      attributeFilter: ['data-hero-copy-ready'],
    })
  document.fonts.ready.then(() => {
    if (!disposed) scheduleResize()
  })
  document.fonts.addEventListener('loadingdone', scheduleResize)
  finePointer.addEventListener('change', scheduleResize)
  desktopText.addEventListener('change', scheduleResize)
  window.addEventListener('resize', scheduleResize)

  const move = (event: PointerEvent) => {
    if (
      !active ||
      !overlay.visible ||
      !finePointer.matches ||
      event.pointerType === 'touch'
    )
      return
    if ((event.target as Element).closest('a,button,input,select,textarea')) {
      lastPointer = null
      return
    }
    const rect = host.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = 1 - (event.clientY - rect.top) / rect.height
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      lastPointer = null
      return
    }
    textMaterial.uniforms.uPointer!.value.set(x, y)
    if (lastPointer && event.timeStamp - lastPointer.time < 180) {
      const dx = event.clientX - lastPointer.x,
        dy = lastPointer.y - event.clientY
      const speed = Math.hypot(dx, dy)
      if (speed > 0.4) {
        fluid.addSplat(
          x,
          y,
          Math.max(-80, Math.min(80, dx)) * p.fluid.force,
          Math.max(-80, Math.min(80, dy)) * p.fluid.force,
          {
            dyeColor: [
              shared.uGold.value.r * 0.65,
              shared.uGold.value.g * 0.65,
              shared.uGold.value.b * 0.65,
            ],
          },
        )
        const emissions = Math.min(10, Math.ceil(speed / 3))
        for (let i = 0; i < emissions; i++) {
          const t = (i + 1) / emissions
          cursorPositions.setXYZ(
            cursorIndex,
            x - (dx / rect.width) * (1 - t),
            y - (dy / rect.height) * (1 - t),
            0,
          )
          born.setX(cursorIndex, clock)
          cursorIndex = (cursorIndex + 1) % cursorCount
        }
        cursorPositions.needsUpdate = true
        born.needsUpdate = true
      }
    }
    lastPointer = { x: event.clientX, y: event.clientY, time: event.timeStamp }
  }
  const leave = () => {
    lastPointer = null
  }
  window.addEventListener('pointermove', move, { passive: true })
  host.addEventListener('pointerleave', leave)

  if (effectsOnly) onReady(true)
  else
    Promise.all(
      HERO_SHAPE_ORDER.map((shape) =>
        loadHeroShapeTargets(shape, count, abort.signal),
      ),
    )
      .then((targets) => {
        if (disposed) return
        positions.copyArray(targets[0]!.positions)
        next.copyArray(targets[1]!.positions)
        positions.needsUpdate = next.needsUpdate = true
        shapes.visible = true
        // Wait for the first real model draw before dismissing the loading visual.
        shapes.onAfterRender = () => {
          shapes.onAfterRender = () => {}
          if (disposed) return
          onReady(true)
          revealControl = animate(0, p.appearance.particleOpacity, {
            duration: reducedMotion ? 0 : 0.7,
            ease: 'easeOut',
            onUpdate: (value) => {
              shapeMaterial.uniforms.uOpacity!.value = value
            },
          })
          if (!active) revealControl.pause()
        }
        figure.dataset.heroShape = HERO_SHAPE_ORDER[0]
        figure.dataset.heroAssetSource = targets.some(
          (t) => t.source === 'fallback',
        )
          ? 'fallback'
          : 'model'
        const cycle = () => {
          if (disposed || reducedMotion || p.motion.idleSpeed === 0) return
          control = animate(0, 1, {
            delay: 5.5,
            duration: 2.8,
            ease: 'easeInOut',
            onUpdate: (value) => {
              shapeMaterial.uniforms.uMorph!.value = value
            },
            onComplete: () => {
              if (disposed) return
              index = (index + 1) % HERO_SHAPE_ORDER.length
              positions.copyArray(targets[index]!.positions)
              next.copyArray(targets[(index + 1) % targets.length]!.positions)
              positions.needsUpdate = next.needsUpdate = true
              shapeMaterial.uniforms.uMorph!.value = 0
              figure.dataset.heroShape = HERO_SHAPE_ORDER[index]
              cycle()
            },
          })
          if (!active) control.pause()
        }
        cycle()
      })
      .catch(() => {
        if (!disposed && !abort.signal.aborted) onError()
      })

  return {
    setActive(value: boolean) {
      active = value
      if (value) {
        control?.play()
        revealControl?.play()
      } else {
        control?.pause()
        revealControl?.pause()
        lastPointer = null
      }
    },
    tick(delta: number) {
      if (disposed || !active) return
      if (resizeNeeded) resize()
      clock += Math.min(delta, 1 / 30)
      shared.uTime.value = clock
      shared.uDpr.value = renderer.getPixelRatio()
      if (p.fluid.enabled && !reducedMotion) fluid.step(Math.min(delta, 1 / 30))
      shared.uVelocity.value = fluid.velocityTexture
      shared.uDye.value = fluid.dyeTexture
    },
    dispose() {
      disposed = true
      abort.abort()
      control?.stop()
      revealControl?.stop()
      showDOM()
      observer.disconnect()
      mutation.disconnect()
      window.removeEventListener('resize', scheduleResize)
      document.fonts.removeEventListener('loadingdone', scheduleResize)
      finePointer.removeEventListener('change', scheduleResize)
      desktopText.removeEventListener('change', scheduleResize)
      window.removeEventListener('pointermove', move)
      host.removeEventListener('pointerleave', leave)
      scene.remove(overlay, shapes, cursor, text)
      for (const material of [
        textMaterial,
        overlayMaterial,
        shapeMaterial,
        cursorMaterial,
      ])
        material.dispose()
      plane.dispose()
      geometry.dispose()
      cursorGeometry.dispose()
      textTexture.dispose()
      fluid.dispose()
    },
  }
}
