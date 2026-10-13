# Quantum Digital Style Guide

## Direction

Use a cinematic dark-blue identity with generous spacing, large editorial headings, restrained interface framing, and luminous blue accents. The interactive hero demonstrates craft; the rest of the page makes the offer and evidence easy to read.

Keep positioning and website copy in [the plan](plan.md). This document defines visual treatment, not additional services or product scope.

## Color tokens

| Token            | Value     | Role                                           |
| ---------------- | --------- | ---------------------------------------------- |
| `canvas`         | `#030812` | Page background                                |
| `surface`        | `#07182B` | Navigation and section surfaces                |
| `surface-raised` | `#0A2038` | Cards and panels                               |
| `brand`          | `#00AEEF` | Primary accent and highlighted headline phrase |
| `signal`         | `#238BFF` | Links, active controls, and focus              |
| `ice`            | `#CCE9FA` | Display text and soft highlights               |
| `white`          | `#F7FBFF` | Main text and high-contrast controls           |
| `muted`          | `#8FA8BA` | Supporting text                                |
| `border`         | `#17334A` | Borders and dividers                           |
| `portal-blue`    | `#007BFF` | Shape particles                                |
| `portal-cyan`    | `#398FFF` | Lit particle surfaces                          |
| `portal-ice`     | `#AFD7FF` | Particle highlights                            |
| `portal-gold`    | `#F5B85B` | Hero cursor trail and sparks                   |
| `portal-amber`   | `#C47B35` | Fading cursor trail                            |
| `portal-core`    | `#FFF0BD` | Bright cursor particle cores                   |

Use gold for hero cursor effects and secondary tiles behind trailing CTA arrows. Keep highlighted heading text solid brand blue. Check contrast in the actual compositions, especially small text, borders, and focus states.

## Typography and layout

- Use the original Quantum Digital vector wordmark in both the marketing and chat headers. Its blue Q is the first letter of Quantum; do not prepend another icon or repeat the brand in adjacent text. `BrandLink` provides the shared, home-linked, accessible treatment. The asset in `public/brand/quantum-digital.svg` preserves the original paths from the old monorepo header.
- Use only that wordmark's blue Q for the transparent favicon. Keep `public/favicon.svg` and the 16/32/48/256px images in `public/favicon.ico` consistent with the original vector path.

- Use a thin gold page scrollbar on the dark surface track, matching Selected work's mobile scrollbar.
- Use Inter for display, body, and interface text, with system sans-serif fallbacks. Use a system monospace stack sparingly for small labels.
- Use medium-weight display headings, tight tracking, and responsive sizing. Balance compact heading line height with readable wrapping; keep body text comfortably spaced.
- Keep the homepage hero title's compact 0.98 line height. Render “Put AI to work.” as a separate block with a 0.16em top margin so it clears the descender in “products.” without widening the gap between “Build better” and “products.”, including the animated text rendering.
- Align fluid text copies to the browser text baseline using measured font ascent/descent and DOM range bounds. Avoid estimated offsets that shift the heading when the reveal animation hands over to the canvas.
- Use a centered content width of approximately 80rem, 20px mobile gutters, and 32px gutters on wider screens. Give sections generous vertical spacing.
- Keep the header pinned to the top. Its navigation background is transparent at scroll zero and fades in on scrolling or pointer hover using Motion. At scroll zero with no header hover, the background fades out even if a link is focused. Use subtle borders, rounded cards, and restrained glow. Keep case-study content quieter than the hero.
- Stack the hero copy and visual on mobile; use two columns on wide screens. Below 851px, use a hamburger menu with a full-viewport backdrop and a top navigation panel that leaves an outside dismissal area. Animate with Motion, trap focus, lock background scrolling, and close on outside tap, Escape, navigation, or resizing to desktop. Keep a native disclosure fallback when JavaScript is disabled.
- Keep chat accessible through the pinned header and contextual CTAs. Links to `/chat` use a chat-bubble icon; do not add a floating chat launcher.
- Center the footer’s middle description on desktop and stack its content centrally on mobile. Omit a separate footer “Let’s talk” button.
- Keep the footer’s top border inside the standard width container, matching the hero’s inset bottom border. Keep the home page main container’s bottom padding at zero and place the 112px of space before the footer inside the final conversation section. This lets its canvas and cursor effects cover the space and fade directly into the footer.

## Hero treatment

