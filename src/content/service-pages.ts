import type { PublishedContent } from '../../shared/content'
import {
  publishedServicePage,
  servicePageRoute,
} from '../../shared/service-pages'

export type ServiceNarrative = {
  startingHeading: string
  processIntro: string
  relatedIntro: string
  startingPoint: string
  closingIntro: string
  intro: string
  audience: string
  problems: { title: string; description: string }[]
  deliverables: { title: string; description: string }[]
  steps: { title: string; description: string }[]
  questions: { question: string; answer: string }[]
  relatedSlugs: string[]
  closing: string
  action: string
}

const product: ServiceNarrative = {
  startingHeading: 'Connect the idea to the product.',
  processIntro:
    'Product decisions, architecture, and delivery stay connected. Each step gives us something concrete to review.',
  relatedIntro:
    'A closer look at connected product journeys and mobile business workflows. These examples describe the work and its boundaries.',
  startingPoint: 'A useful journey, with a scope we agree together.',
  closingIntro:
    'Tell me about the people using it, what they need to do, and where you are starting from.',

  intro:
    'A first version should connect what people need to do with the software that makes it possible. Start with a useful journey, make the scope clear, and build the interfaces and systems around it.',
  audience:
    'For founders turning an idea into a first release, and product teams extending an application that already exists. We can define a focused project or work together as the product evolves.',
  problems: [
    {
      title: 'An idea needs a starting point.',
      description:
        'There are many possible features, but the first useful outcome is still unclear. We identify the people using the product, their core task, and the smallest connected journey worth delivering.',
    },
    {
      title: 'The pieces need to work together.',
      description:
        'An interface is only part of a product. Data, permissions, backend services, and integrations need to support the same experience, including loading, errors, and recovery.',
    },
    {
      title: 'An existing product needs its next step.',
      description:
        'A new feature or difficult workflow has to fit the system and team already in place. We review those constraints before deciding what to build or change.',
    },
  ],
  deliverables: [
    {
      title: 'A clear first release.',
      description:
        'An agreed product journey, priorities, and scope. Make the important decisions explicit so everyone understands what the release includes and what can come later.',
    },
    {
      title: 'Connected application engineering.',
      description:
        'Web or mobile interfaces, data models, and backend services shaped around the agreed journey. Account flows, permissions, and integrations are included when the scope calls for them.',
    },
    {
      title: 'Delivery with a handover.',
      description:
        'Agree the checks, deployment, documentation, and ownership needed to operate and continue the product. Ongoing engineering support is an option to discuss, not an automatic commitment.',
    },
  ],
  steps: [
    {
      title: 'Understand the journey.',
      description:
        'Start with users, the problem, the existing system, and the constraints that matter.',
    },
    {
      title: 'Make the scope concrete.',
      description:
        'Choose the first useful outcome and connect product decisions with the technical approach.',
    },
    {
      title: 'Build and review.',
      description:
        'Review working increments, resolve edge cases, and adjust when real use reveals a better direction.',
    },
    {
      title: 'Verify and hand over.',
      description:
        'Check the agreed behavior, prepare deployment, and document how the product can be maintained.',
    },
  ],
  questions: [
    {
      question: 'Can we start without a specification?',
      answer:
        'Yes. We can begin with who the product is for, the task they need to complete, and what a useful first version should achieve. We turn that into an agreed scope before building.',
    },
    {
      question: 'Can you build on an existing product?',
      answer:
        'Yes. The work can focus on a feature, an integration, or a difficult workflow. We review the current architecture and the constraints your team works with before choosing the approach.',
    },
    {
      question: 'Is this only for web applications?',
      answer:
        'No. My experience includes web and mobile products, including React Native applications. We choose the interface and platform around the people using the product and the requirements of the project.',
    },
    {
      question: 'How long does a first version take?',
      answer:
        'That depends on the journey, integrations, existing foundations, and review requirements. We discuss those constraints and agree a realistic scope rather than promising a timeline before understanding the work.',
    },
    {
      question: 'What does handover include?',
      answer:
        'We agree deployment, documentation, ownership, and any ongoing support as part of the scope. A focused delivery and a longer engineering partnership are both possible.',
    },
  ],
  relatedSlugs: ['care-coordination', 'accounting-workflows'],
  closing: 'What should your first useful version do?',
  action: 'Tell me about your product',
}

