export type CaseStudy = {
  slug: string
  title: string
  category: string
  summary: string
  role: string
  context: string
  challenge: string
  approach: string
  delivery: string
  evidence?: string
  repositoryUrl?: string
  demoUrl?: string
  featured?: boolean
}

export const positioning = {
  description:
    'I build web and mobile products, connect complex workflows, and put AI to work. With over 15 years of engineering experience, I take ownership from the first technical decisions to deployment.',
  approach:
    'My experience spans consumer apps, business platforms, and tools for day-to-day operations. I start with what people need to do, then connect the interface, data, integrations, and delivery around that work.',
} as const

// Add only owner-approved, NDA-safe completed work. No example clients or results.
export const caseStudies: CaseStudy[] = [
  {
    slug: 'guided-business-builder',
    title: 'Guided Business Builder',
    category: 'Product engineering & applied AI / 2026',
    summary:
      'A guided workspace that turns a service business owner’s knowledge into a private website and customer assistant, with confirmed business facts, visual editing, and reviewed enquiries.',
    role: 'Personal project · product design, architecture, AI integration, and full-stack development.',
    context:
      'Small service businesses need a way to explain their work, shape a website, and answer customer questions from the same business information. This working development prototype connects those steps in one application.',
    challenge:
      'Turn an owner’s description into useful website content and customer answers while keeping private details separate and giving the owner control over business facts and proposed changes.',
    approach:
      'Guide the owner through an interview and services setup, confirm a version of their business context, then generate a private website. Connect visual edit requests and assistant answers to approved knowledge using React, TanStack Start, Convex, and AI SDK.',
    delivery:
      'A development prototype with saved business discovery, public/private context review, private website generation, object-based editing, revision comparison and restore, assistant testing, and an enquiry inbox with reply drafts. Stripe sandbox checkout, signed webhook updates, refunds, and release rehearsal are implemented as the prototype enters owner validation. Production payments, public publication, and custom domains remain planned.',
    evidence:
      'Six actual development screenshots show the product overview, illustrated interview, context review, saved website edit, assistant conversation, and customer enquiry review. Business details are synthetic. The captured website and edit use deterministic demo generation; they illustrate the workflow rather than model-output quality.',
  },
  {
    slug: 'care-coordination',
    title: 'Care Coordination',
    category: 'Mobile products & applied AI',
    summary:
      'A mobile app connecting older people, family members, and helpers, with real-time chat and voice input that turns requests into actions for the user to confirm.',
    role: 'Architecture, application development, client communication, and delivery within independent client work.',
    context:
      'Care coordination brings several people into the same workflow. Older people, family members, and helpers need an application that reflects their different roles while keeping communication connected.',
    challenge:
      'Support different roles and shared communication, and make it possible to request an action by speaking rather than navigating through the interface.',
    approach:
      'Combine a mobile experience with role-specific workflows and real-time chat. For voice requests, transcribe the speech, interpret the intended action, and ask the user to confirm it.',
    delivery:
      'A mobile care-coordination application with senior, family, and helper roles, real-time chat, and AI voice input connected to application actions.',
    evidence:
      'This example shows AI working inside a product workflow: understanding a spoken request and connecting it to an action, with confirmation remaining part of the experience.',
  },
  {
    slug: 'accounting-workflows',
    title: 'Accounting with AI Assistance',
    category: 'Business software & applied AI',
    summary:
      'A business accounting mobile app that extracts invoice and receipt data, categorizes expenses, and supports bookkeeping tasks with user visibility and control.',
    role: 'Architecture, application development, client communication, and delivery within independent client work.',
    context:
      'Invoices and receipts are the starting point for recurring bookkeeping work. The application brings document handling and AI assistance into a mobile business workflow.',
    challenge:
      'Connect information from financial documents to useful bookkeeping actions while keeping users able to see and control what the application is doing.',
    approach:
      'Use AI to extract data from invoices and receipts and categorize expenses. Integrate that assistance into the accounting application, alongside the user’s ability to inspect and control the work.',
    delivery:
      'A mobile business accounting application with invoice and receipt extraction, expense categorization, and AI assistance for bookkeeping tasks in real time.',
    evidence:
      'The engineering focus is the complete workflow around document data, rather than extraction alone: how that information becomes useful within a business application.',
  },
  {
    slug: 'research-workflow',
    title: 'Research to Action',
    category: 'Internal tools & workflow automation',
    summary:
      'My personal AI research workspace for finding engineering opportunities, assessing fit, preparing tailored outreach, and tracking the next step in a real-time pipeline.',
    role: 'Personal project · product design, application architecture, AI integration, and full-stack development.',
    context:
      'I built Lead Research as a private tool for my own search for AI product engineering and forward deployed engineering opportunities from Latvia. It is a personal project demonstrating AI-powered application development.',
    challenge:
      'Bring scattered job postings, remote eligibility, contracting terms, fit assessment, and outreach into one workflow that reflects my profile and leaves each decision open to review.',
    approach:
      'Connect agent research through MCP to a reviewable shortlist. Recheck selected sources, extract and score opportunities with AI, and generate contextual outreach drafts. Use Next.js, React, and Convex to connect those steps to a real-time application.',
    delivery:
      'A private research application with a pipeline board, source-linked shortlists, explained scores, personal rescore context, working hours in Latvia, qualification questions, connection requests, LinkedIn and email drafts, comments, and activity history.',
    evidence:
      'Four actual application screenshots use fictional data to show the pipeline, lead assessment, outreach drafts, and shortlist review. The engineering connects AI output to structured records, visible processing states, duplicate handling, and retries.',
  },
  {
    slug: 'finance-document-assistant',
    title: 'Finance Document Assistant',
    category: 'Applied AI / 2026',
    summary:
      'An AI assistant for extracting and validating receipts and invoices, answering questions with source references, and generating totals, tables, and charts.',
    role: 'Engineering portfolio project',
    context:
      'A financial-document assistant built with React, TanStack Start, and Convex.',
    challenge:
      'Bring document extraction, validation, and source-referenced answers into one application, so financial information can be explored alongside the documents it came from.',
    approach:
      'Combine a React interface with TanStack Start and Convex, supporting document-based AI assistance and structured financial outputs.',
    delivery:
      'Receipt and invoice extraction and validation, source-referenced questions and answers, and totals, tables, and charts.',
    repositoryUrl: 'https://github.com/prudolfs/fin-doc-assistant',
  },
  {
    slug: 'service-operations-copilot',
    title: 'Service Operations Copilot',
    category: 'Product engineering & AI / 2026',
    summary:
      'A mobile and web application for booking, tracking, and coordinating service jobs, with real-time chat, AI summaries, voice input, and reply suggestions.',
    role: 'Engineering portfolio project',
    context:
      'A service-operations application spanning mobile and web, built with React Native, TanStack Start, and Convex.',
    challenge:
      'Keep service-job coordination and communication together across mobile and web, with AI assistance available within the workflow.',
    approach:
      'Use React Native for mobile, TanStack Start for web, and Convex for the shared application backend. Bring summaries, voice input, and reply suggestions into the job-coordination experience.',
    delivery:
      'Service-job booking, tracking and coordination, real-time chat, AI summaries, voice input, and suggested replies.',
    repositoryUrl: 'https://github.com/prudolfs/service-operations-copilot',
    featured: false,
  },
  {
    slug: 'robotics-lab',
    title: 'Robotics Lab',
    category: 'Interactive software / 2026',
    summary:
      'A robotics platform with a robot simulator, drone mission planner, visual SLAM explorer, warehouse simulation, and a greenhouse workspace for teaching, training, and comparing robot policies.',
    role: 'Engineering portfolio project',
    context:
      'Interactive robotics applications built with TypeScript, React, and Three.js, with Python, MuJoCo, and PyTorch powering the greenhouse robot-learning workspace.',
    challenge:
      'Make robotics simulation, spatial planning, visual SLAM, and robot learning accessible through interactive browser tools with inspectable state and behavior.',
    approach:
      'Combine React and TypeScript interfaces with Three.js for interactive 3D views. In the greenhouse, stream authoritative MuJoCo state from Python, review recorded demonstrations, and compare learned policies with a scripted reference.',
    delivery:
      'A robot simulator, drone mission planner, visual SLAM explorer, warehouse delivery simulation, and Greenhouse Caretaker with manual teaching, demonstration review, imitation learning, bounded PPO practice, policy comparison, and multi-capsule missions.',
    repositoryUrl: 'https://github.com/prudolfs/robotics-lab',
    featured: false,
  },
]

