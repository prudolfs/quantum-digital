# Quantum Digital Website Plan

## Product direction

Build Quantum Digital as an independent product-engineering practice, not a generic agency template or a static CV. Help founders and product teams understand what I build, see credible examples, and start a conversation.

- **Positioning:** Product Engineering & Applied AI
- **Core message:** Build better products. Put AI to work.
- **Supporting message:** I help founders and product teams build software and put AI to work in their business. From new products to smarter workflows and integrations, I take ownership from architecture to deployment.
- **Conversion paths:** Direct Proton booking for the first public release; a dedicated AI chat page becomes the primary guided path once ready. Booking and normal navigation remain available without chat.
- **Chat entry:** A persistent icon in the bottom-right corner opens `/chat` as a full page.
- **Visual direction:** Follow [the style guide](style.md) for the hero, palette, typography, layout, and motion.

### Hero copy

Use the interactive hero composition and visual behavior with fresh copy aligned to this offer. Product engineering and applied AI receive equal emphasis.

- **Eyebrow:** Product Engineering & Applied AI
- **Headline:** Build better products. Put AI to work.
- **Highlighted phrase:** Put AI to work.
- **Description:** I help founders and product teams build software and put AI to work in their business. From new products to smarter workflows and integrations, I take ownership from architecture to deployment.
- **Initial primary CTA:** Book a conversation — opens the configured Proton booking page.
- **Primary CTA once AI chat is ready:** Tell me about your project — opens `/chat`.
- **Secondary CTA:** Explore my work — links to Selected Work.

Keep the direct booking link visible after chat launches. Update letter-reveal sequencing and fluid-text alignment for the new headline; do not retain unrelated service promises.

## Stack and guardrails

- React, TanStack Start, TypeScript, Tailwind CSS, shadcn/ui
- Convex for data and server-side functions
- Vercel AI SDK for chat
- A small, private admin area for content and inquiries
- Proton booking page linked directly from the public site and from chat
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
- No conventional contact form. Use chat and an inquiry tool.
- Keep layout, design, and hero tuning in code; use the admin only for structured content that is useful to edit.
- Launch the public offer, real work, and direct booking before admin, live AI chat, and inquiry capture. Start with typed content in source files; add Convex-backed content when the admin is implemented.

---

## Phase 1: Project foundation

- [ ] Create or confirm the TanStack Start project structure.
- [ ] Configure TypeScript, Tailwind CSS, and shadcn/ui.
- [ ] Define the Convex integration boundary; connect the backend when implementing admin and chat.
- [ ] Configure environment variables for local development and deployment.
- [ ] Configure the quality commands defined below, including browser checks for desktop and mobile.
- [ ] Establish shared layout, navigation, typography, spacing, and responsive breakpoints.
- [ ] Add accessible focus states, reduced-motion handling, and useful loading/error states.
- [ ] Set up deployment and verify a minimal production build.
- [ ] Document setup, environment variables, development, and deployment in the README.

**Exit criteria:** The app runs locally, passes foundation checks, and deploys successfully without requiring admin or chat.

## Phase 2: Public marketing site

