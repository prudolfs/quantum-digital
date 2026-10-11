# PostHog analytics

## Configuration

The owner's public `phc_` project token and EU ingestion host (`https://eu.i.posthog.com`) are configured in `wrangler.jsonc` as `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST`. They are browser configuration, not Convex environment variables or Cloudflare secrets. A PostHog personal API key (`phx_`) must never be used here. See [PostHog's public-token guidance](https://posthog.com/docs/privacy).

These two keys are included in the explicit Vite public allow-list and the guarded release build. Cloudflare Workers Builds environment variables can override them; changing them requires rebuilding and deploying. Empty both build variables to disable analytics. Configure a separate project or leave analytics disabled for branch previews if preview traffic should not mix with production.

Enable **Cookieless server hash mode** under **Project settings → Web analytics** in the PostHog project. See [PostHog’s cookieless setup](https://posthog.com/tutorials/cookieless-tracking). The installed SDK documents that the project must accept cookieless events; otherwise ingestion ignores them. No cookie banner or analytics storage is added. The lazy browser SDK uses `cookieless_mode: 'always'`, memory persistence, no person profiles, and no identification. Cookieless identity is derived by PostHog's servers rather than a durable browser ID. This configuration is a data-minimization choice, not a claim about legal obligations.

Ordinary loopback development and browser tests skip analytics, even with Wrangler's public defaults. To inspect local analytics deliberately, set `VITE_SITE_URL` to the exact local origin and use a separate test project. PostHog's setup screen/project settings provide the project token and host. The production project is EU; US projects would instead use `https://us.i.posthog.com`.

## Events

| Event                       | Trigger                                                                                    | Properties                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `$pageview`                 | Initial public route and client-side pathname navigation                                   | `page_path`, sanitized `$current_url`, `$host`, `$pathname` |
| `chat_started`              | First visitor message in an empty conversation                                             | `page_path`                                                 |
| `inquiry_requested`         | First successfully produced contact form or conversational inquiry draft in a conversation | `page_path`, `source`                                       |
| `inquiry_reviewed`          | A new validated draft reaches review, from the contact form or assistant                   | `page_path`, `source`                                       |
| `inquiry_submit_attempted`  | Visitor explicitly confirms submission                                                     | `page_path`, `source`                                       |
| `inquiry_submitted`         | Website receives a successful saved receipt with an inquiry ID                             | `page_path`, `source`                                       |
| `inquiry_submission_failed` | Confirmation fails; draft remains retryable                                                | `page_path`, `source`                                       |

`source` is only `contact_form` or `conversation`. Request counts once per active conversation; each distinct reviewed/submitted draft counts once per browser lifecycle. IDs used for local deduplication are never sent. Restored tool results and saved receipts do not count as new requests or submissions. Restart allows a new request funnel.

Page views ignore query strings, fragments, and same-page anchors. Admin and unknown non-work routes are excluded. The six approved work paths retain their slug; other work paths use `/work/:slug`. Automatic page capture is disabled, so route changes do not double-count. The intended funnel is chat page view → chat started → inquiry requested → inquiry reviewed → inquiry submitted; submission attempts/failures help explain drop-off. Work/About page views show which content leads into chat.

## Privacy and resilience

Autocapture, replay, performance recording, automatic exceptions, heatmaps, surveys, feature flags, and other external extensions are disabled. A final event/property allow-list strips SDK enrichment, original URLs/referrers, campaign parameters, names, email addresses, chat/form text, timing, budget, session/draft/inquiry IDs, and error messages. The real browser User-Agent (`$raw_user_agent`) is included because cookieless ingestion requires it to compute the server-side visitor/session hash; it is taken from the browser, not custom event data. Canonical `$host` and sanitized `$pathname` remain for Web Analytics. Cookieless mode removes raw connection identity data during ingestion; no browser-generated visitor/session IDs are added. Only this ingestion metadata and the documented properties remain. GeoIP enrichment is disabled. Do Not Track and Global Privacy Control prevent initialization/capture.

Analytics is browser-side and best effort: blockers, offline browsers, or navigation can prevent delivery. A submission event follows a confirmed server receipt; it never changes database writes or inquiry confirmation. Convex's private inbox remains the authoritative inquiry record. No analytics calls or errors can block chat, navigation, or submission. The privacy page explains this collection.

## Verification

Unit checks exercise property redaction, event/path restrictions, deduplication without transmitting IDs, privacy signals, local exclusions, and analytics failures. Browser checks intercept all PostHog ingestion, use synthetic inquiries, and verify public route tracking, the inquiry funnel, failed confirmation/retry, restoration, and absence of analytics cookies/storage. They do not send events into the live project or submit real inquiries.

The opt-in browser check requires an isolated preview built with its exact loopback origin, for example `VITE_SITE_URL=http://127.0.0.1:3026 pnpm build`. Start preview on that port, then run `ANALYTICS_E2E_LOCAL=1 pnpm exec playwright test e2e/analytics.spec.ts` with a config pointing at that preview. All PostHog requests are intercepted. The check emulates a normal visitor identity because the SDK intentionally filters automated browsers; production keeps that bot filter. Rebuild using `pnpm deploy:check` afterwards to restore production public settings before deployment.

## A live visitor but zero dashboard count

The SDK setup message about manually calling `posthog.capture('$pageview')` is expected: `capture_pageview: false` disables automatic capture, while `SiteAnalytics` calls `captureAnalytics('$pageview')` on public route changes, which calls the SDK manually. Do not enable automatic page views as well.

Verify that Cookieless server hash mode is enabled in the same EU project as the configured token. Check the event stream for `$pageview` and inspect the dashboard date range and filters. Check ingestion warnings for `cookieless_missing_user_agent`: a strict `before_send` filter must retain the browser User-Agent, or cookieless events can be discarded despite reaching ingestion. The sanitized `$host` and `$pathname` should also appear in outgoing page views. An online indicator alone does not identify which aggregate metric is being counted. Persons/profile counts are distinct from anonymous event/visitor counts: this integration intentionally uses `person_profiles: never`. Do not turn on profiles or cookies just to change that number.

If page views appear in the event stream but Web Analytics still shows zero, clear domain/date filters and inspect the bot/automation exclusion. PostHog has a [reported cookieless classification issue](https://github.com/PostHog/posthog/issues/88350): privacy-redacted user agents can be classified as automation after ingestion. Inspect a page view and compare with that exclusion disabled rather than assuming all traffic is a bot.

Cookie-based tracking can recognize returning browsers across days, while cookieless server hashes rotate daily. Switching requires an explicit consent UI and corresponding SDK/persistence/property-filter changes, not just changing the dashboard setting. Keep inquiry contents and contact details out of analytics in either mode.
