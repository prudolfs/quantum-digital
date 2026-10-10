import { v } from 'convex/values'

export const caseFields = {
  slug: v.string(),
  title: v.string(),
  category: v.string(),
  summary: v.string(),
  role: v.string(),
  context: v.string(),
  challenge: v.string(),
  approach: v.string(),
  delivery: v.string(),
  evidence: v.optional(v.string()),
  repositoryUrl: v.optional(v.string()),
  demoUrl: v.optional(v.string()),
  featured: v.optional(v.boolean()),
}
export const serviceFields = {
  id: v.string(),
  number: v.string(),
  title: v.string(),
  theme: v.string(),
  description: v.string(),
  detail: v.string(),
  art: v.union(
    v.literal('product'),
    v.literal('ai'),
    v.literal('workflow'),
    v.literal('integration'),
  ),
}
export const settingsFields = {
  homeTitle: v.string(),
  homeDescription: v.string(),
  heroDescription: v.string(),
  approachDescription: v.string(),
  contactEmail: v.string(),
  questions: v.array(v.object({ question: v.string(), answer: v.string() })),
}
