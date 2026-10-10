/** Approved public career narrative, grounded in the résumé and project review. */
export const aboutIntroduction = {
  headline: 'I’m Rudolfs.',
  highlight: 'Product to engineering.',
  description:
    'I’m Rudolfs Pukitis, a full-stack engineer with 15+ years of software engineering experience. I’ve built web and mobile products, contributed within cross-functional teams, and led delivery teams. Quantum Digital is my independent practice, connecting product decisions with the engineering that makes them work.',
}

export const careerJourney = [
  {
    years: '2009–2016',
    title: 'Web, games, and mobile.',
    description:
      'Independent work across websites, commerce, business dashboards, browser and social games, and native Android and iOS apps. Architecture, development, client communication, and delivery stayed close to the product.',
    contribution: 'Independent delivery · solo and small groups',
  },
  {
    years: '2016–2020',
    title: 'Products behind everyday services.',
    description:
      'Frontend contributions to travel commerce, marketplaces, and city services. On parking and property-management products, I also led teams, shaped architecture, mentored colleagues, and worked with stakeholders.',
    contribution: 'Team contributions · leadership on selected projects',
  },
  {
    years: '2020–2022',
    title: 'Leading teams through delivery.',
    description:
      'Led agile teams working on online shopping and delivery, patient-facing services, and mobile fuel purchases. The role connected architecture, mentoring, stakeholder communication, and delivery.',
    contribution: 'Team leadership · architecture and delivery coordination',
  },
  {
    years: '2022–2024',
    title: 'Complex platforms, built together.',
    description:
      'Frontend and full-stack feature development in cross-functional teams building insurance platforms and visual tools for workflows, forms, and data entry.',
    contribution: 'Team contribution · frontend and full-stack development',
  },
  {
    years: '2024–present',
    title: 'Independent products and applied AI.',
    description:
      'Care coordination and accounting mobile apps, an agronomic-device monitoring dashboard, and technical consulting. Independent client work includes architecture, development, communication, and delivery, alongside portfolio exploration in AI workflows and robotics.',
    contribution: 'Independent client delivery · portfolio exploration',
  },
] as const

export const workingPractices = [
  {
    title: 'Start with a useful journey.',
    description:
      'Define who needs to do what, and what a useful first version should accomplish. A care request, for example, connects spoken input, editable details, and the people coordinating the task.',
    exampleSlug: 'care-coordination',
  },
  {
    title: 'Connect the interface to the system.',
    description:
      'Architecture follows the workflow: records, permissions, integrations, and processing states. Shared job state across mobile and web gives each participant a view that fits their role.',
    exampleSlug: 'service-operations-copilot',
  },
  {
    title: 'Make uncertainty reviewable.',
    description:
      'Give people something they can inspect. Document fields stay connected to their source; research candidates remain separate from the pipeline until selected. AI assistance needs clear boundaries around the next action.',
    exampleSlug: 'research-workflow',
  },
  {
    title: 'Plan for the handover.',
    description:
      'Agree on what delivery includes: testing, deployment, documentation, and ongoing operation. Keep those decisions connected to implementation so the next person can understand and continue the work.',
  },
] as const

export const currentExplorations = [
  {
    slug: 'finance-document-assistant',
    description:
      'Document workflows where extraction, human review, calculated answers, and source references stay connected.',
  },
  {
    slug: 'service-operations-copilot',
    description:
      'Shared mobile and web operations, with voice, summaries, and editable replies inside the job workflow.',
  },
  {
    slug: 'robotics-lab',
    description:
      'Four simulated browser applications for movement, sensing, planning, mapping, and controller comparisons.',
  },
] as const