export const experience = [
  {
    title: 'Business platforms and complex workflows.',
    description:
      'Insurance software and visual workflow builders, including forms and data-entry flows. I contributed frontend and full-stack features within cross-functional teams.',
  },
  {
    title: 'Products people use on the move.',
    description:
      'Grocery shopping and delivery, patient-facing services, mobile fuel payments, and city services. My roles included frontend development, solution architecture, and leading delivery teams.',
  },
  {
    title: 'Tools behind the operation.',
    description:
      'Parking and property management, commerce back offices, accounting and analytics dashboards, and agronomic device monitoring. This work spans team contributions, technical leadership, and independent delivery.',
  },
  {
    title: 'From earlier platforms to practical AI.',
    description:
      'My background includes marketing sites, online stores, browser games, and native mobile apps. More recent work connects AI assistants, document extraction, retrieval, and tool calling to web and mobile products.',
  },
] as const

export const commonQuestions = [
  {
    question: 'Can we start with an idea rather than a specification?',
    answer:
      'Yes. We can start with who the product is for, what they need to do, and what a useful first version should achieve. From there, we define the scope and the decisions needed to begin building.',
  },
  {
    question: 'Can you improve an existing product?',
    answer:
      'Yes. The work can focus on a feature, an integration, a difficult workflow, or the foundations of an existing application. We start by understanding the current system and the constraints your team works with.',
  },
  {
    question: 'Where does AI make sense?',
    answer:
      'When it has a clear job: extracting document data, making information easier to find, interpreting a request, or preparing work for someone to review. We look at the full workflow and how to handle uncertainty before choosing an AI approach.',
  },
  {
    question: 'How do you work with an existing team?',
    answer:
      'I can take responsibility for a defined piece of work or contribute alongside your engineers. My background includes independent delivery, cross-functional product teams, technical leadership, and mentoring.',
  },
  {
    question: 'What happens after the first version?',
    answer:
      'We agree on what delivery includes: deployment, documentation, handover, and any ongoing work. A focused project and an ongoing engineering partnership are both possible; the scope depends on what your product needs.',
  },
] as const
export const profileLinks: { label: string; url: string }[] = [
  { label: 'GitHub', url: 'https://github.com/prudolfs' },
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/rudolfs-pukitis-33027a154',
  },
]

