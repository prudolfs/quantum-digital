import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <section className="intro-section" aria-labelledby="intro-heading">
      <p className="eyebrow">Product Engineering & Applied AI</p>
      <h1 id="intro-heading" className="display-title">
        Build better products.
        <br />
        <span>Put AI to work.</span>
      </h1>
      <p className="body-copy intro-copy">
        I help founders and product teams build software and put AI to work in
        their business. From new products to smarter workflows and integrations,
        I take ownership from architecture to deployment.
      </p>
      <Button asChild size="lg">
        <Link to="/about">
          Get to know the approach
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </Button>
    </section>
  )
}
