# Guided Business Builder illustration

Original conceptual Blender artwork: an assembled storefront inside a browser, approved business-fact cards, a customer conversation, and a reviewed enquiry. Rounded navy, blue, gold, ice, and paper forms use the same orthographic camera and studio-lighting approach as the other selected-work illustrations. This is an abstract workflow illustration, not a product screenshot.

Created in the open Blender 5.2.3 LTS session through Blender MCP on localhost port 9876. The build creates a dedicated scene and preserves unrelated scenes. The editable source retains individual objects, materials, curves, bevels, camera, and lights.

Rebuild from the repository root with Blender MCP running:

```sh
python3 scripts/work/blender-mcp.py
node scripts/work/prepare-work-posters.mjs builder
```

Alternatively, run `blender --background --python scripts/work/build-builder.py` for the source/export step. The poster tool records the transparent crop and matching viewer geometry in `view.json`.

`builder-hero.blend`, the original transparent PNG, and `manifest.json` are source artifacts. Only the self-contained GLB and desktop/mobile WebP stills ship in `public/work/builder/`. The GLB has 4,788 triangles and is 208,372 bytes, below the 320,000-byte budget. It has no texture, external buffer, camera, or light dependencies. The poster tool enforces the existing desktop/mobile budgets of 80,000/35,000 bytes.

The shared viewer supplies lighting and pointer/touch response, preserves the still on loading or graphics failure, and respects reduced motion and data saving. Actual development screenshots remain separately labeled in the evidence section.
