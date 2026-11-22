# TeddyVerse character and asset-production standard

This standard applies to all **new** Teddy assets - especially Captain gameplay sprites and Haiku meditation poses. The existing Rosie artwork is a **composition and UI-placement reference**, not the identity of the new pet.

## Reference precedence
1. **Actual Teddy photographs** supplied in the private pet reference set, across multiple angles and lighting.
2. **Approved TeddyVerse-72 art** whose likeness has been checked against those photographs. Nine first-round corrections are not automatically approved.
3. The **corresponding original Rosie asset** - consult it for exact pose, crop, arrangement, costume style, lighting and safe areas. Never copy Rosie's anatomy, Shiba-specific appearance, face or coat merely because the source depicts Rosie.
4. Existing **generic assets** (gardens, scenery, laser barriers, cards, UI frames, scroll paper, lanterns, butterflies) should remain untouched unless a real visual inspection finds pet-specific content.

If a pet photo is not available to the artist, **do not generate a stand-in animal**. A false likeness is a rejected deliverable, even if the illustration is attractive. Never put private photos or unapproved pet images in public GitHub, source maps or production metadata.

## Captain - mandatory consistency
- Establish a single approved *Captain Teddy* uniform and craft design reference before finishing motion states: align cap, kerchief, clothing colors, proportions, canopy and helmet across Yacht Dash, Cosmic Odyssey and Ember Tunnel.
- Game sprites must have **identical registration, view direction, collision silhouette and reference center** to the original slot. Do not change the art dimensions, craft orientation, weapon origin or hitbox visually without testing. Maintain bank-left/bank-right, forward/rear, cruise/boost, attack, damage, dodge and defeat as distinct states.
- Victory illustrations may be detailed, but all depict the same Teddy. Preserve source scene logic, hero/Fiend hierarchy and compatibility with page/screen aspect ratios.
- Keep **Jett, Kitty and Chip** distinct and unchanged unless an explicit review slot identifies Rosie artwork embedded in them.
- Environmental assets are candidates for reuse, not automatic regenerate requests.
- Do not reactivate the Captain route until all required artwork, sprite animation QA and keyboard/touch/Tesla gameplay checks are signed off.

## Haiku, Zen Garden and meditation
- Teddy must remain visually consistent in contemplative, smug, pleased, affectionate, puzzled, enlightened and calligrapher expressions; robes, sensei posture and costume variants should derive from one approved character sheet.
- Keep animated breathing poses and loops registration-compatible; body/hat/ears should not jump between frames. Preserve page hierarchy: the adorable character is the visual focal point.
- Transparent sprites must have genuine alpha - no baked checkerboard or white halos. Scrolls, journal, hand-drawn decorations and frames should stay visually distinct from background paintings.
- iPhone-specific meditation scenes must have intentionally composed **portrait crops**; desktop/landscape scenes are separate. If an existing iPhone image is generic and works, retain it.
- Petals, small lanterns, butterflies and atmosphere effects are independent assets; reuse the existing originals where appropriate and add new ones only to fill a documented gap.
- Verify poem legibility and actual 5-7-5 text separately from artwork, plus timer, pause/end, background and audio controls.

## Technical approval
- Use the frozen `TV###` ID and exact source image path in [generation-queue.json](generation-queue.json).
- Produce a PNG master at least as large as the recorded source dimensions, with the same aspect ratio. The importer generates WebP/AVIF/JPEG as appropriate; do not upload a renamed PNG as a .webp.
- If `hasAlpha` is true, alpha is required and must remain clean after conversion; solid-background scenes should not acquire artificial transparency.
- Treat SVGs separately. Preserve vector paths, masks, data URIs, transparency and accessibility labels. Specifically, the two original coin-retina SVGs can be derived from approved Teddy coin art rather than commissioned anew.
- One slot per output; no collage, duplicate subject or invented captions. Use before/after, 1x phone crop and desktop crop proofs.
- Approval requires human reviewer + timestamp, matching Teddy identity, no broken fallback, format/dimension validation and recorded SHA-256. Passing a hash verifies the file identity, **not artistic correctness**.
- The generated application is always built from a **disposable isolated Teddy source clone**. No edits, packages, commits or artifacts are copied into RosieVerse production.
