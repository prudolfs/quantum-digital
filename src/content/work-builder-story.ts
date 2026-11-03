import type { WorkStory } from '../../shared/work-story'

export const builderStory: WorkStory = {
  headline: 'Explain your business.',
  highlight: 'Shape what comes next.',
  experience: 'Interview → confirmed knowledge → website → enquiries',
  stack: 'React · TanStack Start · Convex · AI SDK',
  workflowHeading: 'One business. Connected knowledge.',
  workflowIntro:
    'An owner knows their work. The product helps them explain it, review what can be shared, and use that knowledge in a private website and customer assistant. The working prototype is entering owner validation, with Stripe sandbox checkout and release rehearsal implemented. Production payments, public publication, and custom domains remain planned.',
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
      title: 'A request becomes a saved design.',
      description:
        'The owner asks for an editorial, spacious website. The saved preview shows the updated typography and layout beside the editing conversation.',
      image: '/work/builder/request-preview.webp',
      alt: 'Private Clear Home demo website with an editorial design beside the saved request to make the site editorial and spacious.',
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
      title: 'Answer from the same business facts.',
      description:
        'The owner tests how the assistant explains services and helps a customer request a quote, using approved public knowledge.',
      image: '/work/builder/business-assistant.webp',
      alt: 'Private assistant test answering what home cleaning includes and how a customer can request a quote.',
      caption: 'Actual development capture · synthetic assistant conversation',
    },
    {
      title: 'Turn the conversation into an enquiry.',
      description:
        'A customer reviews their contact details, requested service, and preferred date before submitting. The owner keeps control of availability, quotes, and bookings.',
      image: '/work/builder/enquiry-review.webp',
      alt: 'Customer enquiry review showing contact details, cleaning request, preferred date, and explicit confirmation before submission.',
      caption: 'Actual development capture · synthetic enquiry review',
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
    {
      title: 'Rehearse payment and release.',
      description:
        'Reserve usage budgets and verify Stripe sandbox checkout, signed webhook updates, and refunds. Release rehearsal pairs exact website and context approvals with rollback and unpublication; production launch remains ahead.',
    },
  ],
  closingHeading: 'What does your business',
  closingHighlight: 'already know?',
  closingDescription:
    'Let’s turn that knowledge into a product people can use.',
  chatLabel: 'Discuss a guided AI product',
}
