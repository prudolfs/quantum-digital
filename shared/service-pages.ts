import type { ManagedService } from './content'

// Activate each page only after its narrative and artwork have been reviewed.
export const servicePageRoutes = {
  product: { slug: 'product-development', label: 'Product development' },
  ai: { slug: 'ai-integrations', label: 'AI integrations' },
  workflow: { slug: 'workflow-automation', label: 'Workflow automation' },
  integration: { slug: 'system-integrations', label: 'System integrations' },
} as const

export function servicePageRoute(service: Pick<ManagedService, 'id'>) {
  return Object.hasOwn(servicePageRoutes, service.id)
    ? servicePageRoutes[service.id as keyof typeof servicePageRoutes]
    : undefined
}

export function publishedServicePage(services: ManagedService[], slug: string) {
  return services.find((service) => servicePageRoute(service)?.slug === slug)
}

// Validate URL/request hints against the current published snapshot.
export function serviceChatContext(services: ManagedService[], slug: unknown) {
  if (typeof slug !== 'string') return undefined
  const service = publishedServicePage(services, slug)
  const route = service && servicePageRoute(service)
  return service && route
    ? { slug: route.slug, label: route.label, title: service.title }
    : undefined
}
