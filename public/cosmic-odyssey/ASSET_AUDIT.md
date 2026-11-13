# Cosmic Odyssey artwork audit - November 12, 2026

## What is verified
- The connected Dropbox folder `/Rosie-App-Transfer` contains these original transfer packages:
  - `Captain-Rosie-Cosmic-Odyssey-Foundation-Art.zip` (16,297,917 bytes)
  - `Captain-Rosie-Cosmic-Odyssey-Fiends-All-Assets.zip` (14,271,851 bytes)
  - `Captain-Rosie-Cosmic-Odyssey-Environment-Batch-2.zip` (9,421,323 bytes)
  - `Captain-Rosie-Cosmic-Odyssey-Player-Batch-3.zip` (13,937,587 bytes)
  - `Captain-Rosie-Cosmic-Odyssey-UI-Batch-4.zip` (5,493,705 bytes)
  - `Captain-Rosie-Cosmic-Odyssey-Playable-Prototype.zip`.
- The ZIPs' existence and sizes were verified from Dropbox metadata. Their internal member lists could **not** be retrieved by the connected Dropbox text interface, which has a 5 MB extraction limit. Do not treat a ZIP's presence as proof that each member was inspected or imported.
- The Cosmic Odyssey development branch had **23** optimized gameplay image assets before this pass. It now includes **19 additional standalone optimized artwork files** imported from the project's verified original artwork, totaling **42 image assets** under `public/cosmic-odyssey/assets/`.
- These are independent images, **not crops from a composite sprite sheet**. They are optimized WebP derivatives of the full source PNGs. Keep original masters in their archived packages.

## New art connected to gameplay
| Art | Gameplay use |
|---|---|
| `rosie-cruise` | Default movement (no active weapon) |
| `rosie-bank-left`, `rosie-bank-right` | Banking during turns |
| `rosie-dodge` | Evasive turn near a Fiend |
| `rosie-boost` | Sustained straight movement |
| `rosie-laser`, `rosie-rocket` | Weapon-specific firing states only |
| `chip-turn`, `chip-ascent`, `chip-rear`, `chip-dash` | Chip's maneuvering and acceleration |
| `chip-fire` | Chip's attack image |
| `chip-stun` | Chip's hit/defeat image |
| `jett-retreat`, `kitty-retreat` | Character-specific defeat and damaged-retreat images |
| `laser-bolt` | Independent image-based laser projectile overlay |

## Existing artwork still actively used
- Rosie base/vertical/rear/front/damage images and large shield.
- Jett, Kitty, Chip base sprites and existing Jett and Kitty attack images.
- Cheese, rocket/shield pickups, portal, explosion, rocket/laser/pause buttons, and life emblem.
- Nebula Passage and Lunar Outpost backgrounds.

## Outstanding assets already produced but not yet individually recovered from ZIPs
- Jett's individual turning, ascent, rear-flight, windup, stun states and purple plasma/exhaust overlays.
- Kitty's alternate navigation, windup, stun, boost, twin-laser and thruster overlays.
- Additional Fiend impact, charge and stun effects; original Jett purple and Kitty pink projectile images remain to be recovered.
- Additional wall-junction and floor-tile art, decorative hazards, power-bone/cheese pickup variants, optional result/header art.
- Rosie damage/respawn/victory transition frames and alternate visual effects.
These are candidates for **recovery and integration**, not necessarily candidates for generating anew. Verify actual ZIP members and quality before importing.

## Technical caveats
- Each standalone sprite is a key pose, not a complete frame-by-frame animation. The engine currently handles movement interpolation and defeat transitions.
- Health, scoring, gameplay rules, and hitboxes are separate from image bounds.
- Validate at iPhone scale for visual size and corridor occlusion before merging.
- Do not merge this experimental game into the main Captain games without playtesting.

## Follow-up integration - November 12, 2026
Three more original **standalone** assets were imported from verified source images and optimized as WebP, without extracting from contact sheets:
- `assets/chip-bolt.webp` - Emerald Ringed Energy Bolt - image-backed projectile fired by Chip
- `assets/rosie-projectile.webp` - Captain Rosie's Golden Paw Rocket - image-backed rocket now travels down the corridor and explodes
- `assets/meteor.webp` - Meteor Mischief Golden Cosmic Frame - selectable third playtest backdrop

