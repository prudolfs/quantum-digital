import { useEffect, useRef, useState } from 'react'

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}
let scriptReady: Promise<void> | undefined
function loadScript() {
  if (window.turnstile) return Promise.resolve()
  if (!scriptReady)
    scriptReady = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.addEventListener('load', () => resolve(), { once: true })
      script.addEventListener(
        'error',
        () => {
          script.remove()
          scriptReady = undefined
          reject(new Error('Verification unavailable'))
        },
        { once: true },
      )
      document.head.append(script)
    })
  return scriptReady
}

export function ChatTurnstile({
  siteKey,
  attempt,
  onToken,
}: {
  siteKey: string
  attempt: number
  onToken: (token: string) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [failedVerification, setFailedVerification] = useState('')
  const [retry, setRetry] = useState(0)
  const verificationId = `${siteKey}:${attempt}:${retry}`
  const [completedVerification, setCompletedVerification] = useState('')
  const failed = failedVerification === verificationId
  useEffect(() => {
    let disposed = false
    let widget: string | undefined
    onToken('')
    loadScript()
      .then(() => {
        if (disposed || !container.current || !window.turnstile) return
        widget = window.turnstile.render(container.current, {
          sitekey: siteKey,
          cData: `attempt-${attempt}-${retry}`,
          action: 'chat',
          theme: 'dark',
          size: container.current.clientWidth < 300 ? 'compact' : 'flexible',
          appearance: 'interaction-only',
          callback: (token: string) => {
            if (disposed) return
            setFailedVerification('')
            setCompletedVerification(verificationId)
            onToken(token)
          },
          'before-interactive-callback': () => {
            if (disposed) return
            setCompletedVerification('')
            setFailedVerification('')
            onToken('')
          },
          'expired-callback': () => {
            if (disposed) return
            setCompletedVerification('')
            onToken('')
          },
          'error-callback': () => {
            if (disposed) return
            setCompletedVerification('')
            onToken('')
            setFailedVerification(verificationId)
          },
          'timeout-callback': () => {
            if (disposed) return
            setCompletedVerification('')
            onToken('')
            setFailedVerification(verificationId)
          },
        })
      })
      .catch(() => {
        if (!disposed) setFailedVerification(verificationId)
      })
    return () => {
      disposed = true
      if (widget) window.turnstile?.remove(widget)
    }
  }, [siteKey, attempt, retry, onToken, verificationId])
  return (
    <div
      className="chat-verification"
      hidden={completedVerification === verificationId}
    >
      <div ref={container} />
      {failed && (
        <p role="alert">
          Verification couldn’t load.{' '}
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            Try again
          </button>
        </p>
      )}
    </div>
  )
}
