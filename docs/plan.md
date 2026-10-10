# Quantum Digital Website Plan

## Product direction

Build Quantum Digital as an independent product-engineering practice, not a generic agency template or a static CV. Help founders and product teams understand what I build, see credible examples, and start a conversation.

- **Positioning:** Product Engineering & Applied AI
- **Core message:** Build better products. Put AI to work.
- **Supporting message:** I help founders and product teams build software and put AI to work in their business. From new products to smarter workflows and integrations, I take ownership from architecture to deployment.
- **Conversion path:** A dedicated AI conversation on `/chat` gathers project and contact details. The visitor reviews and confirms an inquiry before it is stored in Convex for the private admin inbox. No conventional contact form or appointment booking.
- **Public domain:** https://quantum-digital.pukitis-rudolfs.workers.dev/
- **Chat entry:** The pinned header and contextual CTAs open `/chat` as a full page, with chat-bubble icons.
- **Visual direction:** Follow [the style guide](style.md) for the hero, palette, typography, layout, and motion.

### Hero copy

Use the interactive hero composition and visual behavior with fresh copy aligned to this offer. Product engineering and applied AI receive equal emphasis.

- **Eyebrow:** Product Engineering & Applied AI
- **Headline:** Build better products. Put AI to work.
- **Highlighted phrase:** Put AI to work.
- **Description:** I help founders and product teams build software and put AI to work in their business. From new products to smarter workflows and integrations, I take ownership from architecture to deployment.
- **Primary CTA:** Tell me about your project — opens `/chat`.
- **Secondary CTA:** Explore my work — links to Selected Work.

Keep work, services, and normal navigation useful without opening chat. If the AI backend is unavailable, show an honest availability message and the supplied email address. Update letter-reveal sequencing and fluid-text alignment for the new headline; do not retain unrelated service promises.

## Stack and guardrails

- React, TanStack Start, TypeScript, Tailwind CSS, shadcn/ui
- Convex for data and server-side functions
- Vercel AI SDK for chat
- A small, private admin area for content and inquiries
- Chat-based inquiry capture with a server-controlled confirmation action; no calendar integration
- pnpm for package management; Oxfmt, Oxlint, TypeScript, Vitest, convex-test, and Playwright for quality checks

Guardrails:

- Keep the first version small and shippable.
- No general-purpose CMS, public accounts, or complex admin dashboard.
- No RAG/vector search initially. Use structured content and curated context.
- Separate real completed work from conceptual service cards.
- Do not invent client outcomes, metrics, screenshots, or endorsements.
- Respect NDAs and keep private project data private.
- Blender renders on service cards are conceptual illustrations, not depictions of shipped client products.
- Use the shared WebGL fluid/particle hero with static/lightweight fallbacks. Limit additional 3D effects to selected visuals.
- No conventional contact form. Gather details conversationally, prepare a draft, and save only after the visitor clicks confirmation.
- Keep layout, design, and hero tuning in code; use the admin only for structured content that is useful to edit.
- The first inquiry-enabled release requires the public offer, real portfolio work, live AI chat, confirmed inquiry capture, and the private owner inbox. Content editing can follow later. Keep public content in typed source files until content administration is needed.

---

## Phase 1: Project foundation

- [x] Create or confirm the TanStack Start project structure.
- [x] Configure TypeScript, Tailwind CSS, and shadcn/ui.
- [x] Define the Convex integration boundary; connect the backend when implementing admin and chat.
- [x] Configure environment variables for local development and deployment.
- [x] Configure the quality commands defined below, including browser checks for desktop and mobile.
- [x] Establish shared layout, navigation, typography, spacing, and responsive breakpoints.
- [x] Add accessible focus states, reduced-motion handling, and useful loading/error states.
- [x] Set up deployment and verify a minimal production build. Production build and Cloudflare Worker deployment dry-run pass; live deployment remains a separate release step.
- [x] Document setup, environment variables, development, and deployment in the README.

**Exit criteria:** The app runs locally, passes foundation checks, and packages successfully for Cloudflare Workers without requiring admin or chat. Verify the live deployment during the public release.

**Review status:** Dependencies are installed. Runtime type-checking, linting, formatting verification, all six unit tests, all eight desktop/mobile browser tests, the production build, and Cloudflare deployment dry-run pass. Browser checks cover navigation, keyboard focus, accessibility, 404 recovery, JavaScript-free rendering, and reduced motion. Corrected the Worker compatibility date to `2026-09-18`, supported by the installed local runtime. Phase 1 exit criteria are met. No site has been published. Stop here for review before Phase 2.

