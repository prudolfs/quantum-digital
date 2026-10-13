# Public-site security

## Implemented controls

- All chat, session restoration, restart, contact draft, confirmation, and authentication POST routes pass through a shared request guard before reading bodies or contacting Turnstile. Limits use salted IP hashes and, when present, anonymous session hashes. Counters live in Convex and apply across Worker instances. Backend downtime fails closed for these endpoints; public pages remain accessible.
- Minute limits: chat 30, session restoration 60, restart 10, contact draft 20, confirmation 10, authentication POST 20. Existing draft creation limits (10/hour/session), confirmation limits (5/hour/session), and Better Auth sign-in limits (5/5 minutes) remain. A 429 includes Retry-After.
- AI responses reserve a shared generation allowance before contacting the model. The default is 200 generation attempts per UTC day, including retries by visitors and failed provider attempts. Each attempt still has bounded input, up to four tool/model steps, 1,000 output tokens per step, one provider retry, and a 45-second timeout. This is a request allowance, not a guaranteed currency budget. Configure a provider spending limit separately where available.
- Turnstile tokens are verified server-side for the current hostname and chat action. Verification occurs after the request guard. Client-supplied chat history cannot overwrite stored assistant messages or tool outputs.
- Conversations and inquiry drafts are isolated by anonymous session hash. Final submission checks draft ownership, expiry, and explicit confirmation; repeat confirmation is idempotent. Inbox and content administration enforce verified owner authorization in Convex. The Worker-to-Convex bridge requires a server-only secret. Private mutations are internal functions.
- Production SSR/API responses receive CSP, framing restrictions, MIME sniffing protection, a referrer policy, and restrictions on camera/microphone/location access. CSP allows inline hydration scripts and styles required by the current SSR implementation; it is not a strict nonce-based script policy. Development omits CSP to allow Vite tooling. Static asset responses are served separately by Cloudflare.
- Chat text renders through React with a small emphasis/link parser and an explicit published-link allow-list. Raw HTML is not rendered. Assistant tools can read published content and prepare drafts, but cannot submit inquiries or access the admin inbox.
- Inactive conversations expire after 30 days. Expired drafts and stale request counters are pruned hourly. Confirmed inquiries remain for owner follow-up.

## Production settings

On the **Convex deployment serving the live site** (currently the shared cloud development deployment `peaceful-koala-818`), optionally set:

| Variable              | Default | Purpose                                                                                                                           |
| --------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `AI_CHAT_DAILY_LIMIT` | `200`   | Shared generation attempts per UTC day; integer 1–10,000. Invalid values pause generation.                                        |
| `AI_CHAT_ENABLED`     | enabled | Set exactly `false` to pause generation immediately for subsequent reservations. Restoration and inquiry review remain available. |

The **Cloudflare Worker** also accepts `AI_CHAT_ENABLED=false` to reject new generation requests before processing chat. This Worker setting does not replace the shared Convex allowance. Neither setting is a VITE variable. Existing in-flight generations may finish after pausing.

Deploy the updated Convex functions before the frontend/Worker: the new request guard requires the `request-rate` and `generation-reserve` bridge operations. A frontend-only deployment against the old backend will make guarded APIs unavailable. No new database tables are required.

For isolated local backend review, use a separate development/local Convex deployment with these functions loaded. Run `pnpm convex:dev` against that development deployment, set the local `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` to its endpoints, and match its bridge secret in `.dev.vars`. Check the selected deployment before running the command: do not use the backend serving the live website for an isolated review. The browser integration checks intercept chat storage and PostHog; backend security checks run in `convex-test`, without changing any live backend. The owner approved local review and authorized release. The new Convex functions were deployed to the current live backend before the matching Worker release through GitHub/Cloudflare.

The current checkout and public Worker share a backend. To allow frontend review before deploying the new Convex operations, a loopback **development** server can fall back to in-memory request limits and a 200-attempt daily allowance when the backend returns exactly `Unknown operation`. This applies only to the two new security operations. Existing conversation storage, Turnstile checks, draft ownership, and owner authorization still use the backend normally. These development counters reset when the server/isolate restarts. Backend authentication failures and outages never trigger compatibility. Production builds, including local production previews, always require the persistent Convex controls and fail closed if they are missing. Deploy updated Convex functions before releasing the Worker.

After owner setup, remove `ADMIN_SETUP_KEY` from the production Convex environment. Existing login remains available. Use a unique password stored in a password manager. MFA for the Cloudflare, Convex, GitHub and AI-provider accounts protects the infrastructure; an additional app-admin MFA/Cloudflare Access integration is optional and not enabled by this change.

## Basic monitoring

Cloudflare observability already records sanitized server failures; inspect Worker error logs and unexpected 429/503 responses. Application logs omit raw exceptions, request bodies, cookies, and visitor-supplied text. Provider/dashboard budget alerts and incident notifications require configuration in the respective dashboards; this code does not silently create external alerts.

PostHog Error Tracking receives consented public-browser crashes through the standard `captureException(error)` SDK method, including route error boundaries, uncaught Error objects, and unhandled promise rejections. Error messages, stack traces and SDK metadata are preserved without property stripping. Admin routes and browser privacy opt-outs are excluded. At most ten crash reports are attempted per page lifetime, and the same Error object is reported once. Session replay and broad console capture are disabled. Server-side errors remain in Cloudflare logs. After acceptance, the `qd:verify-error-tracking` browser event sends an explicitly labelled setup-verification exception; see [analytics setup](analytics.md).

No additional PostHog key is needed. Open Error Tracking in the existing EU project to inspect reports. Configure issue alerts there if desired. Blockers or rejected consent can prevent browser reports; they are best effort, not a complete incident monitor.

## Verification

Unit/backend tests cover endpoint limits, cookie/IP rotation, window reset, the shared UTC-day generation cap, emergency pause, invalid configuration, bridge authorization, conversation/draft isolation, owner access, published-only content, safe output rendering, and crash reporting/consent. Browser checks validate production headers, public navigation, consented exception ingestion, and rendering without CSP violations. These checks use synthetic data and intercepted PostHog ingestion.

References: [Cloudflare server-side Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Convex authorization](https://docs.convex.dev/auth/overview), [PostHog Error Tracking](https://posthog.com/docs/error-tracking/start-here).
