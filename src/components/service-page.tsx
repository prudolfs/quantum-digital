import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react'
import { ActionIcon } from './action-icon'
import { FaqItem } from './faq-item'
import { WorkModel } from './work-model'
import { serviceArt } from '@/lib/service-model-config'
import type { findPublishedServicePage } from '@/content/service-pages'

type ServicePageData = NonNullable<ReturnType<typeof findPublishedServicePage>>

function ServiceAction({ children, slug }: { children: string; slug: string }) {
  return (
    <Link
      className="text-link work-action"
      to="/chat"
      search={{ service: slug }}
    >
      {children} <ActionIcon icon={MessageSquare} />
    </Link>
  )
}

function Illustration({ theme }: { theme: string }) {
  const art = serviceArt(theme)
  if (art)
    return <WorkModel key={theme} art={art} className="service-illustration" />
  return (
    <figure className="work-model service-illustration">
      <picture>
        <img
          src={`/services/${theme}.jpg`}
          width={880}
          height={480}
          fetchPriority="high"
          decoding="async"
          alt="An abstract illustration of connected software capabilities."
        />
      </picture>
      <figcaption>Conceptual illustration</figcaption>
    </figure>
  )
}

export function ServicePage({
  service,
  route,
  narrative,
  related,
}: ServicePageData) {
  return (
    <article className="work-story service-page">
      <header className="work-hero">
        <div className="section-shell">
          <Link className="work-back" to="/" hash="services">
            <ArrowLeft size={16} aria-hidden="true" /> What I can help you build
          </Link>
          <div className="work-hero-grid">
            <div>
              <p className="eyebrow">{route.label}</p>
              <h1>{service.title}</h1>
              <p className="body-copy work-hero-description">
                {service.description}
              </p>
              <div className="work-actions">
                <ServiceAction slug={route.slug}>
                  {narrative.action}
                </ServiceAction>
                <a className="text-link work-action" href="#deliverables">
                  Explore the scope <ActionIcon icon={ArrowDown} />
                </a>
              </div>
            </div>
            <Illustration theme={service.art} />
          </div>
          <dl className="work-facts">
            <div>
              <dt>The focus</dt>
              <dd>{service.detail}</dd>
            </div>
            <div>
              <dt>Working together</dt>
              <dd>A focused project or ongoing engineering support.</dd>
            </div>
            <div>
              <dt>The starting point</dt>
              <dd>{narrative.startingPoint}</dd>
            </div>
          </dl>
        </div>
      </header>
      <section
        className="work-section section-shell"
        aria-labelledby="problems-heading"
      >
        <div className="work-section-intro">
          <div>
            <p className="eyebrow">01 / A useful starting point</p>
            <h2 id="problems-heading">{narrative.startingHeading}</h2>
          </div>
          <p className="body-copy">{narrative.audience}</p>
        </div>
        <ul className="work-decisions">
          {narrative.problems.map((item, index) => (
            <li key={item.title}>
              <span className="work-number">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      </section>
      <section
        className="work-section service-scope section-pattern section-pattern--triangles"
        id="deliverables"
        aria-labelledby="deliverables-heading"
      >
        <div className="section-shell">
          <div className="work-section-intro">
            <div>
              <p className="eyebrow">02 / What we can build</p>
              <h2 id="deliverables-heading">A scope connected to delivery.</h2>
            </div>
            <p className="body-copy">{narrative.intro}</p>
          </div>
          <div className="work-applications">
            {narrative.deliverables.map((item) => (
              <section key={item.title}>
                <h3>{item.title}</h3>
                <p className="body-copy">{item.description}</p>
              </section>
            ))}
          </div>
          <p className="service-scope-note body-copy">
            These are possible parts of an engagement. We agree the deliverables
            around your needs; every project has its own scope.
          </p>
        </div>
      </section>
      <section
        className="work-section section-shell"
        aria-labelledby="process-heading"
      >
        <div className="work-section-intro">
          <div>
            <p className="eyebrow">03 / How we work</p>
            <h2 id="process-heading">Make progress reviewable.</h2>
          </div>
          <p className="body-copy">{narrative.processIntro}</p>
        </div>
        <ol className="service-process">
          {narrative.steps.map((step, index) => (
            <li key={step.title}>
              <span className="work-number">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p className="body-copy">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>
      {related.length > 0 && (
        <section
          className="work-section section-shell"
          aria-labelledby="related-heading"
        >
          <div className="work-section-intro">
            <div>
              <p className="eyebrow">04 / Relevant work</p>
              <h2 id="related-heading">The engineering behind the offer.</h2>
            </div>
            <p className="body-copy">{narrative.relatedIntro}</p>
          </div>
          <div className="work-related">
            {related.map((study) => (
              <Link
                to="/work/$slug"
                params={{ slug: study.slug }}
                key={study.slug}
              >
                <span className="work-related-title">
                  {study.title} <ActionIcon icon={ArrowRight} />
                </span>
                <p className="body-copy">{study.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section
        className="work-section work-context section-shell"
        aria-labelledby="questions-heading"
      >
        <div className="work-section-intro">
          <div>
            <p className="eyebrow">Before we begin</p>
            <h2 id="questions-heading">A few useful answers.</h2>
          </div>
        </div>
        <div className="faq-list">
          {narrative.questions.map((entry) => (
            <FaqItem key={entry.question} {...entry} heading />
          ))}
        </div>
      </section>
      <footer className="work-closing section-shell">
        <p className="eyebrow">Build something useful</p>
        <h2>{narrative.closing}</h2>
        <p className="body-copy">{narrative.closingIntro}</p>
        <ServiceAction slug={route.slug}>{narrative.action}</ServiceAction>
      </footer>
    </article>
  )
}
