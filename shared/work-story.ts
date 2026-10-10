import { z } from 'zod'

const copy = z.string().trim().min(1).max(2000)
const entry = z.object({ title: copy, description: copy })
// Code-managed narrative returned only for an existing published case study.
// No Convex records or admin fields use this optional presentation schema.
export const workStorySchema = z.object({
  headline: copy,
  experience: copy.optional(),
  stack: copy.optional(),
  applications: z
    .array(entry.extend({ status: copy }))
    .max(4)
    .optional(),
  highlight: copy,
  workflowHeading: copy,
  workflowIntro: copy,
  steps: z.array(entry).min(1).max(6),
  evidenceHeading: copy,
  evidenceIntro: copy,
  evidence: z
    .array(entry.extend({ image: copy, alt: copy, caption: copy }))
    .max(4),
  decisionsHeading: copy,
  decisionsIntro: copy,
  decisions: z.array(entry).max(6),
  closingHeading: copy,
  closingHighlight: copy,
  closingDescription: copy,
  chatLabel: copy,
})
export type WorkStory = z.infer<typeof workStorySchema>
