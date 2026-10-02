# Tỷ Phú Việt Nam

Playable mobile-first local board game for 2–4 players, using React, TypeScript, Zustand, Framer Motion and Vite.

## Run

```powershell
cd E:\Projects\Monopoly
npm ci
npm run dev
```

Open the URL printed by Vite and use landscape orientation. Dependencies are pinned and a lockfile is included.

If dependencies are already installed and this terminal has Node.js but cannot find npm:

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1
```

## Play

Choose 2–4 names and start. Roll, move, buy or skip, resolve events/rent, manage and upgrade your assets, then end your turn. Tap a property for its full name, landmark, ownership and rent table. Assets and game history are available inside the center board. Insufficient cash opens liquidation before bankruptcy. The last remaining player wins.

The game runs on one device, in memory. Reloading the page starts over. Portrait shows a rotate-device fallback. The page does not scroll; longer property lists and history scroll inside their sheets.

## Validation

```powershell
npm run check
npm run playtest
```

`check` runs strict typecheck, tests and the production build. `playtest` runs 30 seeded full-game simulations and writes `docs/playtest-results.json`. There is no in-game bot and no lint configuration.

Equivalent commands without npm:

```powershell
node node_modules/typescript/bin/tsc -b --pretty false
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
node scripts/playtest.mjs
```

## Architecture

UI → store action → immutable engine reducer → game state → UI. Business rules, effects, randomness and financial transactions live under `src/game`, independent of React. Static property definitions remain separate from runtime owners/levels. Automatic callbacks drive rolling/movement phases; all actions are validated by the engine. The UI also locks rapid repeated input.

M3–M12 gameplay and mobile UI are implemented. M13 has automated playtesting and a balance review; human game timing and physical-device testing remain to be verified. See [implementation and validation report](docs/implementation-review.md) for assumptions, limitations and results. The earlier [M2 audit](docs/M2-review.md) is retained as history.
