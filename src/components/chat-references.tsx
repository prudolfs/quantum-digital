import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { ActionIcon } from './action-icon'
import {
  caseStudyResultSchema,
  engagementResultSchema,
} from '../../shared/chat'
import { chatTextParts } from '../lib/chat-text'

export function ChatText({
  text,
  allowedLinks,
}: {
  text: string
  allowedLinks: ReadonlySet<string>
}) {
  return (
    <p className="chat-message__text">
      {chatTextParts(text, allowedLinks).map((part, index) =>
        part.type === 'link' ? (
          <a key={index} href={part.href}>
            {part.text}
          </a>
        ) : part.type === 'strong' ? (
          <strong key={index}>{part.text}</strong>
        ) : (
          part.text
        ),
      )}
    </p>
  )
}

export function ChatReference({
  name,
  output,
  allowedLinks,
}: {
  name: string
  output: unknown
  allowedLinks: ReadonlySet<string>
}) {
  if (name === 'tool-getCaseStudy') {
    const result = caseStudyResultSchema.safeParse(output)
    if (!result.success) return null
    if (!result.data.available)
      return (
        <p className="chat-note">This case study is not currently available.</p>
      )
    const { study } = result.data
    if (!allowedLinks.has(`/work/${study.slug}`)) return null
    return (
      <aside className="chat-reference" aria-label="Referenced case study">
        <p className="eyebrow">{study.category}</p>
        <h2 className="section-title">{study.title}</h2>
        <p className="body-copy">{study.summary}</p>
        <Link
          className="text-link"
          to="/work/$slug"
          params={{ slug: study.slug }}
        >
          Read the case study <ActionIcon icon={ArrowRight} />
        </Link>
      </aside>
    )
  }
  if (name === 'tool-explainEngagements') {
    const result = engagementResultSchema.safeParse(output)
    if (!result.success) return null
    return (
      <aside className="chat-reference" aria-label="Working together options">
        <h2 className="section-title">Ways to work together</h2>
        <dl>
          {result.data.engagements.map((engagement) => (
            <div key={engagement.number}>
              <dt>{engagement.label}</dt>
              <dd>{engagement.description}</dd>
            </div>
          ))}
        </dl>
        <Link className="text-link" to="/" hash="engagements">
          Explore working together <ActionIcon icon={ArrowRight} />
        </Link>
      </aside>
    )
  }
  return null
}
