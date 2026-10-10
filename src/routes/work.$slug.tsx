import { ActionIcon } from '@/components/action-icon'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { loadPublishedContent } from '@/server/content'
import { ChatLink } from '@/components/chat-link'
import { pageHead } from '@/lib/seo'
import { findPublishedWork } from '@/content/work-stories'
import { WorkStoryPage } from '@/components/work-story'

export const Route = createFileRoute('/work/$slug')({
  loader: async ({ params }) => {
    const result = findPublishedWork(await loadPublishedContent(), params.slug)
    if (!result) throw notFound()
    return result
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead(
          `${loaderData.study.title} | Quantum Digital`,
          loaderData.study.summary,
          `/work/${loaderData.study.slug}`,
        )
      : {},
  component: CaseStudyPage,
})

function CaseStudyPage() {
  const { study, story, related, art } = Route.useLoaderData()
  if (story && art)
    return (
      <WorkStoryPage study={study} story={story} related={related} art={art} />
    )
  const sections = [
    ['Context', study.context],
    ['Challenge', study.challenge],
    ['Approach', study.approach],
    ['Delivery', study.delivery],
    ['Engineering focus', study.evidence],
  ]
  return (
    <article className="case-study section-shell">
      <Link to="/" hash="work" className="text-link">
        <ArrowLeft aria-hidden="true" size={16} /> Selected work
      </Link>
      <header>
        <p className="eyebrow">{study.category}</p>
        <h1 className="display-title">{study.title}</h1>
        <p className="body-copy intro-copy">{study.summary}</p>
        <p className="case-role">My role: {study.role}</p>
        {(study.repositoryUrl || study.demoUrl) && (
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
        )}
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
