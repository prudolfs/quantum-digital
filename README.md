# Quantum Digital

A TanStack Start website for Rudolfs Pukitis’s independent Product Engineering & Applied AI practice, targeting Cloudflare Workers at https://quantum-digital.pukitis-rudolfs.workers.dev/.

## Current scope

The public site has the shared fluid/particle hero, original Blender service illustrations, portfolio case studies, engagement options, About, professional profile links, and SEO metadata. The primary CTA opens `/chat`.

The AI conversation collects project and contact details and prepares a temporary inquiry draft. Only the visitor’s explicit confirmation saves it in Convex. `/admin` provides an owner-only inbox with status filtering and updates. An optional contact form opens inside chat; there is no standalone public contact form or calendar booking. Chat has a dedicated hexagon-background workspace, a home-linked logo, Restart chat, and a compact bottom composer. Convex restores one anonymous conversation per browser; messages expire after 30 days of inactivity. The assistant also receives the approved public résumé and portfolio snapshots. Cloudflare Turnstile protects chat generation and inline draft preparation. The same workspace manages case studies, services, site settings, and FAQs with explicit draft/publish controls.

The Quantum Digital cloud development backend is connected and configured for owner setup. The owner has configured local AI Gateway credentials and Gemini 2.5 Flash; Phase 5 live streaming and inquiry draft preparation were verified. The chat refinement also passed live streaming, Convex restoration/restart, and inline-form draft preparation with Cloudflare’s official local test widget. The owner confirmed that chat works on the public deployment after correcting Turnstile hostname authorization. Production inquiry delivery and the real owner account still need release verification. See [Inquiry setup](docs/inquiry-setup.md) for exact setup steps and verification limits.

## Development

Use Node.js 22.12+ and pnpm 10.18.3.

```sh
pnpm install --frozen-lockfile
pnpm convex:dev
```

In a second terminal:

```sh
pnpm dev
```

Open http://localhost:3000. Convex generates local deployment values in `.env.local`. Public pages render without a database or AI key; the conversation shows an honest availability state while its backend is unconfigured. To enable AI locally, configure the server-only values in `.dev.vars` described in `.dev.vars.example` and the inquiry setup guide.

## Configuration

| Variable                     | Location                              | Purpose                                                        |
| ---------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| `VITE_SITE_URL`              | Cloudflare build / `.env.local`       | Public origin; defaults to the supplied Workers domain         |
| `VITE_CONVEX_URL`            | Cloudflare build / `.env.local`       | Public Convex client endpoint                                  |
| `VITE_CONVEX_SITE_URL`       | Cloudflare build / `.env.local`       | Public Convex HTTP-actions endpoint                            |
| `INTAKE_BRIDGE_SECRET`       | Worker binding and Convex environment | Matching server secret for the intake bridge                   |
| `AI_GATEWAY_API_KEY`         | Worker secret binding                 | AI Gateway credential                                          |
| `VITE_TURNSTILE_SITE_KEY`    | Cloudflare build / `.env.local`       | Public managed Turnstile widget key                            |
| `VITE_POSTHOG_PROJECT_TOKEN` | Wrangler / Cloudflare build           | Public PostHog project token (`phc_`)                          |
| `VITE_POSTHOG_HOST`          | Wrangler / Cloudflare build           | PostHog ingestion host; configured for EU                      |
| `TURNSTILE_SECRET_KEY`       | Worker secret / `.dev.vars`           | Server-side Turnstile validation                               |
| `AI_MODEL`                   | Worker binding                        | Supported `provider/model` slug                                |
| `SITE_URL`                   | Convex environment                    | Exact website origin for authentication                        |
| `ADMIN_SETUP_KEY`            | Convex environment                    | One-time owner bootstrap secret, at least 32 random characters |
| `ADMIN_OWNER_EMAIL`          | Convex environment                    | Sole allowed owner account                                     |
| `BETTER_AUTH_SECRET`         | Convex environment                    | Server-side authentication secret                              |

`VITE_*` values are public and fixed at build time. Vite uses the six approved public values from Wrangler `vars` as defaults; `.env.local` and Cloudflare build variables override them. Server secrets are never copied from Wrangler into browser definitions. Never put credentials in them. Backend URLs require HTTPS except explicit loopback development URLs. `.dev.vars`, `.env.local`, `.env.convex.local`, and `.convex/` are ignored.

## Quality checks

```sh
pnpm format
pnpm check
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm deploy:check
```

`check` runs TypeScript for frontend/backend, Oxlint, Oxfmt, Vitest, and convex-test behavior checks. Browser tests use production preview on desktop and mobile Chromium and include keyboard/accessibility, JavaScript-free rendering, graphics fallback, responsive screenshots, metadata, case studies, streamed chat review/retry receipts, and private inbox access. Model streaming is mocked in browser tests; persistence and access controls are tested against Convex’s test runtime. The separate opt-in live chat check verified real Gateway streaming, published tools, and an unsubmitted draft. The owner confirmed the deployed site is tested and working on October 11, 2026; the launch plan is complete. This production acceptance is separate from the automated local checks.

Use `pnpm test:launch` for checks, production build, and browser tests together. `pnpm deploy:check` builds with the release configuration guard and packages the Worker with `--dry-run`; it does not publish. `pnpm build:release` overrides ignored local Vite settings with Wrangler/CI public values and rejects test Turnstile keys or mismatched Convex endpoints. Keep ordinary `pnpm build` for local browser tests.

