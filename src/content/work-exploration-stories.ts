import type { WorkStory } from '../../shared/work-story'

export const researchStory: WorkStory = {
  headline: 'Research that',
  highlight: 'leads somewhere.',
  experience: 'Discovery → review → a trackable next step',
  stack: 'React · TypeScript · Convex · Agent tools',
  workflowHeading: 'From scattered sources to a decision.',
  workflowIntro:
    'Built around opportunity research: discover candidates, review the evidence, and choose what deserves a place in the pipeline. The same product thinking applies wherever research needs a clear next step.',
  steps: [
    {
      title: 'Discover candidates.',
      description:
        'Gather opportunities into a shortlist with source material and relevance explanations. Discovery stays separate from imported pipeline records.',
    },
    {
      title: 'Review and select.',
      description:
        'Inspect the source, restrictions, and duplicate warnings. Only candidates selected by the person proceed to import.',
    },
    {
      title: 'Verify the source.',
      description:
        'Re-check selected opportunities. Inaccessible sources and uncertain eligibility remain visible states, with a path to review or retry.',
    },
    {
      title: 'Inspect the score.',
      description:
        'Extraction and scoring turn imported material into information for review. Per-record processing states keep failures separate from the rest of the batch.',
    },
    {
      title: 'Prepare a draft.',
      description:
        'Use the opportunity context to prepare outreach wording. The person reviews the draft; the workflow does not send messages or apply automatically.',
    },
    {
      title: 'Track the next step.',
      description:
        'Move the opportunity through a pipeline, with comments and activity history keeping the decision connected to its context.',
    },
  ],
  evidenceHeading: 'The decision stays with the person.',
  evidenceIntro:
    'These original reconstructions use synthetic opportunities, example states, and illustrative scores. They explain the implemented workflow without exposing real research records or suggesting a live-source verification benchmark.',
  evidence: [
    {
      title: 'Select what moves forward.',
      description:
        'A shortlist can contain a plausible candidate, an eligibility question, and a duplicate warning. Reviewing the list alone creates no pipeline records.',
      image: '/work/research/shortlist-review.svg',
      alt: 'Reconstructed shortlist showing synthetic opportunities marked ready for review, needs verification, and already imported.',
      caption: 'Reconstructed workflow · synthetic opportunities',
    },
    {
      title: 'See the state behind the next step.',
      description:
        'Verification, scoring, and draft preparation have distinct states. A draft is an editable next step, with no automatic sending.',
      image: '/work/research/pipeline-draft.svg',
      alt: 'Reconstructed pipeline record with verification state, an illustrative score, and an outreach draft awaiting human review.',
      caption: 'Reconstructed workflow · illustrative score and draft',
    },
  ],
  decisionsHeading: 'Automation with visible boundaries.',
  decisionsIntro:
    'The useful engineering is in selection, evidence, retries, and durable state—not just producing a list of suggestions.',
  decisions: [
    {
      title: 'Keep discovery separate.',
      description:
        'Candidates remain reviewable before import. Unselected items do not become pipeline records or start extraction and scoring work.',
    },
    {
      title: 'Make uncertainty explicit.',
      description:
        'Eligibility, duplicate identity, inaccessible sources, and processing failures have their own states. A failed fetch does not prove an opportunity is closed.',
    },
    {
      title: 'Make imports repeatable.',
      description:
        'Transactional identity checks make repeated or parallel imports idempotent. Draft preparation uses the opportunity context while leaving sending to the person.',
    },
  ],
  closingHeading: 'Where should your research',
  closingHighlight: 'take you next?',
  closingDescription:
    'Let’s connect the sources, decisions, and work that follows.',
  chatLabel: 'Discuss a research workflow',
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
