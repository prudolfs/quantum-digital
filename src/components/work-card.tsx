import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import type { CaseStudy } from '@/content/site'
import { ActionIcon } from '@/components/action-icon'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

export function WorkCard({ study }: { study: CaseStudy }) {
  return (
    <Link className="work-card" to="/work/$slug" params={{ slug: study.slug }}>
      <Card variant="work">
        <CardHeader>
          <CardDescription>
            {study.category.replace(/ \/ 2026$/, '')}
          </CardDescription>
          <CardTitle>
            <h3>{study.title}</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="body-copy">{study.summary}</p>
        </CardContent>
        <CardFooter>
          <span className="text-link">
            Read the case study <ActionIcon icon={ArrowUpRight} />
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
