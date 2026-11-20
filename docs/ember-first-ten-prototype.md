# Ember Tunnel - First Ten Assets / Playable Milestone

## Scope
This draft PR adds the first excavation/discovery mechanic to the existing 75-second run while preserving the approved Rosie vehicle and original cave worlds.

- Five optional geological discoveries: earth (2), crystal (2), and a royal chamber (1).
- Normal auger breaks earth and opens the concealed chamber; Burrow Turbo is required for crystal.
- Intact/cracked/broken states use the approved physical drill-tip coordinates, frame-rate-independent contact and safe world-anchored placements.
- Breaking obstacles awards score and Turbo charge. The chamber awards a collectible Royal Bone Medallion and a treasure cache.
- Collision-safe dig sites are positioned away from existing solid cliff formations.
- HUD and results show breaks, secrets and relics; Royal Bone discovery persists locally between sessions.
- Rock/crystal breakage plays the imported 10-frame VFX and short sound/haptic feedback.
- The original Rosie cockpit, 16-frame rotating auger and game controls are unchanged.

## Imported assets
All **10** approved-for-review optimized WebPs from the refined contact-sheet pack have been imported byte-for-byte under `public/ember-drill/breakables/v2/`, with metadata in `manifest.json`.

| Asset | Loaded into gameplay | Purpose |
|---|---|---|
| 01-earth-wall-intact.webp | yes | normal earth state |
| 02-earth-wall-cracked.webp | yes | earth damage state |
| 03-crystal-wall-intact.webp | yes | Turbo-only crystal |
| 04-crystal-wall-cracked.webp | yes | cracked crystal |
| 05-secret-entrance-closed.webp | yes | hidden entrance |
| 06-secret-entrance-open.webp | yes | revealed chamber |
| 07-rosie-drilling-effort.webp | **no** | saved as reference only, likeness unapproved |
| 08-rosie-excited-discovery.webp | **no** | saved as reference only, likeness unapproved |
| 09-royal-bone-medallion.webp | yes | persistent achievement illustration |
| 10-rock-crystal-shatter-vfx-5x2.webp | yes | 10-frame 5x2 break animation |

The matching transparent PNG sources, contact sheet, and original-size earth study remain in `Ember Tunnel First 10 Assets v2.zip` outside GitHub. These are **upscaled refinements from the original contact-sheet illustration**, not ten independently redrawn high-resolution masters. The two generated Rosie portraits must NOT replace the canonical in-game dog until their likeness is explicitly approved.

## Implementation
- `src/emberBreakableTerrain.js`: deterministic sites, collision-contact integrity, charge and treasure rewards.
- `src/emberBreakablePainter.js`: isolated mounted sprites and intact/cracked/broken rendering, with fallback artwork.
- `src/emberDrillEngine.js`: engine integration plus safe, seed-specific course pickup variation.
- `src/emberDrillPainter.js`: world-layer integration and shattering atlas.
- `src/EmberTunnelDrill.jsx`: registered image paths, persistent Royal Bone reveal, HUD/audio/UI feedback.
- `tests/ember-breakable-terrain.test.mjs` and existing engine tests.
- `scripts/verify_ember_breakables.mjs` and visual QA workflow for Chromium desktop/mobile and WebKit mobile.

## Release gate
GitHub Actions verifies the engine tests and Vite production build. The additional cross-browser visual workflow captures screenshots and ensures imported images load and earth walls are actually painted. Keep PR #192 in draft until browser QA and human visual review of the approved art registration. Do not merge or deploy to production without passing those gates.

## Crystal shutter and passage-mission milestone
The existing 75-second two-passage game now has a second gameplay layer without requiring new generated art:
- Three deterministic moving crystal shutters at world positions 5300 (roof), 13360 (floor) and 18300 (roof). All have clear same-side formation registration and draw using existing crystal formations.
- Shutters telegraph before entering the screen; their collision core tracks the exact inward extension drawn by the painter, from a small embedded shelf through extension and retraction.
- Shutters can be dodged for 100 points and +8 Turbo charge or smashed during Turbo for 150 points. Each shutter can pay only once, and unvisited behind-the-player shutters cannot grant free dodge points.
- A first Barkroot objective rewards destroying an earth wall (+250), while the second Ruby objective rewards safely passing or shattering the Ruby shutter (+350).
- Shutter notices are positioned opposite the moving wall, so warnings do not obscure the danger. The live route strip and results show objective status and crystal dodges.
- New pure engine/feedback tests cover deterministic timing, fair collisions, idempotent rewards, mission scoring and warning placement; browser smoke checks verify the objective panel does not overlap the canvas on iPhone and desktop.
- Existing approved Rosie vehicle and original 16-frame auger remain untouched.

**Playtest caveat:** This is an exploratory milestone. It does not yet constitute the five-level campaign or a final difficulty tune. Preserve draft PR status until mobile-browser QA and visual assessment have completed.
