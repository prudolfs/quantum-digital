import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUpRight, MessageSquare } from 'lucide-react'
import { profileLinks } from '@/content/site'
import {
  aboutIntroduction,
  careerJourney,
  workingPractices,
  currentExplorations,
} from '@/content/about'
import { loadPublishedContent } from '@/server/content'
import { ActionIcon } from '@/components/action-icon'
import { WorkModel } from '@/components/work-model'
import { aboutModelArt } from '@/lib/about-model-config'
import { pageHead } from '@/lib/seo'

export const Route = createFileRoute('/about')({
  loader: () => loadPublishedContent(),
  head: () =>
    pageHead(
      'About | Quantum Digital',
      'Rudolfs Pukitis: 15+ years of software engineering across web, mobile, business platforms, team leadership, and independent product delivery.',
      '/about',
    ),
  component: AboutPage,
})

function AboutPage() {
  const { caseStudies } = Route.useLoaderData()
  const work = new Map(caseStudies.map((study) => [study.slug, study]))
  return (
    <article className="work-story about-page">
      <header className="work-hero about-hero">
        <div className="section-shell">
          <div className="work-hero-grid">
            <div>
              <p className="eyebrow">
                Rudolfs Pukitis / Independent product engineer
              </p>
              <h1>
                {aboutIntroduction.headline}
                <br />
                <span>{aboutIntroduction.highlight}</span>
              </h1>
              <p className="body-copy work-hero-description">
                {aboutIntroduction.description}
              </p>
              <div className="work-actions">
                <a className="text-link work-action" href="#experience">
                  Explore the journey
                  <ActionIcon icon={ArrowDown} />
                </a>
                <Link className="text-link work-action" to="/chat">
                  Let’s talk
                  <ActionIcon icon={MessageSquare} />
                </Link>
              </div>
            </div>
            <WorkModel art={aboutModelArt} />
          </div>
          <div className="about-intro-note">
            <p>Interfaces, data, and the work around them.</p>
            <p>React · React Native · TypeScript · Node · Applied AI</p>
          </div>
        </div>
      </header>

      <section
        className="work-section section-shell"
        id="experience"
        aria-labelledby="experience-heading"
      >
        <div className="work-section-intro">
          <div>
            <p className="eyebrow">01 / The journey</p>
            <h2 id="experience-heading">
              Different industries. Connected engineering.
            </h2>
          </div>
          <p className="body-copy">
            The work has changed over the years. So has my role: independent
            delivery, contributing within a team, and leading teams through
            architecture and delivery.
          </p>
        </div>
        <ol className="about-journey">
          {careerJourney.map((entry) => (
            <li key={entry.years}>
              <span className="about-years">{entry.years}</span>
              <div>
                <h3>{entry.title}</h3>
                <p className="body-copy">{entry.description}</p>
                <p className="about-contribution">{entry.contribution}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="work-section about-practices"
        aria-labelledby="practices-heading"
      >
        <div className="section-shell">
          <div className="work-section-intro">
            <div>
              <p className="eyebrow">02 / Working together</p>
              <h2 id="practices-heading">Decisions connected to delivery.</h2>
            </div>
            <p className="body-copy">
              Start with the people using the product. Connect scope,
              architecture, implementation, and handover to the work they need
              to do.
            </p>
          </div>
          <div className="about-practice-grid">
            {workingPractices.map((practice) => {
              const example =
                'exampleSlug' in practice
                  ? work.get(practice.exampleSlug)
                  : undefined
              return (
                <section key={practice.title}>
                  <h3>{practice.title}</h3>
                  <p className="body-copy">{practice.description}</p>
                  {example && (
                    <Link
                      className="text-link work-action"
                      to="/work/$slug"
                      params={{ slug: example.slug }}
                    >
                      {example.title}
                      <ActionIcon icon={ArrowUpRight} />
                    </Link>
                  )}
                </section>
              )
            })}
          </div>
        </div>
      </section>

      <section
        className="work-section section-shell"
        aria-labelledby="explorations-heading"
      >
        <div className="work-section-intro">
          <div>
            <p className="eyebrow">03 / Current explorations</p>
            <h2 id="explorations-heading">Keep building. Keep asking why.</h2>
          </div>
          <p className="body-copy">
            Portfolio projects give me room to investigate complete AI workflows
            and interactive systems. These are engineering explorations
            alongside independent client work.
          </p>
        </div>
        <div className="about-explorations">
          {currentExplorations.map((entry) => {
            const study = work.get(entry.slug)
            return study ? (
              <Link
                to="/work/$slug"
                params={{ slug: study.slug }}
                key={entry.slug}
              >
                <h3>
                  {study.title}
                  <ActionIcon icon={ArrowUpRight} />
                </h3>
                <p className="body-copy">{entry.description}</p>
              </Link>
            ) : null
          })}
        </div>
      </section>

      <section
        className="work-closing section-shell about-closing"
        aria-labelledby="about-closing-heading"
      >
        <p className="eyebrow">Your next product</p>
        <h2 id="about-closing-heading">
          What are you
          <br />
          <span>working towards?</span>
        </h2>
        <p className="body-copy">
          Tell me about the people, the problem, and what a useful first version
          could do.
        </p>
        <Link className="text-link work-action" to="/chat">
          Tell me about your project
          <ActionIcon icon={MessageSquare} />
        </Link>
        <div className="about-profile-links">
          {profileLinks.map((profile) => (
            <a
              className="text-link work-action"
              href={profile.url}
              key={profile.url}
            >
              {profile.label}
              <ActionIcon icon={ArrowUpRight} />
            </a>
          ))}
        </div>
      </section>
    </article>
  )
}
