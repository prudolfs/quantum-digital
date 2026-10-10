// Hero tuning stays in source; no backend or parameter editor is required.
export type HeroParameters = {
  version: 1
  scene: { particleCount: number; particleSize: number; cameraZ: number }
  fluid: {
    enabled: boolean
    force: number
    radius: number
    dissipation: number
    curl: number
  }
  appearance: {
    primaryColor: string
    secondaryColor: string
    particleOpacity: number
    glowIntensity: number
  }
  motion: { idleSpeed: number; interactionStrength: number }
  quality: { mobileParticleScale: number; reducedMotion: 'static' | 'low' }
}

export type HeroQualityProfile =
  | 'static'
  | 'performance'
  | 'balanced'
  | 'quality'

export const defaultHeroParameters: HeroParameters = {
  version: 1,
  scene: { particleCount: 1800, particleSize: 0.026, cameraZ: 4.8 },
  fluid: {
    enabled: true,
    force: 7,
    radius: 0.0035,
    dissipation: 0.975,
    curl: 0.72,
  },
  appearance: {
    primaryColor: '#00aeef',
    secondaryColor: '#cce9fa',
    particleOpacity: 0.72,
    glowIntensity: 1.15,
  },
  motion: { idleSpeed: 0.42, interactionStrength: 0.65 },
  quality: { mobileParticleScale: 0.42, reducedMotion: 'static' },
}

export function resolveHeroQuality({
  gpuTier,
  isMobile,
  reducedMotion,
  parameters,
}: {
  gpuTier: number
  isMobile: boolean
  reducedMotion: boolean
  parameters: HeroParameters
}): {
  profile: HeroQualityProfile
  particleCount: number
  dpr: [number, number]
} {
  if (reducedMotion && parameters.quality.reducedMotion === 'static') {
    return { profile: 'static', particleCount: 0, dpr: [1, 1] }
  }
  if (gpuTier <= 0) return { profile: 'static', particleCount: 0, dpr: [1, 1] }
  const scale = isMobile ? parameters.quality.mobileParticleScale : 1
  if (isMobile || gpuTier === 1 || reducedMotion) {
    return {
      profile: 'performance',
      particleCount: Math.max(
        300,
        Math.round(parameters.scene.particleCount * scale * 0.65),
      ),
      dpr: [1, 1.25],
    }
  }
  if (gpuTier === 2) {
    return {
      profile: 'balanced',
      particleCount: Math.round(parameters.scene.particleCount * scale),
      dpr: [1, 1.5],
    }
  }
  return {
    profile: 'quality',
    particleCount: Math.round(parameters.scene.particleCount * scale),
    dpr: [1, 2],
  }
}
