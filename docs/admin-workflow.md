# Owner admin workflow

The workspace is `/admin`, with separate Inquiry inbox, Selected work, Services, and Site settings tabs. Sign-in and recovery use the Quantum Digital logo, a centered access panel, and the homepage hexagon background. The workspace has searchable record previews, explicit saves, version checks, and protection for unsaved changes. Public registration is disabled. Owner setup verifies ownership using the setup key rather than a verification email; password recovery uses Resend.

## Create the owner once

The connected deployment is [peaceful-koala-818](https://dashboard.convex.dev/d/peaceful-koala-818), which currently also backs the public Worker. Its configured owner email is `rudolfs.pukitis@proton.me` and auth website origin is `https://quantum-digital.pukitis-rudolfs.workers.dev`. Open `/admin` on that public origin. Local admin development needs a separate backend with a matching local `SITE_URL`.

Get `ADMIN_SETUP_KEY` from this deployment’s Convex environment settings, or the private ignored `.env.convex.cloud.local` file. Enter the owner email, key, and your chosen password twice. The key is a separately generated random secret, not your password or the Better Auth secret. No real owner password has been chosen by the implementation or tests.

After creation, a permanent database marker and an existing-user check close bootstrap. Remove `ADMIN_SETUP_KEY` in Convex after completing setup; email/password sign-in continues working. Changing the key or owner email does not reopen setup or migrate the account. Sign-in rate limiting uses the Cloudflare client-IP header and persistent Better Auth storage.

Production uses its own environment variables and first-time setup. Set `SITE_URL` to `https://quantum-digital.pukitis-rudolfs.workers.dev` there, with fresh setup/auth/bridge secrets. Cloudflare publishing and production deployment remain separate release steps.

## Reset the owner password

Configure these **server-only Convex environment variables** on the deployment used by the site:

- `RESEND_API_KEY`: a Resend API key with permission to send email.
- `ADMIN_EMAIL_FROM`: a sender address on a Resend-verified domain, such as `Quantum Digital <admin@your-verified-domain>`.
- `ADMIN_OWNER_EMAIL`: must match the email on the existing Better Auth user. The admin login remains `rudolfs.pukitis@proton.me`; changing this environment variable alone does not change an existing account.
- `ADMIN_PASSWORD_RESET_EMAIL`: optional fixed recovery recipient, otherwise the owner email is used. The approved temporary recipient is `pukitis.rudolfs@gmail.com`, matching the owner's Resend account. This does not change the admin login. Only server configuration can set this address; request parameters cannot choose the recipient.
- `SITE_URL`: the working website origin, with no trailing slash. This is used for auth URLs and trusted callbacks. If an old custom domain is down, use the working Workers origin consistently in the backend and frontend build settings.

The recipient can use Proton Mail; it does not need to be on the sender domain. A Proton address cannot be used as a Resend sender without controlling that domain. For initial testing, Resend's `onboarding@resend.dev` sender can send to the email registered on your Resend account. A down website does not necessarily mean its DNS or email domain is unavailable; verify domain ownership and DNS separately before choosing the sender.

Choose **Forgot password?**, enter the account email, and select **Send reset link**. The response is generic for known and unknown emails. The link opens `/admin` with a single-use token that expires after 30 minutes. Enter matching 12–128-character passwords. A successful reset revokes existing sessions, clears the token from the URL, and returns to sign-in. Invalid/expired links offer a new request. Reset requests allow three attempts per five minutes per client IP; reset submissions allow five.

Without email configuration, requests are disabled and the UI reports that email could not be sent. Better Auth returns a generic success even if a configured provider subsequently fails; inspect Convex auth logs and the Resend delivery dashboard when an email is missing. Tokens and provider response bodies are not logged by the email callback. No real email is sent by automated tests. Configure and deploy both backend and frontend before live delivery verification.

References: [Better Auth password recovery](https://better-auth.com/docs/authentication/email-password), [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email).

The November 5, 2026 recovery rollout uses `Quantum Digital <onboarding@resend.dev>` as the temporary sender and `pukitis.rudolfs@gmail.com` as the fixed recovery recipient, matching the Resend account while `send.quantumdigital.dev` has failed verification. The Proton owner login and existing `BETTER_AUTH_SECRET` are unchanged. Backend functions and the branded frontend are deployed to the existing Convex deployment and public Worker. A live reset request through the public admin UI returned success, and Resend confirmed delivery to Gmail; the owner chooses the new password. The API key is stored only in Convex and ignored local configuration, never frontend bindings or committed files. The full quality check passes 131 tests, and the access screens passed six desktop/mobile browser checks. The release build and Cloudflare deployment dry-run pass.

## Edit content

After signing in, open Selected work, Services, or Site settings and choose **Import current content** once. This copies the already-approved public content into draft and published records; it does not change what visitors see. Initialization is idempotent and never overwrites an existing workspace.

Case studies and services have searchable lists and create/edit screens. Fill required fields, choose display order, and select **Save draft**. Drafts remain private; publishing is a separate action. Service illustrations reuse the four existing visual types. Case-study repository/demo links are optional HTTPS URLs, so abstract client examples can stay unlinked. “Also list this case study on About” controls the additional-work links; all published work appears in Selected work.

Select **Publish saved draft** after saving. Publishing changes the website, case-study routes, sitemap, and assistant context. A slug change changes the case-study address; redirects are not generated. **Unpublish** requires confirmation and keeps the record as a private draft. There is no hard-delete action.

Site settings cover homepage search/share title and description, hero/approach copy, public contact email, and up to 20 questions/answers. Save settings as a draft, then publish them explicitly. Public contact email is separate from the owner sign-in email.

Navigation and closing/reloading the tab warn about unsaved changes. Saving or publishing with an old version fails instead of overwriting another edit; reload and review the latest version before retrying.

## Scope and public rendering

Rich work-story layouts, illustration configuration, workflow explanations, and annotated evidence are code-managed. All six work presentations supplement existing published records; title, summary, role, and original narrative fields still use saved published values. Care/accounting/research repository/demo links are suppressed by their abstract-client disclosure policy; approved finance/service/robotics links use saved published values. No new editor fields or migration are needed. Changing its slug selects the ordinary layout until a matching code-managed story is defined. Unpublishing removes the route and assistant lookup result; public illustration files remain static assets.

Engagement structure, professional profile links, broader experience, page structure, animation, and layout remain in source code. No arbitrary page builder or media upload library is introduced.

Public pages use server-side loaders. Before import, approved source defaults provide the site. After import, only published snapshots are returned, including genuinely empty collections after unpublishing everything. A configured backend failure does not restore defaults and accidentally expose unpublished material. Published changes are loaded on the next route request/navigation; already-open pages are not live subscriptions.

The inquiry inbox uses shadcn cards, selects, a date-range calendar, tabs, dialogs, and confirmation dialogs. Compact cards show the name, email, status, submission date, a short brief, timing, budget, and whether an AI summary exists. **View inquiry** opens the full brief, saved conversation, summary, and status control in a dialog; **Reply by email** opens your mail client. The content editors also use shadcn inputs, textareas, checkboxes, selects, and confirmation dialogs.

The backend returns 12 inquiries per page, newest first, with Previous/Next cursor pagination across the matching records. Status and inclusive calendar-date filters run on the backend before pagination. Date boundaries and displayed timestamps use `Europe/Riga`, including daylight-saving changes. Changing a filter returns to the first page.

New confirmations retain the visible user and assistant text in a private `inquiryConversations` snapshot. Restarting or expiring the anonymous chat does not erase this submitted copy. The owner can choose **Generate summary** to create a saved recap covering requirements, constraints, next steps, and open questions. Generation uses the Worker's existing `AI_GATEWAY_API_KEY` and `AI_MODEL`; there are no new provider settings. The transcript is treated as untrusted input, hidden reasoning/tool payloads are excluded, and generated output is schema-validated. A summary is generated once and cached. Concurrent generation is locked, failed requests can be retried, and uncached generation is limited to 50 per owner per 24-hour window. Saved chat snapshots and AI summaries are never sent to PostHog or used as public assistant context.

Older inquiries can use their original conversation only while its submitted draft and original messages are still retained. Messages created after submission are excluded. If the original chat has been restarted or expired, the dialog reports it as unavailable and keeps the submitted brief; it never invents a missing transcript. **Delete inquiry** requires confirmation and permanently removes the inquiry, submitted drafts, saved chat copy, and AI summary. Original anonymous messages and previously sent analytics events have separate retention; deletion does not remove those. In-flight summary responses cannot recreate deleted records.

Every private backend read and mutation checks the live owner session. The first-time setup mutation validates email, key, password length, and confirmation, and creates the auth account plus setup marker in one mutation. Passwords are hashed by Better Auth. Setup keys and passwords are never stored in public content or browser persistence.

## Checks

`pnpm check` covers typed models, backend access controls, bootstrap validation, password hashing/sign-in cookies, draft separation, stale versions, and publication. The isolated browser scenario in `e2e/admin.spec.ts` additionally exercises the actual setup/sign-in cookie flow and admin publishing UI against a disposable local Convex database. It must never run against the connected cloud database: build with backend ports 3310/3311 and run only the desktop project with `ADMIN_E2E_ISOLATED=1`. Model-provider streaming and production owner access still need release verification.

`e2e/admin-inbox.spec.ts` additionally covers the inbox and detail dialog on desktop and mobile, cursor pagination, shadcn calendar/status filters, changing status, saved summary display, full conversation display, deletion cancellation/confirmation, unavailable-provider recovery, accessibility, and horizontal overflow. It requires `.env.inbox-e2e.local` selecting only the disposable backend at `http://127.0.0.1:3310` and a build/preview at `http://127.0.0.1:3036`. It refuses a cloud backend. Unit tests cover summary output and prompt boundaries with a mocked provider; these checks do not spend live AI credits.

Deploy the inbox schema/functions to the connected Convex backend before deploying the matching Worker. Existing inquiry rows need no migration; saved chat snapshots are created on new confirmations, with the limited legacy lookup described above. The frontend expects the new paginated inbox and detail endpoints, so it should not be released on its own.

The inbox update was deployed to the connected backend and public Worker on November 5, 2026 after 141 unit/backend tests, 14 admin browser scenarios, and the release dry-run passed. A clearly labeled **DEMO — Warehouse operations** inquiry (`jd7fv6n70zz80a9qzebketkthh8hna35`) was created for the live preview with six synthetic conversation messages. Its confirmation passed through the public submission endpoint, and its summary was generated through the live admin UI using `google/gemini-2.5-flash` and saved successfully. A short-lived administrative preview session was removed after verification; the owner's password, auth secret, and existing inquiries were not changed. The demo inquiry remains available for the owner to review or delete.

Implementation references: [Convex Better Auth with TanStack Start](https://labs.convex.dev/better-auth/framework-guides/tanstack-start), [Better Auth email and password](https://better-auth.com/docs/authentication/email-password), [Better Auth rate limits](https://better-auth.com/docs/concepts/rate-limit).

## Chat refinement

Conversation transcripts are stored privately in Convex `chatThreads` and `chatMessages`; the inbox continues to list confirmed inquiries, not a recent-chats interface. Conversations restore for the anonymous visitor’s browser and expire after 30 days of inactivity. Restart clears messages while preserving confirmed inquiries. Contact details may come from conversation or a tool-rendered form; either path still requires explicit review and confirmation. Public résumé/portfolio snapshots are currently maintained in source, separately from published website content. Turnstile keys belong in Cloudflare/build configuration, not admin content or Convex auth environment.

Robotics adds a code-managed overview of all four applications. The bootstrap summary now includes Warehouse Demo; imported records keep their saved title, summary, and context until the owner edits/publishes them. Research remains abstract and unlinked. Service/robotics repository actions continue to use approved saved published values.

About’s public introduction, career journey, working practices, and workbench illustration are code-managed, alongside the approved résumé/portfolio snapshots. Its example and exploration links resolve published project titles from the existing loader, so unpublished examples disappear. These changes add no admin fields or record migration; homepage and existing saved case-study copy remain owner-managed.

Restored chat references follow current publication and disclosure rules. Old tool results cannot reactivate an unpublished route or an abstract project’s external link. Existing saved messages remain readable; no transcript or content migration is required.
