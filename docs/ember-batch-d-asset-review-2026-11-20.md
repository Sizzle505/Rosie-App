# Ember Tunnel Batch D - Asset Continuation (November 20, 2026)

**STATUS: REJECTED BY USER - DO NOT INTEGRATE, REUSE OR PRESENT AS MATCHING GAME ART.** The November 20 concept montage and attempted spark-bolt prototype are visually inconsistent with the actual approved Tunnel game. Preserve only as historical audit evidence; do not use them as references for future generation. This note tracks art prepared after the prior asset-generation conversation reached capacity. It is isolated to draft PR #192.

## Rejection record

User rejected the entire batch as not resembling the current game. Incorrect outputs include generic fantasy boss/character redesigns, card-like gate illustrations and noncanonical Rosie imagery. The supposed eight-frame Copperjack spark effect also lacks validated transparent registration and should not be integrated. The replacement process must **first** review actual running-game screenshots and original approved sprite binaries from the existing branch/Dropbox art archives. New effects must match the original art precisely and must remain isolated until visually accepted.

## Rejected source package (historical only)

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

**Do not develop from these concept images.** Inspect approved canonical source assets and live Tunnel screenshots first. Build a side-by-side visual spec, then create standalone replacement assets based on actual source art and verify at in-game scale. Keep PR draft and production unchanged.
