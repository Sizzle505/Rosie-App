# Ember Tunnel - Expansion Pack A / First 10 Art Candidates
Date: 2026-11-20
Status: **Generation submitted for art review. NOT imported into runtime, NOT approved for gameplay.**

These are individual high-resolution render jobs in the connected Runway workspace, deliberately separate from earlier composite contact-sheet concept studies. The 2D game must retain approved canonical black-and-tan Rosie, white naval captain's hat, red/white/navy kerchief, red/brass drillcraft. Do not substitute an orange Shiba.

| ID | Asset | Render task ID | Handoff requirement |
|----|-------|----------------|--------------------|
| 01 | Crystal shutter - retracted | cfdae536-c07d-4817-8828-ab04a47fac19 | Left-wall brass-and-amethyst housing, crystals wholly recessed, no collision extension |
| 02 | Crystal shutter - extended | 52388e47-c118-40b1-9ab9-7dd86f131424 | Reference-matched to 01; amethyst points project right; match pixel size, pivot, and world anchor |
| 03 | Barkroot collapse trap | d21a83aa-52ba-4a65-b702-66adff9d960e | 2x4 sheet, stationary ceiling rootstone then cracks, falls, rubble; warning must precede hit window |
| 04 | Ruby pendulum | 1944d6ee-d671-4a3a-8bac-d43e59c502af | Single straight-on isolated ruby/gold mechanism; programmatic swing about a defined pin |
| 05 | Monty Muddleton | d12aa2c8-5048-4212-8fd3-513f8b71a8d5 | 4x3 mole sheet (emerge, taunt, clod throw, recoil, retreat), consistent baseline and costume |
| 06 | Ruby Scarab Sentinel | 3ba53682-3e0b-405e-b59e-bbcd8034348d | 4x3 mechanical jeweled beetle sheet, walking/flying/damaged poses; no clipping |
| 07 | Barkroot victory | f5eae277-4c9b-4ae6-a408-50977c52fbc8 | Portrait illustration; reference canonical black-and-tan Rosie and established red/brass drill |
| 08 | Ruby victory | f9944f07-b389-422d-89a8-56a91b63b513 | Portrait illustration; same canonical Rosie reference, held ruby, Ruby Temple setting |
| 09 | Underground expedition map | f867237c-23a0-4cb0-b808-19295022d4a2 | Five worlds, distinct interactive pin anchors, text-free artwork, safe for desktop/mobile crop |
| 10 | Rootbound Key relic | 8ade43f3-27d7-4d56-a91a-07fd93415607 | Gold paw-and-emerald key isolated relic, readable at pickup scale and victory scale |

## Integration requirements

1. Review outputs individually and reject any frame inconsistent in character, scale, silhouette, or animation pose; do not call an attractive storyboard a registered sprite sheet.
2. Remove backgrounds from isolated sprites, preserve edge quality, and export PNG masters plus optimized WebP; keep intact/extended shutter images pixel-registered to one shared anchor.
3. Validate that the dynamic moving-shutter physics and art match: crystal projection must not exceed visible painted spikes or create unseen hitboxes.
4. Keep Rosie victory illustrations off the live app until her likeness is visibly correct. Existing official banner and approved body remain untouched.
5. Check asset loading, spatial registration, image alpha, frame count, color, and animation in desktop Chromium, iPhone WebKit, and iPad.
6. Import only reviewed art to `public/ember-drill/expansion-batch-a/` on the draft PR. Do not merge to main or deploy to production without review.

Earlier concept contact sheets are previews only. This manifest records *render tasks*, not a claim that ten final high-resolution transparent sprite masters exist in GitHub.