Prototype gameplay additionally supports telegraphed Fiend ranged attacks. Jett and Kitty currently use **temporary colored projectile styling**, not recovered standalone projectile masters; do not classify those two effects as production-complete. Projectiles follow the open tile grid, respect the protection shield, and can hit Rosie either when they enter her square or when she moves into theirs.

**Verification:** JavaScript passed syntax checks. Simulated mobile 11×15 and desktop 17×11 tests confirmed the original Chip projectile asset, shield-blocked collision, unshielded damage, and Meteor selection. The connected Vercel preview was reported READY. Real iPhone visual and input testing is still outstanding.

**Archive limitation:** The connected Dropbox provider confirms the source ZIPs exist but its text extraction interface rejects ZIPs larger than 5 MB. A signed download was requested but the working container cannot retrieve its host. Therefore the full member-by-member ZIP audit cannot yet be certified. Continue recovering source-quality Fiend assets when accessible; never replace them with contact-sheet crops.


## Environment integration - November 12, 2026 (later pass)
Verified all six source PNGs against the exact members of `Captain-Rosie-Cosmic-Odyssey-Environment-Batch-2.zip`, then imported small WebP gameplay derivatives. Their original full-size image files remain available in the ZIP. Images were **not** arbitrarily cropped from a montage during this pass.

| Source ZIP member | Installed gameplay image | Use |
|---|---|---|
| `11-t-junction.png` | `assets/junction-tee.webp` | Actual maze T-junction floor inlay |
| `12-crossing.png` | `assets/junction-cross.webp` | Actual four-way floor inlay |
| `13-end-cap.png` | `assets/junction-endcap.webp` | Dead-end corridor floor inlay |
| `15-fiend-spawn-node.png` | `assets/fiend-spawn.webp` | Painted launch platforms under Rosie and each Fiend |
| `19-large-asteroid.png` | `assets/asteroid-large.webp` | Decorative outer-playfield space scenery |
| `20-small-asteroid.png` | `assets/asteroid-small.webp` | Secondary outer scenery and occasional wall crater detail |

**Technical scope:** Inlays and scenery do not change maze connectivity, logical hitboxes, item placement, or enemy pathfinding. The shield is now centered on Rosie's clamped rendered visual bounds rather than the unclamped tile center. This corrects the alignment discrepancy near edges of the board. Original image dimensions vary and the optimized WebP files are intended only for gameplay-scale use; do not enlarge them to hero/banner size.

**Repository count:** 48 optimized image files in `public/cosmic-odyssey/assets/`, including the six new environment imports.

**Verification:** New Git blobs' SHA-1 hashes matched local optimized files. Runtime simulations of the portrait 11×15 and landscape 17×11 mazes produced all four launch pads, actual floor junction classes, a centered shield, and successful transition to Lunar Outpost. Real-device display review remains recommended.

## Expanded environment integration - November 13, 2026

**Source preservation:** Complete Environment Batches 6, 7, 8, and 9 are saved under `/Rosie-App-Transfer/` in Dropbox, along with the 34-file optimized environment ZIP. All ten newest full-resolution backgrounds were additionally uploaded as individually named PNGs. The Batch 6 environment *atlases* remain source material: they are not assumed to be seamlessly tileable and were not chopped into gameplay sprites.

**Installed gameplay art:** 82 optimized WebP assets under `public/cosmic-odyssey/assets/` (48 before this pass, 34 newly added). The additions consist of 10 new primary backgrounds, 4 earlier alternative backgrounds, and 20 individually authored transparent props. New artwork is retained in the original archives; optimized copies are used in-browser.

### Ten campaign environments
| Stage | Scene | Background |
|---|---|---|
| 1 | Nebula Passage | `scene-nebula.webp` |
| 2 | Meteor Mischief | `scene-meteor.webp` |
| 3 | Lunar Outpost | `scene-lunar.webp` |
| 4 | Crystal Caverns | `scene-crystal.webp` |
| 5 | Volcanic Foundry | `scene-foundry.webp` |
| 6 | Derelict Starship | `scene-derelict.webp` |
| 7 | Comet Ice Canyon | `scene-ice.webp` |
| 8 | Ringworld Gardens | `scene-garden.webp` |
| 9 | Black Hole Observatory | `scene-blackhole.webp` |
| 10 | Ancient Alien Ruins | `scene-ruins.webp` |

Four alternate views (`scene-nebula-alt`, `scene-meteor-alt`, `scene-lunar-alt`, `scene-lunar-alt2`) are also installed; use the header scenery selector to cycle through all 14. The start overlay allows direct selection of any stage for playtesting without completing the earlier levels. Sequential advancement carries score, remaining hull and ammunition forward.

