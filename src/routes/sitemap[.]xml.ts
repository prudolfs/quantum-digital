import { createFileRoute } from '@tanstack/react-router'
import { publicEnv } from '@/env'
import { caseStudies } from '@/content/site'

const escape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const origin = new URL(publicEnv.VITE_SITE_URL).origin
        const paths = [
          '/',
          '/about',
          '/chat',
          '/privacy',
          ...caseStudies.map(
            (study) => `/work/${encodeURIComponent(study.slug)}`,
          ),
        ]
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escape(new URL(path, origin).href)}</loc></url>`).join('')}</urlset>`,
          {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
          },
        )
      },
    },
  },
})
