import { createFileRoute, notFound } from '@tanstack/react-router'
import { loadPublishedContent } from '@/server/content'
import { findPublishedServicePage } from '@/content/service-pages'
import { ServicePage } from '@/components/service-page'
import { servicePageHead } from '@/lib/service-seo'

export const Route = createFileRoute('/services/$slug')({
  loader: async ({ params }) => {
    const page = findPublishedServicePage(
      await loadPublishedContent(),
      params.slug,
    )
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData }) => (loaderData ? servicePageHead(loaderData) : {}),
  component: ServiceDetail,
})

function ServiceDetail() {
  return <ServicePage {...Route.useLoaderData()} />
}
