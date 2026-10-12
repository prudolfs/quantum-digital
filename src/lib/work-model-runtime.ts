import {
  AgXToneMapping,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  Texture,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Object3D, Material, BufferGeometry } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { WorkModelArt } from './work-model-config'

export type ModelController = {
  setPointer: (x: number, y: number) => void
  setActive: (active: boolean) => void
  dispose: () => void
}

function disposeModel(root: Object3D) {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    geometries.add(object.geometry)
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material))
        if (value instanceof Texture) textures.add(value)
    }
  })
  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) material.dispose()
  for (const texture of textures) {
    texture.dispose()
    // Embedded glTF textures can own ImageBitmaps as well as GPU resources.
    const image = texture.image as { close?: () => void } | undefined
    if (typeof image?.close === 'function') image.close()
  }
}

export async function mountWorkModel(
  host: HTMLElement,
  {
    art,
    signal,
    onReady,
    onFailure,
  }: {
    art: WorkModelArt
    signal: AbortSignal
    onReady: () => void
    onFailure: () => void
  },
): Promise<ModelController> {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  })
  if (!context) throw new Error('Graphics unavailable')
  const renderer = new WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.toneMapping = AgXToneMapping
  renderer.toneMappingExposure = 1
  const scene = new Scene()
  const camera = new OrthographicCamera(-3, 3, 2, -2, 0.1, 100)
  const target = new Vector3(...art.target)
  camera.position.set(...art.camera)
  camera.lookAt(target)
  // Match the Blender camera and the poster's recorded transparent crop.
  const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
  const up = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
  const shift = right
    .multiplyScalar(art.cropShift[0])
    .add(up.multiplyScalar(art.cropShift[1]))
  camera.position.add(shift)
  camera.lookAt(target.clone().add(shift))
  if (!art.bakedLighting) {
    scene.add(new HemisphereLight('#cce9fa', '#17334a', 1.5))
    for (const [position, intensity, color] of [
      [[0, 8, 6], 3, '#fff2dc'],
      [[4, 6, -3], 3.5, '#8cc2ff'],
      [[-5, 3, 2], 1.5, '#bfd9ff'],
    ] as const) {
      const light = new DirectionalLight(color, intensity)
      light.position.set(position[0], position[1], position[2])
      light.target.position.copy(target)
      scene.add(light, light.target)
    }
  }
  const pivot = new Group()
  pivot.position.copy(target)
  scene.add(pivot)
  let frame = 0
  let disposed = false
  let active = true
  let modelReady = false
  let readyNotified = false
  const pointer = { x: 0, y: 0 }
  let count = 0
  const render = () => {
    frame = 0
    if (disposed || !active || !modelReady) return
    const targetY = pointer.x * 0.12
    const targetX = pointer.y * 0.05
    pivot.rotation.y += (targetY - pivot.rotation.y) * 0.16
    pivot.rotation.x += (targetX - pivot.rotation.x) * 0.16
    try {
      renderer.render(scene, camera)
      host.dataset.modelFrames = String(++count)
      if (!readyNotified) {
        readyNotified = true
        onReady()
      }
      if (
        Math.abs(targetY - pivot.rotation.y) +
          Math.abs(targetX - pivot.rotation.x) >
        0.0001
      )
        frame = requestAnimationFrame(render)
    } catch {
      onFailure()
    }
  }
  const invalidate = () => {
    if (!frame && !disposed && active && modelReady)
      frame = requestAnimationFrame(render)
  }
  const resize = () => {
    if (disposed) return
    const { width, height } = host.getBoundingClientRect()
    if (!width || !height) return
    const vertical = Math.max(
      art.verticalSpan,
      art.horizontalSpan / (width / height),
    )
    camera.top = vertical / 2
    camera.bottom = -vertical / 2
    camera.right = (vertical * width) / height / 2
    camera.left = -camera.right
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
    invalidate()
  }
  const observer = new ResizeObserver(resize)
  const lost = (event: Event) => {
    event.preventDefault()
    onFailure()
  }
  canvas.addEventListener('webglcontextlost', lost)
  const dispose = () => {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frame)
    observer.disconnect()
    canvas.removeEventListener('webglcontextlost', lost)
    signal.removeEventListener('abort', dispose)
    disposeModel(scene)
    renderer.dispose()
    renderer.forceContextLoss()
    canvas.remove()
  }
  signal.addEventListener('abort', dispose, { once: true })
  try {
    signal.throwIfAborted()
    const response = await fetch(art.model, { signal })
    if (!response.ok) throw new Error('Model unavailable')
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > 320_000) throw new Error('Model exceeds budget')
    const gltf = await new GLTFLoader().parseAsync(bytes, '')
    if (art.bakedLighting) {
      gltf.scene.traverse((object) => {
        if (!(object instanceof Mesh)) return
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          material.toneMapped = false
      })
    }
    if (signal.aborted) {
      disposeModel(gltf.scene)
      signal.throwIfAborted()
    }
    gltf.scene.position.sub(target)
    pivot.add(gltf.scene)
    signal.throwIfAborted()
    host.append(canvas)
    resize()
    observer.observe(host)
    await renderer.compileAsync(scene, camera)
    signal.throwIfAborted()
    modelReady = true
    invalidate()
    return {
      setPointer(x, y) {
        pointer.x = Math.max(-0.5, Math.min(0.5, x))
        pointer.y = Math.max(-0.5, Math.min(0.5, y))
        invalidate()
      },
      setActive(value) {
        active = value
        if (!active) {
          cancelAnimationFrame(frame)
          frame = 0
        } else invalidate()
      },
      dispose,
    }
  } catch (error) {
    dispose()
    throw error
  }
}
