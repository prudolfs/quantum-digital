import { z } from 'zod'
import { caseStudySchema } from './content'
import { inquirySchema } from './inquiry'

export const chatLimits = {
  messages: 40,
  inputCharacters: 2000,
  conversationCharacters: 32_000,
} as const
export const starterPrompts = [
  'I have an idea for a product',
  'I want to use AI or automate a workflow',
  'Show me relevant work',
  'Let’s discuss working together',
] as const
export const preparedInquirySchema = z.object({
  draftId: z.string().min(1),
  details: inquirySchema,
  expiresAt: z.number(),
})
export const contactFormSchema = z.object({
  formId: z.string().min(1),
  details: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    summary: z.string().optional(),
    timing: z.string().optional(),
    budget: z.string().optional(),
  }),
})
export const caseStudyResultSchema = z.discriminatedUnion('available', [
  z.object({
    available: z.literal(true),
    study: caseStudySchema,
    url: z.string(),
  }),
  z.object({ available: z.literal(false), message: z.string() }),
])
export const engagementResultSchema = z.object({
  engagements: z.array(
    z.object({
      number: z.string(),
      title: z.string(),
      label: z.string(),
      description: z.string(),
    }),
  ),
  url: z.literal('/#engagements'),
})

export function chatErrorNotice(message: string) {
  if (message.includes('VERIFICATION_FAILED'))
    return {
      text: 'Please complete the security check, then retry your message.',
      retry: true,
    }
  if (
    message.includes('CONVERSATION_CHANGED') ||
    message.includes('CONVERSATION_BUSY')
  )
    return {
      text: 'This conversation was updated in another tab or is still receiving a response. Reload the chat to continue.',
      retry: false,
    }
  if (message.includes('CONVERSATION_LIMIT'))
    return {
      text: 'This conversation has reached its length limit. Clear it to start a new conversation.',
      retry: false,
    }
  if (message.includes('SESSION_EXPIRED'))
    return {
      text: 'Your conversation session expired. Clear the conversation to reconnect and start again.',
      retry: false,
    }
  if (message.includes('RATE_LIMIT'))
    return {
      text: 'You’ve sent several requests recently. Wait a little before retrying.',
      retry: true,
    }
  if (message.includes('ASSISTANT_UNAVAILABLE'))
    return {
      text: 'The assistant is temporarily unavailable. Please try again later.',
      retry: true,
    }
  return {
    text: 'The assistant couldn’t finish its response. You can retry or clear the conversation.',
    retry: true,
  }
}
