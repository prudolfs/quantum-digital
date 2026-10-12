import type { PublishedContent } from '../../shared/content'
import {
  publishedServicePage,
  servicePageRoute,
} from '../../shared/service-pages'

export type ServiceNarrative = {
  intro: string
  audience: string
  problems: { title: string; description: string }[]
  deliverables: { title: string; description: string }[]
  steps: { title: string; description: string }[]
  questions: { question: string; answer: string }[]
  relatedSlugs: string[]
  closing: string
  action: string
}

const product: ServiceNarrative = {
  intro:
    'A first version should connect what people need to do with the software that makes it possible. Start with a useful journey, make the scope clear, and build the interfaces and systems around it.',
  audience:
    'For founders turning an idea into a first release, and product teams extending an application that already exists. We can define a focused project or work together as the product evolves.',
  problems: [
    {
      title: 'An idea needs a starting point.',
      description:
        'There are many possible features, but the first useful outcome is still unclear. We identify the people using the product, their core task, and the smallest connected journey worth delivering.',
    },
    {
      title: 'The pieces need to work together.',
      description:
        'An interface is only part of a product. Data, permissions, backend services, and integrations need to support the same experience, including loading, errors, and recovery.',
    },
    {
      title: 'An existing product needs its next step.',
      description:
        'A new feature or difficult workflow has to fit the system and team already in place. We review those constraints before deciding what to build or change.',
    },
  ],
  deliverables: [
    {
      title: 'A clear first release.',
      description:
        'An agreed product journey, priorities, and scope. Make the important decisions explicit so everyone understands what the release includes and what can come later.',
    },
    {
      title: 'Connected application engineering.',
      description:
        'Web or mobile interfaces, data models, and backend services shaped around the agreed journey. Account flows, permissions, and integrations are included when the scope calls for them.',
    },
    {
      title: 'Delivery with a handover.',
      description:
        'Agree the checks, deployment, documentation, and ownership needed to operate and continue the product. Ongoing engineering support is an option to discuss, not an automatic commitment.',
    },
  ],
  steps: [
    {
      title: 'Understand the journey.',
      description:
        'Start with users, the problem, the existing system, and the constraints that matter.',
    },
    {
      title: 'Make the scope concrete.',
      description:
        'Choose the first useful outcome and connect product decisions with the technical approach.',
    },
    {
      title: 'Build and review.',
      description:
        'Review working increments, resolve edge cases, and adjust when real use reveals a better direction.',
    },
    {
      title: 'Verify and hand over.',
      description:
        'Check the agreed behavior, prepare deployment, and document how the product can be maintained.',
    },
  ],
  questions: [
    {
      question: 'Can we start without a specification?',
      answer:
        'Yes. We can begin with who the product is for, the task they need to complete, and what a useful first version should achieve. We turn that into an agreed scope before building.',
    },
    {
      question: 'Can you build on an existing product?',
      answer:
        'Yes. The work can focus on a feature, an integration, or a difficult workflow. We review the current architecture and the constraints your team works with before choosing the approach.',
    },
    {
      question: 'Is this only for web applications?',
      answer:
        'No. My experience includes web and mobile products, including React Native applications. We choose the interface and platform around the people using the product and the requirements of the project.',
    },
    {
      question: 'How long does a first version take?',
      answer:
        'That depends on the journey, integrations, existing foundations, and review requirements. We discuss those constraints and agree a realistic scope rather than promising a timeline before understanding the work.',
    },
    {
      question: 'What does handover include?',
      answer:
        'We agree deployment, documentation, ownership, and any ongoing support as part of the scope. A focused delivery and a longer engineering partnership are both possible.',
    },
  ],
  relatedSlugs: ['care-coordination', 'accounting-workflows'],
  closing: 'What should your first useful version do?',
  action: 'Tell me about your product',
}

const narratives: Record<string, ServiceNarrative> = { product }

export function findPublishedServicePage(
  content: PublishedContent,
  slug: string,
) {
  const service = publishedServicePage(content.services, slug)
  if (!service) return undefined
  const narrative = narratives[service.id]
  const route = servicePageRoute(service)
  if (!narrative || !route) return undefined
  return {
    service,
    route,
    narrative,
    related: narrative.relatedSlugs.flatMap((relatedSlug) => {
      const study = content.caseStudies.find(
        (item) => item.slug === relatedSlug,
      )
      return study ? [study] : []
    }),
  }
}
