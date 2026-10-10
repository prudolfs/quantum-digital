import { DefaultChatTransport } from 'ai'

export function createConversationTransport(onTokenConsumed: () => void) {
  let revision = 0
  let token = ''
  const consumeToken = () => {
    token = ''
    onTokenConsumed()
  }
  const transport = new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({ revision, turnstileToken: token }),
    fetch: async (url, options) => {
      try {
        const response = await fetch(url, options)
        const savedRevision = response.headers.get('X-QD-Revision')
        if (savedRevision) revision = Number(savedRevision)
        return response
      } finally {
        consumeToken()
      }
    },
  })
  return {
    transport,
    setRevision: (value: number) => {
      revision = value
    },
    setToken: (value: string) => {
      token = value
    },
    consumeToken,
  }
}
