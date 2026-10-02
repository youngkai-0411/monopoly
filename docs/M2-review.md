# M2 audit and validation

Reviewed on 2026-10-03. Scope: finish M2, then stop for confirmation before M3.

This is the historical M2 checkpoint. The user subsequently authorized all remaining milestones; see [the playable MVP report](implementation-review.md) for the current state.

## Mobile layout follow-up

At the user's request, removed the entire bottom navigation (assets, cards, prototype label, history and more). Removed its unused CSS and third grid row at both regular and compact landscape sizes. The board gains 52px in regular landscape and 51px in compact landscape; the player HUD and center roll button remain.

Typecheck and production build passed. Rechecked 568×320, 667×375 and 844×390: 36 tiles, no tile/center clipping or page overflow. Portrait fallback passed at 390×844. The updated screenshot is [M2 mobile without bottom navigation](M2-mobile-no-bottom-nav.png). References to bottom actions in the original audit below describe the earlier version.

The user subsequently requested removing the large center title. Removed its JSX and unused heading CSS, including responsive overrides. The current mobile center contains the current-player indicator, dice, total and roll button. Typecheck/build passed; verified at 844×390 with 36 tiles and no page overflow. Latest screenshot: [M2 mobile without large title](M2-mobile-no-title.png).

## Current state and architecture

- React/TypeScript/Vite app with Zustand and installed Framer Motion dependency.
- Static board, properties, groups and card definitions live under `src/game/data`.
- Runtime ownership/levels live in `PropertyState`, separate from property definitions.
- Pure initial-game setup and rent calculation live under `src/game/engine`; neither imports React.
- Store invokes setup and exposes start/reset. M2 UI reads board/property data but uses sample HUD/dice values. The complete UI/action/engine/state loop is future gameplay work, not complete today.
- TypeScript strict mode is enabled. Foundation data and rent tests exist.
- Card decks are empty at setup and card definitions are placeholders. Shuffling, effects, insurance, movement, phase enforcement and bankruptcy are not implemented; these belong to later milestones.
- No lint configuration or script is present. The directory is not a Git checkout.

## M1 status

Foundation is in place: 36 board entries, 23 properties, eight groups, configurable baseline economy, 2–4 player setup, separated static/runtime data and rent multipliers. Added Vite client declarations to repair the CSS import typecheck error found during validation. No game rules or economic values changed.

## M2 findings and changes

The original 9×9 grid has only 32 perimeter cells. Its index-to-cell mapping placed multiple tiles in the same cell and generated a tenth row. It also ran counterclockwise. Replaced only the visual mapping with a continuous clockwise 12×8 perimeter; original board indices and tile sequence are preserved. Start is bottom-right, then movement follows bottom, left, top and right edges.

Original property fonts were 6.5–9px. Board now uses the available viewport width, wider side columns and taller top/bottom rows. HUD space is reduced; property names use at least 10px, wrap naturally, and show their full place names. `TP.HCM` displays as `Hồ Chí Minh`; property ID, group, price, rent and upgrade cost are unchanged. Short-name fields remain in static data for compatibility but are not used on tiles.

Group colors, special-tile colors/icons and the original center-board visual direction are retained. On the shortest tested viewport, decorative special icons are hidden first to keep labels readable. Bottom actions and roll button are 48px high. Tiles remain small visual prototype elements; property sheets and gameplay action handling are future milestones.

Responsive checks caught center content clipping at 667×375 and 740×360; a compact single-line title and spacing adjustments fixed it. Portrait renders the rotate-device fallback.

## Validation

- Typecheck: passed using the local TypeScript binary.
- Tests: eight tests passed in two files, covering foundation, exact special-tile composition, board indices, unique perimeter positions, continuous adjacency including wraparound, clockwise direction and rent calculation.
- Production build: passed using local Vite.
- Lint: unavailable because the project has no lint setup.
- Browser console: no captured errors or warnings during verification.
- Verified landscape viewports: 568×320, 667×375, 740×360, 844×390, 932×430, 1024×768 and 1440×900.
- Verified portrait fallback: 390×844.
- Browser DOM checks found 36 tiles, 23 properties, 13 specials, no tile text/price clipping and no page overflow. The center-board children fit after fixes. Primary action heights were 48px. Screenshots were inspected for visual readability.
- Checks use browser viewport overrides, not physical-device testing; safe-area CSS remains in place, but actual device notches and browser chrome have not been tested.

## Remaining milestone boundaries

M2 remains a visual prototype: HUD and dice are sample values, and buttons do not implement gameplay. The handoff mentioned a standalone HTML preview, but none exists in this repository; the running Vite app is the verified preview. No standalone preview was required to meet M2's definition of done.

No M3–M13 gameplay work was added. Continue only after the user confirms M3 — Players & Turn. Keep engine-level action validation and all previously agreed game rules when implementing later milestones.
