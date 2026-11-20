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

## Additional environmental animation prototypes (same ChatGPT pack)

The follow-on archive is named **Ember Tunnel Five Animation Prototypes.zip** in the ChatGPT conversation. It contains the above three character candidates plus:

| Hazard | Frames | Grid | Cell size | Intended level |
|---|---:|---|---|---|
| Lava geyser | 6 | 3 x 2 | 384 x 384 RGBA PNG | Molten Depths |
| Falling basalt | 8 | 4 x 2 | 384 x 384 RGBA PNG | Molten Depths |

Both were extracted from ChatGPT-generated concept artwork and given consistent canvas registration, lossless WebP atlases and GIF previews. They **are not native-resolution production sprites**. Before gameplay use, remove residual conceptual edges, repaint at proper source resolution, and compare every hazard animation's visible active frame with its physics warnings and hitbox.

**QA recorded:** Validated five sprite atlases and all 42 separate RGBA frames for uniform dimensions, nonempty image content and transparent pixels. ZIP integrity check passed (66 members). This is structural validation, not visual art approval or gameplay QA.

No image binaries were imported to GitHub in this pass. Draft PR remains isolated from production.

## 2026-11-20 follow-up: Cinderclaw independent 12-frame redraw

A new **Ember Tunnel Cinderclaw 12 Frame Upgrade.zip** package was generated in ChatGPT. This supersedes the 8-frame extracted Cinderclaw animation *for art review*. It was not uploaded to GitHub.

- Source is a newly generated, transparent 4 x 3 sprite sheet at 1448 x 1086 pixels, approximately 362 x 362 source pixels per pose.
- Separate cleaned alpha PNG cells are registered at 384 x 384 with no stretching; PNG and lossless WebP atlas output is 1536 x 1152. 12 poses: idle, breath glow, walk A/B, crouch, fireball charge, fireball launch, roar, burrow start, burrow deep, re-emerge, exhausted.
- Includes action manifest, native source, GIF, and contact preview; ZIP CRC and all twelve alpha frames validated.
- Transparent fringe cleanup was applied, but independent mobile/desktop visual QA and per-pose clipping review remain mandatory.
- The Mole King standalone redraw could not be obtained reliably: attempted generations returned labeled group montages. **Retain the 8-pose extracted Mole King as prototype only**, do not misrepresent it as a new native-resolution character master.

## Isolated boss mechanics groundwork

`src/emberBossEncounter.js` adds deterministic, warning-first state machines, with tests in `tests/ember-boss-encounter.test.mjs`. The modules are **not imported or activated in the existing 75-second drill course**:

| Encounter | Health | Attacks | Telegraph | Active window | Vulnerable recovery |
|---|---:|---|---|---|---|
| Cinderclaw | 3 | Fireball, Burrow | 1.15 / 1.35 seconds | 0.55 / 0.70 seconds | 1.30 / 1.45 seconds |
| Mole King | 4 | Quake, Earth Burst | 1.40 / 1.30 seconds | 0.65 seconds | 1.55 / 1.45 seconds |

A boss only takes one hit per exposed recovery from a player Turbo attack that is in range. The state machine emits attack warnings and hit/defeat events, but leaves actual projectile paths, collision zones and score payouts to future level integration. CI validates the timing rules, one-hit limits and terminal defeat behavior.

## Remaining release gates
1. Redraw the Mole King from an isolated, high-resolution reference into a consistent true sprite sheet.
2. Import reviewed images from the ChatGPT package into `public/ember-drill/` on the development branch; no binary files from the new pack have been transferred into GitHub here.
3. Implement Molten Depths and Royal Treasury as actual separate stages before enabling either boss.
4. Playtest on iPhone/WebKit, iPad and desktop with real projectile collision, warning timing, recovery cues, image alpha and frame registration.
5. Preserve the existing Rosie vehicle and do not merge to production until stage and art QA pass.
