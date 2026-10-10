import { z } from 'zod'

const optionalBackendUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z
    .url()
    .refine((value) => {
      const url = new URL(value)
      return (
        url.protocol === 'https:' ||
        (url.protocol === 'http:' &&
          ['127.0.0.1', 'localhost'].includes(url.hostname))
      )
    }, 'Use HTTPS, or a loopback URL for a local Convex backend')
    .optional(),
)

const publicEnvironmentSchema = z.object({
  VITE_SITE_URL: z
    .url()
    .refine(
      (value) => ['http:', 'https:'].includes(new URL(value).protocol),
      'Use an HTTP or HTTPS site URL',
    )
    .default('https://quantum-digital.pukitis-rudolfs.workers.dev'),
  VITE_CONVEX_URL: optionalBackendUrl,
  VITE_CONVEX_SITE_URL: optionalBackendUrl,
})

export function parsePublicEnvironment(values: Record<string, unknown>) {
  return publicEnvironmentSchema.parse(values)
}

export const publicEnv = parsePublicEnvironment(import.meta.env)
