# Rosie's Recipes — implementation and asset provenance

## Installed and verified image assets

The six approved illustrated files were imported from `/Rosie-App-Transfer/Rosies Recipes Assets.zip` via a one-time GitHub Actions transfer. The import checked the original archive's SHA-256 (`e5f465e2b274e22db465ce6b9182f256ef407857ed94299582a593fb98467bb0`) before committing. The temporary transfer workflow was automatically removed after the successful commit.

- `public/rosieverse/recipes/recipes-hero.webp` — approved orange-gold royal kitchen, Rosie and food, full tall source
- `public/rosieverse/recipes/recipes-title.webp` — original transparent Royal Cookbook crest
- `public/rosieverse/recipes/recipes-card-frame.webp` — original transparent collectible card frame
- `public/rosieverse/recipes/recipes-parchment.webp` — original transparent recipe parchment
- `public/rosieverse/recipes/recipes-controls.webp` — original decorative controls sheet, used for search
- `public/rosieverse/recipes/recipes-continuation.webp` — original satin drapery background extension

All were separately retrieved from GitHub and verified as nonempty WebP blobs. They are referenced by the actual `src/RosieRecipes.jsx` React page, `src/RosieRecipes.css`, and `src/RosieRecipesAssetLayout.css`.

## Current page functionality

- Route: `/#recipes` via Rosie’s Resources, with its regular four-destination bottom navigation
- Original 25 titles, grouped by Breakfast, Small Bites, Main Courses, Desserts
- Live search, sorting, category filtering, favorites persisted on the current device
- Genuine illustrated recipe-card frames and a detailed parchment view
- Original recipe text placeholders only; no invented ingredients, cooking times, instructions or recipe photography
- Ingredient checkboxes and print available automatically when exact original contents are added

## Import the source text later

Fill in each entry in `src/rosieRecipesData.js` with authentic `description`, `ingredients`, `steps`, `prepMinutes`, `cookMinutes`, `servings`, `difficulty`, and `note`. Do not replace the previously established titles or fabricate missing amounts.

## iPhone verification

`.github/workflows/rosie-recipes-visual.yml` exercises WebKit at 393x852 and 375x667 and Chromium at 393x852, checks the six real assets, verifies title and card images, search, category filtering, favorites, parchment switching, and page overflow; it saves before/after screenshots as GitHub Actions artifacts.

This is a draft PR. Do not merge until the user approves the actual iPhone aesthetic and the complete original recipes have been imported.
