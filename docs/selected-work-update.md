# Selected work update · November 2026

Guided Business Builder now has a source-default selected-work card and a code-managed case study at `/work/guided-business-builder`. Its hero is an original conceptual Blender storefront connected to approved business facts, a conversation, and an enquiry, using the shared interactive 3D viewer and matching stills. Actual development screenshots remain in the product-evidence section. The copy describes the development prototype and reflects the owner-validation stage, implemented Stripe sandbox checkout/webhooks/refunds, and release rehearsal. Production payments, public publication, and custom domains remain planned. No repository or demo link has been assumed.

Robotics Lab now covers five applications, including Greenhouse Caretaker. Its story adds manual teaching, demonstration review, imitation learning, bounded PPO practice, policy comparison, and learned execution. Screenshots show live learned carrying and recorded validation comparison. Python/MuJoCo authority, local checkpoint requirements, idealized sensing/grasping, and separation of playback from live control are explicit.

## Publishing saved content

The existing CMS remains authoritative once initialized. Source defaults do not overwrite saved records. To make this update visible on an initialized deployment:

1. Deploy the frontend through the existing release workflow.
2. In `/admin` → Selected work, create or update `guided-business-builder` using the matching record in `src/content/site.ts`. Put it first in display order, save the draft, and publish it.
3. Edit the saved `robotics-lab` summary, context, challenge, approach, and delivery using the matching source record, then save and publish. Its code-managed story updates with the frontend.
4. Check both routes, the homepage card, sitemap, and assistant lookup against the published collection.

No backend migration, automatic record overwrite, or live publication is part of the source change.

## Evidence sources

Builder captures come from the 1080 × 1080 set in `../guided-business-builder/screenshots/linked-in/`; all details are synthetic and the website/edit use deterministic demo generation. The four selected scenes are `request-preview` (the saved editorial website edit), `business-details` (illustrated discovery), `business-assistant` (approved answers), and `enquiry-review` (explicit customer confirmation). Uncropped WebP copies are under `public/work/builder/`, each below 50 KB. Rebuild with `node scripts/work/prepare-builder-evidence.mjs`; encoding details and source paths are recorded in `assets/work/builder/evidence.json`.

Greenhouse captures come from `../robotics-lab/apps/greenhouse-demo/screenshots/learned-carrying.png` and `policy-comparison.png`, documented by that folder's README. They were resized to 900 × 900 and encoded as WebP under `public/work/robotics/`; both are below 50 KB. The carrying view is live simulation paused on seed 42; the comparison is recorded validation seed 10006, including learned pickup failures.
