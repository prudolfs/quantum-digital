# Research illustration assets

Research workspace connecting synthetic source cards to review, verification, and an editable draft. Public project remains abstract and unlinked.

This is original conceptual Blender artwork. Diagram records and interface layouts are synthetic, labelled reconstructions.

Rebuild from the repository root:

```sh
blender --background --python scripts/work/build-explorations.py -- research
node scripts/work/prepare-work-posters.mjs research
node scripts/work/build-walkthroughs.mjs
```

Editable text and objects are in `research-hero.blend`. The source PNG is transparent; `manifest.json` records geometry/camera details. `view.json` records crop and camera matching for the live Three.js viewer. The GLB has 3,683 triangles and no textures, external buffers, cameras, or lights. Source generation uses a separate background scene.

GLB: 201,656 bytes. Desktop WebP: 68,586. Mobile WebP: 31,494. Budgets are 320,000/80,000/35,000 bytes respectively and 50,000 per evidence image. Shared optional viewer JavaScript has a 225,000-byte gzip budget. Still-first loading and mouse tilt match the other work pages; mobile/reduced-motion/data-saving modes retain the still.
