# Yacht Dash expansion - art and playtesting

All **39 approved WebP assets are imported** under `public/yacht-dash/` on PR #190:

- 15 portrait backgrounds (five each for Typhoon Passage, Moonlight Regatta, The Emperor's Finale)
- 20 transparent obstacle and rival sprites
- 4 dedicated Captain Rosie victory screens
- `public/yacht-dash/asset-manifest.json` lists each file and its verified SHA-256 checksum.

The import came from Dropbox `/Rosie-App-Transfer/Yacht-Dash-Approved-Expansion-Assets-20261119.zip`. The original ZIP had a zero-byte fishing-skiff placeholder. The skiff was restored from the approved transparent PNG master, separately staged as `/Rosie-App-Transfer/Yacht-Dash-Skiff-Master-20261119.png`. Its corrected size and checksum are in the GitHub manifest. The one-time import workflow has been removed.

## Current experience

Sakura Strait is the original complete 75-second game, with its existing five paintings, collectibles and movement. It is followed by three **independent** 75-second chapters:

1. Typhoon Passage - storm wreckage, reef hazards, drifting debris, storm weather
2. Moonlight Regatta - illuminated hazards, rival yachts and night scenery
3. The Emperor's Finale - imperial harbor, mixed hazards and the emperor's awards ceremony

Each new chapter has five approved 941 × 1672 portrait paintings. Artwork loads from the repository, not from Dropbox at runtime.

**All four chapters are unlocked during playtesting** using `YACHT_PLAYTEST_ALL_LEVELS = true` in `src/yachtDashExpansion.js`. Local score records and up to three performance medals are tracked per chapter; locks may be re-enabled later by changing that one flag. The level picker has victory-art previews to inspect awards without first completing a voyage.

## QA

- `node --test src/yachtDashExpansion.test.js src/yachtDashArt.test.js`
- `npm run build`
- Inspect desktop and iPhone layout, swipe/joystick/keyboard steering, level switching, hazards, animation smoothness and 75-second success/failure
- Confirm medals, per-chapter best records, victory previews and no unexpected scroll
- Confirm Sakura's five original paintings were not modified
- Keep PR #190 in draft until visual gameplay QA is satisfactory; do not merge into production without release approval
