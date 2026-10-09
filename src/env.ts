import { z } from 'zod'

const optionalHttpsUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z
    .url()
    .refine((value) => new URL(value).protocol === 'https:', 'Use an HTTPS URL')
    .optional(),
)

const publicEnvironmentSchema = z.object({
  VITE_SITE_URL: z
    .url()
    .refine(
      (value) => ['http:', 'https:'].includes(new URL(value).protocol),
      'Use an HTTP or HTTPS site URL',
    )
    .default('http://localhost:3000'),
  VITE_BOOKING_URL: optionalHttpsUrl,
  VITE_CONVEX_URL: optionalHttpsUrl,
})

export function parsePublicEnvironment(values: Record<string, unknown>) {
  return publicEnvironmentSchema.parse(values)
}

export const publicEnv = parsePublicEnvironment(import.meta.env)
