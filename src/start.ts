import {
  createMiddleware,
  createStart,
  createCsrfMiddleware,
} from '@tanstack/react-start'
import { protectRequest, securityHeaders } from '@/server/security'

const security = createMiddleware().server(async ({ request, next }) => {
  const blocked = await protectRequest(request)
  if (blocked) return securityHeaders(blocked, import.meta.env.PROD)
  try {
    const result = await next()
    return {
      ...result,
      response: securityHeaders(result.response, import.meta.env.PROD),
    }
  } catch (error) {
    // Deliberately omit request bodies, URLs, cookies, and raw exception messages.
    console.error('Application request crashed.', {
      category: 'unhandled-server-error',
    })
    throw error
  }
})

export const startInstance = createStart(() => ({
  requestMiddleware: [
    security,
    createCsrfMiddleware({
      filter: ({ handlerType }) => handlerType === 'serverFn',
    }),
  ],
}))
