import { createFileRoute } from '@tanstack/react-router'
import { ChatLink } from '@/components/chat-link'
import { pageHead } from '@/lib/seo'

export const Route = createFileRoute('/about')({
  head: () =>
    pageHead(
      'About | Quantum Digital',
      'An independent product engineering and applied AI practice. Ownership from architecture to deployment, working directly with founders and product teams.',
      '/about',
    ),
  component: AboutPage,
})

function AboutPage() {
  return (
    <section className="intro-section" aria-labelledby="about-heading">
      <p className="eyebrow">The approach</p>
      <h1 id="about-heading" className="display-title">
        From problem
        <br />
        to <span>working product.</span>
      </h1>
      <p className="body-copy intro-copy">
        I’m Rudolfs Pukitis, a full-stack engineer with over 15 years of
        software engineering experience. Quantum Digital is my independent
        practice combining product engineering and applied AI. I work with
        founders and product teams to turn ideas and complex workflows into
        software people can use.
      </p>
      <div className="detail-panel">
        <h2 className="section-title">Ownership from start to finish.</h2>
        <p className="body-copy">
          Architecture, implementation, integrations, and deployment stay
          connected throughout the work.
        </p>
      </div>
      <div className="detail-panel">
        <h2 className="section-title">Start with the problem.</h2>
        <p className="body-copy">
          We look at what people need to do, where the friction is, and what a
          useful first version should accomplish. That gives architecture and
          implementation a clear purpose.
        </p>
      </div>
      <div className="detail-panel">
        <h2 className="section-title">Build for the handover.</h2>
        <p className="body-copy">
          Deployment, documentation, and ongoing operation are part of the work.
          The goal is software your team can understand, use, and build on.
        </p>
      </div>
      <div className="about-conversation">
        <ChatLink />
      </div>
    </section>
  )
}
