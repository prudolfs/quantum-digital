import { ActionIcon } from '@/components/action-icon'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { caseStudies } from '@/content/site'
import { ChatLink } from '@/components/chat-link'
import { pageHead } from '@/lib/seo'

export const Route = createFileRoute('/work/$slug')({
  loader: ({ params }) => {
    const study = caseStudies.find((entry) => entry.slug === params.slug)
    if (!study) throw notFound()
    return study
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead(
          `${loaderData.title} | Quantum Digital`,
          loaderData.summary,
          `/work/${loaderData.slug}`,
        )
      : {},
  component: CaseStudyPage,
})

function CaseStudyPage() {
  const study = Route.useLoaderData()
  const sections = [
    ['Context', study.context],
    ['Challenge', study.challenge],
    ['Approach', study.approach],
    ['Delivery', study.delivery],
    ['Evidence & lessons', study.evidence],
  ]
  return (
    <article className="case-study">
      <Link to="/" hash="work" className="text-link">
        <ArrowLeft aria-hidden="true" size={16} /> Selected work
      </Link>
      <header>
        <p className="eyebrow">{study.category}</p>
        <h1 className="display-title">{study.title}</h1>
        <p className="body-copy intro-copy">{study.summary}</p>
        <p className="case-role">My role: {study.role}</p>
        <div className="action-row">
          {study.repositoryUrl && (
            <a className="text-link" href={study.repositoryUrl}>
              Repository <ActionIcon icon={ArrowUpRight} />
            </a>
          )}
          {study.demoUrl && (
            <a className="text-link" href={study.demoUrl}>
              Live demo <ActionIcon icon={ArrowUpRight} />
            </a>
          )}
        </div>
      </header>
      {sections.map(
        ([title, content]) =>
          content && (
            <section key={title}>
              <h2 className="section-title">{title}</h2>
              <p className="body-copy">{content}</p>
            </section>
          ),
      )}
      <footer>
        <h2 className="section-title">Have a related challenge?</h2>
        <ChatLink />
      </footer>
    </article>
  )
}