const ai: ServiceNarrative = {
  startingHeading: 'Give AI a specific job.',
  processIntro:
    'Start with representative inputs and a useful outcome. Review the results before making AI part of the everyday workflow.',
  relatedIntro:
    'Document extraction, source-referenced answers, and assistance within service-job communication. These examples show the application around the model.',
  startingPoint: 'A defined task and examples we can assess together.',
  closingIntro:
    'What information or request needs interpreting, and how should someone review the result?',
  intro:
    'A model response is one part of an integration. The useful work is connecting inputs, approved context, application tools, and a clear path for people to inspect the result.',
  audience:
    'For teams adding assistance to an existing product, or building an internal tool around a specific information task. We start with the job and decide whether model assistance makes sense.',
  problems: [
    {
      title: 'Documents need to become useful data.',
      description:
        'Invoices, receipts, and other documents contain information that people need to check and use. Extraction should stay connected to the source and the next step in the application.',
    },
    {
      title: 'Answers need the right context.',
      description:
        'A general answer may miss the information that matters to your team. Define the approved sources, access boundaries, and references needed for a useful answer.',
    },
    {
      title: 'Requests need a reviewable action.',
      description:
        'Written or spoken input can suggest what a person wants to do. Keep the proposed action visible, handle ambiguity, and let the person confirm before consequential changes.',
    },
  ],
  deliverables: [
    {
      title: 'A task we can evaluate.',
      description:
        'An agreed use case and representative examples, including difficult inputs. Compare ordinary software and model-assisted approaches against the outcome you need.',
    },
    {
      title: 'Assistance inside the application.',
      description:
        'A provider integration, approved context or source lookup, and bounded application tools where needed. Connect results to useful interface states rather than leaving them in a separate demo.',
    },
    {
      title: 'Review and recovery.',
      description:
        'Source visibility, corrections, appropriate confirmation, and failure handling. Agree data handling, operating costs, and the checks that matter for this task.',
    },
  ],
  steps: [
    {
      title: 'Define the job.',
      description:
        'Identify the input, the useful result, and who will check or act on it.',
    },
    {
      title: 'Test representative examples.',
      description:
        'Compare approaches and inspect uncertain or incorrect results before choosing the integration.',
    },
    {
      title: 'Connect context and tools.',
      description:
        'Fit the assistance into the application’s data access, permissions, and user journey.',
    },
    {
      title: 'Review real behavior.',
      description:
        'Check sources, corrections, costs, and recovery paths with the people using it.',
    },
  ],
  questions: [
    {
      question: 'Does this task need AI?',
      answer:
        'Not necessarily. Rules, search, or ordinary application logic may be enough. We use model assistance when interpreting varied information adds value, and assess it against representative examples.',
    },
    {
      question: 'Can AI work inside our existing application?',
      answer:
        'Yes, subject to the application’s interfaces, data access, and permissions. We review those boundaries before deciding how context, tools, and results should connect.',
    },
    {
      question: 'How do people review uncertain results?',
      answer:
        'Keep the source information and proposed result visible. Provide correction paths and appropriate confirmation before consequential actions. The exact review flow depends on the task.',
    },
    {
      question: 'Do we need a vector database?',
      answer:
        'That depends on the amount and shape of your information. A small curated context or direct lookup can be sufficient. Retrieval becomes useful when there is more relevant source material than the model should receive at once.',
    },
    {
      question: 'How do we choose a model and handle data?',
      answer:
        'We consider the task, representative results, response time, cost, and provider data handling. Access permissions and which information may be sent to a provider are decisions to agree before connecting real data.',
    },
  ],
  relatedSlugs: ['finance-document-assistant', 'service-operations-copilot'],
  closing: 'Where would assistance be useful?',
  action: 'Tell me about your AI task',
}

