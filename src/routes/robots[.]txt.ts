import { createFileRoute } from '@tanstack/react-router'
import { publicEnv } from '@/env'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const origin = new URL(publicEnv.VITE_SITE_URL).origin
        return new Response(
          `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`,
          {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          },
        )
      },
    },
  },
})
