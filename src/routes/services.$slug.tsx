import { createFileRoute, notFound } from '@tanstack/react-router'
import { loadPublishedContent } from '@/server/content'
import { findPublishedServicePage } from '@/content/service-pages'
import { ServicePage } from '@/components/service-page'
import { pageHead } from '@/lib/seo'

export const Route = createFileRoute('/services/$slug')({
  loader: async ({ params }) => {
    const page = findPublishedServicePage(
      await loadPublishedContent(),
      params.slug,
    )
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead(
          `${loaderData.route.label} | Quantum Digital`,
          loaderData.service.description,
          `/services/${loaderData.route.slug}`,
        )
      : {},
  component: ServiceDetail,
})

function ServiceDetail() {
  return <ServicePage {...Route.useLoaderData()} />
}