- Start the hero layout at page top zero and span the full viewport width. Let its background and cursor effects cover the whole hero without clipping them to the copy or artwork columns; retain content gutters for readable text and actions.
- Preserve the particle shape cycle: Q symbol → robot → rocket → diamond → Q symbol. Use blue and ice lighting with sphere-shaded point sprites.
- Keep the fluid simulation shared between shape displacement, localized text distortion, and gold cursor sparks. It must not intercept CTA clicks or scrolling.
- Reveal the emphasized headline phrase once with a 0.05-second letter stagger. Recompute the phrase and layout alignment when website copy changes.
- Render the heading and description as semantic HTML before enhancement. Show the enhanced text only after it is aligned and ready; restore HTML on initialization failure or context loss.
- Use lazy loading, capability-based particle budgets, adaptive resolution, and off-screen/hidden-tab pause. On touch screens, keep crisp native DOM text visible after typing and at rest. Use its fluid copy only during touch interaction and restore native text as the effect settles; retain the lower mobile GPU budget. Restore visible DOM text on graphics failure.
- On mobile, respond to single-finger taps and swipes with softer gold dye/sparks and localized text distortion. Use passive touch listeners so effects continue during native scrolling, without pointer capture or preventing defaults. Ignore controls and multi-touch gestures; reset motion tracking on touch end/cancel. Recreate the canvas texture after text-layout or viewport changes so GPU storage matches the new dimensions. Keep reduced-motion and unsupported-device fallbacks static.
- Provide a static Q illustration when motion is reduced or graphics are unavailable. Essential copy and actions never depend on the effect.
- Keep hero tuning in code for the first version. A visual parameter editor is outside the initial admin scope.

## Components and content visuals

- Rich work pages use full-width selective patterns with inset editorial content, a large project-specific illustration, an always-readable workflow, annotated product evidence, engineering decisions, related published work, and a contextual chat action. Project context and delivery uses the homepage FAQ treatment under “Behind the product.”: five separate native disclosures, gold chevrons with a 20px text gap, and smooth Motion height/opacity animation. Reduced motion opens immediately, and answers remain usable without JavaScript. Each hero pairs its own immediate responsive WebP artwork with optional demand-rendered 3D and a Motion crossfade after the first rendered frame. Mobile stacks copy/art and uses the still. Evidence captions distinguish actual finance captures using synthetic documents/prepared answers from the reconstructed care/accounting walkthroughs. Care uses a phone, role cards, and voice waveform; accounting uses a phone, receipt, and expense tiles. Each viewer resets when navigating to a different project, keeping the correct still visible while its model loads.
- About carries the work-page typography and full-width patterns into a personal introduction, five-part editorial career journey, working-practice examples, and published-project explorations. Its conceptual Blender workbench connects a phone, interface, document, keyboard, and robot. Use clear contribution labels for independent work, team contributions, and team leadership. Keep profile/chat text buttons centered on mobile with trailing icons at the button edge.
- Research uses a workspace/source-card/pipeline scene and six steps in three desktop columns or two tablet/mobile columns. Service operations uses a dispatch board and phone. Robotics uses a conceptual warehouse diorama, a responsive four-application overview, and actual simulator captures. Captions distinguish reconstructed examples, conceptual artwork, and existing application captures; development boundaries remain visible beside each robotics application. All six heroes share desktop pointer tilt, a retained last-touch pose on mobile, and static fallbacks.

- Center text in full-width mobile CTAs and align the trailing icon at the button’s right edge. Reserve equal space on the left so the icon does not shift the centered text.
- Use shadcn/ui for familiar controls, with shared brand tokens and clear loading, empty, error, and focus states.
- Marketing CTAs use readable text with a gold trailing icon tile. Chat links use chat bubbles, and other links use directional arrows. Icon buttons keep their background unchanged on hover; Motion scales the gold icon tile instead. Use brand-blue filled buttons for submission controls and outlined buttons for secondary actions.
- Use 16px navigation, buttons, links, and supporting text; 14px metadata; and a 20px desktop hero description (18px on mobile). Keep mobile navigation readable at 14px. Motion animations respect reduced-motion preferences.
- Real work cards show verified project content. Conceptual service cards may use Blender renders but must be labeled as illustrations.
- Keep admin screens compact and task-oriented, with minimal decoration and no continuous animation.
- Keep common client questions in a plain section with native disclosure controls. Use gold chevrons with 20px of space before the question. Animate answer height, opacity, and position on opening and closing using Motion; skip that animation for reduced motion. Answers remain available without JavaScript.
- Present Selected work as a single horizontal row; keep Services in a normal responsive grid so consecutive sections do not both pin. Pin the full section content below the header when it fits the viewport, and move through the cards with vertical page scrolling before releasing the section. Fit three whole cards across wide screens, two on tablets, and one on mobile. Use native horizontal scrolling on short screens, with reduced motion, or without JavaScript. Keep every card accessible to the keyboard and retain page scrolling without intercepting wheel events.
- Keep work cards equal in height, reserve two lines for both category and title, align descriptions from the same position, and anchor “Read the case study” to the bottom. Allow full text to wrap rather than truncating it.
- Stack the Selected work category, heading, and introductory paragraph above the card row. Align them with the cards’ left edge and constrain the paragraph to 48rem so it stays connected to the section on every screen size.
- Blend the work row into the page background with subtle gradients at its left and right edges while more cards remain in that direction. Clear the left fade at the start and the right fade at the end so the outermost cards stay readable. Scale fade widths from 24px to 48px with the viewport.

## Section backgrounds

