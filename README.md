# Quantum Digital

A TanStack Start foundation for an independent Product Engineering & Applied AI practice. Phase 1 provides server-rendered routes, the shared responsive shell, design tokens, shadcn/ui configuration, route states, environment validation, and quality commands.

## Review status

Dependencies are installed. TypeScript, lint, formatting, all six unit tests, all eight desktop/mobile browser tests, the production build, and Cloudflare deployment packaging pass. The foundation is ready for review before Phase 2. No site has been published.

## Local setup

Use Node.js 22.12+ (24 LTS recommended) and pnpm 10.18.3.

```sh
corepack enable
corepack prepare pnpm@10.18.3 --activate
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000. The app also runs without `.env.local`: no backend or credentials are required for Phase 1. Development uses the local Cloudflare Workers runtime.

## Configuration

| Variable           | Purpose                                                 | Phase 1 requirement                                    |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------ |
| `VITE_SITE_URL`    | Public site origin; defaults to `http://localhost:3000` | Optional; set the real HTTPS origin for release        |
| `VITE_BOOKING_URL` | Real HTTPS Proton booking link                          | Optional now; required before the first public release |
| `VITE_CONVEX_URL`  | Public HTTPS Convex deployment URL                      | Optional until admin/chat implementation               |

`src/env.ts` validates these values. Empty optional values are treated as unset; unsafe booking/backend URLs fail validation. `VITE_*` values are public and compiled into the build. Set them in the build environment and rebuild after changing them.

Future server-only bindings belong in a gitignored `.dev.vars` file locally and Cloudflare secret bindings in deployment. `.dev.vars.example` documents that boundary. Never put credentials in `VITE_*` variables or commit local environment files.

## Checks

```sh
pnpm format
pnpm check
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm deploy:check
```

`check` runs TypeScript, Oxlint, Oxfmt verification, and Vitest. Browser tests run against the production build through `vite preview`, covering desktop and mobile Chromium, navigation, keyboard focus, accessibility, 404 recovery, JavaScript-free rendering, and reduced motion. Run `build` before standalone browser tests. Use `pnpm test:launch` for checks, build, and browser tests together.

`pnpm deploy:check` builds and asks Wrangler to package the Worker with `--dry-run`; it does not publish. `pnpm preview` serves the latest production build locally.

## Deployment

Deployment targets Cloudflare Workers using `wrangler.jsonc`, with a separate Worker named `quantum-digital`. There are no custom-domain routes configured. Build output is written to `dist/client` and `dist/server`; the Cloudflare plugin generates the deployable Worker configuration.

For Cloudflare Workers Builds, set `PNPM_VERSION=10.18.3` in Settings → Build → Build Variables and Secrets to match the project's `packageManager` pin. Use `pnpm build` as the build command and `pnpm exec wrangler deploy` as the deploy command. The pnpm version controls dependency installation and builds; the deployed app runs on the Workers runtime. Cloudflare supports overriding pnpm through this [build variable](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/).

The compatibility date is `2026-09-18`, supported by the installed local Workers runtime. When updating the date, verify local preview and browser tests with the installed runtime before deploying.

After reviewing the foundation, set the public build variables, authenticate your Cloudflare account, and deploy:

```sh
pnpm exec wrangler login
pnpm deploy
```

Verify the returned URL, both public routes, and the 404 response. Add the final domain only when preparing the public release. Publishing and domain changes are separate from this local review step.

The runtime configuration follows the [Cloudflare TanStack Start guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/). The component setup follows the [shadcn/ui manual installation guide](https://ui.shadcn.com/docs/installation/manual).

## Project structure

- `src/routes`: typed file-based pages and root document.
- `src/components`: shared layout, route states, and shadcn/ui components.
- `src/styles.css`: brand tokens, responsive shell, focus, and reduced motion.
- `src/env.ts`: explicit public configuration boundary.
- `e2e`: browser acceptance checks.
- [Architecture](docs/architecture.md): runtime, configuration, and future Convex integration boundaries.
- [Plan](docs/plan.md): phased scope and completion checklist.
- [Style guide](docs/style.md): visual direction.

The interactive hero, Selected Work, booking CTA, and chat icon are Phase 2. Admin, live chat, and inquiry capture remain later phases.
