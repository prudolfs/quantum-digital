import { expect, it } from 'vitest'
import { defaultContent } from '../../shared/content-defaults'
import { findPublishedServicePage } from './service-pages'
import { servicePageRoute } from '../../shared/service-pages'

it('uses published fields and maps by service identity, independently of artwork', () => {
  const content = structuredClone(defaultContent)
  content.services[0]!.title = 'Published product title'
  content.services[0]!.art = 'ai'
  const page = findPublishedServicePage(content, 'product-development')!
  expect(page.service.title).toBe('Published product title')
  expect(page.service.art).toBe('ai')
  expect(page.route.label).toBe('Product development')
  expect(page.related.map((study) => study.slug)).toEqual([
    'care-coordination',
    'accounting-workflows',
  ])
  expect(servicePageRoute({ id: 'unmapped-service' })).toBeUndefined()
  expect(servicePageRoute({ id: 'constructor' })).toBeUndefined()
})

it('does not resurrect unpublished or renamed service and related-work records', () => {
  expect(
    findPublishedServicePage(
      { ...defaultContent, services: [] },
      'product-development',
    ),
  ).toBeUndefined()
  const content = structuredClone(defaultContent)
  content.services[0]!.id = 'renamed-product'
  expect(
    findPublishedServicePage(content, 'product-development'),
  ).toBeUndefined()
  expect(findPublishedServicePage(defaultContent, 'unknown')).toBeUndefined()
  const page = findPublishedServicePage(
    { ...defaultContent, caseStudies: [] },
    'product-development',
  )!
  expect(page.related).toEqual([])
})

it('provides distinct narratives and only currently published related examples for all four offers', () => {
  const headings = new Set<string>()
  for (const service of defaultContent.services) {
    const route = servicePageRoute(service)!
    const page = findPublishedServicePage(defaultContent, route.slug)!
    headings.add(page.narrative.startingHeading)
    expect(page.narrative.questions).toHaveLength(5)
    expect(page.related).toHaveLength(2)
    expect(
      findPublishedServicePage(
        {
          ...defaultContent,
          services: defaultContent.services.filter(
            (item) => item.id !== service.id,
          ),
        },
        route.slug,
      ),
    ).toBeUndefined()
    expect(
      findPublishedServicePage(
        { ...defaultContent, caseStudies: [] },
        route.slug,
      )?.related,
    ).toEqual([])
  }
  expect(headings.size).toBe(4)
})
