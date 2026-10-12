import productView from '../../assets/services/product/view.json'
import aiView from '../../assets/services/ai/view.json'
import workflowView from '../../assets/services/workflow/view.json'
import integrationView from '../../assets/services/integration/view.json'
import type { WorkModelArt } from './work-model-config'

const views = {
  product: productView,
  ai: aiView,
  workflow: workflowView,
  integration: integrationView,
}
const descriptions = {
  product: 'An illustrated interface rests on connected product layers.',
  ai: 'A central AI node connects to a network of smaller information nodes.',
  workflow: 'Three connected stages show work moving through a process.',
  integration:
    'Two separate systems exchange information through a shared connection.',
}

const serviceArtwork: Record<string, WorkModelArt> = Object.fromEntries(
  Object.entries(views).map(([theme, view]) => [
    theme,
    {
      ...view,
      camera: view.camera as [number, number, number],
      target: view.target as [number, number, number],
      cropShift: view.cropShift as [number, number],
      model: `/services/${theme}/${theme}-hero.glb`,
      poster: `/services/${theme}/${theme}-hero.webp`,
      mobilePoster: `/services/${theme}/${theme}-hero-mobile.webp`,
      mobileBreakpoint: 767,
      bakedLighting: true,
      backgroundPoster: `/services/${theme}/${theme}-background.webp`,
      caption: 'Conceptual illustration',
      alt: descriptions[theme as keyof typeof descriptions],
    },
  ]),
)

export function serviceArt(theme: string): WorkModelArt | undefined {
  return Object.hasOwn(serviceArtwork, theme)
    ? serviceArtwork[theme]
    : undefined
}
