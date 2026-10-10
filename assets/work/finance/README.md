# Finance illustration assets

Original conceptual artwork for the Finance Document Assistant page. The receipt, review fields, amounts, and chart are synthetic illustration elements, not a shipped interface or a calculated financial dataset.

## Source and export

Run from the repository root:

```sh
blender --background --python scripts/work/build-finance.py
```

The script creates an isolated background scene, saves editable objects and text in `finance-hero.blend`, exports a self-contained `public/work/finance/finance-hero.glb`, renders transparent `finance-hero.png`, and writes geometry/camera details to `manifest.json`. It does not open or modify another project or an existing interactive Blender scene. The PNG is the high-resolution source; the public WebP images are resized, cropped derivatives. `poster.json` records the desktop poster's dimensions and crop bounds for matching a future live viewer to the still.

Geometry uses rounded panels, low-resolution flat text, seven materials, and no textures, external buffers, cameras, or lights in the GLB. Lighting and the initial orthographic camera remain in the editable Blender source. This asset uses the site's navy, blue, ice, and gold palette.

## Application captures

`public/work/finance/document-preview.webp` and `chart-chat.webp` are resized derivatives of the supplied finance project's synthetic-demo screenshots. They show the actual application interface; the chart conversation contains prepared demo answers. Captions must retain that distinction. Neither image establishes a live-model benchmark or a financial result for a real customer.

The Finance Document Assistant route loads these assets through the work-story layout. The optional viewer uses a matching camera/crop configuration, demand rendering, and poster fallbacks. Asset budgets are 320,000 bytes for the GLB, 80,000 for the desktop poster, 35,000 for mobile, and 50,000 for each evidence image. Optional viewer JavaScript, including shared Three.js, has a 225,000-byte gzip budget. Real-device GPU performance and deployed-domain verification remain release checks.