const workflow: ServiceNarrative = {
  startingHeading: 'Make the next step visible.',
  processIntro:
    'Map the current process, improve a bounded step, and review what changes in practice. Keep ownership and recovery clear as the workflow grows.',
  relatedIntro:
    'Research shortlists, review queues, pipeline tracking, and mobile bookkeeping. These examples connect processing to the people responsible for the next step.',
  startingPoint: 'A repeated process and one useful improvement.',
  closingIntro:
    'Where does work get repeated, lose its place, or wait for someone to take the next step?',
  intro:
    'Useful automation connects the work around a task: its current state, who reviews it, what happens next, and how to recover when processing fails. AI can support a step when interpretation is needed.',
  audience:
    'For teams coordinating recurring work across notes, spreadsheets, and applications. Start with one bottleneck or build a workspace that makes the whole process easier to follow.',
  problems: [
    {
      title: 'Work is scattered across tools.',
      description:
        'Information, notes, and decisions live in different places. Bring the relevant context together so people can review work without reconstructing it each time.',
    },
    {
      title: 'Nobody can see the next step.',
      description:
        'A handoff needs an owner and a clear state. Make queues, responsibilities, and review decisions visible instead of relying on someone to remember what happens next.',
    },
    {
      title: 'Repeated processing needs recovery.',
      description:
        'An automated step can fail or receive the same input twice. Preserve the work, show what happened, and provide an agreed retry or manual path.',
    },
  ],
  deliverables: [
    {
      title: 'A shared process model.',
      description:
        'Map steps, states, ownership, and the decisions that need human review. Agree which improvement is useful enough to build first.',
    },
    {
      title: 'A workspace for the work.',
      description:
        'Queues, status views, and relevant information around the process. Connect suitable automated steps, with review gates where judgment or approval belongs.',
    },
    {
      title: 'Visible operation.',
      description:
        'Activity history, failure states, retries, and duplicate handling where the process calls for them. Document how the team can continue and recover the work.',
    },
  ],
  steps: [
    {
      title: 'Follow the current process.',
      description:
        'Understand the inputs, handoffs, decisions, and places where work gets stuck.',
    },
    {
      title: 'Choose a bounded improvement.',
      description:
        'Identify a useful step and make ownership and review requirements explicit.',
    },
    {
      title: 'Connect states and actions.',
      description:
        'Build the interface and automation around visible progress and recoverable processing.',
    },
    {
      title: 'Review everyday use.',
      description:
        'Check the handoffs with the team and decide what to improve next.',
    },
  ],
  questions: [
    {
      question: 'What should remain manual?',
      answer:
        'Keep judgment and approvals with people where mistakes have material consequences. Automate suitable repeatable work around those decisions, with clear inputs and review states.',
    },
    {
      question: 'Can we automate one step first?',
      answer:
        'Yes. A bounded improvement can make an existing process easier without replacing it all. It also gives us something concrete to review before expanding the scope.',
    },
    {
      question: 'Does workflow automation require AI?',
      answer:
        'No. State transitions, rules, scheduled tasks, and integrations can handle many steps. AI is an option when varied information needs interpretation, with review around its results.',
    },
    {
      question: 'What happens when processing fails?',
      answer:
        'Make the state and relevant error visible, preserve the work, and agree retry limits or a manual recovery path. Duplicate protection and activity history can be included when needed.',
    },
    {
      question: 'Will automation send messages automatically?',
      answer:
        'Only if that behavior is explicitly agreed for the workflow. Preparing a draft and sending it are separate actions. Review and confirmation can remain part of the process.',
    },
  ],
  relatedSlugs: ['research-workflow', 'accounting-workflows'],
  closing: 'Which handoff would you improve first?',
  action: 'Tell me about your workflow',
}

