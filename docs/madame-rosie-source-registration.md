# Madame Rosie - Source-Locked Stage Renovation

**Preparation only - no artwork is approved, and the live fortune page is unchanged.**

Verified source: `public/rosie-fortune-stage.webp`, 1522 x 1430, blob SHA `82708ca651cb6e33fbd874f8cd47a3101bf36de3` on `Sizzle505/Rosie-App`.

The supplied `Madame_Rosie_Layered_Renovation_Handoff(1).zip` contains a specification, JSON layer manifest, asset checklist, and two reference screenshots. It **does not** contain source-isolated replacement layers. This branch adds a QA tool so future art cannot be animated or substituted without passing static reconstruction review.

## Gate A - static registration (required before motion)

1. Produce source-matched native 1522 x 1430 transparent canvases for every required layer in the uploaded handoff. Keep the original ornate booth, facial markings, turban jewel and hanging droplet, near forepaw, crescent, lanterns, moon, book titles, treat bowl and armillary. The original image is the authority, not the smaller screenshot crop.
2. Place assets under a separate local root with their requested paths, such as `stage/empty-booth.webp`, `rosie/head-front.webp`, and `orb/glass-back.webp`. Each image must have a 1522 x 1430 transparent canvas, even if its visible portion is a small crop, so layer registration cannot drift.
3. From the repo root run `python3 scripts/fortune_static_qa.py --layers /path/to/layers --out /tmp/madame-rosie-review` (requires `Pillow`).
4. Review `registration-guides.png`, `registered-composite.png`, `source-vs-composite.jpg`, `difference-amplified.png`, and `report.json`. Missing layers fail with exit status 2. The score is only a diagnostic; the **visual** comparison must be approved before proceeding.
5. Reject any duplicated title, second Rosie, unmoving head, pasted foreground, mismatched lighting/fur, invented architecture or changed book titles. The original backdrop and approved static re-composition must agree as closely as painterly source extraction allows.

## Gate B - animation (blocked until Gate A passes)

Use one shared 1522 x 1430 coordinate transform, not independently scaled %-anchored child elements. Separate rear orb glass, nebula, shared clipping mask, answer, reflections, paw and pedestal. Use distinct native head poses for left/right/3-quarter/down/tilt; do not rotateY-flip a portrait. Animate physical curtain and lantern silhouettes rather than only their color/glow overlays.

Expected states: idle 4.8s breathing and occasional micro-glances; whistle produces real listening head turn; ask inclines Rosie toward the orb for a 1.35-2.0s energy convergence; reveal looks up and materializes the answer within the orb; dismiss resets idle. Curtain cycles: 8s / 9.5s; lantern cycles: 5.8s / 6.7s. Reduce perpetual movement under prefers-reduced-motion.

## Gate C - integration and iPhone verification (blocked until Gate B)

Do not replace current `FortuneMachine`, `FortuneLens`, `CrystalEnergy`, whistle or consultation state machine until Gate A approval. Preserve all selected sample questions, answer/save/share/omens, mic, ticket, menu/nav and Rosie Resources behavior. Verify iPhone Safari and desktop: no twin heads, clipped ears, escaping effects, duplicate sign, orb-position drift or low FPS. Do not merge to `main` until side-by-side static comparison and responsive screenshots are accepted.
