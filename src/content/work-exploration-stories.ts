import type { WorkStory } from '../../shared/work-story'

export const researchStory: WorkStory = {
  headline: 'Research that',
  highlight: 'leads somewhere.',
  experience: 'Personal AI workspace · research → assessment → outreach',
  stack: 'Next.js · React · TypeScript · Convex · AI SDK · MCP',
  workflowHeading: 'From a promising role to a useful conversation.',
  workflowIntro:
    'I built Lead Research for my own search for AI product engineering and forward deployed engineering opportunities. It brings AI research, fit assessment, outreach drafts, and a real-time pipeline into one private application, shaped around working from Latvia.',
  steps: [
    {
      title: 'Discover relevant roles.',
      description:
        'A research agent uses my profile and search criteria to gather opportunities and submit a source-linked shortlist through MCP. I can also add a lead directly.',
    },
    {
      title: 'Choose what to pursue.',
      description:
        'I review job descriptions, remote eligibility, contracting terms, and duplicate warnings before selecting which roles to import.',
    },
    {
      title: 'Recheck the posting.',
      description:
        'Selected sources are checked again before import and scoring. Unavailable pages and unresolved eligibility stay visible for review or retry.',
    },
    {
      title: 'Assess the fit.',
      description:
        'AI turns the source material into a problem summary, score breakdown, fit reasons, risks, and qualification questions. I can add personal context and rescore an individual opportunity.',
    },
    {
      title: 'Prepare the conversation.',
      description:
        'The app generates a connection request, LinkedIn message, and email using the opportunity context. I review and send the wording myself.',
    },
    {
      title: 'Keep the next step visible.',
      description:
        'A real-time board tracks New, Outreach, Active, and Closed opportunities. Comments, activity history, and a searchable archive keep the research connected to what happens next.',
    },
  ],
  evidenceHeading: 'Inside my AI research workspace.',
  evidenceIntro:
    'These four screenshots show the actual application with fictional companies, opportunities, scores, and outreach. Lead Research is a private personal project, built to support my own research and demonstrate AI-powered application development.',
  evidence: [
    {
      title: 'One pipeline for the whole search.',
      description:
        'Scored opportunities sit alongside their stage and technology tags. The board makes it easy to see what is new, where a conversation has started, and which opportunities are active or closed.',
      image: '/work/research/pipeline.webp',
      alt: 'Lead Research application showing fictional opportunities, scores, and technology tags across New, Outreach, Active, and Closed columns.',
      caption: 'Actual app capture · fictional pipeline data',
    },
    {
      title: 'Understand the score. Add your context.',
      description:
        'A lead assessment connects the problem summary, fit breakdown, qualification questions, and working hours in Latvia. Optional personal context lets me rescore a role when my circumstances change.',
      image: '/work/research/lead-assessment.webp',
      alt: 'Lead assessment for a fictional AI product engineering role, with score breakdown, personal rescore context, qualification questions, and working hours in Latvia.',
      caption: 'Actual app capture · fictional assessment and scores',
    },
    {
      title: 'Turn research into a tailored introduction.',
      description:
        'Connection requests, LinkedIn messages, and email drafts draw on the role and my engineering background. The original input remains alongside the drafts for reference before I reach out.',
      image: '/work/research/research-outreach.webp',
      alt: 'Outreach section showing a connection request, LinkedIn message, email draft, and original input for a fictional opportunity.',
      caption: 'Actual app capture · fictional outreach drafts',
    },
    {
      title: 'Review the shortlist before importing.',
      description:
        'Source postings, full descriptions, fit explanations, and eligibility gaps stay visible during selection. Only the roles I choose move into verification and the working pipeline.',
      image: '/work/research/shortlist-review.webp',
      alt: 'Shortlist review dialog showing fictional roles, remote and B2B eligibility, source links, and two opportunities selected for import.',
      caption: 'Actual app capture · fictional shortlist',
    },
  ],
  decisionsHeading: 'AI assistance connected to a working product.',
  decisionsIntro:
    'The engineering connects model output to real application state: source material, review, scoring, drafts, and the next action all belong to the same opportunity.',
  decisions: [
    {
      title: 'Give agents a defined handoff.',
      description:
        'MCP connects external research agents to shortlist submission. Discovery stays separate from import, so I can inspect the evidence and select roles before extraction and scoring begin.',
    },
    {
      title: 'Make assessments inspectable.',
      description:
        'Structured AI output feeds the assessment interface: summaries, score reasons, qualification gaps, and outreach. Source context and optional rescore context make the recommendation easier to question and refine.',
    },
    {
      title: 'Keep progress durable.',
      description:
        'Convex keeps the board, processing states, comments, and activity history in sync. Per-record retries and transactional duplicate checks support repeatable imports, while outreach stays under my control.',
    },
  ],
  closingHeading: 'Where could AI help',
  closingHighlight: 'move your work forward?',
  closingDescription:
    'Let’s build useful AI assistance into the application your workflow needs.',
  chatLabel: 'Discuss an AI-powered application',
}

