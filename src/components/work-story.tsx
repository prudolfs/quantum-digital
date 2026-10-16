import { FaqItem } from './faq-item'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowLeft, ArrowUpRight, MessageSquare } from 'lucide-react'
import type { ManagedCaseStudy } from '../../shared/content'
import type { WorkStory as Story } from '../../shared/work-story'
import { ActionIcon } from './action-icon'
import { WorkModel } from './work-model'
import type { WorkModelArt } from '@/lib/work-model-config'

function SectionHeading({
  number,
  label,
  heading,
  intro,
  id,
}: {
  number: string
  label: string
  heading: string
  intro?: string
  id: string
}) {
  return (
    <div className="work-section-intro">
      <div>
        <p className="eyebrow">
          {number} / {label}
        </p>
        <h2 id={id}>{heading}</h2>
      </div>
      {intro && <p className="body-copy">{intro}</p>}
    </div>
  )
}

function Applications({ story }: { story: Story }) {
  if (!story.applications?.length) return null
  return (
    <section
      className="work-section section-shell"
      aria-labelledby="applications-heading"
    >
      <SectionHeading
        number="Lab"
        label="Four applications"
        heading="Four ways to explore."
        intro="Each application has its own focus and current boundaries. All of these worlds are simulated."
        id="applications-heading"
      />
      <div className="work-applications">
        {story.applications.map((application) => (
          <section key={application.title}>
            <h3>{application.title}</h3>
            <p className="body-copy">{application.description}</p>
            <p className="work-application-status">{application.status}</p>
          </section>
        ))}
      </div>
    </section>
  )
}

function Workflow({ story }: { story: Story }) {
  const [selected, setSelected] = useState(0)
  return (
    <section
      className="work-section section-shell"
      id="workflow"
      aria-labelledby="workflow-heading"
    >
      <SectionHeading
        number="01"
        label="The workflow"
        heading={story.workflowHeading}
        intro={story.workflowIntro}
        id="workflow-heading"
      />
      <ol className="work-steps" data-steps={story.steps.length}>
        {story.steps.map((step, index) => (
          <li key={step.title} data-selected={selected === index}>
            <button
              type="button"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <span className="work-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="work-step-title">{step.title}</span>
            </button>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Evidence({ story }: { story: Story }) {
  return (
    <section
      className="work-section work-evidence"
      aria-labelledby="evidence-heading"
    >
      <div className="section-shell">
        <SectionHeading
          number="02"
          label="Inside the product"
          heading={story.evidenceHeading}
          intro={story.evidenceIntro}
          id="evidence-heading"
        />
        <div className="work-evidence-grid">
          {story.evidence.map((entry) => (
            <figure key={entry.title}>
              <div className="work-screen">
                <a
                  href={entry.image}
                  aria-label={`Open full-size image: ${entry.title}`}
                >
                  <img
                    src={entry.image}
                    width="1080"
                    height="1080"
                    loading="lazy"
                    decoding="async"
                    alt={entry.alt}
                  />
                </a>
              </div>
              <figcaption>
                <h3>{entry.title}</h3>
                <p>{entry.description}</p>
                <p className="work-caption">{entry.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function Decisions({ story }: { story: Story }) {
  return (
    <section
      className="work-section section-shell"
      aria-labelledby="decisions-heading"
    >
      <SectionHeading
        number="03"
        label="Engineering decisions"
        heading={story.decisionsHeading}
        intro={story.decisionsIntro}
        id="decisions-heading"
      />
      <ol className="work-decisions">
        {story.decisions.map((entry, index) => (
          <li key={entry.title}>
            <span className="work-number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3>{entry.title}</h3>
            <p>{entry.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function RelatedWork({ related }: { related: ManagedCaseStudy[] }) {
  if (!related.length) return null
  return (
    <section
      className="work-section section-shell"
      aria-labelledby="related-heading"
    >
      <SectionHeading
        number="05"
        label="Connected work"
        heading="Different products. Related thinking."
        id="related-heading"
      />
      <div className="work-related">
        {related.map((entry) => (
          <Link key={entry.slug} to="/work/$slug" params={{ slug: entry.slug }}>
            <span className="work-related-title">
              {entry.title}
              <ActionIcon icon={ArrowUpRight} />
            </span>
            <p>{entry.summary}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Closing({ story }: { story: Story }) {
  return (
    <section
      className="work-closing section-shell"
      aria-labelledby="work-closing-heading"
    >
      <p className="eyebrow">Your next product</p>
      <h2 id="work-closing-heading">
        {story.closingHeading}
        <br />
        <span>{story.closingHighlight}</span>
      </h2>
      <p className="body-copy">{story.closingDescription}</p>
      <Link className="text-link work-action" to="/chat">
        {story.chatLabel}
        <ActionIcon icon={MessageSquare} />
      </Link>
    </section>
  )
}

export function WorkStoryPage({
  study,
  story,
  related,
  art,
}: {
  study: ManagedCaseStudy
  story: Story
  related: ManagedCaseStudy[]
  art: WorkModelArt
}) {
  return (
    <article className="work-story">
      <header className="work-hero">
        <div className="section-shell">
          <Link to="/" hash="work" className="work-back">
            <ArrowLeft size={16} aria-hidden="true" />
            Selected work
          </Link>
          <div className="work-hero-grid">
            <div>
              <p className="eyebrow">
                {study.title} / {study.category}
              </p>
              <h1>
                {story.headline}
                <br />
                <span>{story.highlight}</span>
              </h1>
              <p className="body-copy work-hero-description">{study.summary}</p>
              <div className="work-actions">
                <a className="text-link work-action" href="#workflow">
                  Explore the workflow
                  <ActionIcon icon={ArrowDown} />
                </a>
                {study.repositoryUrl && (
                  <a
                    className="text-link work-action"
                    href={study.repositoryUrl}
                  >
                    View repository
                    <ActionIcon icon={ArrowUpRight} />
                  </a>
                )}
                {study.demoUrl && (
                  <a className="text-link work-action" href={study.demoUrl}>
                    Live demo
                    <ActionIcon icon={ArrowUpRight} />
                  </a>
                )}
              </div>
            </div>
            <WorkModel key={art.model} art={art} />
          </div>
          <dl className="work-facts">
            <div>
              <dt>My role</dt>
              <dd>{study.role}</dd>
            </div>
            <div>
              <dt>Experience</dt>
              <dd>{story.experience ?? 'Documents → review → answers'}</dd>
            </div>
            <div>
              <dt>Built with</dt>
              <dd>{story.stack ?? 'React · TanStack Start · Convex'}</dd>
            </div>
          </dl>
        </div>
      </header>
      <Applications story={story} />
      <Workflow story={story} />
      <div id="inside-product">
        <Evidence story={story} />
      </div>
      <Decisions story={story} />
      <section
        className="work-section section-shell work-context"
        aria-labelledby="context-heading"
      >
        <SectionHeading
          number="04"
          label="Project context and delivery"
          heading="Behind the product."
          intro="The context, approach, and delivery that shaped the work."
          id="context-heading"
        />
        <div className="faq-list">
          {[
            ['Context', study.context],
            ['Challenge', study.challenge],
            ['Approach', study.approach],
            ['Delivery', study.delivery],
            ['Engineering focus', study.evidence],
          ].map(
            ([title, text]) =>
              text && (
                <FaqItem key={title} question={title!} answer={text} heading />
              ),
          )}
        </div>
      </section>
      <RelatedWork related={related} />
      <Closing story={story} />
    </article>
  )
}
