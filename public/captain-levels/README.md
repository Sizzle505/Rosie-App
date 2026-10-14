# Captain Five Seas asset manifest
Five independent level backgrounds and eight transparent cinematic overlay images.
All images are separate optimized WebPs sourced from the user-provided/generated
artwork staged in Dropbox under:
`/HTML/Repos/00_Inbox/Rosie_Captain_Levels_20261010/`.
The image files are in `public/captain-levels/` and are reused in any order.
Five Seas selects a random shuffled starting level on every new Captain page visit.
Every nine game seconds it advances to the next unvisited level; all five appear
during one 45-second voyage, with a new shuffle for a replay.

**Rosie identity**: The portrait remains `public/captain-rosie-deck.webp`
from PR #29 (derived from the established Captain Rosie illustration).
Do not replace Rosie with either of the newly generated generic Shiba portraits.
The original wooden ship `public/captain-rosie-ship.webp` is likewise retained.

**Motion**: The WebPs are independently moving composited alpha layers, not a
sprite sheet or baked animation. CSS adds distinct slow wave drift, wake,
rain, mist, petals, rare lightning and reflected sunlight. A user's reduced-
motion setting disables these animations. Layer opacity keeps pickups readable.
