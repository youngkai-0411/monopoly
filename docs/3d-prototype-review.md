# Square board and following-camera study

The previous rectangular prototype did not match the desired miniature-board reference. This isolated study changes `?graphics=1` to an actual Three.js scene with a square perimeter and a cinematic camera. The previous PixiJS preview is retained at `?graphics=2`; normal local gameplay still uses its existing renderer/engine.

## Scope delivered

- 36 equal 1×1 world-space cells on a 10×10 perimeter; all original indices, 23 property definitions, 13 special cells and clockwise ordering preserved. Source corner indices are 0, 9, 18, 27; tile 27 remains its original Thanh Hóa property rather than changing game rules to invent another corner special.
- Isometric-style orthographic view of a raised board/island, stepped approaches, four pavilions, low-poly trees, courtyard/fountain and miniature pawn/house models. No large central title or control panel.
- Automatic sequence: overview → 1100ms character focus → 850ms dice roll → five 480ms movement steps → 1500ms destination hold → 1100ms return to overview → next character.
- Camera target follows the interpolated character position while keeping its viewing angle. Overview zoom is 1×, character zoom 3.2×. Manual overview/follow controls are available when the demonstration is idle.
- Four model variants, sample houses at levels 1–3 and physically rendered dice; fixture values are 3+2. The scene is a camera demonstration, not a production dice-physics implementation or a playable mode.
- Names/prices printed on one texture atlas and a single board-print mesh. Full selected/current tile name and landmark are also shown in the readable HUD. Overview lettering is naturally small; focus zoom and HUD provide detail.
- Raycast selection of physical tiles and a native keyboard/screen-reader tile list.

## Mobile budget

Static repeated geometry is batched into instanced meshes. The prototype initially needed 232 draw calls; batching reduced the overview to 111 draw calls and approximately 6574 triangles in the measured scene. No live shadow maps, postprocessing or model/texture downloads. Shadows use a shared tiny radial texture; printed tiles use a 768×768 canvas atlas. Pixel ratio is capped at 1.5×. Rendering stops when settled and pauses on visibility changes; reduced motion snaps camera/character transforms. Geometry, materials, textures, instances and the WebGL context are released on teardown.

These are measured scene/resource counts on desktop Chrome, not measured phone FPS. Camera motion and rendering run outside React; React only advances the demonstration stages/steps and HUD. Presentation fixtures never enter the game store, and no source under `src/game` or `src/store` changes.

## Validation

Strict TypeScript passed, all 59 tests passed, and production build passed under Node.js 24.19.0. `scripts/graphics-check.mjs` passed against production at port 4173. Geometry tests verify the 36 distinct/equal cells, continuous corner/wraparound movement, and invalid-index rejection. Browser checks cover 568×320, 667×375, 740×360, 844×390, 932×430, 1024×768 and 1440×900, full-board camera bounds, overlay bounds/no scroll, one canvas, raycast/keyboard selection, manual zoom, all six camera stages, camera following the moving pawn, returning to overview, next character, portrait recovery and reduced motion. A separating-axis polygon test verifies that HUD rectangles do not overlap the board surface in any overview viewport. The small-phone toolbar is reduced to the 48px action button to keep the full board visible. Zero idle frames were rendered during the sampled 600ms; no browser errors/warnings were reported.

Actual results/environment are in `3d-viewport-checks.json`. Images: `3d-overview-mobile.png`, `3d-overview-small-mobile.png`, `3d-follow-mobile.png`, `3d-landing-mobile.png`.

## Next review

Review the full-board angle, zoom distance, following speed and destination hold with the user before expanding production artwork or migrating normal gameplay to this renderer. Physical midrange Android and iPhone/Safari must still verify frame timing, memory, touch readability, loading and battery/heat. Desktop viewport/touch emulation cannot certify those outcomes.
