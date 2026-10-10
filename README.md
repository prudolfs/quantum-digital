# Quantum Digital

A TanStack Start website for Rudolfs Pukitis’s independent Product Engineering & Applied AI practice, targeting Cloudflare Workers at https://quantum-digital.pukitis-rudolfs.workers.dev/.

## Current scope

The public site has the shared fluid/particle hero, original Blender service illustrations, portfolio case studies, engagement options, About, professional profile links, and SEO metadata. The primary CTA opens `/chat`.

The AI conversation collects project and contact details and prepares a temporary inquiry draft. Only the visitor’s explicit confirmation saves it in Convex. `/admin` provides an owner-only inbox with status filtering and updates. There is no public contact form or calendar booking. The same workspace manages case studies, services, site settings, and FAQs with explicit draft/publish controls.

The Quantum Digital cloud development backend is connected and configured for owner setup. The owner has configured local AI Gateway credentials and Gemini 2.5 Flash; live streaming and inquiry draft preparation are verified. Production Convex and the real owner account still need release verification. No site has been published. See [Inquiry setup](docs/inquiry-setup.md) for exact setup steps and verification limits.

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

| Variable               | Location                              | Purpose                                                        |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------- |
| `VITE_SITE_URL`        | Cloudflare build / `.env.local`       | Public origin; defaults to the supplied Workers domain         |
| `VITE_CONVEX_URL`      | Cloudflare build / `.env.local`       | Public Convex client endpoint                                  |
| `VITE_CONVEX_SITE_URL` | Cloudflare build / `.env.local`       | Public Convex HTTP-actions endpoint                            |
| `INTAKE_BRIDGE_SECRET` | Worker binding and Convex environment | Matching server secret for the intake bridge                   |
| `AI_GATEWAY_API_KEY`   | Worker secret binding                 | AI Gateway credential                                          |
| `AI_MODEL`             | Worker binding                        | Supported `provider/model` slug                                |
| `SITE_URL`             | Convex environment                    | Exact website origin for authentication                        |
| `ADMIN_SETUP_KEY`      | Convex environment                    | One-time owner bootstrap secret, at least 32 random characters |
| `ADMIN_OWNER_EMAIL`    | Convex environment                    | Sole allowed owner account                                     |
| `BETTER_AUTH_SECRET`   | Convex environment                    | Server-side authentication secret                              |

`VITE_*` values are public and fixed at build time. Never put credentials in them. Backend URLs require HTTPS except explicit loopback development URLs. `.dev.vars`, `.env.local`, `.env.convex.local`, and `.convex/` are ignored.

## Quality checks

```sh
pnpm format
pnpm check
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm deploy:check
```

`check` runs TypeScript for frontend/backend, Oxlint, Oxfmt, Vitest, and convex-test behavior checks. Browser tests use production preview on desktop and mobile Chromium and include keyboard/accessibility, JavaScript-free rendering, graphics fallback, responsive screenshots, metadata, case studies, streamed chat review/retry receipts, and private inbox access. Model streaming is mocked in browser tests; persistence and access controls are tested against Convex’s test runtime. The separate opt-in live chat check verified real Gateway streaming, published tools, and an unsubmitted draft. Production owner sign-in and deployed-domain confirmation still require release verification.

Use `pnpm test:launch` for checks, production build, and browser tests together. `pnpm deploy:check` builds and packages the Worker with `--dry-run`; it does not publish.

## Cloudflare deployment

The Worker is named `quantum-digital`; no custom-domain routes are required for the supplied `workers.dev` URL. Set `PNPM_VERSION=10.18.3` in Cloudflare Workers Builds. Use `pnpm build` as the build command and `pnpm exec wrangler deploy` as the deploy command. Configure the production Convex endpoints and server bindings first, as described in [Inquiry setup](docs/inquiry-setup.md).

Publishing and live verification remain separate from local review. Confirm the complete chat → review → save → admin-inbox flow after deploying.

## Content and visuals

`src/content/site.ts` holds approved bootstrap content and code-managed engagements, experience, and profile links. Once imported in `/admin`, published Convex snapshots provide work, services, core copy, contact email, and FAQs. See [Admin workflow](docs/admin-workflow.md). The résumé reference is `../interview-prep/utils/RESUME.md`; the portfolio reference is `../interview-prep/search/portfolio.md`. Copy describes portfolio work without inventing client metrics, endorsements, or sole authorship. Supplied repository links need a final public-availability check before launch.

The lazy hero reuses the owner’s `qd-ai-native-studio` renderer and optimized shape buffers. One WebGL fluid field drives Q → robot → rocket → diamond → Q, localized text distortion, and gold cursor sparks. Reduced-motion/graphics failure retain static artwork and readable HTML. Hidden/offscreen scenes pause; narrow/coarse-pointer layouts retain DOM text. The hero chunk is about 294 KB gzip; four target buffers total 144 KB. Inter is self-hosted as a single ~48 KB Latin variable font. Real-device GPU performance remains a release check.

Service illustrations are original Blender scenes, exported as lazy-loaded JPEGs totaling about 200 KB. Rebuild them with `blender --background --python scripts/render-services.py`; they are conceptual illustrations, not client-product screenshots.

- [Plan](docs/plan.md)
- [Architecture](docs/architecture.md)
- [Style guide](docs/style.md)
- [Content decisions](docs/content-decisions.md)
- [Inquiry setup](docs/inquiry-setup.md)
- [Admin workflow](docs/admin-workflow.md)
- [Chat behavior](docs/chat-behavior.md)
