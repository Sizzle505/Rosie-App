# Ember Tunnel - Three Character Animation Review Pack
Date: 2026-11-20
Status: review/prototype, not production.

A ChatGPT-generated archive named **Ember Tunnel Three Character Animation Prototypes.zip** is attached to the active ChatGPT conversation, not uploaded to this repository. Do not assume the PNG or WebP files exist in GitHub or add image imports until binary transfer and art review are completed.

## Artwork contents
| Character | Frames | Atlas | Source quality | Intended level |
|---|---:|---|---|---|
| Copperjack | 12 | 4 columns x 3 rows; 2048x1536; 512x512 frames | Newly generated native transparent sprite sheet; alpha low-level noise cleaned | Clockwork Catacombs |
| Cinderclaw | 8 | 4 columns x 2 rows; 2048x1024; 512x512 frames | Extracted from ChatGPT-generated concept poster; not native 512px painted frames | Molten Depths |
| Mole King | 8 | 4 columns x 2 rows; 2048x1024; 512x512 frames | Extracted from ChatGPT-generated concept poster; not native 512px painted frames | Royal Treasury |

All frames align at a baseline of y=94% with centering on x=50%. Individual RGBA PNGs, lossless WebP atlas copies, GIF previews and per-character frame labels are provided.

### Copperjack action indexes
0 idle; 1 idle variation; 2-3 walk; 4 aim high; 5 charge; 6 thrust; 7 recoil; 8 hit sparks; 9 stagger; 10 collapse; 11 defeated.

### Cinderclaw action indexes
0 idle; 1 advance; 2 fireball charge; 3 fireball release; 4 burrow; 5 emerge; 6 roar; 7 damaged.

### Mole King action indexes
0 idle; 1 boast; 2 quake slam; 3 earth burst; 4 hit; 5 enraged; 6 defeated; 7 surrender.

## Acceptance criteria before integration
1. Verify sprite sheets against the concept reference and inspect all 28 frames on a dark background at actual gameplay scale. Look for clipped paws, scepter/weapon fragments, detached debris, alpha halos and transparent masking artifacts.
2. **Cinderclaw and Mole King are only temporary prototype sprites**: their source artwork was extracted from a concept montage, so their effective painted resolution is much lower than the 512px exports. They require independent high-res character masters and in-betweens prior to release.
3. Copperjack's 12 poses can be playtested as a first-pass sprite atlas, subject to alpha inspection and apparent-size QA; collision shapes must come from physics, not the full image rectangle.
4. Character hitboxes and events should be authored separately, and the animation player should use the documented frame grid/anchor instead of assuming all atlas images are interchangeable.
5. New image imports, art approval, enemy AI, sound integration and mobile hitbox tests remain pending.
6. Keep draft PR #192 isolated from main; no merge or Vercel production promotion without review.

The historical concept montages are not a replacement for distinct assets. Do not count resized/upscaled crops as independently drawn 512px sprites.
