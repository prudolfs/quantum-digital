# PostHog analytics

## Configuration

The owner's public `phc_` project token and EU ingestion host (`https://eu.i.posthog.com`) are configured in `wrangler.jsonc` as `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST`. They are browser configuration, not Convex environment variables or Cloudflare secrets. A PostHog personal API key (`phx_`) must never be used here. See [PostHog's public-token guidance](https://posthog.com/docs/privacy).

These two keys are included in the explicit Vite public allow-list and the guarded release build. Cloudflare Workers Builds environment variables can override them; changing them requires rebuilding and deploying. Empty both build variables to disable analytics. Configure a separate project or leave analytics disabled for branch previews if preview traffic should not mix with production.

Analytics uses normal **cookie-based tracking**. It no longer sets `cookieless_mode` or sends `$cookieless_mode`; Cookieless server hash mode is not required for these events. The EU project token and host remain the same. The SDK stays unloaded until the visitor accepts analytics, then uses first-party cookie persistence with a 180-day expiry and no cross-subdomain tracking. No person profiles or identification are added.

The consent banner offers equally visible **Accept analytics** and **Reject analytics** buttons. It is hidden on admin routes and when browser privacy signals disable tracking. The chat version sits beneath the header, clear of the bottom composer. Cookie preferences in the footer and Privacy page reopen the controls. The choice is stored as `qd-analytics-consent:v1` in local storage; if storage is blocked, it is remembered for the current page only. Rejection means no cookie-based or cookieless capture. Withdrawing acceptance stops future capture and clears the SDK's tracking cookie. Consent changes synchronize across tabs. Events before acceptance are dropped, not replayed later; acceptance captures the current public route once. See [PostHog's React consent guidance](https://posthog.com/tutorials/react-cookie-banner).

Ordinary loopback development and browser tests skip analytics, even with Wrangler's public defaults. To inspect local analytics deliberately, set `VITE_SITE_URL` to the exact local origin and use a separate test project. PostHog's setup screen/project settings provide the project token and host. The production project is EU; US projects would instead use `https://us.i.posthog.com`.

## Events

| Event                       | Trigger                                                                                    | Properties                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `$pageview`                 | Initial public route and client-side pathname navigation                                   | `page_path`, standard `$current_url`, `$host`, `$pathname` |
| `chat_started`              | First visitor message in an empty conversation                                             | `page_path`                                                |
| `inquiry_requested`         | First successfully produced contact form or conversational inquiry draft in a conversation | `page_path`, `source`                                      |
| `inquiry_reviewed`          | A new validated draft reaches review, from the contact form or assistant                   | `page_path`, `source`                                      |
| `inquiry_submit_attempted`  | Visitor explicitly confirms submission                                                     | `page_path`, `source`                                      |
| `inquiry_submitted`         | Website receives a successful saved receipt with an inquiry ID                             | `page_path`, `source`                                      |
| `inquiry_submission_failed` | Confirmation fails; draft remains retryable                                                | `page_path`, `source`                                      |

`source` is only `contact_form` or `conversation`. Request counts once per active conversation; each distinct reviewed/submitted draft counts once per browser lifecycle. IDs used for local deduplication are never sent. Restored tool results and saved receipts do not count as new requests or submissions. Restart allows a new request funnel.

Page-view events fire on pathname changes, rather than separately for query/hash changes. Their SDK metadata retains the full URL, including query strings and fragments. Admin and unknown non-work routes are excluded. The six approved work paths retain their slug; other work paths use `/work/:slug`. Automatic page capture is disabled, so route changes do not double-count. The intended funnel is chat page view → chat started → inquiry requested → inquiry reviewed → inquiry submitted; submission attempts/failures help explain drop-off. Work/About page views show which content leads into chat.

## Privacy and resilience

Consent is the collection gate. After acceptance, the application sends the SDK's standard metadata without a `before_send` property filter: full page URLs, referrers, campaign parameters, browser/OS/device/screen information, visitor/device/session IDs, and ordinary exception metadata. IP processing and GeoIP enrichment are enabled so new visits can populate the country map. Existing events captured with GeoIP disabled are unchanged.

Custom inquiry events still describe only the action and its source; the app does not add chat transcripts, contact form fields, or database IDs to them. Automatic form capture, session replay, performance recording, heatmaps, surveys, feature flags, and console capture remain disabled. Public route tracking and Do Not Track/Global Privacy Control handling remain in place. Rejecting or withdrawing consent prevents initialization/capture and clears analytics cookies.

Analytics is browser-side and best effort: blockers, offline browsers, or navigation can prevent delivery. A submission event follows a confirmed server receipt; it never changes database writes or inquiry confirmation. Convex's private inbox remains the authoritative inquiry record. No analytics calls or errors can block chat, navigation, or submission. The privacy page explains this collection.

## Basic crash reporting

The existing EU project receives `$exception` events through the SDK's standard `captureException(error)` method. Public route error boundaries, uncaught errors and unhandled promise rejections are reported after analytics acceptance. Original error messages, stack traces, and SDK error metadata are preserved without a custom property filter. Reports are deduplicated and capped at ten per page lifetime. Admin routes, privacy opt-outs and ordinary local development remain excluded. The application's listeners perform the automatic uncaught-error/rejection reporting, so SDK exception autocapture stays disabled to avoid duplicate reports. Server-side failures stay in Cloudflare observability.

No extra token is needed. The Error Tracking setup/empty state alone does not prove that the browser integration is missing: reporting happens when an accepted visitor has an exception. After deployment, open a public page, accept analytics, and run this deliberately labelled verification in the browser console:

```js
window.dispatchEvent(new Event('qd:verify-error-tracking'))
```

This sends one `PostHog setup verification` exception marked `is_error_tracking_verification: true`, without crashing the app. Look for `$exception` in the EU project's live event stream, then in Error Tracking after processing. Resolve the verification issue after checking it. If the event appears but no issue follows, inspect Error Tracking ingestion/suppression rules in the dashboard. If no event appears, check consent, privacy signals, browser blockers, network ingestion responses, and that you are viewing the same EU project. No automatic fake errors are sent on page visits.

If new visits still lack country data, check the project's GeoIP transformation and any property filters. The dashboard can discard stored IP addresses while still using them for GeoIP enrichment. See [PostHog data-storage controls](https://posthog.com/docs/privacy/data-storage) and [error tracking troubleshooting](https://posthog.com/docs/error-tracking/troubleshooting). Source maps can be added later for readable production source locations; this change preserves the SDK stack trace but does not upload maps.

## Verification

Unit checks exercise standard metadata, public route tracking, consent gating and withdrawal, deduplication without transmitting inquiry IDs, privacy signals, local exclusions, and analytics failures. Browser checks intercept all PostHog ingestion and use synthetic inquiries. They verify no capture/tracking cookies before acceptance or after rejection, remembered preferences, withdrawal clearing cookies, stable random visitor/device/session IDs and a matching device ID in the identity cookie across navigation and reload, required page-view metadata, both inquiry funnels, failed confirmation/retry, restoration, inquiry fields not being added to custom events, and browser privacy signals. No test sends events to the live project or submits real inquiries.

The opt-in browser check requires an isolated preview built with its exact loopback origin, for example `VITE_SITE_URL=http://127.0.0.1:3026 pnpm build`. Start preview on that port, then run `ANALYTICS_E2E_LOCAL=1 pnpm exec playwright test e2e/analytics.spec.ts` with a config pointing at that preview. All PostHog requests are intercepted. The check emulates a normal visitor identity because the SDK intentionally filters automated browsers; production keeps that bot filter. Rebuild using `pnpm deploy:check` afterwards to restore production public settings before deployment.

## Troubleshooting page views

`capture_pageview: false` disables automatic capture; `SiteAnalytics` calls `captureAnalytics('$pageview')` on public route changes and when consent becomes accepted, which calls the SDK manually. Do not enable automatic page views as well.

After deploying this cookie-mode build, accept analytics and inspect the event stream for `$pageview`. It should have a random `distinct_id` and `$device_id`, valid UUIDv7 `$session_id`, standard `$current_url`/`$host`/`$pathname`, and the browser User-Agent. It must not contain `$cookieless_mode` or a `cookieless_` identity. Existing cookieless events are historical and do not become cookie-mode events retroactively. A previously accepted cookie-mode browser keeps its identity across reloads; the choice can be changed through Cookie preferences.

If live events exist but the dashboard remains zero, clear date/domain/test-account/bot filters and verify that the same EU project receives the events. Users who reject analytics or send privacy opt-out signals are intentionally excluded. The online indicator, event counts, unique visitors, and person profiles are different metrics; this integration still disables person profiles. The prior [reported cookieless aggregation/classification issue](https://github.com/PostHog/posthog/issues/88350) explains the reason for leaving cookieless mode, not the expected behavior of the new cookie-based events.

A null `$device_id` on older events came from our property filter, which stripped the SDK field even when the identity cookie was valid. New events retain the standard SDK UUID; historical events are unchanged. Missing `$device_id` alone does not prove broken persistence or explain a zero visitor count. PostHog’s [overview query](https://github.com/PostHog/posthog/blob/master/products/web_analytics/backend/hogql_queries/web_overview.py) counts distinct event person IDs and requires valid session IDs. Check the deployed build, date/host/test-account filters, and session metadata if counts remain zero.