const integration: ServiceNarrative = {
  startingHeading: 'Connect systems around their constraints.',
  processIntro:
    'Inspect access and data ownership first. Implement a narrow exchange, verify its edge cases, and document how it should operate.',
  relatedIntro:
    'Connected mobile experiences and shared operations across web and mobile. These demonstrate application coordination, rather than an unspecified external vendor integration.',
  startingPoint: 'A defined data flow and access to the systems involved.',
  closingIntro:
    'Which systems need to exchange information, who owns it, and what should happen when an exchange fails?',
  intro:
    'A useful integration needs more than a successful request. Define what information moves, which system owns it, who may access it, and how delivery should behave when systems are unavailable.',
  audience:
    'For teams connecting existing applications, APIs, and data. The scope starts with the flow you need and the access and constraints each system provides.',
  problems: [
    {
      title: 'Information crosses application boundaries.',
      description:
        'Different systems represent the same work in different ways. Define the data contract and source of truth so changes have a clear destination and owner.',
    },
    {
      title: 'APIs come with real limits.',
      description:
        'Available endpoints, permissions, rate limits, and missing features shape what is possible. Review the supported access before committing to an exchange.',
    },
    {
      title: 'Delivery needs more than the happy path.',
      description:
        'Requests may time out, arrive twice, or reach a system that is temporarily unavailable. Agree what can be retried, what must be checked, and what people need to see.',
    },
  ],
  deliverables: [
    {
      title: 'A clear exchange contract.',
      description:
        'Defined inputs, outputs, ownership, and access requirements. Decide which system is authoritative and how conflicting or incomplete data should be handled.',
    },
    {
      title: 'A bounded connection.',
      description:
        'API calls, webhooks, or another supported exchange suited to the systems involved. Include authentication and permissions within the agreed integration scope.',
    },
    {
      title: 'Operation and handover.',
      description:
        'Failure visibility, retry limits, and duplicate protection where required. Document configuration, ownership, and the steps needed to maintain or recover the connection.',
    },
  ],
  steps: [
    {
      title: 'Inspect the systems.',
      description:
        'Review supported access, documentation, permissions, and the flow the team needs.',
    },
    {
      title: 'Define ownership and contracts.',
      description:
        'Agree what moves, what stays authoritative, and how to handle incomplete data.',
    },
    {
      title: 'Build a narrow exchange.',
      description:
        'Connect the agreed flow and verify authentication, delivery, and edge cases.',
    },
    {
      title: 'Prepare operation.',
      description:
        'Check failures and recovery, then document configuration and handover.',
    },
  ],
  questions: [
    {
      question: 'Can you connect our existing systems?',
      answer:
        'We first assess the available APIs, data access, permissions, and required flow. Those findings determine what is feasible and the scope of the connection.',
    },
    {
      question: 'What if an API is limited?',
      answer:
        'Design around its supported access and documented limits, or discuss another approach. A missing endpoint or permission can change the scope; we do not assume a bypass exists.',
    },
    {
      question: 'How are failed exchanges handled?',
      answer:
        'Agree visible failures, bounded retries, duplicate protection, and a recovery procedure for the particular flow. Some errors need a person to review the data rather than repeat the same request.',
    },
    {
      question: 'Do both systems need to update each other?',
      answer:
        'Not always. A one-way exchange can be enough. Bidirectional updates need clear ownership and conflict handling, which we define before building them.',
    },
    {
      question: 'Can we start with one data flow?',
      answer:
        'Yes. A narrow exchange makes access, mappings, and failure behavior concrete. We can review it before connecting more flows or discussing a larger migration.',
    },
  ],
  relatedSlugs: ['care-coordination', 'service-operations-copilot'],
  closing: 'What needs to work together?',
  action: 'Tell me about your systems',
}

const narratives: Record<string, ServiceNarrative> = {
  product,
  ai,
  workflow,
  integration,
}

export function findPublishedServicePage(
  content: PublishedContent,
  slug: string,
) {
  const service = publishedServicePage(content.services, slug)
  if (!service) return undefined
  const narrative = narratives[service.id]
  const route = servicePageRoute(service)
  if (!narrative || !route) return undefined
  return {
    service,
    route,
    narrative,
    related: narrative.relatedSlugs.flatMap((relatedSlug) => {
      const study = content.caseStudies.find(
        (item) => item.slug === relatedSlug,
      )
      return study ? [study] : []
    }),
  }
}
