# Work and About release checks

## Current release status

The owner confirmed deployment and successful production testing on October 11, 2026, including PostHog cookie analytics after the device-ID correction. The launch and work/About enhancement plans are complete. The checks below remain the workflow for future releases; automated local results and owner-reported production acceptance are recorded separately.

## Local verification

Use the pinned pnpm version from `package.json`. Run `pnpm check`, `pnpm build`, and `pnpm test:e2e` with the local testing configuration. The browser suite covers all six work routes, About, homepage/related-work navigation, keyboard and JavaScript-free disclosures, graphics failure, mobile stills, metadata/sitemap, restored chat references, and explicit inquiry review. Provider responses are mocked; real admin and Gateway checks are opt-in.

Inspect desktop, tablet, and narrow mobile layouts. Each hero must show its still immediately. Suitable desktop devices may load the optional model and respond subtly to pointer movement; reduced motion, touch, unavailable graphics, and constrained connection hints retain the still. Check model failure, offscreen/hidden-tab pause, long text, focus visibility, and smooth context-row opening and closing.

Asset budgets per illustration are 320 KB for the self-contained GLB, 80 KB for the desktop WebP, and 35 KB for the mobile WebP. Product evidence stays below 50 KB per image. The optional shared model runtime and Three.js together stay below 225 KB gzip. Check requests and layout shifts in a browser; these budgets do not replace physical-device or production-network testing.

## Release packaging

Run `pnpm deploy:check` before publishing. It performs a guarded release build and Wrangler dry-run without changing the live Worker. `pnpm build:release` uses the six approved public settings from Wrangler or explicit CI environment variables, overriding ignored local Vite files. It rejects local/test Turnstile keys, missing values, non-public HTTP endpoints, and mismatched standard Convex endpoints. Normal `pnpm build` preserves local Vite settings for browser tests.

Keep the working Convex endpoints and matching Worker/Convex bridge secret. This frontend release requires no Convex schema deployment, record migration, admin bootstrap, or secret replacement. A future backend cutover needs its own verification. Never archive `.dev.vars`, `.env.local`, transcripts, or credentials with release artifacts.

## Deployment and rollback

After approval, `pnpm deploy` runs the guarded build and publishes the Worker. Record the preceding Worker version before deploying and retain the preceding source/assets. Smoke-test the public homepage, About, all work routes, unknown-slug handling, navigation, poster/model assets, metadata/sitemap, and chat verification/restoration. Routine checks must not submit real inquiries. Owner sign-in and an explicitly authorized inquiry-to-inbox test are separate checks.

If the release fails, use the recorded preceding Worker version with `pnpm exec wrangler rollback <version-id>`. No database rollback is required for these changes. Unpublishing a case study hides its route and current assistant lookup, but public illustration bundles and static asset URLs remain public. Restored tool results keep readable text while respecting current publication and disclosure rules.
