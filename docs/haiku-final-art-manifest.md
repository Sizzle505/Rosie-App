# Haiku Zen Garden - final art integration (November 20, 2026)

## Archive and source
- Original full-resolution PNGs plus resized transparent WebP assets: Dropbox `/Rosie-App-Transfer/HaikuZenGardenFinal10ProductionAssets.zip`.
- A temporary base64 text transfer manifest was saved to Dropbox as `/Rosie-App-Transfer/HaikuZenGardenFinal10GitHubTransfer.txt` so GitHub could receive real binary WebP objects. It is not used by the app.
- All optimized production images are tracked under `public/rosieverse/haiku/final/`, with real alpha channels.
- Production is unchanged until the draft Haiku PR is reviewed and merged.

## Current use

| Asset | UI placement |
| --- | --- |
| `breathe-with-rosie.webp` | Meditation program: Breathe with Rosie |
| `quiet-sit.webp` | Meditation program: Quiet Sit |
| `a-little-calm.webp` | Meditation program: A Little Calm |
| `evening-unwind.webp` | Meditation program: Evening Unwind |
| `haiku-reflection.webp` | Meditation program: Haiku Reflection |
| `journal-cover.webp` | Closed Book of Small Wisdom shown when journal empty |
| `journal-open.webp` | Open poetry book shown with saved poems |
| `rosie-enlightened.webp` | Completed meditation celebration |
| `lotus-breath-halo.webp` | Dimmed, slowly breathing background halo in immersion |
| `meditation-controls.webp` | **Reference only**: artwork has painted control glyphs; not a functional control. |

## Engineering safeguards
- The five program buttons remain real HTML buttons with meaningful names, focus outlines, and active states.
- The journal art is purely decorative; verses remain selectable, accessible HTML buttons.
- The audio bar is not displayed as an interactive false control. It should be split into a blank control-panel frame plus separate button states before use.
- The background halo's animation honors `prefers-reduced-motion` via existing CSS.
- The image loading and layout are checked at desktop, tablet, and phone dimensions in `tests/haiku-final-art-visual.mjs`.
- No generated artwork is written into the current main/production branch.
