import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { captureAnalytics } from '@/lib/analytics'

export function SiteAnalytics() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const previous = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    captureAnalytics('$pageview')
  }, [pathname])
  return null
}
