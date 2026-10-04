# Fixed-camera 2.5D prototype

The prototype replaces only board presentation. The existing game data, reducer, economy, RNG, store and turn timing are unchanged. The original DOM board remains as loading/WebGL fallback.

## Delivered

- PixiJS 8.22.0 WebGL renderer, asynchronously loaded when a board is opened.
- All 36 original cells in the original clockwise order: 23 properties and 13 specials.
- Shallow oblique projection with an extruded plinth, grass courtyard, soft drawn shadows, trees and small model houses.
- Four procedural pawn designs: conical hat, baseball cap, bun and yellow hat. Pawns interpolate between the engine's existing movement steps.
- Ownership stripes and level 1–3 house models linked to real property state.
- CSS cube dice with pip faces; gameplay results come from the existing engine. The dedicated art preview uses a separate deterministic demonstration sequence.
- Upright full-name DOM labels and accessible property buttons share coordinates with the canvas. Prices are omitted on the shortest layouts, with the complete property detail still available on tap.
- An isolated `?graphics=1` preview available from setup, showing four pawn designs and three sample house levels immediately.
- No large title or bottom navigation added to the gameplay screen.

## Performance choices

No textures, model downloads, postprocessing filters, live shadows or camera controls are required for this prototype. Scenery is built on resize; house geometry changes only when ownership or levels change. Pawn movement runs through requestAnimationFrame without per-frame React updates. The render loop stops after settling, pauses when the document is hidden, and honors reduced motion. Render resolution is capped at 1.5×. Async initialization is cleaned up across StrictMode mounts and unmounts.

These choices are a performance budget, not a claim of measured mobile FPS. The geometry is deliberately shallow to preserve readable names and a board that fits short landscape viewports. Production illustration/3D-rendered sprites can replace these procedural assets once the direction is approved.

## Validation

Strict TypeScript passed under Node.js 24.19.0; 56 tests passed (existing gameplay tests plus five geometry viewport tests); production build passed. `scripts/graphics-check.mjs` passed against the production preview at port 4173. The browser check validates seven landscape sizes from 568×320 to 1440×900, 36/23 cell counts, full-name bounds, no page scroll, 48px primary controls, one canvas after StrictMode initialization, property taps, animated dice and movement, portrait/landscape recovery, reduced motion, four-player gameplay, buying/upgrading through level 3 and DOM fallback after a simulated WebGL context loss. Playable controls and names were additionally checked at 568×320 and 844×390. The stationary scene made zero WebGL draw calls over a 700ms window. No browser errors/warnings were reported.

See `graphics-viewport-checks.json` for the actual results and environment. Screenshots: `graphics-prototype-mobile.png`, `graphics-prototype-small-mobile.png`, and `graphics-gameplay-mobile.png` (a fresh four-player setup).

## Remaining device review

- Physical Android midrange and iPhone/Safari: sustained movement FPS, frame timing, memory and context recovery.
- Loading over mobile data, battery/temperature during a normal-length game.
- Safe-area/notch layout, real touch accuracy and readability.
- Human approval of the art direction before producing custom Vietnamese scenery and animated character sprites.

Desktop headless Chrome emulation cannot certify those physical-device outcomes. Final production art, camera rotation, 3D physics and other game features are outside this prototype.