- [ ] Integrate the interactive hero described in [the style guide](style.md), using the fresh hero copy above.
- [ ] Adapt the letter reveal and shared fluid-text renderer to the new heading and description.
- [ ] Retain the Q → robot → rocket → diamond particle cycle, gold cursor effects, lazy loading, performance adaptation, and static Q fallback.
- [ ] Add direct booking as the initial primary CTA and Selected Work as the secondary CTA.
- [ ] Keep a bottom-right chat icon visible across public pages; it navigates to `/chat`, never an inline popup.
- [ ] Before live AI is ready, make `/chat` a useful page with a direct booking link and a clear availability message; do not simulate a working assistant.
- [ ] Configure and verify the real Proton booking URL before the first public release.
- [ ] Build the **Selected Work** section using truthful, NDA-safe completed projects.
- [ ] Build case-study detail pages with a consistent structure: Context, Challenge, Approach, Delivery, and Evidence/Lessons where shareable.
- [ ] Add public repository/demo links where appropriate.
- [ ] Build the separate **What I Can Help You Build** section with conceptual service cards.
- [ ] Cover service themes such as AI integrations, MVP/product development, workflow automation, and complex integrations.
- [ ] Make clear that service-card renders are conceptual illustrations.
- [ ] Create or commission Blender-rendered visuals for selected service cards.
- [ ] Use WebGPU/3D only where it adds value to selected visuals.
- [ ] Provide static/lightweight fallbacks and avoid blocking content on 3D assets.
- [ ] Add an About section focused on end-to-end ownership, not a full CV.
- [ ] Explain engagement options: fixed-scope project and ongoing engineering support.
- [ ] Add navigation, footer, and relevant public profile links.
- [ ] Ensure the site remains useful and navigable without opening chat.
- [ ] Add page titles, meta descriptions, canonical URLs, Open Graph metadata, sitemap, and robots rules.
- [ ] Check responsive layouts on mobile, tablet, and desktop.
- [ ] Optimize images, fonts, JavaScript, and 3D assets for performance.
- [ ] Review every case study for NDA/privacy risks and remove unsupported claims.

**Exit criteria:** Visitors can understand both offers, inspect real work, book directly, and open `/chat` from the bottom-right icon. The first release does not depend on admin or live AI.

## Phase 3: Content population

- [ ] Write and review the final positioning, homepage copy, and service descriptions.
- [ ] Add a small number of strong, real case studies rather than a long project catalogue.
- [ ] Consider the accounting app, Code Chat, Service Operations Copilot, and other portfolio work where disclosure is safe.
- [ ] For each case study, record only verified facts and clearly distinguish personal work from team/client work.
- [ ] Add demo/repository links only when public and safe to share.
- [ ] Keep private tools, private data, and NDA-sensitive client details out of public content.
- [ ] Write short, useful answers for likely founder and product-team questions.
- [ ] Review all content for clarity to nontechnical visitors.

**Exit criteria:** All public claims are accurate, useful, and safe to disclose.

## Phase 4: Content model and simple admin

Build the minimum admin needed to manage site content without turning it into a CMS project.

- [ ] Define typed content models for site settings, case studies, service cards, and inquiries.
- [ ] Decide which content belongs in source files and which needs admin editing.
- [ ] Add Convex schema, queries, and mutations for admin-managed content.
- [ ] Add authentication to the admin area using a maintained approach compatible with the stack.
- [ ] Restrict admin access to an explicit owner account or allowlist.
- [ ] Create a private `/admin` route with a simple overview.
- [ ] Add create, edit, publish, and unpublish flows for case studies.
- [ ] Add create, edit, publish, and unpublish flows for service cards.
- [ ] Add basic editing for a small set of site settings and core copy.
- [ ] Add an inquiry list with creation timestamp and status.
- [ ] Add inquiry status updates, for example `new`, `contacted`, and `closed`.
- [ ] Validate inputs server-side and show useful save/error feedback.
- [ ] Add empty states and confirmation before destructive actions.
- [ ] Ensure unpublished content is excluded from public queries and AI context.
- [ ] Test access control, including unauthenticated calls to protected Convex functions.

**Scope limit:** No drag-and-drop page builder, arbitrary layouts, role matrix, analytics dashboard, or complex media library.

**Exit criteria:** The owner can securely publish work/service content and review inquiries without changing code.

## Phase 5: AI chat experience

- [ ] Replace the interim `/chat` page with a dedicated full-page conversation UI using the Vercel AI SDK.
- [ ] Keep the bottom-right icon as a navigation link to `/chat`; provide a clear way back to the website.
- [ ] Switch the hero primary CTA to “Tell me about your project” once live chat passes acceptance, keeping direct booking accessible.
- [ ] Support streaming, loading states, retry/error handling, and mobile layouts.
- [ ] Add starter prompts:
  - [ ] “I have an idea for a product”
  - [ ] “I want to use AI or automate a workflow”
  - [ ] “Show me relevant work”
  - [ ] “Let’s discuss working together”
