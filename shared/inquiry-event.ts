import type { InquiryDetails } from './inquiry'

// Public project token, matching wrangler.jsonc; never a personal API key.
export const inquiryPostHogDefaults = {
  token: 'phc_qGc6Rwiayw2DmkqOrPBhi7JuuM4iuffFo7xP00QziQi',
  host: 'https://eu.i.posthog.com',
}

export function inquiryEvent(
  inquiry: InquiryDetails & {
    _id: string
    _creationTime: number
    source: string
    status: string
    updatedAt: number
  },
  eventId: string,
  isTest = false,
) {
  const { _id, _creationTime, ...details } = inquiry
  return {
    event: 'chat_inquiry_submitted',
    uuid: eventId,
    distinct_id: `inquiry:${_id}`,
    timestamp: new Date(_creationTime).toISOString(),
    properties: {
      ...details,
      inquiry_id: _id,
      submitted_at: new Date(_creationTime).toISOString(),
      page_path: '/chat',
      is_test: isTest,
      $process_person_profile: false,
      $geoip_disable: true,
    },
  }
}
