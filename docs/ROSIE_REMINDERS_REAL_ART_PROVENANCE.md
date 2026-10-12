# Rosie Reminders - approved original-image provenance (2026-10-12)

These seven images in `public/rosieverse/reminders/approved-art/` are **actual image-derived assets transferred via Dropbox**, not hand-drawn SVG approximations.

## Source originals (retained in Dropbox)
- `/Rosie-App-Transfer/rosie-reminders-blue-celestial-original-20261012.png` - original generated 941 x 1672 PNG; SHA-256 `f5acba0f67b885e4a46430bc190e4ca7686e35897a1269b0227797c3abba3241`
- `/Rosie-App-Transfer/rosie-reminders-today-calendar-original-20261012.png` - original generated 2508 x 627 PNG; SHA-256 `39faed42ccaee86c850e0fdeecc07f5b741e36133083db025182bce44618ffb2`
- `/Rosie-App-Transfer/rosie-reminders-add-save-original-20261012.png` - original generated 1536 x 1024 PNG; SHA-256 `70b0f02ad1493477bd1b58de695017d5b219a4f1d6e655e6b824ea3e0bcec170`
- `/Rosie-App-Transfer/rosie-reminders-midnight-velvet-original-20261012.png` - source 1024 x 1024 material PNG; SHA-256 `ae71da74fc5aef859a066cc4a4859fee617b90fba01d0bef19fba369ca04196c`
- `/Rosie-App-Transfer/rosie-reminders-gold-planner-original-20261012.png` - original illustrated planner 1122 x 1402 PNG; SHA-256 `e441ff8cf82cb2e5e23875eb6b89b96c1123e839912a46a95b00e3215764ebce`
- `/Rosie-App-Transfer/rosie-reminders-goals-banner-original-20261012.png` - original title banner 2172 x 724 PNG; SHA-256 `6d4ccb148bbf5ec3d99a23125d7306417608721987a9401781c077f47402f26b`

All originals were transferred from the conversation to Dropbox, then downloaded into the build environment and SHA-256-verified byte-for-byte against the conversation source files.

## Image-derived deployed assets
- `midnight-celestial-full.webp`: 941 x 1672 export of original blue celestial art, quality 96 (preserves source resolution)
- `midnight-velvet-tile.webp`: 1024 x 1024 quality-96 export of the transferred source midnight velvet material
- `today-art.webp`: 1265 x 346 alpha-transparent cutout from the original Today/Calendar sheet
- `calendar-art.webp`: 1272 x 346 alpha-transparent cutout from the same original source
- `add-art.webp`: 707 x 353 alpha-transparent cutout from the original Add/Save sheet
- `save-art.webp`: 709 x 353 alpha-transparent cutout from the original Add/Save sheet
- `planner-parchment.webp`: 576 x 257 cropped **blank writable material** from the original illustrated gold planner

The original source artwork retains the baked-in captions, so React continues to provide native semantic button labels via visually hidden text. The titles, input fields, reminders, goals, lists and calendar state are rendered live, not flattened into images. The source Goals & Gratitude banner and illustrated planner are intentionally **not** overlaid as whole images over editable controls.

## Binary verification
The image files were imported into GitHub as binary blobs through the authenticated connector. Their Git blob SHA values were checked against `git hash-object` of the exported files in the build environment. The former substitute SVG styling and assets were removed from this page.