## Phase 2: Public marketing site

- [x] Integrate the interactive hero described in [the style guide](style.md), using the fresh hero copy above.
- [x] Adapt the letter reveal and shared fluid-text renderer to the new heading and description.
- [x] Retain the Q → robot → rocket → diamond particle cycle, gold cursor effects, lazy loading, performance adaptation, and static Q fallback.
- [x] Link the primary CTA to `/chat` and Selected Work as the secondary CTA.
- [x] Keep a chat link in the pinned header across public pages; it navigates to `/chat`, never an inline popup.
- [x] Show a clear availability message and email fallback when chat is not configured; never simulate a working assistant.
- [ ] Configure the production Convex backend, AI credentials/model, and owner account before the first inquiry-enabled release.
- [x] Populate Selected Work from the supplied portfolio reference: Finance Document Assistant, Service Operations Copilot, and Robotics Lab. Clearly identify them as portfolio projects.
- [x] Build case-study detail pages with a consistent structure: Context, Challenge, Approach, Delivery, and Evidence/Lessons where shareable.
- [x] Add repository links supplied in the portfolio reference. Recheck public availability before release.
- [x] Build the separate **What I Can Help You Build** section with conceptual service cards.
- [x] Cover service themes such as AI integrations, MVP/product development, workflow automation, and complex integrations.
- [x] Make clear that service-card renders are conceptual illustrations.
- [x] Create or commission Blender-rendered visuals for selected service cards. Four original static renders, with a reproducible Blender script.
- [x] Use WebGPU/3D only where it adds value to selected visuals.
- [x] Provide static/lightweight fallbacks and avoid blocking content on 3D assets.
- [x] Add an About section focused on end-to-end ownership, not a full CV.
- [x] Explain engagement options: fixed-scope project and ongoing engineering support.
- [x] Add navigation, footer, GitHub, LinkedIn, and privacy links from the supplied references.
- [x] Ensure the site remains useful and navigable without opening chat.
- [x] Add page titles, meta descriptions, canonical URLs, Open Graph metadata, sitemap, and robots rules.
- [x] Check responsive layouts on mobile, tablet, and desktop.
- [x] Optimize images, fonts, JavaScript, and 3D assets for performance. Lazy-loaded JPEG service renders total approximately 200 KB; Inter is self-hosted; the hero renderer is a separate lazy chunk and uses precomputed buffers. Real-device GPU performance remains a release check.
- [ ] Review every case study for NDA/privacy risks and remove unsupported claims.

**Implementation status:** The public marketing site and shared fluid hero are implemented. Identity/profile information comes from `../interview-prep/utils/RESUME.md`, and portfolio content from `../interview-prep/search/portfolio.md`. The supplied Workers domain is configured for metadata. Booking has been removed; all inquiry CTAs open `/chat`. Case studies use only supplied facts, no invented clients, metrics, or sole-authorship claims. The local Convex backend, AI chat endpoint, explicit review/confirmation flow, and owner-only inbox are implemented. Production credentials and an owner account are still required. No site has been published.

**Exit criteria:** Visitors understand the offers, inspect portfolio work, and open the full-page conversation. The first inquiry-enabled release also meets the chat, inquiry, and owner-inbox acceptance criteria below.

## Phase 3: Content population

- [x] Write and review the positioning, homepage copy, and service descriptions.
- [x] Add a small number of strong, real case studies rather than a long project catalogue.
- [x] Feature abstract care-coordination, accounting, and research-workflow examples alongside Finance Document Assistant; retain the other published portfolio routes.
- [x] For each case study, record only verified facts and clearly distinguish portfolio work from team/client work.
- [x] Keep supplied public portfolio links; omit project/demo/repository links for the three abstract examples.
- [x] Keep private data and NDA-sensitive client details out of public content.
- [x] Write short, useful answers for likely founder and product-team questions.
- [x] Review all content for clarity to nontechnical visitors.

**Implementation status:** Content is populated from the supplied resume/portfolio and the implemented research project. The owner authorized abstract descriptions of Seniory, its accounting app, the research application, and broader experience. Six examples appear in the homepage’s horizontal row. Selected work pins on suitable viewports and uses vertical scrolling to traverse its cards; Services stays in a normal responsive grid; reduced-motion, short-screen, and JavaScript-free layouts keep native horizontal scrolling. About describes the broader experience and links to the remaining portfolio examples. Published content also grounds the assistant. Source and disclosure decisions are recorded in [Content decisions](content-decisions.md). No site has been published.

