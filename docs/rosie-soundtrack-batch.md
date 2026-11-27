## Soundtrack upgrade — staging only

Upload the twelve processed MP3 files to `public/rosie-music/` before merging or deploying. Run `node scripts/verify-rosie-soundtrack-batch.mjs`, `node --test src/rosieMusicCatalog.test.js`, and `npm run build`. Then test real desktop and iPhone playback, including boss arrival, final victory, pause/resume, silence, and navigation. The old music remains in place. Do not merge until the twelve asset hashes pass.

- tunnel-tyrant.mp3: The Tyrant's Coronation
- tunnel-clockwork-boss.mp3: Clockwork Confrontation
- tunnel-caverns.mp3: Clockwork Caverns
- tunnel-depths.mp3: Clockwork Depths
- tunnel-crown-victory.mp3: Triumph of the Crown
- rosie-signature.mp3: The Seven-note Journey
- zen-garden-dusk.mp3: Garden at Dusk
- zen-temple-rain.mp3: Temple Rain Meditation
- cosmic-victory.mp3: Brass Launch Beat
- yacht-victory.mp3: Imperial Victory Fanfare
- vault-treasure.mp3: A Private Treasure
- randomizers-monte-carlo.mp3: Monte Carlo Midnight
