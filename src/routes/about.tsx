import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: 'About | Quantum Digital' }] }),
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
        Quantum Digital is an independent practice combining product engineering
        and applied AI. I work with founders and product teams to turn ideas and
        complex workflows into software people can use.
      </p>
      <div className="detail-panel">
        <h2 className="section-title">Ownership from start to finish.</h2>
        <p className="body-copy">
          Architecture, implementation, integrations, and deployment stay
          connected throughout the work.
        </p>
      </div>
    </section>
  )
}
