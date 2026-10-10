import { publicWorkRecord } from '../../shared/work-disclosure'
import {
  researchStory,
  servicesStory,
  roboticsStory,
} from './work-exploration-stories'
import type { PublishedContent } from '../../shared/content'
import type { WorkStory } from '../../shared/work-story'
import {
  accountingModelArt,
  careModelArt,
  financeModelArt,
  researchModelArt,
  servicesModelArt,
  roboticsModelArt,
  type WorkModelArt,
} from '../lib/work-model-config'

const financeStory: WorkStory = {
  headline: 'Ask the question.',
  highlight: 'See the evidence.',
  workflowHeading: 'A document is just the beginning.',
  workflowIntro:
    'Extraction is one step. The useful product connects the original file, the person reviewing it, and the question they want answered.',
  steps: [
    {
      title: 'Bring the source.',
      description:
        'Upload a receipt or invoice. Follow its processing state as the data is extracted.',
    },
    {
      title: 'Review the details.',
      description:
        'Compare the extracted fields with the original. Correct and approve what you will rely on.',
    },
    {
      title: 'Ask a question.',
      description:
        'Explore spending or suppliers through read-only tools that calculate results from your documents.',
    },
    {
      title: 'Follow the evidence.',
      description:
        'View a table or chart, then return to the document behind the answer.',
    },
  ],
  evidenceHeading: 'The source stays in the picture.',
  evidenceIntro:
    'Original files, structured data, and answers remain connected. These application captures use a synthetic receipt and prepared demo conversation.',
  evidence: [
    {
      title: 'Inspect the original.',
      description:
        'The document preview keeps the source available while working with extracted information.',
      image: '/work/finance/document-preview.webp',
      alt: 'Finance Document Assistant showing the original synthetic receipt on the document detail screen.',
      caption: 'Actual application capture · synthetic document',
    },
    {
      title: 'Understand the answer.',
      description:
        'A chart gives the result shape. A source reference gives you somewhere to check it.',
      image: '/work/finance/chart-chat.webp',
      alt: 'Demo conversation showing a spending chart, an accessible data table, and a link to the source receipt.',
      caption: 'Actual application capture · prepared demo answers',
    },
  ],
  decisionsHeading: 'Useful AI needs a careful workflow.',
  decisionsIntro:
    'The interesting engineering happens around the model: validation, ownership, review, and calculations you can inspect.',
  decisions: [
    {
      title: 'Extract, then validate.',
      description:
        'Schema and arithmetic checks surround extraction. User-confirmed fields survive later retries, so reviewed work is preserved.',
    },
    {
      title: 'Let code do the sums.',
      description:
        'The assistant selects read-only tools. Application code calculates totals in integer minor units and keeps currencies separate.',
    },
    {
      title: 'Keep access scoped.',
      description:
        'Document ownership comes from the authenticated identity. Bounded tool results give the model the information relevant to a question.',
    },
  ],
  closingHeading: 'What could your documents',
  closingHighlight: 'help you do?',
  closingDescription: 'Let’s talk about the workflow around them.',
  chatLabel: 'Discuss a document workflow',
}

const careStory: WorkStory = {
  headline: 'One request.',
  highlight: 'Everyone connected.',
  experience: 'Request → review → coordination',
  stack: 'React Native · TypeScript · Convex',
  workflowHeading: 'Help starts with a clear request.',
  workflowIntro:
    'Older people, family members, and helpers take part in the same workflow. Each needs the right context, with a clear way to request help and keep the conversation connected.',
  steps: [
    {
      title: 'Say what you need.',
      description:
        'Voice input turns a spoken request into structured details, using the current screen and any form information already entered.',
    },
    {
      title: 'Review the request.',
      description:
        'Inspect the type of help, date, time, and duration. Edit the details before submitting the request.',
    },
    {
      title: 'Connect the people.',
      description:
        'A helper accepts the request. Family access follows the approved relationship to the care profile.',
    },
    {
      title: 'Keep context together.',
      description:
        'The request has its own conversation, connecting participants to the work they are coordinating.',
    },
  ],
  evidenceHeading: 'Different roles. One shared context.',
  evidenceIntro:
    'These reconstructed walkthroughs use synthetic details to explain request review and role coordination. Their layouts illustrate the workflow rather than reproduce the client’s screens.',
  evidence: [
    {
      title: 'A request you can review.',
      description:
        'A spoken request becomes fields for inspection. The review step gives the person a chance to correct what was understood.',
      image: '/work/care/request-review.svg',
      alt: 'Reconstructed care request: a shopping request for tomorrow at 09:00 for one hour, with a confirmation step.',
      caption: 'Reconstructed workflow · synthetic request',
    },
    {
      title: 'People connected to the task.',
      description:
        'Senior, family, and helper experiences meet around the request. Approved family access and helper acceptance provide context for shared communication.',
      image: '/work/care/shared-request.svg',
      alt: 'Reconstructed coordination diagram connecting a senior’s request, approved family access, helper acceptance, and the request conversation.',
      caption: 'Reconstructed workflow · illustrative roles',
    },
  ],
  decisionsHeading: 'The workflow matters as much as the interface.',
  decisionsIntro:
    'Care coordination brings relationships, requests, and communication together. Voice assistance has a useful role when it fits those existing interactions.',
  decisions: [
    {
      title: 'Represent the relationships.',
      description:
        'Care profiles and relationships are separate from a single fixed user role. Family access has explicit permissions and pending, active, and revoked states.',
    },
    {
      title: 'Give voice the context.',
      description:
        'Interpretation receives the current screen and partially completed form. It prepares structured request details that the person can review.',
    },
    {
      title: 'Keep chat with the request.',
      description:
        'The conversation follows the help request and its participants. Completion or cancellation can archive that conversation alongside the request’s lifecycle.',
    },
  ],
  closingHeading: 'When several people',
  closingHighlight: 'share one workflow.',
  closingDescription: 'Let’s talk about the product that connects them.',
  chatLabel: 'Discuss a coordination product',
}