export const services = [
  {
    id: 'product',
    number: '01',
    title: 'A product, from the ground up.',
    theme: 'Product engineering',
    description:
      'Build a useful first version, or develop a product that already exists. Connect web and mobile interfaces, data, backend services, and deployment around what users need to do.',
    detail: 'MVPs · Web applications · Product development',
  },
  {
    id: 'ai',
    number: '02',
    title: 'AI that fits the way you work.',
    theme: 'Applied AI',
    description:
      'Extract document data, find relevant information, or turn a spoken request into an application action. Give AI the context and tools it needs, with clear review and control for users.',
    detail: 'AI integrations · Assistants · Internal tools',
  },
  {
    id: 'workflow',
    number: '03',
    title: 'Less busywork. Better flow.',
    theme: 'Workflow automation',
    description:
      'Connect research, review, and day-to-day operations in one workflow. Replace scattered notes and repeated handoffs with clear processing states, useful recommendations, and a record of what happened.',
    detail: 'Process automation · Operations tools · Human review',
  },
  {
    id: 'integration',
    number: '04',
    title: 'Make your systems work together.',
    theme: 'Complex integrations',
    description:
      'Connect APIs, data, and existing software around your real constraints. Handle failures and edge cases so the integration is useful beyond the happy path.',
    detail: 'APIs · Data flows · System integrations',
  },
] as const

export const engagements = [
  {
    number: '01',
    title: 'A focused project.',
    label: 'Fixed scope',
    description:
      'For a defined product, integration, or workflow. We agree on the problem, scope, and delivery, then work towards a clear handover.',
  },
  {
    number: '02',
    title: 'An engineering partner.',
    label: 'Ongoing support',
    description:
      'For a product that keeps evolving. Work through priorities together, ship improvements, and keep architecture connected to the business.',
  },
] as const