### Props and mechanics
- Character-specific spawn artwork: `spawn-jett`, `spawn-chip`, `spawn-kitty`, `gravity-pad` for Rosie's launch point, and `cosmic-exit-new` for the final portal.
- Environment wall decoration uses the additional art (`hazard-molten`, `obstacle-crystal`, `hazard-gate`, `reactor-cyan`, `beacon`, `debris-satellite`, `mining-drill`, `turret-prism`, `barrier-cyan`, `meteor-flame`, `sentry-gold`). Wall decoration does not modify traversal or hitboxes.
- New floor interactions: cargo supply crates grant three ammunition, repair stations heal one hull (or temporary protection if already at full health), gravity pads grant short protection and one ammunition, plasma mines inflict a collision hit unless shielded, and a paired wormhole system allows two-way travel from Stage 4 onward.
- Previously approved Rosie, Jett, Kitty and Chip sprite states are preserved. Arrow/WASD input, treat-funded weapons, Fiend AI and projectile hits are unchanged apart from the new environment interactions.

### Technical verification and cautions
- JavaScript parse passed. Simulated 393×852 mobile and 1280×800 desktop test beds generated maze cells, seven/eight decorative objects, all four launch pads, functional item placement, correctly paired wormholes on later stages, and final-stage win state. A full live browser screenshot and actual iPhone touch testing have **not** been performed and must not be claimed.
- Responsive D-pad controls were enlarged for normal-height portrait phones, with a compact fallback for short viewports.
- Revisit balance over ten stages: increased speed and plasma mines may require adjustment based on playtests. Do not increase difficulty further without feedback.
- All changes remain in the Cosmic Odyssey development branch / Draft PR #159. Do not merge into production until visually reviewed.

## Maze architecture and targeting revision - November 13, 2026

**Corrected visual hierarchy:** The illustrated scene is now rendered inside the actual gameplay board at near-full contrast. The outside page uses a subdued vignette. Corridors are transparent, with no generic square floor overlays.

**New connected partition assets:** Six 512×512 SVG atlases are stored as `assets/partitions-deco.svg`, `partitions-lunar.svg`, `partitions-crystal.svg`, `partitions-foundry.svg`, `partitions-verdant.svg`, and `partitions-void.svg`. Each contains 16 independent graphical configurations representing the four-bit N=1, E=2, S=4, W=8 wall adjacency mask: isolated pillar, end caps, straight sections, bends, T-junctions and four-way junctions. A wall cell selects the matching atlas position with `--partition-x`/`--partition-y`. Neighbor connectors share the same dimensions. Collision remains based on `grid`, not image alpha.

Material families: Nebula→deco; Meteor/Foundry→foundry; Lunar/Ice→lunar; Crystal/Ruins→crystal; Garden→verdant; Derelict/Black Hole→void. Alternative scenery previews update wall materials as well.

**Spawn-platform lifecycle:** Rosie's and each Fiend's large launch-pad artwork is a short opening flourish only. Once a stage begins, pads fade and their DOM images and launch-cell classes are removed after 820 ms. They do not remain scattered through the level.

**Directional auto aim:** `acquireDirectionalTarget(origin,facing)` considers only live Fiends forward of Rosie in a ~31° cone. A densely sampled grid ray rejects any wall-covered shot, including diagonal corner intersections. Candidates are ranked by perpendicular distance to her firing direction, with range breaking ties. A briefly shown target reticle confirms the lock; the laser beam and rocket projectile rotate toward the chosen target. If there is no visible Fiend, the weapon fires straight in the last movement direction. This is an aim assist, not automatic firing.

**Verification:** JavaScript parses. Mock gameplay checks covered 11×15 portrait and 17×11 desktop grids, fourteen/fifteen distinct wall connection masks, proper scene-material switching, straight-on and offset enemy locks, nearest-aligned Fiend priority, wall obstruction, and targets behind Rosie. A separate lifecycle test confirmed all four spawn stations fade and are removed from the new session. The rocket rendered with a diagonal angle (18.43°) toward an off-axis target and reverted to cardinal heading when the target's line was blocked. These are logic/simulation tests, not a live iPhone visual inspection.

**Status:** Development preview only, unmerged Draft PR #159. A real browser/on-device screenshot review remains necessary, particularly the look of the six new modular partition atlases at native iPhone sizes.
