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

- Use Inter for display, body, and interface text, with system sans-serif fallbacks. Use a system monospace stack sparingly for small labels.
- Use medium-weight display headings, tight tracking, and responsive sizing. Balance compact heading line height with readable wrapping; keep body text comfortably spaced.
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
- Use lazy loading, capability-based particle budgets, adaptive resolution, and off-screen/hidden-tab pause. Keep readable DOM copy on narrow or coarse-pointer layouts.
- Provide a static Q illustration when motion is reduced or graphics are unavailable. Essential copy and actions never depend on the effect.
- Keep hero tuning in code for the first version. A visual parameter editor is outside the initial admin scope.

## Components and content visuals

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
- In the final conversation section, type “working towards?” once on its first appearance, reserving its full layout space throughout. Reuse the hero’s gold cursor sparks and localized fluid title distortion across the full section, without the particle shape cycle. Enable title distortion on wide layouts with a fine pointer; pause graphics offscreen or when the tab is hidden. Keep the full semantic heading readable without JavaScript, with reduced motion, and after graphics failure or context loss.

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
