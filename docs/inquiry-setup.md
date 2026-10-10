# Chat inquiries and owner inbox

The public conversion path is `/chat`. There is no standalone contact page/form or appointment booking. Visitors may fill a tool-rendered contact form inside chat, then review and explicitly confirm the resulting draft. The AI collects a project summary, name and email conversationally; timing and budget are optional. Its `prepareInquiry` tool writes a temporary draft. Only the visitor’s confirmation button calls `/api/inquiries`, which saves the server-held snapshot in Convex. The tool cannot submit inquiries. Confirmation is bound to an HttpOnly conversation cookie and is idempotent.

## Local development

Start Convex in one terminal with `pnpm convex:dev`, and the website in another with `pnpm dev`. This checkout is connected to the cloud development deployment `peaceful-koala-818` in [Quantum Digital](https://dashboard.convex.dev/t/pukitis-rudolfs/quantum-digital). Its `.env.local` contains the public cloud endpoints. An earlier anonymous local backend remains separate from this cloud project. `convex/_generated` comes from the Convex CLI and is tracked. `.convex/`, `.env.local`, `.env.convex.local`, and `.dev.vars` are ignored.

The cloud development backend has generated authentication, setup-key, and intake-bridge secrets configured in Convex, with a private local copy in ignored `.env.convex.cloud.local`. The matching bridge secret is in `.dev.vars`. Its `SITE_URL` is `http://localhost:3000`: open that origin for owner setup and sign-in. No real owner password has been chosen by the implementation. The owner has configured local AI Gateway credentials and Gemini 2.5 Flash. The live chat refinement check passed for streaming, tools, Convex restoration, restart, and inline-form draft preparation. Local Turnstile uses Cloudflare’s official public test keys; replace them with real domain-bound keys before hosting. Development secrets must stay separate from production secrets.

Configure `AI_GATEWAY_API_KEY`, `AI_MODEL`, and `TURNSTILE_SECRET_KEY` in `.dev.vars`, plus `VITE_TURNSTILE_SITE_KEY` in `.env.local`, to enable the assistant. Rebuild/restart after changing public values. Select a supported `provider/model` slug from [Vercel AI Gateway](https://vercel.com/ai-gateway/models). With either value missing, `/chat` clearly reports that the assistant is unavailable and offers the supplied email address; it does not simulate a response or claim to save inquiries.

## Production backend and owner access

1. The Quantum Digital cloud project and development backend are already connected. Use `pnpm convex:dev` for development updates. Production is a separate deployment within the project and has not been published/configured by this work.
2. Select the **production deployment** in the Convex dashboard, then configure `SITE_URL=https://quantum-digital.pukitis-rudolfs.workers.dev`, `ADMIN_OWNER_EMAIL=rudolfs.pukitis@proton.me`, a new random `BETTER_AUTH_SECRET`, a new random `ADMIN_SETUP_KEY`, and a new random `INTAKE_BRIDGE_SECRET`. Use at least 32 random characters for each secret. For development authentication, `SITE_URL` must match the local origin instead.
3. Deploy the schema, functions, and Better Auth component using `pnpm convex:deploy`.
4. Open `/admin` on the configured website origin. Enter the configured owner email and `ADMIN_SETUP_KEY`, then choose a 12–128-character password and enter it twice. This creates the owner and signs in without sending any email. Public Better Auth registration remains disabled. A database setup marker and existing-account check permanently close bootstrap after successful creation; changing/removing the key does not reopen it. Remove `ADMIN_SETUP_KEY` from that deployment after setup. Future visits use email/password only. Password recovery is not configured; changing `ADMIN_OWNER_EMAIL` does not migrate the existing account.
5. Set `VITE_CONVEX_URL` to the cloud `.convex.cloud` URL and `VITE_CONVEX_SITE_URL` to its `.convex.site` HTTP-actions URL in the Cloudflare build environment. Set `VITE_SITE_URL` to the supplied Workers domain. Rebuild after changing these values.
6. Set `INTAKE_BRIDGE_SECRET` to the same production bridge secret as Convex, plus `AI_GATEWAY_API_KEY` and `AI_MODEL`, as server-only Cloudflare bindings. Use Cloudflare’s dashboard or Wrangler’s interactive secret commands. Keep credentials out of `VITE_*` values.
7. Verify a real streamed conversation, prepare an inquiry, confirm it, then sign into `/admin` and check the saved details and status transitions. Publishing remains separate from this local implementation work.

## Data and authorization

Only public portfolio content is included in AI context. No admin inquiry data, backend credentials, or private résumé/client details are supplied to the model. Full transcripts are stored in private Convex `chatThreads`/`chatMessages` and restored to the same browser via a hashed HttpOnly cookie. Threads expire after 30 days of inactivity; Restart chat deletes their messages. Unconfirmed drafts expire after an hour. Confirmed draft snapshots remain for at least 30 days and while their conversation stays active to restore saved receipts. Hourly cleanup removes expired records. The assistant also receives the approved public résumé and all seven portfolio references; no private inbox data enters its context. Confirmed inquiries contain name, email, summary, optional timing/budget, source, creation timestamp, and status.

Every workspace/inbox read and content/status mutation checks a live Better Auth session, a verified user record, and the owner email on the Convex backend. Public signup is disabled. The intake bridge accepts only the Worker’s server secret; draft creation and confirmation are internal Convex mutations. Same-origin checks, bounded request bodies, text-only chat messages, persistent request limits, and session-bound drafts guard the public endpoints. Status updates use authenticated POST server functions. `/admin` is excluded from the sitemap and marked `noindex`.

See [Admin workflow](admin-workflow.md) for importing approved content and using drafts/publication.

## Verification limits

Backend tests exercise actual Convex mutations, including no submission on preparation, confirmation ownership, expiry, retry deduplication, input validation, request limits, key-protected one-time setup, password hashing and sign-in cookies, disabled signup, owner-only reads/writes, stale-version protection, draft/publication separation, unpublication, and cleanup. Browser tests mock only model streaming and transient storage responses to verify the visitor’s review and retry UI; backend tests verify real persistence independently. Live AI-provider streaming, case lookup, engagement explanations, and an unsubmitted synthetic draft have been verified using the configured credentials. Production Cloudflare/Convex sign-in and confirmation into the real owner inbox remain release checks. See [Chat behavior](chat-behavior.md).

## Turnstile setup

Create a managed widget in the Cloudflare dashboard under Turnstile. Allow `quantum-digital.pukitis-rudolfs.workers.dev`; add localhost/127.0.0.1 only if using real keys for local development. Configure the public site key as `VITE_TURNSTILE_SITE_KEY` in `.env.local` and Cloudflare Workers Builds. Configure the secret as `TURNSTILE_SECRET_KEY` in `.dev.vars` locally and a Worker secret in Cloudflare. The secret does not belong in Convex or any `VITE_*` variable. Do not publish dummy keys.

For local integration testing, Cloudflare documents an always-pass public key `1x00000000000000000000AA` and matching secret `1x0000000000000000000000000000000AA`. These are public test credentials, not production protection. Use explicit local configuration and a real widget before launch. Tokens expire after five minutes, are single-use, and must be refreshed for retry. The backend always requires verification; real keys require the current hostname and action `chat`. Explicit dummy keys on loopback require successful Cloudflare testing metadata. Public domains reject the always-pass testing secret, and missing configuration disables the assistant.

Sources: [Cloudflare token validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Cloudflare testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

## Production, previews, and build variables

Wrangler top-level `vars` configure production runtime values. `previews.vars` configure branch Previews independently; do not move production settings into that block. Keep `AI_MODEL` configured in both. The public Turnstile site key may be listed in both runtime blocks, but this application reads `VITE_*` from Vite’s build-time `import.meta.env`. Set `VITE_TURNSTILE_SITE_KEY`, `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`, and `VITE_SITE_URL` in Workers Builds variables before building. A runtime binding alone will not update the browser bundle. Rebuild and redeploy after changing build variables.

Set `TURNSTILE_SECRET_KEY`, `AI_GATEWAY_API_KEY`, and `INTAKE_BRIDGE_SECRET` as production Worker secrets. For branch Previews, configure them separately in Settings → Previews Base; existing Previews need their own updates because Base secret changes apply only to newly created Previews. Never put secret values in Wrangler `vars`. Ensure the Turnstile widget permits the actual production/preview hostname and the bridge secret matches the Convex backend selected at build time.

References: [Preview configuration](https://developers.cloudflare.com/workers/previews/configuration/), [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
