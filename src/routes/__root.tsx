import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { SiteAnalytics } from '@/components/site-analytics'
import { SiteLayout } from '@/components/site-layout'
import appCss from '@/styles.css?url'
import interFont from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Quantum Digital | Product Engineering & Applied AI' },
      {
        name: 'description',
        content:
          'Product engineering and applied AI for founders and product teams.',
      },
      { name: 'theme-color', content: '#030812' },
    ],
    links: [
      {
        rel: 'preload',
        href: interFont,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  shellComponent: RootDocument,
  component: () => (
    <>
      <SiteAnalytics />
      <SiteLayout>
        <Outlet />
      </SiteLayout>
    </>
  ),
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