**Exit criteria:** All public claims are accurate, useful, and safe to disclose.

## Phase 4: Private inquiry inbox and later content admin

Bring the minimum private inquiry inbox forward for the first inquiry-enabled release. Content management remains a later increment, without turning it into a CMS project.

- [ ] Define typed content models for site settings, case studies, service cards, and inquiries.
- [ ] Decide which content belongs in source files and which needs admin editing.
- [ ] Add Convex schema, queries, and mutations for admin-managed content.
- [x] Add authentication to the admin area using a maintained approach compatible with the stack.
- [x] Restrict admin access to an explicit owner account or allowlist.
- [x] Create a private `/admin` route with a simple overview.
- [ ] Add create, edit, publish, and unpublish flows for case studies.
- [ ] Add create, edit, publish, and unpublish flows for service cards.
- [ ] Add basic editing for a small set of site settings and core copy.
- [x] Add an inquiry list with creation timestamp and status.
- [x] Add inquiry status updates, for example `new`, `contacted`, and `closed`.
- [x] Validate inputs server-side and show useful save/error feedback.
- [ ] Add empty states and confirmation before destructive actions.
- [ ] Ensure unpublished content is excluded from public queries and AI context.
- [x] Test access control, including unauthenticated calls to protected Convex functions.

**Scope limit:** No drag-and-drop page builder, arbitrary layouts, role matrix, analytics dashboard, or complex media library.

**Inbox exit criteria:** The configured owner can sign in, review confirmed inquiries, filter by status, and mark them `new`, `contacted`, or `closed`. Unauthorized direct backend reads/writes fail. Production authentication must be verified before release.

**Later content-admin exit criteria:** The owner can securely publish work/service content without changing code.

## Phase 5: AI chat experience

- [x] Build the full-page conversation UI with the Vercel AI SDK and a server-only AI Gateway integration. Live provider verification requires credentials.
- [x] Keep the header chat link and contextual CTAs pointing to `/chat`; provide a clear way back to the website.
- [x] Use “Tell me about your project” as the primary CTA; keep all public content accessible without chat.
- [x] Support streaming, loading states, retry/error handling, and mobile layouts.
- [ ] Add starter prompts:
  - [ ] “I have an idea for a product”
  - [ ] “I want to use AI or automate a workflow”
  - [ ] “Show me relevant work”
  - [ ] “Let’s discuss working together”
- [x] Provide concise, curated context from published site content.
- [x] Ground responses in available content; do not fabricate experience, capabilities, or outcomes.
- [ ] Link to relevant case studies and service sections instead of repeating entire pages.
- [x] Make chat optional for browsing. Inquiry collection happens through the conversation, with email as an availability fallback.
- [x] Add a clear way to restart or clear a conversation.
- [ ] Test empty, long, interrupted, and failed conversations.

### Initial tool set

- [ ] `getCaseStudy`: return a published case study by slug.
- [ ] `explainEngagements`: explain project-based and ongoing engagement options.
- [x] `prepareInquiry`: prepare a validated, temporary server-held draft for on-screen review. This tool cannot submit an inquiry.
- [x] Server confirmation action: save the held draft only after the visitor clicks the explicit confirmation button; bind it to the conversation and handle retries idempotently.
- [ ] Add `searchSelectedWork` only if a simple published-content lookup is insufficient.

**Exit criteria:** The assistant can explain the offer, reference real portfolio work, and gather project/contact details conversationally. It prepares a draft but never submits an inquiry or claims it was saved. Live streaming and failure/retry behavior must be verified with production AI credentials.

## Phase 6: Confirmed chat inquiries

- [x] Gather name, email, and project summary conversationally; timing and budget are optional.
- [x] Let visitors review the exact server-held draft and request changes before saving.
- [x] Save only after an explicit confirmation button; the assistant has no submission tool.
- [x] Store inquiries in Convex with creation time, source `chat`, and status.
- [x] Validate inputs server-side and enforce persistent request limits.
- [x] Reject cross-origin submissions, foreign-session drafts, and expired drafts.
- [x] Make confirmation retries idempotent; display success only after persistence succeeds.
- [x] Keep drafts temporary and do not store full chat transcripts in the website database.
- [x] Add a privacy notice describing chat processing, draft/inquiry storage, and essential cookies.
- [ ] Verify a real AI conversation through confirmation and the production owner inbox on desktop and mobile.

