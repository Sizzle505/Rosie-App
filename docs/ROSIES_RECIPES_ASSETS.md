# Rosie's Recipes - asset and cookbook import handoff

This branch adds a functional, searchable React page at `/#recipes` under Rosie's Resources.

## Asset mount points

The following optimized image files were generated in the conversation and bundled in `Rosies Recipes Assets.zip`. Unzip these six files directly into `public/rosieverse/recipes/` without changing their filenames. The components and CSS are already wired to these paths.

| Image | Purpose |
| --- | --- |
| `recipes-hero.webp` | Rosie's orange-gold aristocratic kitchen hero |
| `recipes-title.webp` | Rosie's Recipes gold title crest |
| `recipes-card-frame.webp` | Vertical illustrated recipe card frame |
| `recipes-parchment.webp` | Full recipe parchment artwork / decorative future expansion |
| `recipes-controls.webp` | Decorative search / tab / selection control artwork |
| `recipes-continuation.webp` | Satin background continuation for scrolling |

The page displays CSS fallbacks when an asset has not yet been transferred. Do not interpret a READY build as confirmation that the new artwork has been mounted.

## Recipe text

The user previously wrote 25 complete human recipes. Their original names have been recovered and placed in `src/rosieRecipesData.js`; original ingredients and instructions have not been fully recovered. **Do not invent replacement quantities or methods.** Once supplied, fill each item's `description`, `ingredients` (array of strings), `steps` (array of strings), `prepMinutes`, `cookMinutes`, `servings`, `difficulty`, and `note` directly from the original text.

The detail view automatically enables ingredient checkboxes and print when a recipe contains both ingredients and steps.

## Verification after transferring assets and source text

1. Vercel preview READY for current branch head.
2. Confirm the actual kitchen illustration and crest render at `/#recipes` on iPhone Safari.
3. Confirm 25 original recipe titles, search, category chips, sorting and favorites.
4. Confirm a long recipe on iPhone has no clipped ingredients or overlap with the fixed bottom Resources nav.
5. Confirm title crest and card frames display crisply; no visible empty black boxes.
6. Confirm house shortcut, Resources hub entry, and four-item Resources footer navigate correctly.
7. Verify printable recipe hides page chrome and omits the rest of the collection.

Do not merge the draft PR until both recipe content and artwork are available and verified.
