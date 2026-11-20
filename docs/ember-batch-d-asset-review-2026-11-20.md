# Ember Tunnel Batch D - Asset Continuation (November 20, 2026)

**Status: review-only concept art, not runtime assets.** This note tracks art prepared after the prior asset-generation conversation reached capacity. It is isolated to draft PR #192.

## Source of truth

Dropbox transfer path: `/Rosie-App-Transfer/Ember Tunnel Batch D - Ten Art Concepts and Spark Bolt.zip` (13,920,083 bytes).

The ZIP includes the untouched generated concept montage, ten cropped reference compositions, an eight-frame alpha-masked Copperjack spark-bolt prototype, its 8 individual PNG frames, a dark-cave QA preview, and `art-manifest.json`. The effect prototype is 1792 × 896 with a 4 × 2 grid of 448 × 448 cells; it still has a pale glow/matte that needs visual cleanup.

## Asset inventory and disposition

| # | Concept | Art disposition |
|---|---|---|
| 01 | Copperjack spark-bolt attack | Eight-frame prototype; inspect alpha halo and verify collision-aligned phase timing before use |
| 02 | Cinderclaw burrow trail | Composition reference only; requires independent transparent movement-frame art |
| 03 | Mole King earth pillars | Composition reference only; requires stage-anchored warning/extension/retraction frames |
| 04 | Copperjack hit/defeat | Composition reference only; animate existing imported canonical Copperjack atlas |
| 05 | Cinderclaw hit/defeat | Composition reference only; animate existing 12-frame Cinderclaw atlas |
| 06 | Mole King hit/defeat | Composition reference only; animate existing imported Mole King atlas |
| 07 | Clockwork Catacombs entrance gate | Environment reference only; recreate as transparent gate or depth-layered scene |
| 08 | Molten Depths entrance gate | Environment reference only; recreate as transparent gate or depth-layered scene |
| 09 | Royal Treasury entrance gate | Environment reference only; recreate as transparent gate or depth-layered scene |
| 10 | Barkroot Rosie victory | Composition reference only; **do not use** without canonical approved black-and-tan Rosie character correction |

## Non-negotiable runtime constraints

- Preserve the current imported bosses' identities, the approved Rosie vehicle sprites, the classic 75-second route, existing expedition physics and collision hitboxes, and the five-world progress flow.
- Sprite assets must be true transparent PNG or WebP with identical registered cells. Decorative backgrounds and typography must not be mixed into effects or character atlases.
- Copperjack warning/active/recovery visuals must match `bossPresentation` and `bossAttackDanger`; no invisible collisions or implied damage outside an active lane.
- Entrances must work without clipping at desktop, iPhone and iPad viewports, and final portraits cannot replace approved Rosie art until individually accepted.
- Do not merge, deploy to production, or mark Batch D approved until native-scale art and device QA succeed.

## Next technical production step

Create standalone masters (not crops of the reference collage) for assets 02-10, refining VFX 01's glow on dark and light tunnel backgrounds. Import reviewed frame binaries to a **new** review-only directory and add frame registration and missing-image fallback tests before activating any feature. Keep this PR draft.
