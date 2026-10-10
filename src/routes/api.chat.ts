import { createFileRoute } from '@tanstack/react-router'
import { handleChat } from '@/server/chat'

export const Route = createFileRoute('/api/chat')({
  server: { handlers: { POST: ({ request }) => handleChat(request) } },
})
