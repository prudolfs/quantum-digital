import {
  caseStudies,
  services,
  positioning,
  commonQuestions,
} from '../src/content/site'
import type { PublishedContent } from './content'

export const defaultContent: PublishedContent = {
  caseStudies,
  services: services.map((service) => ({ ...service, art: service.id })),
  settings: {
    homeTitle: 'Quantum Digital | Product Engineering & Applied AI',
    homeDescription:
      'Build better products. Put AI to work. Independent product engineering, AI integrations, and workflow automation for founders and product teams.',
    heroDescription: positioning.description,
    approachDescription: positioning.approach,
    contactEmail: 'rudolfs.pukitis@proton.me',
    questions: commonQuestions.map((question) => ({ ...question })),
  },
}
