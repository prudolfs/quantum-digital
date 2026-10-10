/** Original reconstructed diagrams with synthetic values, not product captures. */
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
function label(x, y, value, size = 48, color = '#F7FBFF') {
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${size}" fill="${color}">${value}</text>`
}
function field(y, name, value) {
  return `<rect x="160" y="${y}" width="760" height="136" rx="24" fill="#0A2038"/>${label(194, y + 48, name, 38, '#8FA8BA')}${label(194, y + 103, value, 48)}`
}
function diagram(title, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" rx="32" fill="#07182B"/>${label(72, 82, 'RECONSTRUCTED WORKFLOW', 34, '#F5B85B')}${label(72, 164, title, 60)}${content}${label(72, 1020, 'Synthetic details · illustrative interface', 34, '#8FA8BA')}</svg>\n`
}
const views = [
  [
    'care',
    'request-review.svg',
    diagram(
      'Speak. Review. Confirm.',
      `<rect x="130" y="224" width="820" height="722" rx="44" fill="#030812" stroke="#17334A" stroke-width="4"/>${label(166, 293, '“Help me shop tomorrow', 44, '#CCE9FA')}${label(166, 352, 'morning, for an hour.”', 44, '#CCE9FA')}${field(394, 'TYPE', 'Shopping')}${field(546, 'WHEN', 'Tomorrow · 09:00')}${field(698, 'DURATION', '1 hour')}<rect x="160" y="852" width="760" height="66" rx="20" fill="#F5B85B"/>${label(334, 900, 'Confirm request', 44, '#030812')}`,
    ),
  ],
  [
    'care',
    'shared-request.svg',
    diagram(
      'A shared request.',
      `<rect x="130" y="224" width="820" height="650" rx="44" fill="#030812" stroke="#17334A" stroke-width="4"/>${field(256, 'SENIOR', 'Shopping request created')}${field(418, 'FAMILY', 'Approved access to the request')}${field(580, 'HELPER', 'Request accepted')}${label(166, 800, 'Conversation stays with the request.', 40, '#CCE9FA')}<path d="M540 894v50m-16-16 16 16 16-16" fill="none" stroke="#F5B85B" stroke-width="5"/>`,
    ),
  ],
  [
    'accounting',
    'document-review.svg',
    diagram(
      'Document to details.',
      `<rect x="130" y="224" width="820" height="722" rx="44" fill="#030812" stroke="#17334A" stroke-width="4"/>${label(166, 297, 'Example receipt', 48, '#CCE9FA')}${label(166, 357, 'Extracted information to inspect', 40, '#8FA8BA')}${field(402, 'SUPPLIER', 'Example supplier')}${field(566, 'TOTAL', 'EUR 35.40')}${field(730, 'DOCUMENT', 'Receipt')}`,
    ),
  ],
  [
    'accounting',
    'expense-category.svg',
    diagram(
      'A category you can review.',
      `<rect x="130" y="224" width="820" height="722" rx="44" fill="#030812" stroke="#17334A" stroke-width="4"/>${label(166, 297, 'Example expense', 48, '#CCE9FA')}${field(344, 'AMOUNT', 'EUR 35.40')}${field(512, 'CATEGORY', 'Office supplies')}${label(166, 745, 'Inspect the information.', 44, '#CCE9FA')}${label(166, 804, 'Continue the bookkeeping task.', 44, '#CCE9FA')}<rect x="160" y="852" width="760" height="66" rx="20" fill="#F5B85B"/>${label(426, 900, 'Continue', 44, '#030812')}`,
    ),
  ],
]
views.push(
  [
    'research',
    'shortlist-review.svg',
    diagram(
      'A shortlist to inspect.',
      `${field(246, 'EXAMPLE NORTH · OPPORTUNITY A', 'Ready for review')}${field(422, 'EXAMPLE EAST · OPPORTUNITY B', 'Eligibility needs verification')}${field(598, 'EXAMPLE WEST · OPPORTUNITY C', 'Duplicate · already imported')}${label(160, 837, 'Select candidates before import.', 42, '#CCE9FA')}${label(160, 903, 'Unselected records stay in discovery.', 38, '#8FA8BA')}`,
    ),
  ],
  [
    'research',
    'pipeline-draft.svg',
    diagram(
      'Evidence before outreach.',
      `${field(246, 'VERIFICATION', 'Source checked · example state')}${field(422, 'ILLUSTRATIVE RELEVANCE SCORE', '82 / 100 · inspect the reasons')}${field(598, 'OUTREACH DRAFT', 'Editable · awaiting your review')}${label(160, 837, 'Track the next step in the pipeline.', 42, '#CCE9FA')}${label(160, 903, 'No automatic sending or applying.', 38, '#8FA8BA')}`,
    ),
  ],
)
views.push(
  [
    'services',
    'job-coordination.svg',
    diagram(
      'One job. Three views.',
      `${field(246, 'CLIENT · EXAMPLE REPAIR', 'Review the voice-prepared request')}${field(422, 'WORKER', 'Accepted → in progress')}${field(598, 'MANAGER', 'Inspect the shared job context')}${label(160, 837, 'Conversation belongs to the job.', 42, '#CCE9FA')}${label(160, 903, 'Role-specific actions · shared state', 38, '#8FA8BA')}`,
    ),
  ],
  [
    'services',
    'summary-reply.svg',
    diagram(
      'Inspect. Edit. Then send.',
      `${field(246, 'SUMMARY PROGRESS', 'Pending → streaming → done')}${field(422, 'PREPARED EXAMPLE SUMMARY', 'Repair is in progress.')}${field(598, 'EDITABLE REPLY SUGGESTION', 'I’ll share an update after the check.')}${label(160, 837, 'Suggestions fill the composer.', 42, '#CCE9FA')}${label(160, 903, 'The participant chooses to send.', 38, '#8FA8BA')}`,
    ),
  ],
)
for (const [theme, name, svg] of views) {
  const directory = resolve(root, 'public/work', theme)
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, name), svg)
}
console.log('Original synthetic walkthrough diagrams created.')
