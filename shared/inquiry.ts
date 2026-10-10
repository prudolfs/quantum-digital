import { z } from 'zod'

export const inquirySchema = z
  .object({
    name: z.string().trim().min(1, 'Please tell me your name.').max(120),
    email: z
      .email('Please provide a valid email address.')
      .trim()
      .max(254)
      .transform((value) => value.toLowerCase()),
    summary: z
      .string()
      .trim()
      .min(20, 'Please add a little more about the project.')
      .max(4000),
    timing: z.string().trim().max(200).optional(),
    budget: z.string().trim().max(200).optional(),
  })
  .strict()

export type InquiryDetails = z.infer<typeof inquirySchema>
export const inquiryStatuses = ['new', 'contacted', 'closed'] as const
