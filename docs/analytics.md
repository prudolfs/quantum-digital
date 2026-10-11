# PostHog analytics

## Configuration

The owner's public `phc_` project token and EU ingestion host (`https://eu.i.posthog.com`) are configured in `wrangler.jsonc` as `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST`. They are browser configuration, not Convex environment variables or Cloudflare secrets. A PostHog personal API key (`phx_`) must never be used here. See [PostHog's public-token guidance](https://posthog.com/docs/privacy).

These two keys are included in the explicit Vite public allow-list and the guarded release build. Cloudflare Workers Builds environment variables can override them; changing them requires rebuilding and deploying. Empty both build variables to disable analytics. Configure a separate project or leave analytics disabled for branch previews if preview traffic should not mix with production.

Analytics uses normal **cookie-based tracking**. It no longer sets `cookieless_mode` or sends `$cookieless_mode`; Cookieless server hash mode is not required for these events. The EU project token and host remain the same. The SDK stays unloaded until the visitor accepts analytics, then uses first-party cookie persistence with a 180-day expiry and no cross-subdomain tracking. No person profiles or identification are added.

The consent banner offers equally visible **Accept analytics** and **Reject analytics** buttons. It is hidden on admin routes and when browser privacy signals disable tracking. The chat version sits beneath the header, clear of the bottom composer. Cookie preferences in the footer and Privacy page reopen the controls. The choice is stored as `qd-analytics-consent:v1` in local storage; if storage is blocked, it is remembered for the current page only. Rejection means no cookie-based or cookieless capture. Withdrawing acceptance stops future capture and clears the SDK's tracking cookie. Consent changes synchronize across tabs. Events before acceptance are dropped, not replayed later; acceptance captures the current public route once. See [PostHog's React consent guidance](https://posthog.com/tutorials/react-cookie-banner).

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

Autocapture, replay, performance recording, automatic exceptions, heatmaps, surveys, feature flags, and other external extensions remain disabled. The event/property allow-list strips original URLs/referrers, campaign parameters, names, email addresses, chat/form text, timing, budget, chat/draft/inquiry IDs, window IDs, and error messages. It retains the random SDK visitor ID, UUIDv4/UUIDv7 `$device_id` (a browser-generated identifier, not a hardware ID), and valid UUIDv7 `$session_id` required for cookie-mode Web Analytics, along with the real browser User-Agent for traffic classification. Host/path are derived from the canonical origin and approved routes; query strings and fragments are never sent. GeoIP enrichment is disabled. Do Not Track and Global Privacy Control prevent initialization/capture.

Analytics is browser-side and best effort: blockers, offline browsers, or navigation can prevent delivery. A submission event follows a confirmed server receipt; it never changes database writes or inquiry confirmation. Convex's private inbox remains the authoritative inquiry record. No analytics calls or errors can block chat, navigation, or submission. The privacy page explains this collection.

## Verification

Unit checks exercise property redaction, event/path restrictions, consent gating and withdrawal, deduplication without transmitting inquiry IDs, privacy signals, local exclusions, and analytics failures. Browser checks intercept all PostHog ingestion and use synthetic inquiries. They verify no capture/tracking cookies before acceptance or after rejection, remembered preferences, withdrawal clearing cookies, stable random visitor/device/session IDs and a matching device ID in the identity cookie across navigation and reload, required page-view metadata, both inquiry funnels, failed confirmation/retry, restoration, private-data redaction, and browser privacy signals. No test sends events to the live project or submits real inquiries.

The opt-in browser check requires an isolated preview built with its exact loopback origin, for example `VITE_SITE_URL=http://127.0.0.1:3026 pnpm build`. Start preview on that port, then run `ANALYTICS_E2E_LOCAL=1 pnpm exec playwright test e2e/analytics.spec.ts` with a config pointing at that preview. All PostHog requests are intercepted. The check emulates a normal visitor identity because the SDK intentionally filters automated browsers; production keeps that bot filter. Rebuild using `pnpm deploy:check` afterwards to restore production public settings before deployment.

## Troubleshooting page views

`capture_pageview: false` disables automatic capture; `SiteAnalytics` calls `captureAnalytics('$pageview')` on public route changes and when consent becomes accepted, which calls the SDK manually. Do not enable automatic page views as well.

After deploying this cookie-mode build, accept analytics and inspect the event stream for `$pageview`. It should have a random `distinct_id` and `$device_id`, valid UUIDv7 `$session_id`, sanitized `$current_url`/`$host`/`$pathname`, and the browser User-Agent. It must not contain `$cookieless_mode` or a `cookieless_` identity. Existing cookieless events are historical and do not become cookie-mode events retroactively. A previously accepted cookie-mode browser keeps its identity across reloads; the choice can be changed through Cookie preferences.

If live events exist but the dashboard remains zero, clear date/domain/test-account/bot filters and verify that the same EU project receives the events. Users who reject analytics or send privacy opt-out signals are intentionally excluded. The online indicator, event counts, unique visitors, and person profiles are different metrics; this integration still disables person profiles. The prior [reported cookieless aggregation/classification issue](https://github.com/PostHog/posthog/issues/88350) explains the reason for leaving cookieless mode, not the expected behavior of the new cookie-based events.

A null `$device_id` on older events came from our property filter, which stripped the SDK field even when the identity cookie was valid. New events retain the validated SDK UUID; historical events are unchanged. Missing `$device_id` alone does not prove broken persistence or explain a zero visitor count. PostHog’s [overview query](https://github.com/PostHog/posthog/blob/master/products/web_analytics/backend/hogql_queries/web_overview.py) counts distinct event person IDs and requires valid session IDs. Check the deployed build, date/host/test-account filters, and session metadata if counts remain zero.
