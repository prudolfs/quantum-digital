export const requestLimits = {
  chat: { maximum: 30, windowMs: 60_000 },
  session: { maximum: 60, windowMs: 60_000 },
  restart: { maximum: 10, windowMs: 60_000 },
  draft: { maximum: 20, windowMs: 60_000 },
  confirm: { maximum: 10, windowMs: 60_000 },
  auth: { maximum: 20, windowMs: 60_000 },
} as const
export type RequestKind = keyof typeof requestLimits

export function requestKind(
  pathname: string,
  method: string,
): RequestKind | null {
  if (pathname === '/api/chat' && method === 'POST') return 'chat'
  if (pathname === '/api/chat-session')
    return method === 'GET' ? 'session' : method === 'POST' ? 'restart' : null
  if (pathname === '/api/inquiry-drafts' && method === 'POST') return 'draft'
  if (pathname === '/api/inquiries' && method === 'POST') return 'confirm'
  if (pathname.startsWith('/api/auth/') && method === 'POST') return 'auth'
  return null
}
