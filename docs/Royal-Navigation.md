# Royal navigation integration

18 exact approved WebP assets in public/rosieverse/ui/royal-nav. Live text and existing route handlers remain in main.jsx. Both nav families retain their order and the toggle only shows the destination. The independent arrow badge mirrors horizontally. Home is text-free; Resources and Home use equal sizes. Account and soundtrack launchers retain original classes, positions, dimensions, handlers and signed-in indicator. No overarching frame or page background. Desktop remains in its existing header location; mobile keeps its separate bottom dock, raised 16px to accommodate the slightly taller toggle without overlap. Keyboard focus and reduced-motion support retained. The artwork is integrated on a separate deployment-disabled branch, not production. Test: npm run test:nav. Browser QA on actual devices is required before release.

## Revised composition
Use one invisible responsive positioning grid to remove independent fixed offsets; 54px equal desktop seals, 52px tab strip, 34px icon canvases and 11px labels. Mobile retains the lower two-row footprint. Account and soundtrack medallions remain untouched. Actual browser visual QA remains necessary.

## Compact lacquer revision
Desktop shell reduced from 846px to 650px maximum; bar 40px high; both seals 40px; icon canvas 23px, labels 9px. Toggle 54×34px with 23px arrow medallion. Violet and beveled-gold treatments match the approved persistent medallions; selected state remains inset with no enlarged tab. Mobile bar reduced to 50px and icon canvas 25px; account and music sizes/positions unchanged. Retains exact approved WebP bytes and independent click targets. No production deployment.

## Matched lacquer
The shared navigation and switch background now uses a 640×96 WebP extracted from the symbol-free purple regions of the exact approved music medallion (source git blob c3a230dc72ea1560097a8becc006d6517b806f36), resampled and blended into an elongated strip with localized reflections. Original medallions and icons are unchanged. Compact dimensions retained. The texture is a separate asset, not a flattened menu.

## Final matched seals and richer lacquer
Approved replacement Home and Resources seals normalized to the same 512×512 transparent canvas with equal optical bounds. Home remains text-free; Resources uses the crowned R without a small baked label. New 768×96 lacquer texture is sampled from the approved Home artwork, mirrored into a continuous wide strip and toned down for legibility. The small switch and active tab crop the same material instead of squeezing it horizontally. Paw, music, remaining icons, layout dimensions and route handlers are unchanged. Preview branch only.

## Zen navigation
The Games family now contains Fortune, Cheese, Captain, Zen, Vault and Random. Zen uses a transparent gold-relief lotus SVG, with an active state and the existing #haiku destination. Both menus use six equal-width columns inside the approved compact width. Other art, layout and behavior remain unchanged.
