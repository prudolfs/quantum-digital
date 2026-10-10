import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'
import { publicEnv } from '@/env'

export function authUtilities() {
  if (!publicEnv.VITE_CONVEX_URL || !publicEnv.VITE_CONVEX_SITE_URL) return null
  return convexBetterAuthReactStart({
    convexUrl: publicEnv.VITE_CONVEX_URL,
    convexSiteUrl: publicEnv.VITE_CONVEX_SITE_URL,
  })
}

export async function handleAuth(request: Request) {
  const auth = authUtilities()
  if (!auth)
    return new Response('Admin sign-in is unavailable.', { status: 503 })
  try {
    return await auth.handler(request)
  } catch {
    return new Response('Admin sign-in is temporarily unavailable.', {
      status: 503,
    })
  }
}
