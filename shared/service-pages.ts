import type { ManagedService } from './content'

// Activate each page only after its narrative and artwork have been reviewed.
export const servicePageRoutes = {
  product: { slug: 'product-development', label: 'Product development' },
} as const

export function servicePageRoute(service: Pick<ManagedService, 'id'>) {
  return Object.hasOwn(servicePageRoutes, service.id)
    ? servicePageRoutes[service.id as keyof typeof servicePageRoutes]
    : undefined
}

export function publishedServicePage(services: ManagedService[], slug: string) {
  return services.find((service) => servicePageRoute(service)?.slug === slug)
}
