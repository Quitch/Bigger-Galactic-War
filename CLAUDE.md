# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Bigger Galactic War is a small client mod for Planetary Annihilation and
Planetary Annihilation: TITANS. It adds four galaxy sizes beyond the base game's
five (VAST/GIGANTIC/RIDICULOUS/MARATHON), unlocks the larger star system
templates the base game ships but never uses, and centres/zooms the galaxy map on
the player when a war is opened.

It ships as plain JS loaded by the game's embedded Chrome 40 — no build step, no
bundler, no test suite, and no CI. There are only twelve tracked files; the whole
mod is four JS files plus `modinfo.json`.

The base game install (a `media` folder under Steam's `.../Planetary Annihilation
Titans/`) is not part of this repo and lives at a different path on every
contributor's machine. If it's set up as an additional workspace root it will
appear in the "Additional working directories" list at the start of the session,
and its own `CLAUDE.md` identifies it. Treat it as read-only reference — it is the
only way to see what the two shadowed files looked like before this mod copied
them, and where `gw_balance.js`, `template-loader.js` and `gw_play.js` (the code
this mod hooks into) live. Never edit anything there.

## Commands

```bash
npm ci                  # install pinned tooling (only needed once / after deps change)
npm run lint:js         # eslint .
npm run format:check    # prettier --check .
npm run format:write    # prettier --write .
npm run verify          # lint:js + format:check
```

Dev dependencies float on minor releases (`^`), so `npm ci` reproduces the
lockfile while `npm update` picks up minor/patch bumps. There is no CI, so
`verify` is the whole automated gate.

`.prettierrc` pins `trailingComma: "es5"` — Prettier's own default (`"all"`) emits
trailing commas in function calls, which is ES2017 syntax that PA's Chrome 40
cannot parse, so this setting is a runtime requirement rather than a style
preference. `endOfLine: "auto"` is there because the repo checks out CRLF on
Windows under `.gitattributes`' `text=auto`.

Verification of behaviour is in-game: install/symlink the mod as a client mod, start a new
Galactic War, and check the size dropdown plus the generated systems. Nothing here
can be exercised under Node.

## Architecture

### Entry points

`modinfo.json`'s `scenes` block is the real entry-point list — the game loads
exactly the `coui://` files named there, per scene:

- `gw_start` → `ui/mods/com.pa.quitch.biggergw/size.js`
- `gw_play` → `ui/mods/com.pa.quitch.biggergw/zoom.js`

Anything not listed there reaches the game only by file shadowing (below). Both
scene files are a bare `try`/`catch` at file top level that logs the error and its
JSON to the console rather than letting an exception escape into the scene.

### Galaxy sizes are index-aligned across three places

`size.js` appends four `<option>`s to the base game's `#game-size` select with
values 5–8, re-runs `locTree()` over the select so the new labels get localised,
then `requireGW(["shared/gw_balance"])` and pushes onto two parallel arrays on the
returned module:

- `balance.numberOfSystems` — base ships `[18, 24, 36, 54, 78]` (indices 0–4 =
  SMALL…UBER in `gw_start.html`); this mod pushes `108, 144, 186, 234`.
- `balance.galaxySizeDiffMod` — base ships `[1.25, 1.2, 1.15, 1.1, 1.0]`, a
  descending difficulty ramp; this mod continues it with `0.95, 0.9, 0.85, 0.8`.

The dropdown `value` is the index into both arrays, so the three lists must be
appended to in the same order and kept the same length. Base-game cards read
`GW.balance.numberOfSystems[n]` by index for size-scaled effects, so inserting
rather than appending would silently rebalance the base game.

### Shadowed star system templates

`ui/main/game/galactic_war/shared/js/systems/pa-normal.js` and `titans-normal.js`
override base-game files at the identical relative path. They are full copies, not
diffs — any future base-game change to the parts this mod didn't touch is silently
lost until someone re-syncs them by hand. Only two things actually differ from the
base files (everything else is Prettier reformatting):

1. **`Players` bands.** Base ships four template groups per file, but the last two
   are banded `[0, 0]` and can never match, so their (larger) systems are dead
   data. This mod re-bands all four to `[0,2] / [2,3] / [3,4] / [4,40]` to bring
   them into play. `template-loader.js` picks a group with `_.find` — first match
   wins — so the bands must stay in ascending order and may overlap at the seams
   only the way they do now. `gw_galaxy.js` derives a system's player count from
   how deep it sits in the galaxy (`Math.floor(starPct * 2.25 + 2)`), so a higher
   `Players` band means "appears deeper into the galaxy", not "more human
   players".
2. **Planet radius caps.** Solid-planet `Radius` upper bounds were pulled down to
   800 (`[900,1000]` → `[700,800]`, `[800,1000]` → `[650,750]`) because huge
   planets are slow to generate. The `Radius: [1500, 1500]` entries are gas giants
   (`Biomes: ["gas"]`) and are intentionally left alone.

Note the two files use different AMD forms on purpose: `pa-normal.js` is a plain
value module (`define([ ...templates... ]);` — its factory was dropped as
unnecessary), while `titans-normal.js` keeps `define([dep], function(...))` because
it depends on `systems/planets` for its `fromRandomList` planet pools. Both dropped
the base file's `// !LOCNS:galactic_war` translation marker.

### Galaxy view fix

`zoom.js` runs inside `_.defer` (so it lands after `gw_play`'s own view-model
setup) and calls `model.galaxy.zoom(Math.max(model.galaxy.zoom(),
model.galaxy.minZoom()))` then `model.centerOnPlayer()`. `galaxy.zoom`/`minZoom`
and `centerOnPlayer` are Knockout observables/functions the base `gw_play.js`
assigns onto `self`, which is what makes them reachable from a scene script at all
— this is the general pattern for touching base-game behaviour without shadowing a
file, and shadowing should stay a last resort.

## Conventions

- Shipped code must run on PA's embedded Chrome 40. `eslint.config.mjs` sets
  `ecmaVersion: 6` with a comment noting only partial ES6 support — in practice
  write ES5, and assume the globals declared there (`requireGW`, `locTree`,
  `model`, `_`, plus browser/jQuery/AMD).
- `curly: ["error", "all"]` is the one rule added on top of `js/recommended`.
- Prettier is applied to the whole repo including the shadowed system files
  (that reformatting is already committed — don't revert it, and don't mistake it
  for a behavioural change when diffing against the base game).
- `develop` is the default and working branch; `master` carries releases. The
  develop-branch `modinfo.json` deliberately uses the DEV identity
  (`com.pa.quitch.biggergw-dev`, display name suffixed `DEV`, `"version": "dev"`)
  so it can be installed alongside the released mod; the released `modinfo.json` on
  `master` has the plain identifier and a real version. A release is a CHANGELOG
  entry, the `modinfo.json` version/build/date bump, and a `vX.Y.Z` tag.
- SonarCloud analyses this project (`Quitch_Bigger-Galactic-War`, org `quitch`) via
  automatic analysis — the `.sonarcloud.properties` file was removed on purpose.
  Don't try to run the Sonar CLI.