export const servicesStory: WorkStory = {
  headline: 'Keep the job',
  highlight: 'and the conversation.',
  experience: 'Client → worker → manager · shared job context',
  stack: 'React Native · TanStack Start · Convex',
  workflowHeading: 'One job. Different views of the work.',
  workflowIntro:
    'A service request moves across mobile and web. Each participant sees the information and actions that fit their role, while communication stays connected to the job.',
  steps: [
    {
      title: 'Describe the job.',
      description:
        'Voice input can prepare request details from the current screen and draft context. The client reviews the prefilled form before creating the request.',
    },
    {
      title: 'Take the work forward.',
      description:
        'A worker accepts and starts the job. Shared backend state connects assignment and progress to the appropriate client and manager views.',
    },
    {
      title: 'Communicate in context.',
      description:
        'Request chat keeps participants connected. Dictation and suggested replies fill an editable composer; they do not send a message automatically.',
    },
    {
      title: 'Review and complete.',
      description:
        'Managers can inspect a streamed request summary. The worker completes the job through the request lifecycle, with progress visible across the application.',
    },
  ],
  evidenceHeading: 'Assistance beside the work.',
  evidenceIntro:
    'These reconstructed walkthroughs use synthetic job details and prepared example wording. They explain voice routing, summary states, and editable reply suggestions rather than reproduce application captures or live model output.',
  evidence: [
    {
      title: 'A shared job, with role-specific actions.',
      description:
        'The client request, worker progress, and manager overview share the same job context. Voice prepares details for review rather than silently creating work.',
      image: '/work/services/job-coordination.svg',
      alt: 'Reconstructed service workflow connecting a reviewed client request, worker assignment and progress, and manager overview.',
      caption: 'Reconstructed workflow · synthetic service job',
    },
    {
      title: 'A summary and a reply you can inspect.',
      description:
        'Summary progress is visible in the application. A suggested reply becomes an editable draft in the conversation, leaving the send action to the participant.',
      image: '/work/services/summary-reply.svg',
      alt: 'Reconstructed manager summary and worker reply suggestion, with pending, streaming, and done states and an editable reply draft.',
      caption: 'Reconstructed workflow · prepared assistance examples',
    },
  ],
  decisionsHeading: 'Shared state. Context-aware assistance.',
  decisionsIntro:
    'Mobile and web use the same request records and role rules. AI assistance works inside the existing coordination flow.',
  decisions: [
    {
      title: 'Share the job state.',
      description:
        'Convex connects mobile and web to shared records. Role rules and request transitions govern creation, assignment, start, completion, and cancellation.',
    },
    {
      title: 'Give voice a destination.',
      description:
        'Voice routing receives screen, role, request, and conversation context. Ambiguous targets open a picker so a person chooses where the draft belongs.',
    },
    {
      title: 'Subscribe to AI progress.',
      description:
        'Summary state is persisted as pending, streaming, done, or error. Clients subscribe to those updates, while reply suggestions and dictation remain editable composer content.',
    },
  ],
  closingHeading: 'How could your operations',
  closingHighlight: 'stay better connected?',
  closingDescription:
    'Let’s bring the job, the people, and useful assistance together.',
  chatLabel: 'Discuss an operations product',
}

