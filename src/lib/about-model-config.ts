import view from '../../assets/work/about/view.json'
import type { WorkModelArt } from './work-model-config'

export const aboutModelArt: WorkModelArt = {
  ...view,
  camera: view.camera as [number, number, number],
  target: view.target as [number, number, number],
  cropShift: view.cropShift as [number, number],
  model: '/work/about/about-hero.glb',
  poster: '/work/about/about-hero.webp',
  mobilePoster: '/work/about/about-hero-mobile.webp',
  alt: 'A conceptual engineering workbench with a mobile phone, interface monitor, document, keyboard, and small gold robot.',
  caption:
    'Conceptual workbench illustration · web, mobile, documents, and robotics',
}
