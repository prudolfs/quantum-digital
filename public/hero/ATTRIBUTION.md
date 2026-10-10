# Hero asset provenance

The Q artwork and particle buffers were reused from the owner’s neighboring `qd-ai-native-studio` project. Only the static SVG and precomputed model/fallback targets are shipped here; no source reference images or GLBs are required at runtime.

- **Q symbol:** Quantum Digital brand artwork supplied by the project owner. The canonical outline is the first blue SVG path in `quantum-digital/apps/quantum-digital/app/icons/QuantumDigital.tsx` in the sibling repository, copied to `q-symbol.svg`. The supplied `.temp/Q-SYMBOL.glb` was inspected as a 3D reference; the final lightweight mesh is rebuilt from the vector.
- **Robot, rocket, diamond:** Procedural meshes created for this project using the user supplied `.temp/robo.jpg`, `.temp/rocket.png`, and `.temp/diamond.jpg` as visual references. No stock meshes or image textures are embedded. The source images' external authorship and licenses were not supplied.
- **Targets and previews:** Generated from these meshes by the scripts in `scripts/hero`. Fallback target buffers are generated from Three.js geometric primitives.

Retain the project's existing rights and permissions for the supplied brand artwork and reference designs. This file documents provenance and does not grant a separate license.