export const roboticsStory: WorkStory = {
  headline: 'Build a world.',
  highlight: 'See how robots move.',
  experience: 'Simulation → sensing → planning → mapping',
  stack: 'TypeScript · React · Three.js',
  applications: [
    {
      title: 'Robot Simulator',
      description:
        'Differential-drive motion, lidar, occupancy mapping, A* navigation, coverage, localization, editing, and playback.',
      status:
        'Implemented browser simulation · simulated robots, without physical hardware.',
    },
    {
      title: 'Drone Mission Planner',
      description:
        'Compose and validate 3D missions, execute routes, inspect virtual sensors, and save versioned JSON missions.',
      status:
        'Implemented WebGPU planner · external formats and replay remain roadmap work.',
    },
    {
      title: 'SLAM Studio',
      description:
        'Inspect rendered stereo pixels, visual odometry, sparse maps, and geometrically verified loop closure in an authored lab.',
      status:
        'Development exploration · relocalization remains planned; tracking loss currently requires reset.',
    },
    {
      title: 'Warehouse Demo',
      description:
        'Compare Predictable and Full Laya controllers on the same seeded delivery scenario, then inspect summaries or recorded playback.',
      status:
        'Implemented WebGPU simulation · Full Laya needs a reachable decision service; recordings stay in the current tab.',
    },
  ],
  workflowHeading: 'Make movement and estimation inspectable.',
  workflowIntro:
    'These browser applications are engineering explorations of simulation, navigation, sensing, and mapping. They make the world and the algorithm’s view of it available for inspection.',
  steps: [
    {
      title: 'Choose a world.',
      description:
        'Pick a simulator, drone mission, inspection lab, or seeded warehouse. Configure the scenario and inspect its starting state.',
    },
    {
      title: 'Start the movement.',
      description:
        'Drive a robot, execute a mission, run a guided inspection, or start a delivery. The world follows the simulation’s physical rules.',
    },
    {
      title: 'Inspect the signals.',
      description:
        'Look at routes, sensor readings, stereo observations, maps, or delivery progress. Keep estimated state distinct from the simulator’s ground truth.',
    },
    {
      title: 'Compare the behavior.',
      description:
        'Use the comparisons and playback available in each application. Warehouse controllers share the same seed; recorded delivery playback does not call the decision service.',
    },
  ],
  evidenceHeading: 'The application, beyond the illustration.',
  evidenceIntro:
    'These existing application captures show simulated environments: a seeded warehouse and the stereo workbench in SLAM Studio. They are actual interfaces, separate from the conceptual hero, and do not establish physical-robot performance or a new benchmark.',
  evidence: [
    {
      title: 'Inspect a seeded delivery.',
      description:
        'The warehouse view connects the forklift, route, cargo, run configuration, and delivery state. Predictable mode runs independently; Full Laya requires the decision service.',
      image: '/work/robotics/warehouse-overview.webp',
      alt: 'Actual Warehouse Demo capture showing the authored warehouse, forklift, seed 42, Predictable controller, and delivery inspector before starting.',
      caption: 'Actual application capture · simulated warehouse · seed 42',
    },
    {
      title: 'Look through the stereo workbench.',
      description:
        'SLAM Studio brings rendered stereo input, tracked observations, and estimated motion into the inspection lab. Pixel-based estimation and synthetic observations remain distinguishable modes.',
      image: '/work/robotics/slam-workbench.webp',
      alt: 'Actual SLAM Studio capture showing the authored inspection lab, stereo input with tracked image features, and observation and motion controls.',
      caption:
        'Actual application capture · simulated lab · rendered stereo pixels',
    },
  ],
  decisionsHeading: 'Keep the simulation honest.',
  decisionsIntro:
    'The architecture separates the world, the estimates, the controllers, and the interface. That makes the behavior easier to test and understand.',
  decisions: [
    {
      title: 'Separate simulation from rendering.',
      description:
        'Deterministic dynamics and reusable algorithm packages sit outside React state and rendering. Applications compose those packages into different worlds and inspection tools.',
    },
    {
      title: 'Distinguish estimates from truth.',
      description:
        'Visual odometry and mapping estimate motion from observations. SLAM loop closure requires geometric verification; visual resemblance or ground-truth proximity alone is not enough.',
    },
    {
      title: 'Compare on the same scenario.',
      description:
        'Warehouse controllers share seeded scenarios and physical rules. Delayed or invalid service decisions pause visibly, and recorded playback can inspect a run without the service.',
    },
  ],
  closingHeading: 'What could an interactive world',
  closingHighlight: 'help you understand?',
  closingDescription:
    'Let’s talk about simulation, spatial interfaces, and inspectable software.',
  chatLabel: 'Discuss an interactive product',
}