const accountingStory: WorkStory = {
  headline: 'From a receipt.',
  highlight: 'To the next step.',
  experience: 'Documents → categories → bookkeeping',
  stack: 'React Native',
  workflowHeading: 'Make document data useful on mobile.',
  workflowIntro:
    'Invoices and receipts are the starting point. The mobile application connects their information to expense categorization and bookkeeping assistance, with visibility and control for the user.',
  steps: [
    {
      title: 'Bring a document.',
      description:
        'Provide an invoice or receipt from the mobile application to start the document workflow.',
    },
    {
      title: 'Inspect the information.',
      description:
        'AI extracts document data for the bookkeeping workflow. The person can see the information they are working with.',
    },
    {
      title: 'Review the category.',
      description:
        'Expense categorization brings the document into the business context of the bookkeeping task.',
    },
    {
      title: 'Continue the task.',
      description:
        'Use the assistance within the accounting application, keeping the next bookkeeping step under user control.',
    },
  ],
  evidenceHeading: 'Useful details. Visible assistance.',
  evidenceIntro:
    'These reconstructed mobile walkthroughs use synthetic values to explain the product’s document and category workflow. They illustrate the experience without claiming its exact interface or approval mechanics.',
  evidence: [
    {
      title: 'A document becomes information.',
      description:
        'The example connects a receipt to inspectable supplier and amount details, ready for use within the mobile workflow.',
      image: '/work/accounting/document-review.svg',
      alt: 'Reconstructed mobile bookkeeping diagram showing an example receipt, supplier, and amount of EUR 35.40.',
      caption: 'Reconstructed workflow · synthetic receipt',
    },
    {
      title: 'A category connects it to the task.',
      description:
        'The example expense is categorized as office supplies. Its information stays visible while the user continues the bookkeeping task.',
      image: '/work/accounting/expense-category.svg',
      alt: 'Reconstructed expense category diagram with EUR 35.40 and an office-supplies category, followed by the next bookkeeping step.',
      caption: 'Reconstructed workflow · illustrative category',
    },
  ],
  decisionsHeading: 'Assistance inside the accounting task.',
  decisionsIntro:
    'The product focus is the workflow around financial-document data. These are product-level decisions supported by the mobile project description.',
  decisions: [
    {
      title: 'Connect extraction to the task.',
      description:
        'Extracted document information becomes useful within the bookkeeping application, alongside the work the person needs to complete.',
    },
    {
      title: 'Bring categories into context.',
      description:
        'Expense categorization is part of the accounting workflow, connecting the document to its business use.',
    },
    {
      title: 'Keep assistance visible.',
      description:
        'The mobile experience combines AI assistance with user visibility and control. People remain able to inspect what the application is doing.',
    },
  ],
  closingHeading: 'What would make bookkeeping',
  closingHighlight: 'easier to work with?',
  closingDescription:
    'Let’s talk about the mobile workflow around your business.',
  chatLabel: 'Discuss a mobile business app',
}

type Presentation = {
  story: WorkStory
  art: WorkModelArt
  related: string[]
}
const presentations: Record<string, Presentation> = {
  'robotics-lab': {
    story: roboticsStory,
    art: roboticsModelArt,
    related: ['service-operations-copilot', 'finance-document-assistant'],
  },
  'service-operations-copilot': {
    story: servicesStory,
    art: servicesModelArt,
    related: ['care-coordination', 'research-workflow'],
  },
  'research-workflow': {
    story: researchStory,
    art: researchModelArt,
    related: ['finance-document-assistant', 'service-operations-copilot'],
  },
  'finance-document-assistant': {
    story: financeStory,
    art: financeModelArt,
    related: ['accounting-workflows', 'research-workflow'],
  },
  'care-coordination': {
    story: careStory,
    art: careModelArt,
    related: ['service-operations-copilot', 'accounting-workflows'],
  },
  'accounting-workflows': {
    story: accountingStory,
    art: accountingModelArt,
    related: ['finance-document-assistant', 'care-coordination'],
  },
}

export function findPublishedWork(content: PublishedContent, slug: string) {
  const published = content.caseStudies.find((entry) => entry.slug === slug)
  if (!published) return undefined
  const presentation = presentations[slug]
  const study = publicWorkRecord(published)
  const story = presentation?.story
  const related = presentation
    ? content.caseStudies.filter((entry) =>
        presentation.related.includes(entry.slug),
      )
    : []
  return { study, story, related, art: presentation?.art }
}
