# Royal navigation integration

18 exact approved WebP assets in public/rosieverse/ui/royal-nav. Live text and existing route handlers remain in main.jsx. Both nav families retain their order and the toggle only shows the destination. The independent arrow badge mirrors horizontally. Home is text-free; Resources and Home use equal sizes. Account and soundtrack launchers retain original classes, positions, dimensions, handlers and signed-in indicator. No overarching frame or page background. Desktop remains in its existing header location; mobile keeps its separate bottom dock, raised 16px to accommodate the slightly taller toggle without overlap. Keyboard focus and reduced-motion support retained. The artwork is integrated on a separate deployment-disabled branch, not production. Test: npm run test:nav. Browser QA on actual devices is required before release.

## Revised composition
Use one invisible responsive positioning grid to remove independent fixed offsets; 54px equal desktop seals, 52px tab strip, 34px icon canvases and 11px labels. Mobile retains the lower two-row footprint. Account and soundtrack medallions remain untouched. Actual browser visual QA remains necessary.
