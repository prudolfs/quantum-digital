# Chat inquiries and owner inbox

The public conversion path is `/chat`. There is no contact form or appointment booking. The AI collects a project summary, name and email conversationally; timing and budget are optional. Its `prepareInquiry` tool writes a temporary draft. Only the visitor’s confirmation button calls `/api/inquiries`, which saves the server-held snapshot in Convex. The tool cannot submit inquiries. Confirmation is bound to an HttpOnly conversation cookie and is idempotent.

## Local development

Start Convex in one terminal with `pnpm convex:dev`, and the website in another with `pnpm dev`. This checkout is connected to the cloud development deployment `peaceful-koala-818` in [Quantum Digital](https://dashboard.convex.dev/t/pukitis-rudolfs/quantum-digital). Its `.env.local` contains the public cloud endpoints. An earlier anonymous local backend remains separate from this cloud project. `convex/_generated` comes from the Convex CLI and is tracked. `.convex/`, `.env.local`, `.env.convex.local`, and `.dev.vars` are ignored.

The cloud development backend has generated authentication, setup-key, and intake-bridge secrets configured in Convex, with a private local copy in ignored `.env.convex.cloud.local`. The matching bridge secret is in `.dev.vars`. Its `SITE_URL` is `http://localhost:3000`: open that origin for owner setup and sign-in. No real owner password or AI credentials have been created. Development secrets must stay separate from production secrets.

Configure `AI_GATEWAY_API_KEY` and `AI_MODEL` in `.dev.vars` to enable the assistant. Select a supported `provider/model` slug from [Vercel AI Gateway](https://vercel.com/ai-gateway/models). With either value missing, `/chat` clearly reports that the assistant is unavailable and offers the supplied email address; it does not simulate a response or claim to save inquiries.

## Production backend and owner access

1. The Quantum Digital cloud project and development backend are already connected. Use `pnpm convex:dev` for development updates. Production is a separate deployment within the project and has not been published/configured by this work.
2. Select the **production deployment** in the Convex dashboard, then configure `SITE_URL=https://quantum-digital.pukitis-rudolfs.workers.dev`, `ADMIN_OWNER_EMAIL=rudolfs.pukitis@proton.me`, a new random `BETTER_AUTH_SECRET`, a new random `ADMIN_SETUP_KEY`, and a new random `INTAKE_BRIDGE_SECRET`. Use at least 32 random characters for each secret. For development authentication, `SITE_URL` must match the local origin instead.
3. Deploy the schema, functions, and Better Auth component using `pnpm convex:deploy`.
4. Open `/admin` on the configured website origin. Enter the configured owner email and `ADMIN_SETUP_KEY`, then choose a 12–128-character password and enter it twice. This creates the owner and signs in without sending any email. Public Better Auth registration remains disabled. A database setup marker and existing-account check permanently close bootstrap after successful creation; changing/removing the key does not reopen it. Remove `ADMIN_SETUP_KEY` from that deployment after setup. Future visits use email/password only. Password recovery is not configured; changing `ADMIN_OWNER_EMAIL` does not migrate the existing account.
5. Set `VITE_CONVEX_URL` to the cloud `.convex.cloud` URL and `VITE_CONVEX_SITE_URL` to its `.convex.site` HTTP-actions URL in the Cloudflare build environment. Set `VITE_SITE_URL` to the supplied Workers domain. Rebuild after changing these values.
6. Set `INTAKE_BRIDGE_SECRET` to the same production bridge secret as Convex, plus `AI_GATEWAY_API_KEY` and `AI_MODEL`, as server-only Cloudflare bindings. Use Cloudflare’s dashboard or Wrangler’s interactive secret commands. Keep credentials out of `VITE_*` values.
7. Verify a real streamed conversation, prepare an inquiry, confirm it, then sign into `/admin` and check the saved details and status transitions. Publishing remains separate from this local implementation work.

## Data and authorization

Only public portfolio content is included in AI context. No admin inquiry data, backend credentials, or private résumé/client details are supplied to the model. Full transcripts are not stored in the website database; temporary drafts expire after an hour and an hourly job removes them. Confirmed inquiries contain name, email, summary, optional timing/budget, source, creation timestamp, and status.

Every workspace/inbox read and content/status mutation checks a live Better Auth session, a verified user record, and the owner email on the Convex backend. Public signup is disabled. The intake bridge accepts only the Worker’s server secret; draft creation and confirmation are internal Convex mutations. Same-origin checks, bounded request bodies, text-only chat messages, persistent request limits, and session-bound drafts guard the public endpoints. Status updates use authenticated POST server functions. `/admin` is excluded from the sitemap and marked `noindex`.

See [Admin workflow](admin-workflow.md) for importing approved content and using drafts/publication.

## Verification limits

Backend tests exercise actual Convex mutations, including no submission on preparation, confirmation ownership, expiry, retry deduplication, input validation, request limits, key-protected one-time setup, password hashing and sign-in cookies, disabled signup, owner-only reads/writes, stale-version protection, draft/publication separation, unpublication, and cleanup. Browser tests mock only model streaming and transient storage responses to verify the visitor’s review and retry UI; backend tests verify real persistence independently. A live AI-provider request and production Cloudflare/Convex sign-in still require the deployment, model configuration, credentials, and owner account above.
