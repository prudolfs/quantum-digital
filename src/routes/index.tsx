import { ActionIcon } from '@/components/action-icon'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import { ChatLink } from '@/components/chat-link'
import { ConversationSection } from '@/components/conversation-section'
import { Hero } from '@/components/hero'
import { ServiceArt } from '@/components/service-art'
import { caseStudies, services, engagements } from '@/content/site'
import { pageHead } from '@/lib/seo'

export const Route = createFileRoute('/')({
  head: () =>
    pageHead(
      'Quantum Digital | Product Engineering & Applied AI',
      'Build better products. Put AI to work. Independent product engineering, AI integrations, and workflow automation for founders and product teams.',
      '/',
    ),
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <Hero />
      <section
        id="work"
        className="marketing-section"
        aria-labelledby="work-heading"
      >
        <div className="section-shell">
          <div className="section-intro">
            <p className="eyebrow">01 / Selected work</p>
            <h2 id="work-heading" className="marketing-title">
              The work behind
              <br />
              the words.
            </h2>
            <p className="body-copy">
              A closer look at the context, decisions, and delivery behind
              completed projects.
            </p>
          </div>
          {caseStudies.length ? (
            <div className="work-grid">
              {caseStudies.map((study) => (
                <Link
                  className="work-card"
                  to="/work/$slug"
                  params={{ slug: study.slug }}
                  key={study.slug}
                >
                  <p className="eyebrow">{study.category}</p>
                  <h3>
                    {study.title} <ArrowUpRight aria-hidden="true" />
                  </h3>
                  <p className="body-copy">{study.summary}</p>
                  <span className="text-link">
                    Read the case study <ActionIcon icon={ArrowRight} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="work-empty">
              <span className="work-empty__mark" aria-hidden="true">
                ↗
              </span>
              <div>
                <h3>Case studies are on the way.</h3>
                <p className="body-copy">
                  I’m preparing a selection of work with the context and details
                  I can share publicly. In the meantime, we can discuss your
                  project and relevant experience in a conversation.
                </p>
                <ChatLink />
              </div>
            </div>
          )}
        </div>
      </section>
      <section
        id="services"
        className="marketing-section section-pattern section-pattern--triangles"
        aria-labelledby="services-heading"
      >
        <div className="section-shell">
          <div className="section-intro">
            <p className="eyebrow">02 / What I can help you build</p>
            <h2 id="services-heading" className="marketing-title">
              From an idea.
              <br />
              To something useful.
            </h2>
            <p className="body-copy">
              Product engineering and applied AI, shaped around what your
              business actually needs.
            </p>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.id}>
                <div className="service-card__visual">
                  <span className="service-number">{service.number}</span>
                  <ServiceArt theme={service.id} />
                  <span className="illustration-caption">
                    Conceptual illustration
                  </span>
                </div>
                <div className="service-card__body">
                  <p className="eyebrow">{service.theme}</p>
                  <h3>{service.title}</h3>
                  <p className="body-copy">{service.description}</p>
                  <p className="service-detail">{service.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="approach"
        className="marketing-section"
        aria-labelledby="approach-heading"
      >
        <div className="section-shell approach-section">
          <div className="section-intro">
            <p className="eyebrow">03 / The approach</p>
            <h2 id="approach-heading" className="marketing-title">
              One connected view.
              <br />
              <span>
                From architecture
                <br />
                to deployment.
              </span>
            </h2>
          </div>
          <div className="approach-copy">
            <p className="body-copy">
              Good software takes more than a working feature. The product, the
              systems behind it, and the way people use it need to fit together.
            </p>
            <p className="body-copy">
              I work directly with founders and product teams, taking ownership
              across the stack. We start with the problem, make the tradeoffs
              explicit, and build towards something people can use.
            </p>
            <Link className="text-link" to="/about">
              Get to know the approach <ActionIcon icon={ArrowUpRight} />
            </Link>
          </div>
        </div>
      </section>
      <section
        id="engagements"
        className="marketing-section section-pattern section-pattern--diamonds"
        aria-labelledby="engagements-heading"
      >
        <div className="section-shell">
          <div className="section-intro">
            <p className="eyebrow">04 / Working together</p>
            <h2 id="engagements-heading" className="marketing-title">
              A clear scope.
              <br />
              Or a longer partnership.
            </h2>
          </div>
          <div className="engagement-grid">
            {engagements.map((engagement) => (
              <article className="engagement-card" key={engagement.number}>
                <p className="eyebrow">
                  {engagement.number} / {engagement.label}
                </p>
                <h3>{engagement.title}</h3>
                <p className="body-copy">{engagement.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <ConversationSection />
    </>
  )
}
