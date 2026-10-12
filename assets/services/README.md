# Service illustration source workflow

These four conceptual illustrations support the published service pages. They depict capabilities, not completed client products. Keep the editable Blender scenes and high-resolution lossless masters here; serve only derived assets under `public/services/<theme>/`.

| Theme         | Page                | Composition                                    |
| ------------- | ------------------- | ---------------------------------------------- |
| `product`     | Product development | Stacked product layers and an interface        |
| `ai`          | AI integrations     | A central node and connected information nodes |
| `workflow`    | Workflow automation | Connected stages with visible progress         |
| `integration` | System integrations | Separate systems exchanging information        |

## Rebuild a theme

From the repository root, substituting `ai` with the desired theme:

```sh
blender --background --python scripts/render-services.py -- --theme ai --master
node scripts/prepare-service-images.mjs ai
node scripts/prepare-service-images.mjs ai --lighting
blender --background --python scripts/export-service-model.py -- --theme ai --render-background
node scripts/prepare-service-images.mjs ai --background
```

The first command preserves the original composition, camera, navy studio, and blue accents. It writes an editable `<theme>-hero.blend` and lossless 2860 × 1560 PNG. It leaves existing homepage JPEGs and other themes untouched. The original command without arguments still rebuilds all four homepage JPEGs.

The image script derives 1400 × 764 desktop and 768 × 419 mobile WebPs without cropping the composition. Declared dimensions reserve layout space. `images.json` records sizes; limits are 80 KB desktop and 35 KB mobile. The separate 1400 × 764 JPEG appearance texture stays in source assets and is embedded in the model. Its preparation budget is 160 KB.

The exporter operates on actual illustration meshes. It reduces bevel segments and simplifies sphere geometry, preserving more detail for the large AI core. Camera-projected UVs carry the studio beauty texture with `KHR_materials_unlit`; the self-contained GLB must stay below 320 KB. The studio floor, camera, and lights are excluded. The editable scene and original hero PNG are not overwritten during export. `model.json` records geometry, bounds, size, and exclusions; `view.json` is the matching browser framing.

The background render hides the illustration from camera rays while retaining its studio shadow. Its lossless 1430 × 780 PNG stays here; the optimized WebP has a 35 KB budget and is fetched only for the optional desktop viewer. `lighting.json` and `background.json` record their sizes.

## Web behavior and review

The responsive still appears immediately. Suitable desktop devices may load the shared renderer, background, and model after page load/idle. The still remains visible until the background is decoded and the model renders its first frame. Mobile, coarse pointer, reduced motion, data saving, slow connections, and low memory retain the still. Failed assets or unavailable/lost graphics also restore it.

The model has a bounded pointer tilt. Baked highlights and studio shadows stay fixed; this is view-dependent artwork rather than an orbit viewer. Compare still, live, and pointer states independently for each theme. The renderer rests when idle, pauses offscreen/hidden, and disposes owned GPU resources on route changes. Existing selected-work models retain their live-lighting setup.

Only optimized WebPs and GLBs belong in `public/`. High-resolution masters, Blender scenes, and standalone appearance textures must be absent from the public build. Detailed captures and phase measurements belong in ignored `docs/local/`.

## Reviewed asset sizes

Sizes are bytes, as recorded in the per-theme manifests. The Product development plate is the previously retained 2860 × 1560 source; new plates are 1430 × 780. All hero masters are 2860 × 1560.

| Theme         | Desktop still | Mobile still |     GLB | Triangles | Background |
| ------------- | ------------: | -----------: | ------: | --------: | ---------: |
| `product`     |        37,326 |       17,576 | 169,904 |     1,188 |      7,604 |
| `ai`          |        24,862 |       11,386 | 191,268 |     3,212 |      7,454 |
| `workflow`    |        22,834 |       10,912 | 143,864 |     1,500 |      7,422 |
| `integration` |        17,924 |        9,020 | 113,600 |       932 |      8,672 |
