import { publicEnv } from '@/env'

export function pageHead(title: string, description: string, path: string) {
  const origin = new URL(publicEnv.VITE_SITE_URL).origin
  const url = new URL(path, origin).href
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:site_name', content: 'Quantum Digital' },
      { property: 'og:image', content: `${origin}/social-preview.png` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
