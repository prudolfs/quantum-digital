# Care illustration assets

Original conceptual Blender artwork and reconstructed walkthroughs. All amounts, request details, and interface layouts are synthetic illustrations, not client screenshots. The story remains abstract without external project links.

Rebuild from the repository root:

```sh
blender --background --python scripts/work/build-client.py -- care
node scripts/work/prepare-work-posters.mjs care
node scripts/work/build-walkthroughs.mjs
```

The builder saves editable objects/text in `care-hero.blend`, a transparent source PNG, geometry/camera metadata, and a self-contained public GLB. It does not modify another project or an interactive scene. The poster script crops/resizes the transparent render and records the viewer camera/crop in `view.json`. Walkthroughs are original SVG diagrams labelled as reconstructed with synthetic details.

Geometry: 5,448 triangles, no textures or external buffers. GLB: 311,676 bytes; desktop WebP: 65,688; mobile WebP: 32,964. Budgets are 320,000/80,000/35,000 bytes respectively, and 50,000 bytes per evidence image. The shared optional viewer has a 225,000-byte gzip budget. Mobile/reduced-motion/data-saving modes use the still. Physical-device and deployed-domain checks remain release work.
