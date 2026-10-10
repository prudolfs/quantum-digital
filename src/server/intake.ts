import { env } from 'cloudflare:workers'
import { publicEnv } from '@/env'

export function intakeAvailable() {
  return Boolean(
    publicEnv.VITE_CONVEX_SITE_URL &&
    env.INTAKE_BRIDGE_SECRET &&
    env.INTAKE_BRIDGE_SECRET.length >= 32 &&
    env.AI_GATEWAY_API_KEY &&
    env.AI_MODEL,
  )
}

export function assertSameOrigin(request: Request) {
  if (request.headers.get('Origin') !== new URL(request.url).origin)
    throw new Error('Forbidden origin')
}

export function getSession(request: Request) {
  const cookie = request.headers.get('Cookie') ?? ''
  const value = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('qd-intake='))
    ?.slice('qd-intake='.length)
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null
}

export async function hash(value: string) {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export async function readJson(
  request: Request,
  maximumBytes = 64_000,
): Promise<unknown> {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Missing request body')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maximumBytes) {
      await reader.cancel()
      throw new Error('Request too large')
    }
    chunks.push(value)
  }
  const buffer = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.byteLength
  }
  return JSON.parse(new TextDecoder().decode(buffer))
}

export async function intakeRequest<T>(
  body: Record<string, unknown>,
): Promise<T> {
  if (!publicEnv.VITE_CONVEX_SITE_URL || !env.INTAKE_BRIDGE_SECRET)
    throw new Error('Inquiry storage is unavailable.')
  const response = await fetch(`${publicEnv.VITE_CONVEX_SITE_URL}/intake`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.INTAKE_BRIDGE_SECRET}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) {
    if (response.status === 429)
      throw new Error('Too many requests. Please try again later.')
    const result = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    if (
      result?.error &&
      [
        'CONVERSATION_CHANGED',
        'CONVERSATION_BUSY',
        'CONVERSATION_LIMIT',
        'INVALID_CONVERSATION',
      ].includes(result.error)
    )
      throw new Error(result.error)
    throw new Error('The inquiry could not be processed. Please retry.')
  }
  return response.json() as Promise<T>
}
