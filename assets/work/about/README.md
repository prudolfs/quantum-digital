# About workbench illustration

Original conceptual artwork connecting web interfaces, mobile products, documents, and robotics. It is not a portrait, client screenshot, or physical robot. The illustration supports the public career narrative and uses the same pointer-tilt viewer as the work pages.

Rebuild from the repository root:

```sh
blender --background --python scripts/work/build-about.py
node scripts/work/prepare-work-posters.mjs about
```

The builder creates a separate background scene, saves editable objects in `about-hero.blend`, renders a transparent source PNG, exports a self-contained public GLB, and records geometry/camera details in `manifest.json`. `view.json` records the poster crop and matching Three.js camera. It does not modify another project or an interactive Blender scene.

GLB: 289,764 bytes / 4,704 triangles, with no textures or external buffers. Desktop/mobile WebP: 54,608 / 26,378 bytes. Budgets are 320,000 / 80,000 / 35,000 bytes respectively, and 225,000 gzip bytes for shared optional viewer JavaScript. Keyboard keys use simple geometry to meet the budget while preserving the composition.

Still-first loading, desktop mouse tilt, demand rendering, reduced-motion/mobile/data-saving fallbacks, and loading/graphics error handling share the existing work viewer. Physical-device and deployed-domain performance remain release checks.
