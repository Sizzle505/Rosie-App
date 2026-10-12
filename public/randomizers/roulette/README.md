# RosieVerse roulette - approved image assets

Original, byte-verified artwork was transferred from `Rosie_Roulette_Modular_Assets.zip` through the existing Rosie-App Dropbox transfer folder. All four original PNGs, unmodified, are stored under `originals/`. Production uses WebP derivatives of those same images to reduce page weight; **the content was not regenerated**.

- `wheel-frame-stationary.webp`: actual jeweled gold rim with a transparent center; overlay is stationary.
- `pointer-stationary.webp`: separate ruby-and-gold top pointer; overlay is stationary.
- `slice-texture-crimson.webp`, `slice-texture-onyx.webp`: repeating damask material surfaces for SVG `<pattern>` fills clipped into *live* SVG wedge paths.
- `originals/wheel-frame-stationary.png`, `originals/pointer-stationary.png`, `originals/slice-texture-crimson.png`, `originals/slice-texture-onyx.png`: untouched reference masters.

The generated live SVG face rotates with existing wheel state; the editable text labels rotate with it. Wedge count and angular width come from the current list of choices (2–10). The original `/randomizers/rosie-signet.webp` remains the fixed center crest. The frame, pointer, and crest never rotate and have `pointer-events: none`.

The source frame artwork itself contains a decorative ruby crest at the top. The separate pointer asset is precisely superimposed in its own stationary layer. No full-wheel raster is used for spinning.

Verified original PNG SHA256:
```text
wheel-frame-stationary.png 98d6d55f2c28b2bb3d0cff978e0ee14bee2540122bbeb3238fddcb36a944738b
pointer-stationary.png ff3cc3d16fb93f77416a780b6ac5acb43b439a77523ee7c09057b72c27abda14
slice-texture-crimson.png 1be6ed5d526d959d6e59ced8579b4c2e1beaa9f1e93884e935aa36c4e77560fc
slice-texture-onyx.png aca87e7ba7a1b22e7fba71f9e11604bcecbc41c04c8378e6ad59d4e9ab2a2ee6
```
