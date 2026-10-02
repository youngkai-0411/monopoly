# Playable MVP — implementation and validation

2026-10-03. The user authorized completing all remaining milestones in one development run, superseding the earlier instruction to stop before M3. The existing board and visual direction were extended rather than rebuilt. No bottom navigation or large center title was restored.

## Implemented milestones

| Milestone | Implementation |
| --- | --- |
| M3 | 2–4 player setup, trimmed/validated names, live HUD, turn order, round counting, bankrupt-player exclusion, phase/actor validation |
| M4 | Injected random source, dice animation, stepwise clockwise movement, forward-only Start reward, reduced-motion support |
| M5 | Property sheets with full names, landmarks, prices and rent tables; buy/skip; visible owners |
| M6 | Existing rent calculation integrated with transfers, self-rent exemption and debt handling |
| M7 | Paid upgrades Lv.0–3 without group requirement, visible levels, full-group rent bonuses |
| M8 | All 16 Chance and 16 Life cards, shuffled draw/discard decks, reshuffle, destination resolution, statuses and explicitly chosen rent insurance |
| M9 | Tax, detention fee, free rest, property destination travel, travel-fund reward |
| M10 | Blocking liquidation sheet, investment-based liquidation, partial creditor settlement, bankruptcy notice and turn removal |
| M11 | Last-player-standing detection, full-screen winner presentation and new-game action |
| M12 | Native modal focus/keyboard handling, mobile sheets, animated events/tokens, double-input lock, in-board controls, 200-entry game log, portrait fallback |
| M13 | 30 seeded full-game simulations, invariant checks, browser playtest and balance review |

No multiplayer network, accounts, in-game bots, trading, auctions, mortgages, quick mode or other excluded features were added. The simulated decision policy exists only in test/validation tooling.

## Architecture

`reduceGame` checks actor and phase before cloning state. All successful transitions return new state; invalid actions throw without altering the input. Helpers mutate only that private clone. UI components dispatch actions and query engine selectors rather than applying rules. Zustand catches invalid actions and handles a short 220ms input cooldown; phase guards remain authoritative in the engine.

Randomness is injected into setup, shuffle and dice; tests use seeded or fixed sources. Static definitions remain independent of runtime ownership, levels, positions, decks, payments and logs. Payments queue supports both the current player's obligations and obligations from other players during collection events. After bankruptcy acknowledgment, remaining payments resume before the original turn continues or advances.

Existing starting money, property prices, upgrade costs, rent multipliers, group bonuses and Start reward are preserved. Dependencies were pinned to the installed versions and lockfile metadata synchronized. React's Vite plugin is enabled. Only the irrelevant Framer Motion `use client` annotation warning is filtered in this client-only build; other warnings remain visible.

## Choices for underspecified rules

These were not fully defined in the handoff and are implemented as simple defaults:

- Tạm Giữ charges the configured 100 Tr fine, without skipping a turn or adding jail mechanics.
- Du Lịch lets the player select any property, move clockwise, collect Start if crossed and resolve the destination.
- Quỹ Du Lịch grants a configurable 100 Tr; it is not a pooled tax fund.
- Dice doubles grant no additional turn because no doubles rule was specified.
- Liquidation returns floor(50% × (purchase price + paid level upgrades)), returns the property unowned at Lv.0, and resumes the pending payment.
- If all assets are exhausted, remaining cash goes to the current creditor, unpaid debt is written off, held insurance is returned to discard, and the player is eliminated. Later payments from that bankrupt player are skipped.
- Equal status effects do not stack; opposite traffic/coffee effects cancel. The next roll consumes any remaining status.
- An insurance card stays out of both draw/discard piles while held. It is discarded when used or its holder goes bankrupt. The specified duplicate-insurance fallback of 100 Tr is also implemented; a single-card physical deck normally cannot redraw a held card.

## Validation results

- Strict TypeScript check: passed.
- Automated tests: 51 passed across five files, including complete games for all supported player counts.
- Production build: passed. Production preview was opened and tested through setup → roll → movement → Tax payment → optional actions, with no captured console errors/warnings.
- Direct browser playtest covered two/four-player setup, rolling, movement, Chance card application, buying, HUD updates, upgrades through Lv.3, max-level locking, property sheets, history and orientation changes. A batch of 24 real UI actions crossed multiple turns. Complex insurance/liquidation/bankruptcy/winner combinations were verified by engine tests and simulations, rather than claimed as manually played to completion in the browser.
- Viewports: 568×320, 667×375, 740×360, 844×390, 932×430, 1024×768, 1440×900 and portrait 390×844. Board had 36 tiles, 23 properties and 13 specials, with no page overflow or tile/center clipping. Four-player setup and a property sheet were inspected at 568×320.
- Portrait fallback was also checked while a modal was open; it returned to the sheet when rotated back.
- No lint tool/configuration was present; no claim of a lint pass is made.

Evidence: [mobile screenshot](gameplay-mobile.png), [viewport results](gameplay-viewport-checks.json), [simulation results](playtest-results.json).

## M13 balance review

The reproducible test policy buys whenever affordable, upgrades while keeping a 200 Tr reserve, uses insurance, travels to unowned/own property and liquidates the first available asset. This policy is a test fixture, not a prediction of human decisions.

| Players | Completed | Minimum turns | Median turns | Maximum turns |
| --- | --- | --- | --- | --- |
| 2 | 10/10 | 52 | 152.5 | 302 |
| 3 | 10/10 | 140 | 207.5 | 447 |
| 4 | 10/10 | 168 | 215.5 | 333 |

Every simulated game reached one surviving winner without negative cash, out-of-range positions/levels, invalid owners or lost/duplicate physical cards. The spread in game length is substantial. The 20–35-minute target is not yet proven: time depends on human decisions, upgrading and interaction speed. No timer or quick-mode rule was introduced to force a result. Existing economic values were preserved pending human playtests.

## Practical limits

This is a local in-memory MVP. Refreshing the page discards the active game, as stated in the game information sheet. Native-device notches, browser chrome, soft keyboards, mobile Safari and actual phone performance have not been tested on physical devices. Gameplay page layout does not scroll, while long sheet lists/history can scroll internally. These limitations and the balance target need real-device/human validation before a public release.
