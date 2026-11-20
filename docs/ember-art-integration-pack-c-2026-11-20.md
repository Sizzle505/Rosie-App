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


## November 20 subsequent development: five selectable route playtests

The same draft PR now includes `src/emberExpeditionStages.js` and selected-world routing in `src/EmberTunnelDrill.jsx`.

- Each of five stages can be selected immediately from the game's launch screen (none locked) and starts at its own cave world position.
- Every route is currently a **15-second terrain/playability test**. The original 75-second Classic course remains available and is not replaced.
- Each route has a separate timer, stage heading, approved existing-art scenic theme, score report and 0-3 stars saved under `rosieEmberFiveWorldStarsV1` in localStorage.
- The first star requires completion; the second requires no more than one collision; the third requires at least five collected treasures. Failed runs receive no stars.
- There is no claim that completed boss fights, unique Clockwork/Molten/Royal mechanics, or the ten new binary images are active. In particular, `emberBossEncounter.js` remains independent until future game integration.
- Old gameplay is isolated by the optional `stageIndex` parameter of `newRun`; its default remains classic `RUN_DURATION = 75`.
- Dedicated Node tests and cross-browser Playwright smoke tests cover stage selection, individual starting coordinates, classic backward compatibility and reward persistence.

**Remaining gate:** Ten new WebP binaries are still in the downloadable ChatGPT integration archive and not committed to GitHub. The guarded importer and metadata are ready; the artwork cannot be shown in-app until the image transfer is completed and reviewed.

**Caution:** The new stage map and backdrop treatment are initial playtesting scaffolds, not finished bespoke 5-level art or five distinct mechanical campaigns. Leave this PR in draft.

## November 20 additional gameplay - distinct world hazards

The five selectable 15-second Expedition previews now have dedicated, collision-aligned moving hazards. These are **procedural placeholder illustrations**, not the unimported ChatGPT image binaries.

| Stage | New hazard | First contact | World objective bonus |
|---|---|---|---:|
| Barkroot | Existing drillable earth wall | x 1120 | +250 |
| Ruby | Crystal spikes from ceiling | x 7330 | +300 |
| Clockwork | Brass piston mechanisms | x 12180, 13870 | +375 |
| Molten | Volcanic geysers | x 17650, 18200 | +425 |
| Treasury | Royal earth bursts | x 23720, 24230 | +500 |

- Selected-world obstacles do **not** appear in Classic mode; its 75-second duration, approved Rosie art and physics remain unchanged.
- All new hazards have 470px advance warnings, smoothly extending geometry, an inward-only solid core and automatic retraction. Each has a matching procedural Canvas painter.
- Successfully navigating a hazard yields +125 score and +10 Turbo charge. Turbo shatters it for +175. One success per stage unlocks the stage objective, with the above additional bonus.
- Starting behind a hazard never awards a free dodge or bonus; repeated contacts cannot farm points. The source checks structural collisions against the same wall geometry used to draw the hazard.
- The third star now requires the stage's own objective, not a generic treasure threshold. The first star requires finishing; the second requires no more than one hull hit.
- `tests/ember-expedition-hazards.test.mjs` exercises placement, warning, damage, Turbo shattering, and one-time rewards. Browser smoke QA explicitly waits for the Clockwork warning after selecting that stage.

### Visual review still necessary
These effects are immediately testable without additional art imports, but their final appearance will be replaced selectively by the high-resolution assets after manual registration. Stage 3-5 bosses are **not active**. This remains an isolated draft PR pending desktop, iPhone WebKit and iPad review.
