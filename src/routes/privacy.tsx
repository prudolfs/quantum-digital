import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/lib/seo'
import { loadPublishedContent } from '@/server/content'

export const Route = createFileRoute('/privacy')({
  loader: () => loadPublishedContent(),
  head: () =>
    pageHead(
      'Privacy | Quantum Digital',
      'How Quantum Digital uses chat messages and confirmed project inquiries.',
      '/privacy',
    ),
  component: PrivacyPage,
})

function PrivacyPage() {
  const {
    settings: { contactEmail },
  } = Route.useLoaderData()
  return (
    <article className="case-study">
      <p className="eyebrow">Your information</p>
      <h1 className="display-title">Chat & inquiry privacy</h1>
      <section>
        <h2 className="section-title">Who receives your inquiry</h2>
        <p className="body-copy">
          Quantum Digital is Rudolfs Pukitis’s independent engineering practice.
          Contact <a href={`mailto:${contactEmail}`}>{contactEmail}</a> about
          your information or to ask for its removal.
        </p>
      </section>
      <section>
        <h2 className="section-title">While you chat</h2>
        <p className="body-copy">
          Your messages are sent to the configured AI service through Vercel AI
          Gateway so the assistant can respond. Chat conversations and messages
          are stored in Convex so you can continue when you return using the
          same browser. Conversations expire after 30 days of inactivity and are
          removed by an hourly cleanup job. Restart chat deletes the current
          conversation’s messages; confirmed inquiries remain separate. Please
          avoid sharing secrets, sensitive personal information, or confidential
          client material.
        </p>
      </section>
      <section>
        <h2 className="section-title">Drafts and confirmed inquiries</h2>
        <p className="body-copy">
          When you ask to make an inquiry, the assistant prepares a temporary
          draft containing your name, email, project summary, and any timing or
          budget you choose to provide. Drafts expire after one hour and are
          removed by an hourly cleanup job. An inquiry is submitted only when
          you click the confirmation button. Confirmed details, submission time,
          and status are stored in Convex and visible only in the private admin
          inbox. They are used to review your request and follow up by email,
          and retained until they are no longer needed or you request removal.
        </p>
      </section>
      <section>
        <h2 className="section-title">Cookies and abuse prevention</h2>
        <p className="body-copy">
          Chat uses an essential HttpOnly cookie, renewed for 30 days, to
          restore your conversation and connect drafts to the visitor confirming
          them. Cloudflare Turnstile checks requests to help prevent automated
          abuse; its verification token is checked on the server before AI
          generation. Abuse prevention stores a salted hash of the network
          address and request counts for up to 24 hours, plus the cleanup
          interval. Admin authentication uses essential session cookies. The
          site does not add advertising trackers.
        </p>
      </section>
    </article>
  )
}
