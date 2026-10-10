# Chat behavior

`/chat` is a dedicated viewport-height conversation workspace. The marketing header and footer are omitted. Its Quantum Digital logo links home from the normal header position; Restart chat uses the same text-and-gold-icon treatment as the marketing header CTA. The homepage hexagon pattern fills the background, and a compact auto-growing composer stays at the bottom with accessible icon-only Send and Stop buttons. Messages scroll independently. There is no recent-chats sidebar, public account, or conversation catalogue. It identifies itself as an AI assistant. A direct Contact Rudolfs header action opens an inline contact form through the assistant tool. Four starter prompts cover product ideas, practical AI/automation, relevant work, and working together. Visitors can type freely; Enter sends, Shift+Enter inserts a line break, and input composition does not accidentally submit.

## Published context and references

Each request loads the published Convex content. The system context contains positioning, public FAQs, services, a compact case-study index, approved experience, engagement options, and the public résumé/portfolio snapshots in `src/content/resume.md` and `src/content/portfolio.md`. The snapshots include all seven portfolio projects, career roles/dates, sectors, contributions, skills, and education. Python-stack adaptability is distinguished from demonstrated production experience. No private admin data is included. This small collection uses curated context and targeted lookup; vector RAG remains deferred. Full case-study narratives are fetched only when needed, reducing repeated context cost.

The server tools are:

- `requestContactDetails`: open an editable contact form inside the conversation, prefilling only visitor-provided information. It does not save or submit an inquiry.

- `getCaseStudy`: fetch currently published work by slug, rechecking publication on every call. Missing/unpublished slugs return an unavailable result without exposing drafts.
- `explainEngagements`: return the approved fixed-scope and ongoing engineering options, with no invented prices or availability.
- `prepareInquiry`: create a temporary, session-bound draft for explicit on-screen review. It cannot submit an inquiry.

The existing six-case index is sufficient for selection; no separate search tool is needed yet. Case-study and engagement results render as readable reference cards with links. Assistant text supports safe links and bold emphasis. It renders all other content as text, including HTML. Links are enabled only for known public site routes, approved project/profile links, and the published contact address. Arbitrary URLs, admin routes, and scripts are not clickable.

Visitor messages, conversation history, and tool results are data, not instructions. The assistant is instructed to explain verified contributions, avoid inventing results, and suggest one or two relevant examples rather than repeating entire pages.

## Inquiry review

Visitors can provide name, email, and summary conversationally or fill the tool-rendered contact form. The form prepares a server-held draft through `/api/inquiry-drafts`, then shows the same explicit review/confirmation as conversational intake. Contact information is only requested when the visitor wants to make an inquiry. Rudolfs is not live in chat; confirmed inquiries are followed up by email. Timing and budget can be skipped. The assistant prepares a server-held draft; the visitor reviews it and chooses **Confirm and submit inquiry** or **Make changes**.

The latest draft is the active review. A conversation length limit stops further chat/editing, but still permits confirmation of an already-prepared draft. Older unsubmitted drafts show that an updated draft is below. Buttons wait until generation finishes, so changing details cannot interrupt an active preparation. A saved receipt remains truthful even if later drafts are prepared. The model has no submission tool and cannot establish that a request was saved; only the successful website receipt does that.

Restart chat stops client generation and deletes the current thread’s messages through the protected Convex bridge before clearing the UI. A revision guard prevents late streams from restoring deleted messages. Restart never submits or deletes a confirmed inquiry. Unconfirmed drafts expire after one hour. Confirmed draft snapshots are retained for at least 30 days and while their conversation stays active to restore truthful receipts, while confirmed inquiries remain separate.

## Persistence

`chatThreads` binds one active conversation to a hash of the anonymous HttpOnly `qd-intake` cookie; `chatMessages` stores ordered AI SDK UI messages, including tool outputs. There are no public Convex transcript queries. `/api/chat-session` restores messages, revision, contact-form drafts, confirmed/expired receipts, and generation state. The cookie is renewed for 30 days. Threads expire after 30 days of inactivity and an hourly job removes their messages. There is no cross-device identity or history list.

