# RosieVerse Timekeepers - Luxury asset manifest

**Version:** 2026-10-15-a
**Source:** Dropbox /Rosie-App-Transfer/Timekeepers Asset Pack - Midnight Observatory/
**Application path:** `public/rosieverse/timekeeper/midnight-observatory/luxury/`

This package contains eight circular alpha-clipped luxury dial textures, nine independently rotatable hands with the same central anchor, three pivot caps, and seven World Clock UI elements.

## Runtime assets

| File | Kind | Pixel size | Notes |
|---|---|---|---|
| `dial-textures/sapphire.webp` | dial-texture | 640×640 | Transparent |
| `dial-textures/emerald.webp` | dial-texture | 640×640 | Transparent |
| `dial-textures/onyx.webp` | dial-texture | 640×640 | Transparent |
| `dial-textures/garnet.webp` | dial-texture | 640×640 | Transparent |
| `dial-textures/amethyst.webp` | dial-texture | 640×640 | Transparent |
| `dial-textures/pearl.webp` | dial-texture | 640×640 | Transparent |
| `dial-textures/teal.webp` | dial-texture | 640×640 | Transparent |
| `dial-textures/lapis.webp` | dial-texture | 640×640 | Transparent |
| `world-clock-hands/blued-hour.webp` | hand | 512×512 | Pivot (256,256) |
| `world-clock-hands/blued-minute.webp` | hand | 512×512 | Pivot (256,256) |
| `world-clock-hands/blued-second.webp` | hand | 512×512 | Pivot (256,256) |
| `world-clock-hands/blued-pivot.webp` | pivot | 128×128 | Transparent |
| `world-clock-hands/dauphine-hour.webp` | hand | 512×512 | Pivot (256,256) |
| `world-clock-hands/dauphine-minute.webp` | hand | 512×512 | Pivot (256,256) |
| `world-clock-hands/dauphine-second.webp` | hand | 512×512 | Pivot (256,256) |
| `world-clock-hands/dauphine-pivot.webp` | pivot | 128×128 | Transparent |
| `world-clock-hands/filigree-hour.webp` | hand | 512×512 | Pivot (256,256) |
| `world-clock-hands/filigree-minute.webp` | hand | 512×512 | Pivot (256,256) |
| `world-clock-hands/filigree-second.webp` | hand | 512×512 | Pivot (256,256) |
| `world-clock-hands/filigree-pivot.webp` | pivot | 128×128 | Transparent |
| `world-clock-ui/globe.webp` | ui | 242×256 | Transparent |
| `world-clock-ui/city-plaque.webp` | ui | 512×152 | Transparent |
| `world-clock-ui/sun.webp` | ui | 256×220 | Transparent |
| `world-clock-ui/moon.webp` | ui | 256×217 | Transparent |
| `world-clock-ui/completion-sparkle.webp` | ui | 256×246 | Transparent |
| `world-clock-ui/divider.webp` | ui | 400×77 | Transparent |
| `world-clock-ui/jewel.webp` | ui | 176×180 | Transparent |

## Integration requirements

- Keep the existing Rosie, lever mechanisms, external gears, clock bezel, progress ring and shared bottom navigation unchanged.
- Render dial textures as a circular layer behind the transparent clock-face overlay and behind the clock hands.
- Render the World Clock hour/minute hands only in World Clock mode; digital stopwatch and timer remain primary in their own modes.
- Day/night icons, city plaque, globe icon and completion flourish are source-registered, transparent components.
- The original ten generated PNG images belong in Dropbox as source masters; the processed WebP assets are GitHub runtime files.
- Review iPhone portrait screenshots at 353px, 390px, and 430px widths, and verify control interactions.
