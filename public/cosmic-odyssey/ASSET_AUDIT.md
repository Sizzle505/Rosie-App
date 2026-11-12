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