- Keep pointy-top hexagons in the hero and reuse them in the final conversation section. Use triangles in Services and 45° rotated squares (diamonds) in Working together. Keep Selected work and The approach plain to give the page quieter intervals.
- Show these patterns on desktop, tablet, and mobile. Patterned sections span the full viewport width, with an inner content container retaining the standard gutters and maximum width. Avoid viewport-width overflow tricks or clipping patterns to the content container.
- Use repeating SVG tiles with ice-colored strokes at roughly 2.5% opacity. Fade the top and bottom edges of section patterns, and keep them behind content without intercepting pointer events. Patterns remain static and visible when motion is reduced.
- Additional patterns should follow the same geometric line style, scale, and restrained contrast; add them selectively rather than decorating every section.
- Fade the conversation section’s graphics to transparent over the bottom 96px so cursor trails blend into the footer. Keep the top edge at full opacity.
- In the final conversation section, type “working towards?” once on its first appearance, reserving its full layout space throughout. Reuse the hero’s gold cursor sparks and localized fluid title distortion across the full section, without the particle shape cycle. Enable title distortion for mouse and touch input when graphics are supported; pause graphics offscreen or when the tab is hidden. Keep the full semantic heading readable without JavaScript, with reduced motion, and after graphics failure or context loss.

## Accessibility and acceptance

- Target WCAG AA contrast, visible keyboard focus, semantic headings, and labeled controls. Never communicate status through color alone.
- Respect reduced motion and retain one accessible heading when letters or shader overlays are used.
- Check narrow, medium, and wide layouts, font loading, slow assets, unavailable graphics, context loss, and reduced motion.
- Review screenshots for heading wrapping, overlay alignment, CTA visibility, and layout stability. Measure hero performance on desktop and a lower-capability/mobile device before launch.

## Chat workspace

- `/chat` omits the marketing header and footer. Position the home-linked Quantum Digital logo with the same shell/gutters as the website header.
- Style Restart chat like the header’s Let’s talk action: text followed by a gold Motion-scaled icon, without a hover background.
- Reuse the static full-width homepage hexagon pattern; keep it subtle behind readable messages on every screen.
- Let messages scroll within the viewport. Keep a compact, auto-growing textarea docked at the bottom, with accessible icon-only Send/Stop controls.
- Show one active conversation, with no recent-chats sidebar. A direct Contact Rudolfs header action and tool-rendered form provide an optional quick inquiry path inside chat.
- Keep Turnstile interaction close to the composer; verification must not obscure messages or the confirmation card.

- Keep chat top-bar and composer backgrounds transparent so the hexagon pattern remains visible. Put Contact Rudolfs beside Restart chat in the top bar; use accessible icon-only controls on narrow screens.

## Analytics consent

Use a compact, nonmodal analytics-cookie banner with equally visible accept/reject actions and a Privacy link. Match the dark surface, ice text, and existing button styles. On chat, position it below the header so it does not cover the bottom composer. Keep Cookie preferences available in the footer and Privacy page. Essential chat/admin cookies are independent of the analytics choice.

## Service page pilot

Service detail pages reuse the selected-work typography, full-width selective patterns, scoped deliverable/process sections, current published related work, and shared FAQ disclosures. Each of the four service pages uses a responsive Blender still labelled “Conceptual illustration,” enhanced by a subtle interactive model on desktop and mobile. Mouse hover tilts the model on desktop; passive page-wide touch input gently turns it toward the last touch position and retains that pose without blocking native scrolling. Without touch input, the default pose remains. Lighting is baked into an unlit texture on the actual geometry, preserving the reviewed studio appearance; highlights and shadow remain fixed during the bounded tilt. Each 2860 × 1560 master and editable scene stay in source assets; desktop/mobile WebPs are 1400 × 764 and 768 × 419. Static artwork is immediate and reserves its dimensions. Desktop scope columns stack at tablet/mobile widths, and chat actions use the existing trailing gold-icon treatment. Service-card detail links appear only for active, published page mappings.

Selected-work and service viewers start with the responsive image and enhance it to 3D on desktop and mobile. Reduced motion, explicit data-saving mode, unavailable graphics, load failure, and context loss retain or restore the image. Coarse pointers, reported network speed, and device memory alone do not disable the model. Rendering pauses offscreen and in hidden tabs, and rests once the last touch pose settles. Homepage service-card artwork stays as images.

Service section headings and explanatory copy are specific to product delivery, AI interpretation, process coordination, or system exchange. The contextual chat topic uses a short text line with links to the service and to clear the topic, without another card or automatic message. The existing composer, logo, privacy notice, and explicit inquiry review remain in place.

Homepage service cards share corresponding content-row heights within each desktop/tablet pair. Subgrid aligns the category, title, description start, detail divider, and action despite different copy lengths; it uses content-driven sizing instead of a fixed card height. Mobile retains a natural single-column flow. A flex layout keeps actions low in browsers without subgrid support.

Shared route-loading screens center their message and gold spinner within a roomy loading panel. Motion rotates the decorative spinner; reduced motion keeps it still, and a polite status announces the loading text.
