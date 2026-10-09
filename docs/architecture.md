# Foundation architecture

## Runtime

TanStack Start supplies server-rendered React and typed file-based routes. Vite builds client assets and a Cloudflare Worker through the Cloudflare Vite plugin. The root document loads shared CSS and route metadata; the site layout owns navigation, the skip link, the main landmark, and the footer.

Public pages in this phase render without environment configuration, authentication, AI, or a database. Design tokens live in `src/styles.css`; shadcn/ui configuration lives in `components.json`, with components in `src/components/ui`.

## Convex boundary

Connect Convex during Phase 4, not at startup in Phase 1. Keep initial published content in typed source modules as public pages are implemented. Add the Convex schema, generated API, server functions, and backend tests only when the admin needs them.

- Future client provider and adapters belong in `src/integrations/convex`.
- Backend schema and functions belong in `convex`; generated API types must come from Convex codegen.
- `VITE_CONVEX_URL` is a public endpoint, optional for now. A configured URL alone must not enable admin or create network requests.
- Content queries must return only published content. Protected mutations must enforce the owner identity on the server.
- Chat/server adapters must keep credentials server-side and use validated tool inputs; no unrestricted client writes.
- Add convex-test when backend behavior exists. Until then, avoid fake clients, placeholder schemas, or a provider that requires a deployment.

## Configuration boundary

`src/env.ts` validates only explicitly named public configuration. All `VITE_*` values are visible to visitors and are fixed at build time. Server-only Cloudflare bindings and secrets are separate; add their validation at the consuming server boundary when those features are implemented.

## Release boundary

Phase 1 provides the shell and production deployment configuration. The interactive hero, selected work, booking CTA, and persistent chat control belong to Phase 2. No live publishing or domain change is needed for local review.
