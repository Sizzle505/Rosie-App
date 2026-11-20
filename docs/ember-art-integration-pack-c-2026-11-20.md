# Ember Tunnel - Art Integration Pack C (2026-11-20)

**Status: art prepared; image binaries not imported; gameplay modules not activated.**  
This document is for PR #192 only and has no effect on production.

## Source deliverable
`Ember Tunnel Art Integration Pack 2026-11-20.zip` was created in the current ChatGPT conversation from ten individually generated ChatGPT images (not Runway). Its extracted top-level directory is `Ember Tunnel Art Integration Pack`.

- 7 atlases = **54 frames** in matching registered cells, plus per-frame transparent PNG exports.
- 3 wide 1672 × 941 environment-transition panoramas, exported as WebP.
- 10 untouched source PNGs for future retouching.
- Per-frame dark-background QA previews and `art-manifest.json`.

| Asset | Registration | Frames | Review note |
|---|---|---:|---|
| Mole King | 4 × 3, 384px | 12 | New character art candidate; verify red/yellow fringe cleanup and pose proportions |
| Gear Crusher | 4 × 2, 448px | 8 | **Hold**: residual pale ground paint/steam after alpha cleanup; refine before enabling hitboxes |
| Lava Geyser | 3 × 2, 512px | 6 | Verify safe warning and peak eruption are distinct |
| Falling Basalt | 4 × 2, 448px | 8 | Ensure real damage windows align to falling rock, not dust |
| Royal Earth Burst | 4 × 2, 448px | 8 | Ground telegraph must precede rock pillars |
| World Map Markers | 3 × 2, 512px | 6 | First five cells are levels; sixth is a decorative sparkle |
| Bonus Pickups | 3 × 2, 512px | 6 | Bone, cheese, blue gem, red gem, time bonus, Turbo canister |
| Ruby → Clockwork | 1672 × 941 | 1 | Wide panorama; do not crop critical left-right transition |
| Clockwork → Molten | 1672 × 941 | 1 | Wide panorama, cool brass to hot lava |
| Molten → Royal Treasury | 1672 × 941 | 1 | Wide panorama, volcanic rock to gilded vault |

## Controlled import
```sh
unzip "Ember Tunnel Art Integration Pack 2026-11-20.zip"
node scripts/import-ember-expansion.mjs "./Ember Tunnel Art Integration Pack"
```

The importer validates the expected atlas grids, source manifest and all ten WebP signatures before copying files into `public/ember-drill/expansion-batch-c/`. It **does not** turn on levels or hazards, alter Rosie's official artwork, merge the PR, or deploy.

The pure `src/emberExpansionCatalog.js` enumerates all five planned worlds (unlocked for testing), 54 sprite frames, three transitions, and a defensive canvas drawing helper. `tests/ember-expansion-catalog.test.mjs` covers the metadata and the non-breaking missing-art path. It is inert unless explicitly imported and used in the live game.

## Release gates
1. Copy artwork into this branch after reviewing every atlas/transition at game display scale. **No binaries have been transferred through GitHub in this pass**.
2. Fix gear crusher pale matte and smoke artifacts. Recheck visual alpha halos for Mole King, basalt and earth-burst sheets.
3. Align animated obstacle geometry with collision hitboxes; warnings always precede active damage, and Turbo hits award points once.
4. Build actual separate stages 3-5, stage selections, saved relic/stars, and in-game boss arenas. The existing application still runs a 75-second two-passage course.
5. Complete Desktop Chromium, mobile Safari/WebKit, and iPad QA without changing existing approved Rosie vehicle or earlier levels.
6. Keep PR #192 in draft until reviewed; never merge or promote to production without explicit approval.

**Deferred:** All victory/finale Rosie art remains out of scope; previous victory images did not match the game's approved illustrated style.
