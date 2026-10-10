import { ActionIcon } from '@/components/action-icon'
import { Link } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ChatLink({ className }: { className?: string }) {
  return (
    <Button asChild variant="text" size="lg" className={className}>
      <Link to="/chat">
        Tell me about your project <ActionIcon icon={MessageSquare} />
      </Link>
    </Button>
  )
}
