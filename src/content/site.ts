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
}

// Add only owner-approved, NDA-safe completed work. No example clients or results.
export const caseStudies: CaseStudy[] = [
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
  },
  {
    slug: 'robotics-lab',
    title: 'Robotics Lab',
    category: 'Interactive software / 2026',
    summary:
      'A browser-based robotics platform with a robot simulator, a 3D drone mission planner, and a visual SLAM explorer.',
    role: 'Engineering portfolio project',
    context:
      'A browser-based robotics platform built with TypeScript, React, and Three.js.',
    challenge:
      'Make robotics simulation, spatial planning, and visual SLAM exploration accessible through interactive browser tools.',
    approach:
      'Combine React and TypeScript application interfaces with Three.js for interactive 3D views.',
    delivery:
      'A robot simulator, a 3D drone mission planner, and a visual SLAM explorer.',
    repositoryUrl: 'https://github.com/prudolfs/robotics-lab',
  },
]
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
      'Turn a focused idea into a useful MVP, then build on it. Architecture, interfaces, backend, and deployment work together from the start.',
    detail: 'MVPs · Web applications · Product development',
  },
  {
    id: 'ai',
    number: '02',
    title: 'AI that fits the way you work.',
    theme: 'Applied AI',
    description:
      'Bring AI into your product or business with a clear job to do. Connect assistants and tools to the context they need, with review where it matters.',
    detail: 'AI integrations · Assistants · Internal tools',
  },
  {
    id: 'workflow',
    number: '03',
    title: 'Less busywork. Better flow.',
    theme: 'Workflow automation',
    description:
      'Find the repeated handoffs, manual steps, and disconnected systems. Build a workflow that makes the next action clear and keeps people in control.',
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
