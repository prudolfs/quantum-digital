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

Reserve gold for hero cursor effects. Keep highlighted heading text solid brand blue. Check contrast in the actual compositions, especially small text, borders, and focus states.

## Typography and layout

- Use Inter for display, body, and interface text, with system sans-serif fallbacks. Use a system monospace stack sparingly for small labels.
- Use medium-weight display headings, tight tracking, and responsive sizing. Balance compact heading line height with readable wrapping; keep body text comfortably spaced.
- Use a centered content width of approximately 80rem, 20px mobile gutters, and 32px gutters on wider screens. Give sections generous vertical spacing.
- Use a contained translucent navigation surface, subtle borders, rounded cards, and restrained glow. Keep case-study content quieter than the hero.
- Stack the hero copy and visual on mobile; use two columns on wide screens. Keep navigation, reading, and booking usable at every width.
- Keep a persistent chat icon in the bottom-right corner with an accessible “Open chat” label. It links to the dedicated `/chat` page. Respect mobile safe areas and keep it clear of content and other controls; provide visible keyboard focus.

## Hero treatment

- Use a subtle pointy-top hexagon background with ice-colored strokes at roughly 2.5% opacity, fading toward the bottom.
- Preserve the particle shape cycle: Q symbol → robot → rocket → diamond → Q symbol. Use blue and ice lighting with sphere-shaded point sprites.
- Keep the fluid simulation shared between shape displacement, localized text distortion, and gold cursor sparks. It must not intercept CTA clicks or scrolling.
- Reveal the emphasized headline phrase once with a 0.05-second letter stagger. Recompute the phrase and layout alignment when website copy changes.
- Render the heading and description as semantic HTML before enhancement. Show the enhanced text only after it is aligned and ready; restore HTML on initialization failure or context loss.
- Use lazy loading, capability-based particle budgets, adaptive resolution, and off-screen/hidden-tab pause. Keep readable DOM copy on narrow or coarse-pointer layouts.
- Provide a static Q illustration when motion is reduced or graphics are unavailable. Essential copy and actions never depend on the effect.
- Keep hero tuning in code for the first version. A visual parameter editor is outside the initial admin scope.

## Components and content visuals

- Use shadcn/ui for familiar controls, with shared brand tokens and clear loading, empty, error, and focus states.
- Primary buttons use brand blue with dark text; secondary buttons use dark surfaces, light text, and a subtle border.
- Real work cards show verified project content. Conceptual service cards may use Blender renders but must be labeled as illustrations.
- Keep admin screens compact and task-oriented, with minimal decoration and no continuous animation.

## Accessibility and acceptance

- Target WCAG AA contrast, visible keyboard focus, semantic headings, and labeled controls. Never communicate status through color alone.
- Respect reduced motion and retain one accessible heading when letters or shader overlays are used.
- Check narrow, medium, and wide layouts, font loading, slow assets, unavailable graphics, context loss, and reduced motion.
- Review screenshots for heading wrapping, overlay alignment, CTA visibility, and layout stability. Measure hero performance on desktop and a lower-capability/mobile device before launch.
