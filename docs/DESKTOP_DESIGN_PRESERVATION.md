# Desktop Design Preservation System

## Reference and scope
The approved desktop design is **1920 × 1080 CSS pixels at browser zoom 100%**. It is the source composition, not merely a breakpoint. This system preserves that composition across tall laptops, 16:10/3:2 displays, short screens, and ultrawides. It does not impose a uniform template on bespoke pages.

Layout families remain distinct:
- **Phone:** existing phone rules; no changes from the desktop preservation layer.
- **Tablet:** existing tablet/iPad rules, including pointer-coarse landscape tablets above 1200px.
- **Desktop:** fine-pointer, hover-capable workstations at 1200 CSS px and above.

The preservation layer is `src/desktop-design-preservation.css`; it is imported **last** by `src/main.jsx`. When making changes, preserve that order.

## Rules that keep the art direction intact
1. **Keep 1920 × 1080 unchanged.** Every new desktop exception must first show that it is inert at the approved baseline. Do not rewrite original playground exports or hand-adjusted offsets for the baseline.
2. **Protect the focal composition.** On viewports above 1920px, center a capped 1920px *content stage* and let atmospheric artwork continue to the monitor edges. Do not stretch a card, illustration, workbench, or game board to fill ultrawide space.
3. **Preserve relationships, not raw pixels.** Scale stage-relative X coordinates with its width and Y coordinates with its available height; use clamps to retain legibility and safe bounds. For artwork with a natural aspect ratio, use contain or intentional crop anchoring rather than distortion.
4. **Treat independent pages independently.** Haiku, QR Atelier, Calculations, Recipes, Timekeepers, Fortune, Cheese, Randomizers, Reviews, Home, and game pages have individually authored relationships. Avoid global transforms of page roots, CSS `zoom`, and font scaling that changes gameplay/input coordinates.
5. **Respect scrolling.** On short monitors, let overflow panels scroll or participate in document flow instead of clipping controls underneath the persistent nav. Do not arbitrarily hide overflow on document surfaces.
6. **Protect device families.** Never add viewport-only desktop overrides that change the existing iPad layout, because landscape iPads can exceed 1200 CSS px. For new desktop-only corrections, pair `min-width` with `(hover:hover) and (pointer:fine)`; use a separate tablet stylesheet where needed.

## Current page-level safeguards
- **Haiku Garden:** previously exported 1920px playground offsets interpolate in both width and height at other workstation ratios; scales and art remain unchanged.
- **QR Atelier:** the workshop and fixed left-hand painted viewport are tethered to the same 1920px centered stage on ultrawides.
- **Recipes:** chef art, desktop discovery controls, and recipe reading area occupy the same centered bounded stage on ultrawides; short screens can scroll to controls.
- **Calculations:** the two-column instrument retains its maximum approved stage width, with full-bleed velvet surrounding it.
- **Other pages:** their existing responsive layout rules remain unchanged until ratio evidence identifies a particular fault; this is intentional to preserve individually approved arrangements.

## Regression review
Run `node tests/desktop-design-preservation.mjs` with Vite on port 4173 and Playwright installed. GitHub Actions workflow `desktop-design-preservation.yml` also executes this on relevant PRs and uploads screenshots and geometry.

Current desktop matrix: **1366×768, 1440×900, 1600×900, 1792×856, 1920×1080, 1920×1200, 2256×1504, 2560×1080, 3440×1440**, covering 16:9, 16:10, 3:2, and ultrawide compositions. Phone 390×844, iPad 1366×1024 (touch pointer), and a 1024×768 laptop are negative-control checks.

Before merging: review screenshots of QR Atelier, Calculations, Recipes, Haiku, and Timekeepers, and retain the original 1920×1080 screenshot as the approved baseline. Extend the suite page by page; do not declare the entire app visually certified from a subset of pages.
