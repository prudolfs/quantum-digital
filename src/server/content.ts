import { createServerFn } from '@tanstack/react-start'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'
import { publicEnv } from '@/env'
import { defaultContent } from '../../shared/content-defaults'
import type { PublishedContent } from '../../shared/content'

export async function fetchPublishedContent(): Promise<PublishedContent> {
  if (!publicEnv.VITE_CONVEX_URL) return defaultContent
  const client = new ConvexHttpClient(publicEnv.VITE_CONVEX_URL)
  const content = await client.query(api.content.published, {})
  // An initialized collection stays empty when all records are unpublished.
  return content ?? defaultContent
}
export const loadPublishedContent = createServerFn({ method: 'GET' }).handler(
  fetchPublishedContent,
)
