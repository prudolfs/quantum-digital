import { z } from 'zod'

export const inboxFiltersSchema = z.object({
  status: z.enum(['all', 'new', 'contacted', 'closed']).catch('all'),
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  cursor: z.string().max(4096).optional().catch(undefined),
})
export type InboxFilters = z.infer<typeof inboxFiltersSchema>

// Interpret calendar dates in the inbox's displayed timezone, including DST.
export function rigaMidnight(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const midnight = Date.UTC(year, month - 1, day)
  let candidate = midnight
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Riga',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(candidate)
    const values = Object.fromEntries(
      parts.map(({ type, value }) => [type, value]),
    )
    const represented = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    )
    candidate -= represented - midnight
  }
  return candidate
}

export function inboxDateBounds(from?: string, to?: string) {
  if (from && to && from > to)
    throw new Error('The end date must be after the start date.')
  const dayAfter = to
    ? new Date(Date.parse(`${to}T00:00:00Z`) + 86_400_000)
        .toISOString()
        .slice(0, 10)
    : undefined
  return {
    from: from ? rigaMidnight(from) : undefined,
    to: dayAfter ? rigaMidnight(dayAfter) : undefined,
  }
}

export const inquirySummarySchema = z.object({
  overview: z.string().min(1).max(1200),
  requirements: z.array(z.string().max(600)).max(8),
  constraints: z.array(z.string().max(600)).max(8),
  nextSteps: z.array(z.string().max(600)).max(8),
  openQuestions: z.array(z.string().max(600)).max(8),
})
export type InquirySummary = z.infer<typeof inquirySummarySchema>
export type InquiryMessage = { role: 'user' | 'assistant'; text: string }

export function readableConversation(
  rows: { message: string }[],
): InquiryMessage[] {
  return rows.flatMap(({ message }) => {
    try {
      const parsed = JSON.parse(message)
      if (
        !['user', 'assistant'].includes(parsed.role) ||
        !Array.isArray(parsed.parts)
      )
        return []
      const text = parsed.parts
        .filter(
          (part: { type?: string; text?: unknown }) =>
            part?.type === 'text' && typeof part.text === 'string',
        )
        .map((part: { text: string }) => part.text)
        .join('\n')
        .trim()
      return text ? [{ role: parsed.role, text }] : []
    } catch {
      return []
    }
  })
}
