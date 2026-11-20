# Haiku Garden art integration plan (draft)

This feature's **source artwork is prepared**, but the binary WebP/PNG art has **not yet been uploaded into this Git branch**. The feature branch intentionally retains the approved RosieVerse image as its runtime fallback until these files have been transferred.

Place these files from the separately prepared `RosieHaikuGardenScenePack.zip` under `public/rosieverse/haiku/`:

| File | Purpose | Size | SHA-256 prefix |
| --- | --- | ---: | --- |
| `rosie-meditating-paws-up.webp` | Isolated black-and-tan kimono Rosie with both paws raised | 616084 | `6dd6a1d9e51a` |
| `field-sunrise.webp` | Open blossom field and Mount Fuji at dawn | 568828 | `2f7a07f44346` |
| `zen-sunrise.webp` | Raked sand, koi pond, cherry blossoms | 621508 | `5d83ea535e94` |
| `temple-sunrise.webp` | Ornate temple courtyard at sunrise | 473856 | `f18c98129936` |
| `haiku-scroll-isolated.png` | Transparent-edge Japanese parchment with room for live poem copy | 3014693 | `8e3f3f05dcc7` |

`haiku-scroll-concept.jpg` is a **source reference only**; its checkered border is a baked background and must not replace the isolated PNG.

## Implementation

- `src/RosieHaikuScene.jsx` owns the three landscape choices, persists the visitor’s last selection, and overlays the *same* transparent Rosie layer onto all three.
- `src/RosieHaikuScene.css` lays out the art for desktop/tablet/mobile, with scenery behind the canonical character.
- `src/RosieHaikuGarden.jsx` inserts the stage above the poem and controls.
- On missing art, the shipped view falls back to `/rosieverse/hero.webp` rather than exposing broken images.
- The isolated scroll is staged for a subsequent visual refinement pass; do not replace the existing live-text scroll until its responsive text-safety area is tested.

## QA after transfer

1. Open `/#haiku` in Vercel preview, select all three scenes and verify they change while Rosie stays consistent.
2. Compare the black-and-tan face, cream muzzle, tan eyebrow dots, curled tail, and kimono to approved landing-page Rosie.
3. Check iPhone portrait, landscape, iPad portrait/landscape, and desktop: do not crop Rosie’s head, tail, or raised paws.
4. Confirm background and character PNGs/WebPs have no visible checkerboard or hard matte edges.
5. Run GitHub Actions `Rosie Haiku Garden QA` and Vercel preview build before merge.
