import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import {
  ErrorState,
  LoadingState,
  NotFoundState,
} from '@/components/route-states'

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultPendingComponent: LoadingState,
    defaultErrorComponent: ErrorState,
    defaultNotFoundComponent: NotFoundState,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