**Exit criteria:** A visitor can describe a project through chat, review and confirm an inquiry, and receive a truthful saved receipt. The owner can see it in the private inbox. No public contact form or calendar is required.

## Phase 7: Quality, security, and launch

Run the relevant launch checks for each release. The first public release requires public-site, hero, chat, confirmation, owner-inbox, accessibility, privacy, metadata, and build checks. Content-admin checks become required before that later feature ships.

- [ ] Test public pages, case-study routes, admin flows, chat tools, inquiry confirmation, and inbox status changes.
- [ ] Verify that only the owner can access admin pages and protected mutations.
- [ ] Verify unpublished content cannot be fetched publicly or included in AI answers.
- [ ] Check for prompt-injection attempts that try to reveal secrets, bypass confirmation, or trigger unauthorized actions.
- [ ] Ensure the assistant never claims an inquiry was saved unless the tool succeeds.
- [ ] Add basic error logging and monitor production failures.
- [ ] Check keyboard navigation, contrast, semantic structure, and screen-reader labels.
- [ ] Check mobile performance and Core Web Vitals.
- [ ] Verify metadata, sitemap, robots rules, and social previews.
- [ ] Test 3D fallback behavior and reduced-motion settings.
- [ ] Check secrets and environment variables are not exposed to the client.
- [ ] Add a privacy notice explaining what inquiry/chat data is stored and why.
- [ ] Run the production build and final smoke test.
- [ ] Publish the site and verify the live domain, TLS, analytics/consent setup if used, live chat, confirmation, and admin access.

**Exit criteria:** The site is usable, secure enough for its scope, performant, and ready to receive real inquiries.

## Phase 8: Iterate from real usage

- [ ] Review inquiries and questions to identify unclear positioning or missing content.
- [ ] Improve the chat's curated context and answers based on real failure cases.
- [ ] Add lightweight privacy-respecting analytics only if they will inform a decision.
- [ ] Add content search only if the number of published case studies makes it necessary.
- [ ] Consider chat/inquiry persistence improvements only when there is a concrete need.
- [ ] Revisit 3D/WebGPU effects after the core site is working and performance is measured.

**Exit criteria:** Improvements are driven by actual visitor questions and conversion friction, not speculative infrastructure.

---

## Quality workflow

These commands are configured in the project. Install dependencies before running them; the README contains setup and review instructions.

| Command             | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `pnpm format`       | Format with Oxfmt                                      |
| `pnpm format:check` | Check formatting without changes                       |
| `pnpm lint`         | Run Oxlint                                             |
| `pnpm typecheck`    | Run TypeScript without emitting files                  |
| `pnpm test`         | Run Vitest; use convex-test for backend behavior       |
| `pnpm check`        | Run typecheck, lint, format:check, and unit tests      |
| `pnpm build`        | Build for production                                   |
| `pnpm test:e2e`     | Run Playwright on desktop Chromium and mobile Chromium |
| `pnpm test:launch`  | Run check, production build, and browser tests         |

- Test behavior that can fail meaningfully: protected backend access, publication visibility, inquiry confirmation, and tool success/failure. Avoid tests that merely repeat implementation details.
- Cover public navigation, the header link opening `/chat`, streamed conversation, draft review, explicit confirmation, failure/retry receipts, and owner-only inbox access.
- Cover hero fallback visibility, shape order, readable copy after graphics failure, reduced motion, and unobstructed CTA interaction.
- Use focused screenshot review at narrow, medium, and wide widths and accessibility checks with axe plus manual keyboard navigation.
- Verify the production build and smoke-test each release; measure hero asset size, layout stability, and performance before the initial launch.

## Build and release order

1. Foundation and public marketing site.
2. Populate portfolio content from the supplied references and configure the supplied Workers origin.
3. Bring forward the private owner inbox and Convex inquiry storage from Phase 4.
4. Implement the full-page AI conversation and confirmed inquiry capture from Phases 5–6.
5. Configure production Convex, owner authentication, AI credentials/model, and server bindings.
6. Complete Phase 7 checks, including real provider streaming and the inquiry-to-inbox flow, then publish.
7. Add content-editing administration only when needed; keep the inquiry inbox small.
8. Iterate from real questions and inquiries.

The user's October 10 scope correction supersedes the earlier calendar plan: inquiry details are gathered through chat, with no contact form on public pages.
