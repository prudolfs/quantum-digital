# Chat inquiries and owner inbox

The public conversion path is `/chat`. There is no contact form or appointment booking. The AI collects a project summary, name and email conversationally; timing and budget are optional. Its `prepareInquiry` tool writes a temporary draft. Only the visitor’s confirmation button calls `/api/inquiries`, which saves the server-held snapshot in Convex. The tool cannot submit inquiries. Confirmation is bound to an HttpOnly conversation cookie and is idempotent.

## Local development

Start Convex in one terminal with `pnpm convex:dev`, and the website in another with `pnpm dev`. This checkout has a separate anonymous local Convex deployment; it has not been linked to a cloud account. `convex/_generated` comes from the Convex CLI and is tracked. `.convex/`, `.env.local`, `.env.convex.local`, and `.dev.vars` are ignored.

The local backend has generated authentication and intake-bridge secrets in `.env.convex.local`, plus the matching bridge secret in `.dev.vars`. No owner password or AI credentials have been created. Run `pnpm exec convex env set --from-file .env.convex.local` to apply the local backend configuration if needed. Do not reuse these development secrets for production.

Configure `AI_GATEWAY_API_KEY` and `AI_MODEL` in `.dev.vars` to enable the assistant. Select a supported `provider/model` slug from [Vercel AI Gateway](https://vercel.com/ai-gateway/models). With either value missing, `/chat` clearly reports that the assistant is unavailable and offers the supplied email address; it does not simulate a response or claim to save inquiries.

## Cloud backend and owner access

1. Use `pnpm exec convex login`, then configure a separate Quantum Digital cloud project with `pnpm exec convex dev --configure new`. Do not point this site at an unrelated project’s database.
2. In the Convex dashboard, configure `SITE_URL=https://quantum-digital.pukitis-rudolfs.workers.dev`, `ADMIN_OWNER_EMAIL=rudolfs.pukitis@proton.me`, a new random `BETTER_AUTH_SECRET`, and a new random `INTAKE_BRIDGE_SECRET`. Use at least 32 random characters for each secret. For development authentication, `SITE_URL` must match the local origin instead.
3. Deploy the schema, functions, and Better Auth component using `pnpm convex:deploy`.
4. In the Convex dashboard’s function runner, invoke the **internal** `auth:provisionOwner` action with a password of 12–128 characters. Choose it yourself; do not put it in a public variable, shell command, or source file. This creates the sole allowed owner account. Public registration stays disabled, including for the owner email. Provisioning an existing owner fails rather than replacing the account. Password recovery is not configured; any future recovery needs an authenticated administrative procedure.
5. Set `VITE_CONVEX_URL` to the cloud `.convex.cloud` URL and `VITE_CONVEX_SITE_URL` to its `.convex.site` HTTP-actions URL in the Cloudflare build environment. Set `VITE_SITE_URL` to the supplied Workers domain. Rebuild after changing these values.
6. Set `INTAKE_BRIDGE_SECRET` to the same production bridge secret as Convex, plus `AI_GATEWAY_API_KEY` and `AI_MODEL`, as server-only Cloudflare bindings. Use Cloudflare’s dashboard or Wrangler’s interactive secret commands. Keep credentials out of `VITE_*` values.
7. Verify a real streamed conversation, prepare an inquiry, confirm it, then sign into `/admin` and check the saved details and status transitions. Publishing remains separate from this local implementation work.

## Data and authorization

Only public portfolio content is included in AI context. No admin inquiry data, backend credentials, or private résumé/client details are supplied to the model. Full transcripts are not stored in the website database; temporary drafts expire after an hour and an hourly job removes them. Confirmed inquiries contain name, email, summary, optional timing/budget, source, creation timestamp, and status.

Every inbox read and status mutation checks a live Better Auth session, a verified user record, and the owner email on the Convex backend. Public signup is disabled. The intake bridge accepts only the Worker’s server secret; draft creation and confirmation are internal Convex mutations. Same-origin checks, bounded request bodies, text-only chat messages, persistent request limits, and session-bound drafts guard the public endpoints. Status updates use authenticated POST server functions. `/admin` is excluded from the sitemap and marked `noindex`.

## Verification limits

Backend tests exercise actual Convex mutations, including no submission on preparation, confirmation ownership, expiry, retry deduplication, input validation, request limits, disabled signup, owner-only reads/status changes, and cleanup. Browser tests mock only model streaming and transient storage responses to verify the visitor’s review and retry UI; backend tests verify real persistence independently. A live AI-provider request and production Cloudflare/Convex sign-in still require the deployment, model configuration, credentials, and owner account above.
