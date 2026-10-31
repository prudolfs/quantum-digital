import type { WorkStory } from '../../shared/work-story'

export const builderStory: WorkStory = {
  headline: 'Explain your business.',
  highlight: 'Shape what comes next.',
  experience: 'Interview → confirmed knowledge → website → enquiries',
  stack: 'React · TanStack Start · Convex · AI SDK',
  workflowHeading: 'One business. Connected knowledge.',
  workflowIntro:
    'An owner knows their work. The product helps them explain it, review what can be shared, and use that knowledge in a private website and customer assistant. This is a working development prototype; public publication, billing, and custom domains remain planned.',
  steps: [
    {
      title: 'Describe the business.',
      description:
        'Work through a guided interview, add services and pricing, and save progress. Optional voice input supports the same discovery flow.',
    },
    {
      title: 'Confirm the facts.',
      description:
        'Review the business context, separate public and private details, and confirm a revision before using it to create a website.',
    },
    {
      title: 'Shape the website.',
      description:
        'Generate a private preview. Select an object or describe a global change, review the proposal, and compare or restore saved revisions.',
    },
    {
      title: 'Connect the conversation.',
      description:
        'Test an assistant grounded in approved public facts. Customers review an enquiry before submitting it; the owner receives it in an inbox with reply drafts.',
    },
  ],
  evidenceHeading: 'From the owner’s words to a working preview.',
  evidenceIntro:
    'These actual development captures use a fictional home-cleaning business. The saved website and edit use deterministic demo generation, showing the interface and review flow without measuring model quality.',
  evidence: [
    {
      title: 'The website and the conversation.',
      description:
        'A private website preview sits beside its editing chat. The owner can select part of the page or request a change across the website.',
      image: '/work/builder/website-selection.webp',
      alt: 'Guided Business Builder showing a private Clear Home demo website beside its website-editing chat.',
      caption: 'Actual development capture · synthetic business · demo website',
    },
    {
      title: 'Start with what the owner knows.',
      description:
        'An illustrated interview helps the owner describe the business. The answers become saved context for the steps that follow.',
      image: '/work/builder/business-details.webp',
      alt: 'Business discovery interview with a synthetic home-cleaning business answer and an illustrated guide.',
      caption: 'Actual development capture · synthetic business interview',
    },
    {
      title: 'Review before confirming.',
      description:
        'The owner reviews business information and its visibility before confirming a context revision for website generation.',
      image: '/work/builder/context-review.webp',
      alt: 'Business context review screen for a fictional service business before owner confirmation.',
      caption: 'Actual development capture · synthetic context review',
    },
    {
      title: 'Give the assistant approved knowledge.',
      description:
        'Confirmed public facts provide a shared basis for customer answers. Private assistant tests let the owner inspect the experience before a public launch.',
      image: '/work/builder/approved-knowledge.webp',
      alt: 'Approved public business knowledge available to the customer assistant in the development application.',
      caption: 'Actual development capture · synthetic assistant knowledge',
    },
  ],
  decisionsHeading: 'Keep the owner in the loop.',
  decisionsIntro:
    'The engineering connects business facts, generated code, revision history, and customer conversations. Each has its own review and recovery needs.',
  decisions: [
    {
      title: 'Confirm knowledge before using it.',
      description:
        'Business discovery produces versioned, owner-confirmed context with public/private controls. Customer answers use approved public facts.',
    },
    {
      title: 'Keep generation recoverable.',
      description:
        'Save generated source and output so browser builds can be retried without another model request. Pair website and context revisions for comparison and restore.',
    },
    {
      title: 'Make enquiries explicit.',
      description:
        'Customers review their enquiry before submission and receive a persisted receipt. Preferred dates remain requests for the owner to confirm.',
    },
  ],
  closingHeading: 'What does your business',
  closingHighlight: 'already know?',
  closingDescription:
    'Let’s turn that knowledge into a product people can use.',
  chatLabel: 'Discuss a guided AI product',
}