- [ ] Provide concise, curated context from published site content.
- [ ] Ground responses in available content; do not fabricate experience, capabilities, or outcomes.
- [ ] Link to relevant case studies and service sections instead of repeating entire pages.
- [ ] Make chat optional for browsing and accessing booking.
- [ ] Add a clear way to restart or clear a conversation.
- [ ] Test empty, long, interrupted, and failed conversations.

### Initial tool set

- [ ] `getCaseStudy`: return a published case study by slug.
- [ ] `explainEngagements`: explain project-based and ongoing engagement options.
- [ ] `getBookingLink`: return the configured Proton booking URL.
- [ ] In Phase 6, enable `createInquiry`: save an inquiry only after the visitor confirms the details. Until then, offer direct booking without claiming to capture inquiries.
- [ ] Add `searchSelectedWork` only if a simple published-content lookup is insufficient.

**Exit criteria:** The assistant can explain the offer, link to real work, guide a visitor, and offer the booking page without making unsupported claims.

## Phase 6: Inquiry capture and booking

- [ ] Define the minimum inquiry fields: name or preferred identifier, contact method, project summary, and optional timing/budget.
- [ ] Let visitors review and confirm inquiry details before saving.
- [ ] Store inquiries in Convex with creation time, source, and status.
- [ ] Add server-side validation and basic abuse protection/rate limits.
- [ ] Avoid collecting unnecessary personal or sensitive information.
- [ ] Show a clear confirmation after an inquiry is saved.
- [ ] Reuse the direct booking configuration established for the first public release.
- [ ] Recheck the booking handoff from chat and the intended availability/settings.
- [ ] Make the chat return the booking link directly when requested; do not force extra conversation.
- [ ] Test the complete inquiry and booking handoff on desktop and mobile.

**Exit criteria:** A prospective client can either submit a confirmed inquiry or open the booking page from chat.

## Phase 7: Quality, security, and launch

Run the relevant launch checks for each release. The first public release requires public-site, hero, booking, accessibility, metadata, and build checks. Admin, AI, and inquiry checks become required before those features ship.

- [ ] Test public pages, case-study routes, admin flows, chat tools, inquiry creation, and booking links.
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
- [ ] Publish the site and verify the live domain, TLS, analytics/consent setup if used, chat, admin, and booking handoff.

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

Configure these commands in the project; this planning repository does not yet contain an application or runnable checks.

| Command | Purpose |
| --- | --- |
| `pnpm format` | Format with Oxfmt |
| `pnpm format:check` | Check formatting without changes |
| `pnpm lint` | Run Oxlint |
| `pnpm typecheck` | Run TypeScript without emitting files |
| `pnpm test` | Run Vitest; use convex-test for backend behavior |
| `pnpm check` | Run typecheck, lint, format:check, and unit tests |
| `pnpm build` | Build for production |
| `pnpm test:e2e` | Run Playwright on desktop Chromium and mobile Chromium |
| `pnpm test:launch` | Run check, production build, and browser tests |

- Test behavior that can fail meaningfully: protected backend access, publication visibility, inquiry confirmation, and tool success/failure. Avoid tests that merely repeat implementation details.
- Cover public navigation, direct booking, the icon opening `/chat`, and the full-page conversation flow when live chat is added.
- Cover hero fallback visibility, shape order, readable copy after graphics failure, reduced motion, and unobstructed CTA interaction.
- Use focused screenshot review at narrow, medium, and wide widths and accessibility checks with axe plus manual keyboard navigation.
- Verify the production build and smoke-test each release; measure hero asset size, layout stability, and performance before the initial launch.

## Build and release order

1. Phase 1: Foundation.
2. Phase 2: Public site, interactive hero, direct booking, and `/chat` entry page.
3. Phase 3: Populate and review real content as public pages are built.
4. Apply the public-site checks from Phase 7 and ship the first public release.
5. Phase 4: Minimal content admin and Convex integration.
6. Phase 5: Dedicated live AI chat page.
7. Phase 6: Confirmed inquiry capture and chat-to-booking handoff.
8. Apply the remaining Phase 7 checks before shipping each feature.
9. Phase 8: Iterate from real usage.

Keep every phase small enough to ship incrementally. The admin should support the site, not become a product of its own.
