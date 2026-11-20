# Haiku Garden art integration and QA

**Completed.** The five production WebP/PNG assets were transferred from Dropbox into GitHub on the isolated `feature/rosie-haiku-garden` branch, with byte-for-byte SHA-256 verification in GitHub Actions. The original approved archive is preserved at `/Rosie-App-Transfer/RosieHaikuGardenScenePackFinal.zip`.

The following production assets are committed under `public/rosieverse/haiku/`:

| File | Purpose | Size | SHA-256 prefix |
| --- | --- | ---: | --- |
| `rosie-meditating-paws-up.webp` | Isolated black-and-tan kimono Rosie with both paws raised | 616084 | `6dd6a1d9e51a` |
| `field-sunrise.webp` | Open blossom field and Mount Fuji at dawn | 568828 | `2f7a07f44346` |
| `zen-sunrise.webp` | Raked sand, koi pond, cherry blossoms | 621508 | `5d83ea535e94` |
| `temple-sunrise.webp` | Ornate temple courtyard at sunrise | 473856 | `f18c98129936` |
| `haiku-scroll-isolated.png` | Transparent-edge Japanese parchment with room for live poem copy | 3014693 | `8e3f3f05dcc7` |

`haiku-scroll-concept.jpg` is a **source reference only**; its checkered border is a baked background and must not replace the isolated PNG.

## Implementation

- `src/RosieHaikuScene.jsx` displays the three background choices, persists the visitor’s last selection, and overlays the *same* transparent Rosie layer onto all three. The owning page also tracks the selection for postcard rendering.
- `src/RosieHaikuScene.css` lays out the art for desktop/tablet/mobile, with scenery behind the canonical character.
- `src/RosieHaikuGarden.jsx` inserts the stage above the poem and controls.
- On missing art, the shipped view falls back to `/rosieverse/hero.webp` rather than exposing broken images.
- `src/RosieHaikuGarden.css` uses the real transparent ornamental scroll beneath accessible live HTML poem text. The postcard generator draws the chosen scene, Rosie, and scroll onto a 1200 x 1600 PNG.

## QA before merge

1. Open `/#haiku` in Vercel preview, select all three scenes and verify they change while Rosie stays consistent.
2. Compare the black-and-tan face, cream muzzle, tan eyebrow dots, curled tail, and kimono to approved landing-page Rosie.
3. Check iPhone portrait, landscape, iPad portrait/landscape, and desktop: do not crop Rosie’s head, tail, or raised paws.
4. Confirm background and character PNGs/WebPs have no visible checkerboard or hard matte edges.
5. Run GitHub Actions `Rosie Haiku Garden QA` and Vercel preview build before merge.

## Integration checks completed

- GitHub Actions imported all five files with exact SHA-256 checksums.
- Vercel preview returned HTTP 200 with the correct WebP/PNG MIME types for all five asset paths.
- The regular Haiku Garden QA workflow and Vite build passed following the initial binary import. A later change also adds image-format assertions to the automated test.
- **Still requires human device/visual QA:** iPhone/iPad/desktop scene and scroll composition, native sharing, download of the postcard, and local journal persistence.
