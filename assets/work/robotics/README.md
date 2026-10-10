# Robotics illustration and evidence

Original conceptual warehouse diorama: a forklift, storage racks, route, and illustrative sensor rays. This is hero artwork, not the simulator asset or a physically accurate robot. Its caption remains distinct from the actual application captures below.

Rebuild from the repository root:

```sh
blender --background --python scripts/work/build-explorations.py -- robotics
node scripts/work/prepare-work-posters.mjs robotics
node scripts/work/prepare-robotics-evidence.mjs
```

The last command reads the existing public warehouse/SLAM screenshots from the adjacent `robotics-lab` checkout. It does not start simulations or change that checkout. `evidence.json` records source paths, dimensions, quality, and qualification. The WebP captures show simulated environments; they do not establish physical deployment or a fresh benchmark.

The editable Blender source, transparent PNG, and geometry/camera manifest are retained here. `view.json` matches the poster crop to the live Three.js camera. GLB: 211,056 bytes / 4,128 triangles, self-contained with no textures or external buffers. Desktop/mobile posters: 64,154 / 28,554 bytes. Warehouse/SLAM evidence: 46,540 / 47,160 bytes, both 1080×1080. Budgets are 320,000 for a model, 80,000/35,000 for posters, 50,000 per evidence image, and 225,000 gzip bytes for optional viewer JavaScript.

The hero uses the same still-first viewer, pointer tilt, and fallback behavior as the other work pages. A WebGL2-capable desktop can view this illustration; that does not remove the WebGPU requirement for the actual warehouse/drone applications. Full Laya needs a decision service, warehouse recordings remain tab-local, and SLAM relocalization remains planned.
