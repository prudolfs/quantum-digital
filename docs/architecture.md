# Website architecture

TanStack Start supplies server-rendered React, typed routes, and server functions. Vite builds assets and a Cloudflare Worker. Public metadata uses `https://quantum-digital.pukitis-rudolfs.workers.dev`; no deployment or domain changes have been made during local work.

## Public content and visuals

`src/content/site.ts` holds positioning, services, engagements, case studies, experience summaries, common questions, and profile links. Project descriptions come from `../interview-prep/search/portfolio.md`; identity, client-work experience, and profile links come from `../interview-prep/utils/RESUME.md`. Abstract research-workflow capabilities are checked against the implemented UI and backend in `../lead-research`. The homepage shows six examples in a horizontal row; existing portfolio routes remain available and two are also linked from About. Case studies distinguish independent client work from portfolio work without claiming client outcomes, metrics, or sole authorship. Care coordination, accounting, and research examples have no external project links. See [Content decisions](content-decisions.md) for source and disclosure decisions.

Selected work uses a horizontal-section component; Services uses a normal responsive grid. On screens with sufficient viewport height, the work panel stays below the header while Motion’s scroll position moves the native row horizontally. The section’s extra height equals its horizontal travel, so scrolling releases naturally at the end and reverses when scrolling back. There are no wheel interception or body scroll locks. Reduced-motion, JavaScript-free, and short-screen layouts retain a native horizontal row with keyboard and manual scrolling.

The hero uses semantic HTML and static Q artwork before lazy enhancement. A shared WebGL fluid field drives text distortion, morphing shapes, and gold cursor sparks. Font/bounds changes resynchronize text. Narrow/coarse-pointer layouts retain DOM text; graphics failure restores it. The renderer pauses offscreen or while hidden and adapts quality. The final conversation section lazily reuses the same scene runtime in effects-only mode with its own section-sized canvas, omitting shape loading and cycling. Motion types its emphasized title once on first entry; the fluid text takes over after typing finishes. Each section pauses its renderer independently, and reduced motion keeps the complete DOM heading. Service cards use original, labeled Blender renders loaded as static JPEGs.

## Conversation and inquiries

The primary CTA and pinned header link open `/chat`, using chat-bubble icons. There is no standalone contact form and no booking integration. Vercel AI SDK streams through `/api/chat`; a configured AI Gateway key and model enable it. The assistant receives only curated public site content.

A temporary HttpOnly cookie identifies the conversation. The assistant’s only intake tool prepares a validated, expiring draft in Convex. The visitor sees the exact draft and clicks confirmation. `/api/inquiries` checks same origin and the conversation cookie, then sends the draft ID and session hash to the secret-protected Convex HTTP bridge. The internal mutation checks ownership and expiry and saves the held snapshot once. Neither model text nor model tool execution can submit an inquiry.

The application does not persist full chat transcripts. Drafts and rate-limit records have scheduled cleanup. Confirmed inquiries remain private in Convex. `/privacy` explains processing, storage, cookies, and contact for removal.

## Owner inbox

Better Auth runs on Convex using its maintained component. Public signup is disabled. The owner is provisioned through an internal action and restricted to `ADMIN_OWNER_EMAIL`. Every inbox query and status mutation verifies a live session and the verified owner record on the backend. TanStack server functions forward the authenticated token; no unauthenticated caller can read inquiries or alter their status. `/admin` lists the newest 100 matching inquiries and supports `new`, `contacted`, and `closed` states.

Content administration remains a later phase; the current admin is an inquiry inbox, not a CMS.

## Configuration and release

`VITE_SITE_URL`, `VITE_CONVEX_URL`, and `VITE_CONVEX_SITE_URL` are public build-time configuration. Only HTTPS backend endpoints and explicit loopback development URLs are accepted. Credentials belong in server bindings and the Convex environment. The intake bridge secret must match on both services. Authentication secrets never reach client assets.

The local Convex deployment is separate from production. Live AI, production authentication, and production persistence require the configuration in [Inquiry setup](inquiry-setup.md). The supplied domain and portfolio content remove the previous domain/profile/content placeholders. Publishing and live end-to-end verification remain release steps.
