import productView from '../../assets/services/product/view.json'
import type { WorkModelArt } from './work-model-config'

export const productServiceArt: WorkModelArt = {
  ...productView,
  camera: productView.camera as [number, number, number],
  target: productView.target as [number, number, number],
  cropShift: productView.cropShift as [number, number],
  model: '/services/product/product-hero.glb',
  poster: '/services/product/product-hero.webp',
  mobilePoster: '/services/product/product-hero-mobile.webp',
  mobileBreakpoint: 767,
  bakedLighting: true,
  backgroundPoster: '/services/product/product-background.webp',
  caption: 'Conceptual illustration',
  alt: 'An illustrated interface rests on connected product layers.',
}
