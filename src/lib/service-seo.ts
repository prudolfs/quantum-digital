import type { findPublishedServicePage } from '@/content/service-pages'
import { profileLinks } from '@/content/site'
import { publicEnv } from '@/env'
import { pageHead } from './seo'

type ServicePageData = NonNullable<ReturnType<typeof findPublishedServicePage>>

export function servicePageHead({ service, route }: ServicePageData) {
  const path = `/services/${route.slug}`
  const head = pageHead(
    `${route.label} | Quantum Digital`,
    service.description,
    path,
  )
  const origin = new URL(publicEnv.VITE_SITE_URL).origin
  const url = new URL(path, origin).href
  const personId = `${origin}/about#rudolfs`
  return {
    ...head,
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Person',
              '@id': personId,
              name: 'Rudolfs Pukitis',
              url: `${origin}/about`,
              sameAs: profileLinks.map(({ url: profile }) => profile),
              brand: { '@type': 'Brand', name: 'Quantum Digital' },
            },
            {
              '@type': 'Service',
              '@id': `${url}#service`,
              name: service.title,
              serviceType: route.label,
              description: service.description,
              url,
              provider: { '@id': personId },
            },
            {
              '@type': 'WebPage',
              '@id': url,
              url,
              name: `${route.label} | Quantum Digital`,
              description: service.description,
              mainEntity: { '@id': `${url}#service` },
              inLanguage: 'en',
            },
          ],
        }).replaceAll('<', '\\u003c'),
      },
    ],
  }
}
