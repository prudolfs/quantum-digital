import { z } from 'zod'

const text = (maximum: number) => z.string().trim().min(1).max(maximum)
const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional()
const externalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true
    try {
      return new URL(value).protocol === 'https:'
    } catch {
      return false
    }
  }, 'Use an HTTPS project URL')
  .optional()
export const slugSchema = z
  .string()
  .trim()
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase words separated by hyphens',
  )
export const caseStudySchema = z.object({
  slug: slugSchema,
  title: text(140),
  category: text(100),
  summary: text(600),
  role: text(500),
  context: text(4000),
  challenge: text(4000),
  approach: text(4000),
  delivery: text(4000),
  evidence: optionalText(4000),
  repositoryUrl: externalUrl,
  demoUrl: externalUrl,
  featured: z.boolean().optional(),
})
export const serviceArt = ['product', 'ai', 'workflow', 'integration'] as const
export const serviceSchema = z.object({
  id: slugSchema,
  number: text(4),
  title: text(140),
  theme: text(100),
  description: text(1000),
  detail: text(300),
  art: z.enum(serviceArt),
})
export const siteSettingsSchema = z.object({
  homeTitle: text(140),
  homeDescription: text(300),
  heroDescription: text(1000),
  approachDescription: text(2000),
  contactEmail: z.email().trim().max(254),
  questions: z
    .array(z.object({ question: text(200), answer: text(2000) }))
    .max(20)
    .refine(
      (questions) =>
        new Set(questions.map((entry) => entry.question.toLowerCase())).size ===
        questions.length,
      'Use a different question for each answer.',
    ),
})
export const setupOwnerSchema = z
  .object({
    email: z.email().trim().max(254),
    setupKey: z.string().min(32).max(256),
    password: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: 'The passwords must match.',
    path: ['confirmPassword'],
  })
export type ManagedCaseStudy = z.infer<typeof caseStudySchema>
export type ManagedService = z.infer<typeof serviceSchema>
export type SiteSettings = z.infer<typeof siteSettingsSchema>
export type PublishedContent = {
  caseStudies: ManagedCaseStudy[]
  services: ManagedService[]
  settings: SiteSettings
}
