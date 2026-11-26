# Matching Bloxx pixel art

`town.png` is the native 288 × 370 sprite sheet. The first row holds the four floor colors, entry and roof. The second row holds the foundation, crane, tree and roadside props. The lower rows hold the four building silhouettes for day, sunset and their distant layers.

`compact.png` holds the 36 px floor cells and matching foundation for narrow lanes. The option buttons use the same floor artwork. The WebGL scene uses solid-color meshes from `models.js` with the same palette. The Canvas scene uses the sprite sheets.

The sheets use hard alpha edges. The game draws the scene on a native pixel grid and scales the artwork in whole steps with smoothing off. Labels are drawn separately for legibility.
