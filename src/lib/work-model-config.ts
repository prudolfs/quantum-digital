import roboticsView from '../../assets/work/robotics/view.json'
import servicesView from '../../assets/work/services/view.json'
import researchView from '../../assets/work/research/view.json'
import careView from '../../assets/work/care/view.json'
import accountingView from '../../assets/work/accounting/view.json'

export type WorkModelArt = {
  model: string
  poster: string
  mobilePoster: string
  width: number
  height: number
  alt: string
  caption?: string
  camera: [number, number, number]
  target: [number, number, number]
  horizontalSpan: number
  verticalSpan: number
  cropShift: [number, number]
  mobileBreakpoint?: number
  bakedLighting?: boolean
  backgroundPoster?: string
}

export const financeModelArt: WorkModelArt = {
  model: '/work/finance/finance-hero.glb',
  poster: '/work/finance/finance-hero.webp',
  mobilePoster: '/work/finance/finance-hero-mobile.webp',
  width: 1400,
  height: 863,
  alt: 'Three illustrated layers: an original receipt, reviewable document fields, and a chart with a source reference.',
  camera: [5.1, 5.6, 10],
  target: [0.12, 1.7, -0.16],
  horizontalSpan: 5.93053125,
  verticalSpan: 3.656625,
  cropShift: [-0.011484375, 0.03215625],
}

export const careModelArt: WorkModelArt = {
  ...careView,
  camera: careView.camera as [number, number, number],
  target: careView.target as [number, number, number],
  cropShift: careView.cropShift as [number, number],
  model: '/work/care/care-hero.glb',
  poster: '/work/care/care-hero.webp',
  mobilePoster: '/work/care/care-hero-mobile.webp',
  alt: 'An illustrated request-review phone connected to senior, family, helper, and voice-input objects.',
}

export const accountingModelArt: WorkModelArt = {
  ...accountingView,
  camera: accountingView.camera as [number, number, number],
  target: accountingView.target as [number, number, number],
  cropShift: accountingView.cropShift as [number, number],
  model: '/work/accounting/accounting-hero.glb',
  poster: '/work/accounting/accounting-hero.webp',
  mobilePoster: '/work/accounting/accounting-hero-mobile.webp',
  alt: 'An illustrated mobile document workflow with a receipt, expense category, and extraction and review tiles.',
}

export const researchModelArt: WorkModelArt = {
  ...researchView,
  camera: researchView.camera as [number, number, number],
  target: researchView.target as [number, number, number],
  cropShift: researchView.cropShift as [number, number],
  model: '/work/research/research-hero.glb',
  poster: '/work/research/research-hero.webp',
  mobilePoster: '/work/research/research-hero-mobile.webp',
  alt: 'A conceptual research workspace where source cards connect to review, verification, and an editable draft.',
}

export const servicesModelArt: WorkModelArt = {
  ...servicesView,
  camera: servicesView.camera as [number, number, number],
  target: servicesView.target as [number, number, number],
  cropShift: servicesView.cropShift as [number, number],
  model: '/work/services/services-hero.glb',
  poster: '/work/services/services-hero.webp',
  mobilePoster: '/work/services/services-hero-mobile.webp',
  alt: 'A conceptual dispatch board connecting client, worker, and manager job cards to a phone with editable reply drafts.',
}

export const roboticsModelArt: WorkModelArt = {
  ...roboticsView,
  camera: roboticsView.camera as [number, number, number],
  target: roboticsView.target as [number, number, number],
  cropShift: roboticsView.cropShift as [number, number],
  model: '/work/robotics/robotics-hero.glb',
  poster: '/work/robotics/robotics-hero.webp',
  mobilePoster: '/work/robotics/robotics-hero-mobile.webp',
  alt: 'A conceptual warehouse diorama with a gold forklift, storage racks, a blue route, and illustrative sensor rays.',
  caption: 'Conceptual warehouse illustration · simulated scene',
}
