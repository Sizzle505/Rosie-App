# Ember Tunnel - Existing asset integration pass (November 21, 2026)

**Development only:** draft PR #192 on `work/ember-destructible-treasures-20261119`. Production/main unchanged. The prior rejected Batch D remains explicitly excluded.

## Changes actually activated in this review branch

1. **Barkroot recovered lantern doorway:** `terrainPassageGate` from `terrain-transitions/ember-passage-arrival-lantern-gate.webp` is painted as background scenery only for selected Barkroot Expedition (stage 0). Its source has a stray horizontal line on the right, so `src/emberRecoveredArtAccents.js` crops strictly to the central doorway; no collision/hitbox was added. It is intentionally not drawn in Classic.
2. **Original golden Turbo flame trail:** `boosttrail` from `feature-boosttrail.webp` now adds a very low-alpha recovered tail behind Rosie only during a real Turbo. The image's right side contains an entire duplicate drill silhouette; only the left 43% of the source is sampled. The existing source-derived 16-frame auger, turn poses and exhaust remain authoritative; `turbo-head-frames.webp` is still not overlaid.
3. **Barkroot Turbo canister:** An original sixth-cell `bonus-pickups-atlas.webp` collectible at world X = 620, centered in the tunnel, awards 65 Turbo charge (capped at 100), 175 points, and a one-time message.
4. **Ruby time bonus:** An original fifth-cell collectible at stage start + 630 awards +3 seconds and 200 points exactly once. Both rewards only exist in optional stages 0 and 1, respectively. Classic retains 75s, and advanced boss-stage durations remain 30/40/40s.
5. Stage 0/1 now decode the existing bonus atlas on demand; there are no new generated images or image binaries in this pass.

## Implementation and regression coverage

- Source: `src/emberRecoveredArtAccents.js`, `src/emberDrillPainter.js`, `src/emberDrillEngine.js`, `src/EmberTunnelDrill.jsx`, `src/emberBreakableFeedback.js`.
- Tests: `tests/ember-recovered-art-accents.test.mjs` and `tests/ember-expedition-bonuses.test.mjs`. Both have been appended to the branch's explicit Ember Node CI test command.
- Acceptance still requires Native-scale iPhone WebKit/iPad/desktop visual review of the trimmed gate and flame alpha (not just a successful Vite compilation). Do not merge solely because Vercel preview becomes READY.

## Existing art correctly classified as already in use

Some earlier filename-only reporting was misleading. The formation painter uses dynamic `assets[item.key]` lookups and many OG/terrain assets are **already in use**. The Golden Bone already appears on certain completed run results. The other nine expansion atlases and three transition panoramas are already in the optional Expedition renderer. Avoid duplicate placements and do not infer a missing graphic solely from absence of a direct literal reference.

## Audio not yet shipped

`/Rosie-App-Transfer/Rosie-Music-20261120-05-Deep Gear Discovery.wav` is available in Dropbox, but **no permanent public media URL or verified repository binary copy** is available through the current file-transfer tools. Do not embed a temporary, private or expiring Dropbox download URL in React. When an authenticated permanent repository transfer is available, convert the original lossless WAV to a reasonable streaming format, verify clean beginning and end, and connect it to the user's existing sound toggle with appropriate pause/replay behavior. Until then existing procedural sound effects remain unchanged.

## Next review

Inspect four native-scale captures: Barkroot gate arrival, Barkroot canister, Ruby time pickup, and a powered Turbo with the recovered tail behind the approved vehicle. Confirm none appears as a floating collision hazard, source matte, duplicate cone or band across the corridor. Only then consider additional world-specific decoration.
