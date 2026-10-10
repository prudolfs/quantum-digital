# Phase 5 chat behavior

`/chat` is a full-page conversation, with optional browsing and the existing header/contextual entry points. It identifies itself as an AI assistant. Four starter prompts cover product ideas, practical AI/automation, relevant work, and working together. Visitors can type freely; Enter sends, Shift+Enter inserts a line break, and input composition does not accidentally submit.

## Published context and references

Each request loads the published Convex content. The system context contains positioning, public FAQs, services, a compact case-study index, approved experience, and engagement options. Full case-study narratives are fetched only when needed, reducing repeated context cost.

The server tools are:

- `getCaseStudy`: fetch currently published work by slug, rechecking publication on every call. Missing/unpublished slugs return an unavailable result without exposing drafts.
- `explainEngagements`: return the approved fixed-scope and ongoing engineering options, with no invented prices or availability.
- `prepareInquiry`: create a temporary, session-bound draft for explicit on-screen review. It cannot submit an inquiry.

The existing six-case index is sufficient for selection; no separate search tool is needed yet. Case-study and engagement results render as readable reference cards with links. Assistant text supports safe links and bold emphasis. It renders all other content as text, including HTML. Links are enabled only for known public site routes, approved project/profile links, and the published contact address. Arbitrary URLs, admin routes, and scripts are not clickable.

Visitor messages, conversation history, and tool results are data, not instructions. The assistant is instructed to explain verified contributions, avoid inventing results, and suggest one or two relevant examples rather than repeating entire pages.

## Inquiry review

Name, email, and summary are gathered conversationally only when the visitor wants to make an inquiry. Timing and budget can be skipped. The assistant prepares a server-held draft; the visitor reviews it and chooses **Confirm and submit inquiry** or **Make changes**.

The latest draft is the active review. A conversation length limit stops further chat/editing, but still permits confirmation of an already-prepared draft. Older unsubmitted drafts show that an updated draft is below. Buttons wait until generation finishes, so changing details cannot interrupt an active preparation. A saved receipt remains truthful even if later drafts are prepared. The model has no submission tool and cannot establish that a request was saved; only the successful website receipt does that.

Clear conversation stops generation, clears messages/input/errors, and refreshes session availability. It never submits anything. Temporary drafts expire and are cleaned up normally; transcripts are not persisted by the website.

## Streaming and recovery

Stop retains partial text and offers retry or continuing the conversation. Incomplete tool calls are excluded when converting history for the next model request. Clear waits for cancellation so old stream output cannot repopulate the new conversation. Scrolling back through history pauses automatic following until the visitor returns near the latest response or sends another message.

Errors display safe, actionable messages. Temporary provider/storage failures and request limits allow retry. Expired sessions and conversation limits direct visitors to clear and restart. Provider response bodies, credentials, prompts, and transcripts are not logged; error logging records only a fixed category or model ID.

Requests accept text from visitors, with up to 2,000 characters per message across its text parts. The server validates supported roles and parts, rejects empty input, caps history at 40 messages and 32,000 serialized characters, and bounds the request body at 64,000 bytes. The composer prevents continuing an already-full history. Limits apply on the backend even when callers bypass the UI. Same-origin/session checks and persistent rate limits remain in place.

## Model and cost controls

The configured model is `google/gemini-2.5-flash`, matching the tested lead-research default. `AI_GATEWAY_API_KEY` is a server-only Cloudflare binding; local values come from `.dev.vars`, and `AI_MODEL` can be set there or as a Worker variable. Keep the owner's existing bridge secret when editing the file.

For Gemini 2.5 Flash, thinking is disabled for this straightforward chat workload. Each generation step has a 1,000-output-token cap; a response can run at most four steps for tool use, with one SDK transport retry and a 45-second overall generation timeout. There is no automatic switch to a more expensive model. These are per-request controls, not a monthly spending cap. Gateway credits and model eligibility remain managed by Vercel.

## Verification

`pnpm check` covers published lookup, absent/unpublished work, engagement data, inquiry preparation without a submission capability, input/history limits, stopped-tool conversion, safe links, and actionable errors, alongside the existing backend tests.

`e2e/chat.spec.ts` checks starter prompts, lookup/engagement cards, safe link rendering, keyboard submission, stopped partial responses, continued history, clearing during streaming, retry, and long conversations on desktop/mobile. Provider output is deterministic in those tests; no model calls are made. Existing inquiry tests check review and submission-retry behavior independently.

The opt-in live check uses the real configured Gateway and Convex backend:

```sh
LIVE_CHAT=1 pnpm exec playwright test e2e/chat-live.spec.ts --project=desktop-chromium --workers=1 --output=test-results/live
```

It makes a few bounded model calls, reads published work, explains engagements, and creates an expiring draft from synthetic details. It asserts that no submission endpoint was called and never presses confirmation. This check passed during Phase 5. Production Cloudflare deployment, confirmation into the real owner inbox, and deployed-domain desktop/mobile verification remain release work.

Use separate output directories or run browser commands sequentially, since Playwright clears its output folder at startup.

References: [AI SDK chat UI](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot), [AI SDK text streaming](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), [AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing).
