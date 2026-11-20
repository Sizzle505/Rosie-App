# Ember Tunnel - Art Integration Pack C (2026-11-20)

**Current status: five playable playtest worlds, three procedural boss encounters; generated image binaries still not imported.**  
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
4. Replace the existing procedural world and boss illustrations with the individually approved atlas images, finish original boss arenas, verify stage difficulty. The Classic 75-second course is still separate.
5. Complete Desktop Chromium, mobile Safari/WebKit, and iPad QA without changing existing approved Rosie vehicle or earlier levels.
6. Keep PR #192 in draft until reviewed; never merge or promote to production without explicit approval.

**Deferred:** All victory/finale Rosie art remains out of scope; previous victory images did not match the game's approved illustrated style.


## November 20 subsequent development: five selectable route playtests

The same draft PR now includes `src/emberExpeditionStages.js` and selected-world routing in `src/EmberTunnelDrill.jsx`.

- Each of five stages can be selected immediately from the game's launch screen (none locked) and starts at its own cave world position.
- The initial launch provided five 15-second terrain routes; subsequent revisions extend Clockwork to 30 seconds and Molten/Treasury to 40 seconds for bosses. Classic remains 75 seconds.
- Each route has a separate timer, stage heading, approved existing-art scenic theme, score report and 0-3 stars saved under `rosieEmberFiveWorldStarsV1` in localStorage.
- First star requires completion; second requires at most one hull hit; third now requires the unique world objective. Failed runs earn no stars.
- Clockwork, Molten and Treasury subsequently acquired procedural hazards and in-game boss fights. Generated image binaries are still not imported.
- Old gameplay is isolated by the optional `stageIndex` parameter of `newRun`; its default remains classic `RUN_DURATION = 75`.
- Dedicated Node tests and cross-browser Playwright smoke tests cover stage selection, individual starting coordinates, classic backward compatibility and reward persistence.

**Remaining gate:** Ten new WebP binaries are still in the downloadable ChatGPT integration archive and not committed to GitHub. The guarded importer and metadata are ready; the artwork cannot be shown in-app until the image transfer is completed and reviewed.

**Caution:** The new stage map and backdrop treatment are initial playtesting scaffolds, not finished bespoke 5-level art or five distinct mechanical campaigns. Leave this PR in draft.

## November 20 additional gameplay - distinct world hazards

The five selectable Expedition previews now have dedicated, collision-aligned moving hazards. These are **procedural placeholder illustrations**, not the unimported ChatGPT image binaries.

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
These effects are immediately testable without additional art imports, but their final appearance will be replaced selectively by the high-resolution assets after manual registration. Stage 3-5 bosses are now **playable using procedural character placeholders**; their production illustration atlases remain unimported. This remains an isolated draft PR pending desktop, iPhone WebKit and iPad review.


## Playable boss arenas - November 20 implementation

The Clockwork, Molten and Treasury challenge routes now culminate in playable boss battles implemented by `emberExpeditionBossStage.js` and `emberExpeditionBossPainter.js`.

| World | Duration | Boss | Health | Reward |
|---|---:|---|---:|---:|
| Clockwork Catacombs | 30s | Copperjack | 2 Turbo hits | +1,400 |
| Molten Depths | 40s | Cinderclaw | 3 Turbo hits | +1,750 |
| Royal Treasury | 40s | Mole King | 4 Turbo hits | +2,600 |

- The boss spawns approximately 8.5 seconds after a route begins. The world scroll then stops; normal cave pickup/formation collisions are suspended for the arena.
- Every boss cycles between clearly drawn, distinct **warning**, **active**, and **recovery** phases. Warning geometry matches the active damage zone.
- Rosie's auger must align vertically with the guardian; the horizontal Turbo reach permits up- or down-angled strikes. **Only Turbo during a recovery phase damages the boss**, once per recovery opening. Boss Turbo now lasts 0.72 seconds rather than the Classic 4.8-second shield, so one activation cannot auto-hit successive openings. Charge is refreshed at each recovery and any tunnel Turbo is cleared at arena entry.
- Boss attacks damage Rosie's hull at most once per cycle, respecting existing damage cooldown. Turbo shields the drill during attacks.
- Defeating the boss gives its unique reward and finishes the stage. Hull failure and timer expiry **do not** count as victories or grant completion stars.
- Both boss characters and impact markings are rendered procedurally for now, using separate Canvas routines, **not** the pending generated art and **not** the rejected victory screens.
- `tests/ember-expedition-boss-stage.test.mjs` covers first-warning, stopped scrolling, attack geometry, one successful Turbo hit per recovery, boss victories, and timeout. A source-engine simulation confirmed 2 / 3 / 4 hits across Copperjack / Cinderclaw / Mole King.
- Playwright QA now verifies the persistent Clockwork warning event and independently launches the Molten stage to confirm Cinderclaw's health and phase become visible.

**Remaining work:** production sprite import, device art review, precise hitbox art-registration, additional bosses' animations and tuning, audio, individual world transitions, and the postponed style-correct victory scenes.

## QA stabilization update

- Browser diagnostics isolated the prior Molten boss smoke timeout to **slow headless animation pacing**: a 25-second wall-clock wait advanced only approximately eight seconds of simulation, just short of the 8.5-second boss spawn. The app was active, hull intact, and no JavaScript crash occurred.
- The smoke timeout now allows 65 seconds of wall-clock while still requiring a real boss spawn with full health. Diagnostic state is retained for any further failure; the test never fakes boss state.
- Added a fourth **iPad WebKit 1024×768 touch viewport** and layout overflow checks alongside desktop Chromium, mobile Chromium and mobile WebKit.
- Stage progress now fills to 100% upon early boss victory. Unit tests ensure a single Turbo activation does not automatically damage the boss in later recovery windows.


## Latest development pass - Falling Basalt, tablet performance and in-game panoramas

Earlier passages in this document describe historical *pre-import* states and are superseded by this section and the PR body. The new 12-file WebP import is present in the development branch.

- **All nine atlases now have an in-game purpose.** The previously inactive Falling Basalt 8-frame atlas is now anchored at x 18200 on the Molten **ceiling**, replacing the earlier ceiling geyser. The second geyser has moved to the clear **floor** at x 18600. The first geyser remains x 17650. Three hazards are separated rather than overlaying one another.
- The Falling Basalt solid core is determined by the existing `expeditionHazardReach` function, with a 470px warning and a dedicated "FALLING BASALT" notice. A procedural ceiling-rock fallback is drawn only if the imported atlas has not decoded. Its physics are tested for warning, dodge, one-time reward and nonoverlap with geological formations.
- **The three transition panoramas are now drawn inside the actual game**, not only on the world-selection cards. Each is aspect-preserving and pans from the previous biome toward the selected biome over the first 3.4s. The Classic route is excluded.
- **Tablet responsiveness:** the Canvas backing-store is capped at 1.25M pixels, leaving CSS size and collision geometry unchanged. Inactive game panels redraw less often. When rendering is slow, a maximum of 200ms wall time is simulated through collision-accurate substeps of at most 45ms, preserving warnings and preventing the previous severe iPad slow motion.
- The browser smoke test closes the original Classic game page before launching the next test game to prevent competing WebKit Canvas loops from starving the iPad. All four viewport configurations remain in the QA matrix.
- The art remains **review quality**, especially the Gear Crusher matte and the new boss frame-to-phase alignment. No rejected victory image has been activated, and production remains untouched.

Release gate: verify the new WebKit iPad and desktop gameplay screenshots and that every imported boss/hazard/panorama actually renders as expected before promoting the branch.