## Cloudflare deployment

The Worker is named `quantum-digital`; no custom-domain routes are required for the supplied `workers.dev` URL. Set `PNPM_VERSION=10.18.3` in Cloudflare Workers Builds. Use `pnpm build:release` as the build command and `pnpm exec wrangler deploy` as the deploy command, or run `pnpm deploy` for a guarded build and deployment together. Configure the production Convex endpoints and server bindings first, as described in [Inquiry setup](docs/inquiry-setup.md).

The current release is deployed and owner-accepted. For future releases, keep publishing and live verification separate from local review and confirm the chat → review → save → admin-inbox flow after deploying.

## Content and visuals

`src/content/site.ts` holds approved bootstrap content and code-managed engagements, experience, and profile links. Once imported in `/admin`, published Convex snapshots provide work, services, core copy, contact email, and FAQs. See [Admin workflow](docs/admin-workflow.md). Versioned public assistant snapshots live in `src/content/resume.md` and `src/content/portfolio.md`. The résumé reference is `../interview-prep/utils/RESUME.md`; the portfolio reference is `../interview-prep/search/portfolio.md`. Copy describes portfolio work without inventing client metrics, endorsements, or sole authorship. Supplied repository links were included in the completed release review.

The lazy hero reuses the owner’s `qd-ai-native-studio` renderer and optimized shape buffers. One WebGL fluid field drives Q → robot → rocket → diamond → Q, localized text distortion, and gold cursor sparks. Reduced-motion/graphics failure retain static artwork and readable HTML. Hidden/offscreen scenes pause; supported touch screens use softer trails and localized text distortion through passive touch listeners, preserving native scrolling and crisp DOM text at rest. The hero chunk is about 294 KB gzip; four target buffers total 144 KB. Inter is self-hosted as a single ~48 KB Latin variable font. Local graphics checks and owner device feedback informed the completed release; repeat device checks when changing effects.

Service illustrations are original Blender scenes, exported as lazy-loaded JPEGs totaling about 200 KB. Rebuild them with `blender --background --python scripts/render-services.py`; they are conceptual illustrations, not client-product screenshots.

All six selected-work pages use the shared visual work-story layout with distinct Blender heroes, workflow steps, annotated evidence, decisions, and related published work. Care, accounting, and research use clearly labelled synthetic reconstructions and omit external project links. `src/content/work-stories.ts` holds the code-managed narrative; existing published records control identity, summary, role, links, and visibility. Each optional demand-rendered viewer has an immediate responsive still fallback; mobile and reduced-motion modes use the still. Care/accounting artwork is rebuilt with `blender --background --python scripts/work/build-client.py -- care` (or `accounting`), followed by `node scripts/work/prepare-work-posters.mjs care` (or `accounting`). Rebuild the reconstructed diagrams with `node scripts/work/build-walkthroughs.mjs`. Rebuild the finance model/render with `blender --background --python scripts/work/build-finance.py`; see [the asset guide](assets/work/finance/README.md).

Research, service operations, and robotics artwork is rebuilt with `blender --background --python scripts/work/build-explorations.py -- research` (or `services` / `robotics`), followed by `node scripts/work/prepare-work-posters.mjs research` (or the matching theme). Robotics has a four-application overview with explicit development limits. Its existing application captures are optimized by `node scripts/work/prepare-robotics-evidence.mjs`, using the adjacent source checkout; see [the robotics asset guide](assets/work/robotics/README.md).

About uses the approved résumé-grounded career journey in `src/content/about.ts`, shared with the assistant, and an original mouse-interactive workbench illustration. Rebuild with `blender --background --python scripts/work/build-about.py` and `node scripts/work/prepare-work-posters.mjs about`; see [the About asset guide](assets/work/about/README.md). Its project links resolve only published work.

- [Plan](docs/plan.md)
- [Architecture](docs/architecture.md)
- [Style guide](docs/style.md)
- [Content decisions](docs/content-decisions.md)
- [Inquiry setup](docs/inquiry-setup.md)
- [Admin workflow](docs/admin-workflow.md)
- [Chat behavior](docs/chat-behavior.md)

Project context and delivery uses the same gold-chevron FAQ rows and Motion transitions as the homepage, with keyboard and JavaScript-free support. See [Release checks](docs/work-release.md) for verification and rollback guidance.

Consent-gated cookie-based PostHog analytics tracks page views and the chat/inquiry funnel. The EU project token and host are public Wrangler build defaults; optional Cloudflare build variables can override them. Visitors choose whether to accept analytics cookies; rejected or pending consent sends no analytics. See [Analytics setup and events](docs/analytics.md).

All four service detail pages are available when their mapped service IDs are published: Product development, AI integrations, Workflow automation, and System integrations. They reuse the work-page visual language with distinct scope/process copy, current published related work, practical FAQs, responsive stills, and optional baked-lighting desktop models. Chat actions carry a validated service topic without automatically sending a message or replacing the restored conversation. Page metadata, structured identity/service data, sitemap entries, and assistant facts use the same published mapping. Rebuild an illustration with `blender --background --python scripts/render-services.py -- --theme ai --master`, then `node scripts/prepare-service-images.mjs ai`; substitute the other theme names as needed. See [the service-page plan](docs/service-pages-plan.md) and [asset workflow](assets/services/README.md).
