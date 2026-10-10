export const HERO_SHAPE_ORDER = [
  'q-symbol',
  'robot',
  'rocket',
  'diamond',
] as const
export const HERO_SHAPE_POINT_COUNT = 6000

export type HeroShape = (typeof HERO_SHAPE_ORDER)[number]
export type HeroShapeTargets = {
  positions: Float32Array
  source: 'model' | 'fallback'
}

function decodeTargets(buffer: ArrayBuffer, count: number): Float32Array {
  if (buffer.byteLength !== HERO_SHAPE_POINT_COUNT * 3 * 2) {
    throw new Error('Invalid hero target buffer length')
  }
  const view = new DataView(buffer)
  const positions = new Float32Array(count * 3)
  for (let index = 0; index < HERO_SHAPE_POINT_COUNT * 3; index++) {
    const value = view.getInt16(index * 2, true)
    if (value === -32768)
      throw new Error('Hero target outside normalized bounds')
    if (index < positions.length) positions[index] = value / 32767
  }
  return positions
}

/** Prepared for Phase 4; importing this module does not load or start a scene. */
export async function loadHeroShapeTargets(
  shape: HeroShape,
  count = HERO_SHAPE_POINT_COUNT,
  signal?: AbortSignal,
): Promise<HeroShapeTargets> {
  if (!Number.isInteger(count) || count < 1 || count > HERO_SHAPE_POINT_COUNT) {
    throw new Error('Hero point count must be between 1 and 6000')
  }
  for (const source of ['model', 'fallback'] as const) {
    try {
      const directory = source === 'model' ? 'targets' : 'fallbacks'
      const response = await fetch(`/hero/${directory}/${shape}.i16`, {
        signal,
      })
      if (!response.ok)
        throw new Error(`Hero asset request failed: ${response.status}`)
      return {
        positions: decodeTargets(await response.arrayBuffer(), count),
        source,
      }
    } catch (error) {
      if (signal?.aborted || source === 'fallback') throw error
    }
  }
  throw new Error('Hero shape unavailable')
}
