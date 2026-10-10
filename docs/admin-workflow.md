# Owner admin workflow

The workspace is `/admin`, with separate Inquiry inbox, Selected work, Services, and Site settings tabs. Its layout borrows the useful parts of `../we-move-it-2026`: searchable record previews, explicit saves, version checks, and protection for unsaved changes. There is no public registration, verification email, or password-reset email flow.

## Create the owner once

The connected development deployment is [peaceful-koala-818](https://dashboard.convex.dev/d/peaceful-koala-818). Its configured owner email is `rudolfs.pukitis@proton.me` and website origin is `http://localhost:3000`. Open that local origin, then `/admin`.

Get `ADMIN_SETUP_KEY` from this deployment’s Convex environment settings, or the private ignored `.env.convex.cloud.local` file. Enter the owner email, key, and your chosen password twice. The key is a separately generated random secret, not your password or the Better Auth secret. No real owner password has been chosen by the implementation or tests.

After creation, a permanent database marker and an existing-user check close bootstrap. Remove `ADMIN_SETUP_KEY` in Convex after completing setup; email/password sign-in continues working. Changing the key or owner email does not reopen setup or migrate the account. Password recovery is currently outside this scope. Sign-in rate limiting uses the Cloudflare client-IP header and persistent Better Auth storage.

Production uses its own environment variables and first-time setup. Set `SITE_URL` to `https://quantum-digital.pukitis-rudolfs.workers.dev` there, with fresh setup/auth/bridge secrets. Cloudflare publishing and production deployment remain separate release steps.

## Edit content

After signing in, open Selected work, Services, or Site settings and choose **Import current content** once. This copies the already-approved public content into draft and published records; it does not change what visitors see. Initialization is idempotent and never overwrites an existing workspace.

Case studies and services have searchable lists and create/edit screens. Fill required fields, choose display order, and select **Save draft**. Drafts remain private; publishing is a separate action. Service illustrations reuse the four existing visual types. Case-study repository/demo links are optional HTTPS URLs, so abstract client examples can stay unlinked. “Also list this case study on About” controls the additional-work links; all published work appears in Selected work.

Select **Publish saved draft** after saving. Publishing changes the website, case-study routes, sitemap, and assistant context. A slug change changes the case-study address; redirects are not generated. **Unpublish** requires confirmation and keeps the record as a private draft. There is no hard-delete action.

Site settings cover homepage search/share title and description, hero/approach copy, public contact email, and up to 20 questions/answers. Save settings as a draft, then publish them explicitly. Public contact email is separate from the owner sign-in email.

Navigation and closing/reloading the tab warn about unsaved changes. Saving or publishing with an old version fails instead of overwriting another edit; reload and review the latest version before retrying.

## Scope and public rendering

Engagement structure, professional profile links, broader experience, page structure, animation, and layout remain in source code. No arbitrary page builder or media upload library is introduced.

Public pages use server-side loaders. Before import, approved source defaults provide the site. After import, only published snapshots are returned, including genuinely empty collections after unpublishing everything. A configured backend failure does not restore defaults and accidentally expose unpublished material. Published changes are loaded on the next route request/navigation; already-open pages are not live subscriptions.

The inquiry inbox shows the most recent 100 matching confirmed requests. Filter and update their status between `new`, `contacted`, and `closed`. No inquiry data goes into assistant context.

Every private backend read and mutation checks the live owner session. The first-time setup mutation validates email, key, password length, and confirmation, and creates the auth account plus setup marker in one mutation. Passwords are hashed by Better Auth. Setup keys and passwords are never stored in public content or browser persistence.

## Checks

`pnpm check` covers typed models, backend access controls, bootstrap validation, password hashing/sign-in cookies, draft separation, stale versions, and publication. The isolated browser scenario in `e2e/admin.spec.ts` additionally exercises the actual setup/sign-in cookie flow and admin publishing UI against a disposable local Convex database. It must never run against the connected cloud database: build with backend ports 3310/3311 and run only the desktop project with `ADMIN_E2E_ISOLATED=1`. Model-provider streaming and production owner access still need release verification.

Implementation references: [Convex Better Auth with TanStack Start](https://labs.convex.dev/better-auth/framework-guides/tanstack-start), [Better Auth email and password](https://better-auth.com/docs/authentication/email-password), [Better Auth rate limits](https://better-auth.com/docs/concepts/rate-limit).

## Chat refinement

Conversation transcripts are stored privately in Convex `chatThreads` and `chatMessages`; the inbox continues to list confirmed inquiries, not a recent-chats interface. Conversations restore for the anonymous visitor’s browser and expire after 30 days of inactivity. Restart clears messages while preserving confirmed inquiries. Contact details may come from conversation or a tool-rendered form; either path still requires explicit review and confirmation. Public résumé/portfolio snapshots are currently maintained in source, separately from published website content. Turnstile keys belong in Cloudflare/build configuration, not admin content or Convex auth environment.
