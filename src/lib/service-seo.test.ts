import { expect, it, vi } from 'vitest'
import { defaultContent } from '../../shared/content-defaults'
import { findPublishedServicePage } from '@/content/service-pages'
import { servicePageRoutes } from '../../shared/service-pages'

vi.mock('@/env', () => ({
  publicEnv: { VITE_SITE_URL: 'https://example.com' },
}))
import { servicePageHead } from './service-seo'

it('matches service metadata and identity to published visible content on every route', () => {
  for (const route of Object.values(servicePageRoutes)) {
    const page = findPublishedServicePage(defaultContent, route.slug)!
    const head = servicePageHead(page)
    const graph = JSON.parse(head.scripts[0]!.children)['@graph']
    const service = graph.find(
      (node: Record<string, string>) => node['@type'] === 'Service',
    )
    expect(service).toMatchObject({
      name: page.service.title,
      description: page.service.description,
      serviceType: route.label,
      url: `https://example.com/services/${route.slug}`,
    })
    expect(head.links[0]?.href).toBe(service.url)
    expect(service).not.toHaveProperty('offers')
    expect(service).not.toHaveProperty('aggregateRating')
    expect(
      graph.find((node: Record<string, string>) => node['@type'] === 'Person')
        .sameAs,
    ).toEqual([
      'https://github.com/prudolfs',
      'https://www.linkedin.com/in/rudolfs-pukitis-33027a154',
    ])
  }
})

it('escapes published text inside the data script without altering its decoded meaning', () => {
  const content = structuredClone(defaultContent)
  content.services[0]!.title = '</script><script>alert("test")</script>'
  const page = findPublishedServicePage(content, 'product-development')!
  const script = servicePageHead(page).scripts[0]!.children
  expect(script).not.toContain('</script>')
  expect(JSON.parse(script)['@graph'][1].name).toBe(content.services[0]!.title)
})
