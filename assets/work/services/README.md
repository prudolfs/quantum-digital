# Services illustration assets

Dispatch board and phone linking client, worker, manager, and editable conversation assistance. Evidence diagrams are reconstructions, not captures from the source presentation GIF.

This is original conceptual Blender artwork. Diagram records and interface layouts are synthetic, labelled reconstructions.

Rebuild from the repository root:

```sh
blender --background --python scripts/work/build-explorations.py -- services
node scripts/work/prepare-work-posters.mjs services
node scripts/work/build-walkthroughs.mjs
```

Editable text and objects are in `services-hero.blend`. The source PNG is transparent; `manifest.json` records geometry/camera details. `view.json` records crop and camera matching for the live Three.js viewer. The GLB has 3,698 triangles and no textures, external buffers, cameras, or lights. Source generation uses a separate background scene.

GLB: 205,096 bytes. Desktop WebP: 62,316. Mobile WebP: 29,662. Budgets are 320,000/80,000/35,000 bytes respectively and 50,000 per evidence image. Shared optional viewer JavaScript has a 225,000-byte gzip budget. Still-first loading and mouse tilt match the other work pages; mobile/reduced-motion/data-saving modes retain the still.
