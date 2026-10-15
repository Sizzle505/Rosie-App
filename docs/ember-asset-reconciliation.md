# Ember Tunnel asset reconciliation and use (14 October 2026)

- GitHub `public/ember-drill/`: **53 image files** (plus `feature-manifest.json`).
- Dropbox `/Rosie-App-Transfer/`: **27 standalone Ember PNG masters**, plus **7 Ember transfer packages/manifests**. Many are alternate sources, exports, or ZIP duplicates of the GitHub images.
- The original precision handoff contains **21 recovered image files**: 12 wall illustrations, 3 vehicle-pose frames, 4 low-frequency geological textures, 2 organic panoramas.
- All 21 GitHub counterparts are **byte-identical**, checked by Git object SHA-1 calculated from the handoff bytes.
- The handoff's embedded 805,033-byte terrain v2 ZIP exactly matches Dropbox `Ember Continuous Terrain Materials v2.zip` content hash `52d4cd5c9e95cc2143b65b7b0df7fa8b80cf570d543092b6b715c3f7d58b9a09`.

## Integration in this feature branch

The 12 wall images have been registered and drawn as **one-off terrain-attached illustrations**, never repeated as a tiled structural texture. `ruby-loop.webp` is now a short Ruby panorama stage. The split transparent `feature-crystaloverlay.webp` is registered to both collision edges as a single optional Ruby inset. Low-frequency geological materials are the softly feathered structural UNDERLAY, not scenic wall paintings.

The original machine, three poses, HUD, rules, 75-second duration, and footer are preserved.

## Deliberate visual exclusions

- `turbo-animation.webp` depicts a nearly complete additional drill nose and would create a doubled ghost sprite if stacked without appropriate extraction. Only the real vehicle and existing boost particles/trail are displayed.
- `roof-roots.webp`, `floor-ruby.webp`, `barkroot-hanging-roots.webp`, `descending-roof.webp`, and `descending-floor.webp` are wide, non-seamless illustrated panels. They remain available as source artwork, not repeated rectangular strips.
- `auger-spin.png` is 2000x820, four columns by two rows. It has eight visually near-identical drill frames, so additional animated rib highlights are used as a temporary indication of spin; a properly re-rendered rotating nose remains a separate quality task.

## Items not verified as delivered

The purpose-made seamless structural lip masters named **S01-S04** in the handoff have no exact counterparts under those filenames in the feature branch or Dropbox standalone listing. ZIPs other than the embedded v2 package have not been exhaustively opened; do not describe these masters as definitively lost or never created. A genuinely world-arc-mapped structural atlas would be superior to the current feathered low-frequency underlay.

`Ember Tunnel Drill - First Milestone Asset Pack.zip`, `Ember Drill - Recovered Tunnel Layers.zip`, and `Ember Drill - Recovered Walls and Turn Frames.zip` are present in Dropbox, but their internal file lists have **not** yet been independently verified in this session. Do not count their contents as missing without inspection.

No production merge.
