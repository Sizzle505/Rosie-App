# Yacht Dash expansion - staged artwork

The 39 approved image assets are archived in Dropbox:

`/Rosie-App-Transfer/Yacht-Dash-Approved-Expansion-Assets-20261119.zip`

This pack was generated from the approved November 19, 2026 art revisions, excluding rejected draft montages and generic Shiba victories. It contains:

- **Sakura Strait**: preserve the original five `public/captain-levels/` paintings. New victory image only.
- **Typhoon Passage**: five portrait 941×1672 paintings and storm obstacles.
- **Moonlight Regatta**: five portrait 941×1672 paintings, regatta obstacles and multiple rival yacht poses.
- **The Emperor's Finale**: five portrait paintings, combined hazards and the awards-podium victory illustration featuring the elderly Akita emperor and Captain Rosie.
- **Victory screens**: four portrait paintings, including the latest revised Moonlight and Emperor scenes.
- **Obstacles**: 20 transparent WebP sprites.

## Import

1. Download the ZIP from the Dropbox transfer folder above.
2. Unzip **at the repository root**, preserving `public/yacht-dash/`; the ZIP also includes `asset-manifest.json` (39 entries, filenames and SHA-256 checksums).
3. Commit `public/yacht-dash/` on this feature branch before merge. Do not replace existing `public/captain-levels/` paintings.
4. Run `node --test src/yachtDashExpansion.test.js`, `npm run build`, then visually inspect chapter selection and 75-second gameplay on desktop and iPhone.
5. Check stage unlocking after successful completion, missing-art fallbacks, collisions, rival passing, and the four victory illustrations.

The game code deliberately uses fallbacks to existing paintings and a generic buoy if a new asset is not yet in the repository. **Do not merge or deploy this branch as final until all binary art is imported and verified.**

## Implementation principles

Each chapter is a separate 75-second run with five scenic transitions. Sakura preserves original pickup mechanics; new stages introduce hazards, rival movement, risk/reward, and sequential unlocks. The Emperor's Finale is a new fourth chapter rather than a fifth scene of the Moonlight level.

No gameplay lane markings are baked into the paintings; the subtle CSS steering guidelines are reduced in intensity.