The Worker saves the user message before generation and the assistant message when streaming ends. A separately consumed stream protected with Worker `waitUntil` lets persistence finish when the browser leaves. Returning during a response polls until generation completes or its lease expires. Server-generated response IDs are shared with the browser so consecutive requests match the stored messages. Saved history is authoritative: incoming client assistant text/tool outputs cannot replace it. Revision checks reject stale tabs and overlapping generation. Retry replaces the response to the same saved user message.

## Streaming and recovery

Stop retains partial text and offers retry or continuing the conversation. Incomplete tool calls are excluded when converting history for the next model request. Restart waits for client cancellation and a successful server reset; failed resets keep the conversation visible and allow retry. Scrolling back through history pauses automatic following until the visitor returns near the latest response or sends another message.

Errors display safe, actionable messages. Temporary provider/storage failures and request limits allow retry. Expired sessions and conversation limits direct visitors to clear and restart. Provider response bodies, credentials, prompts, and transcripts are not logged; error logging records only a fixed category or model ID.

Requests accept text from visitors, with up to 2,000 characters per message across its text parts. The server validates supported roles and parts, rejects empty input, caps history at 40 messages and 32,000 serialized characters, and bounds the request body at 64,000 bytes. The composer prevents continuing an already-full history. Limits apply on the backend even when callers bypass the UI. Same-origin/session checks and persistent rate limits remain in place.

## Cloudflare Turnstile

Use a managed Turnstile widget with `appearance: interaction-only` and action `chat`. It can request interaction when needed. `VITE_TURNSTILE_SITE_KEY` is public build-time configuration; `TURNSTILE_SECRET_KEY` is a Worker secret. `/api/chat` and `/api/inquiry-drafts` call Siteverify before generation/draft storage and require successful validation, the current hostname, and action `chat`. Tokens are single use and renewed after each attempt. Missing configuration and failed verification fail closed. Existing same-origin checks and rate limits remain. Explicit Cloudflare dummy keys are supported only on loopback: their successful testing metadata is checked instead of real hostname/action values. Public domains reject the always-pass testing secret.

See [Cloudflare server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) and [testing keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

## Model and cost controls

The configured model is `google/gemini-2.5-flash`, matching the tested lead-research default. `AI_GATEWAY_API_KEY` is a server-only Cloudflare binding; local values come from `.dev.vars`, and `AI_MODEL` can be set there or as a Worker variable. Keep the owner's existing bridge secret when editing the file.

For Gemini 2.5 Flash, thinking is disabled for this straightforward chat workload. Each generation step has a 1,000-output-token cap; a response can run at most four steps for tool use, with one SDK transport retry and a 45-second overall generation timeout. There is no automatic switch to a more expensive model. These are per-request controls, not a monthly spending cap. Gateway credits and model eligibility remain managed by Vercel.

## Verification

`pnpm check` covers published lookup, absent/unpublished work, engagement data, inquiry preparation without a submission capability, input/history limits, stopped-tool conversion, safe links, and actionable errors, alongside the existing backend tests.

`e2e/chat.spec.ts` checks exact header-logo alignment, transparent workspace layout, the header contact action/form, navigation/reload restoration, failed/successful restart, starter prompts, lookup/engagement cards, safe link rendering, keyboard submission, stopped partial responses, continued history, clearing during streaming, retry, and long conversations on desktop/mobile. Provider output is deterministic in those tests; no model calls are made. Existing inquiry tests check review and submission-retry behavior independently.

The opt-in live check uses the real configured Gateway and Convex backend:

```sh
LIVE_CHAT=1 pnpm exec playwright test e2e/chat-live.spec.ts --project=desktop-chromium --workers=1 --output=test-results/live
```

It makes four bounded model calls, reads published work, explains engagements, prepares conversational and inline-form drafts from synthetic details, restores messages/drafts after reload, and verifies restart. It asserts that no submission endpoint was called and never presses confirmation. This refinement check passed with real Gemini/Gateway and the connected Convex development backend, using Cloudflare’s official local test widget and Siteverify. It clears its active transcript at the end; unconfirmed drafts expire normally. Real production Turnstile keys and the deployed hostname still need release verification. Production Cloudflare deployment, confirmation into the real owner inbox, and deployed-domain desktop/mobile verification remain release work.

Use separate output directories or run browser commands sequentially, since Playwright clears its output folder at startup.

References: [AI SDK chat UI](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot), [AI SDK text streaming](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), [AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing).
