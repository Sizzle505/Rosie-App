# Manual customization - family/friends, 2-3 dogs per month

**No image-generation API or automatic model billing needed.** ChatGPT image creation happens interactively. The Node tools are for naming, organizing and testing approved images, not unattended art generation.

## Phase A - intake and likeness
1. Receive the ten dog photos according to `PHOTO-INTAKE.md`; keep them private. Confirm use rights and name/breed/personality.
2. Initialize a separate private pet package: `node pet-template-lab/scripts/prepare.mjs init --out /private/pets/slug --id slug --name 'Dog Name'`.
3. Create the approved canonical dog master first. Do not continue until facial proportions, coat markings, ear shape, tail and apparent age are correct.
4. Record manual approval of the canon in the private package's `approvals.json`; the scripts do not infer visual quality.

## Phase B - page artwork
5. Run `node pet-template-lab/scripts/prepare.mjs prompts --pack /private/pets/slug` to generate page-by-page ChatGPT prompt drafts. Provide the original source image to ChatGPT alongside the approved canon when generating each asset.
6. Generate art in `PRODUCTION-BATCHES.md` order. Save approved images to `assets/<page>/<slot>.<extension>` in the private package; keep full-size masters under `masters/`.
7. After each batch, run `prepare.mjs status --pack /private/pets/slug` and `prepare.mjs review --pack /private/pets/slug --replace`. Open the **local** `review.html`; do not upload it publicly. Image presence does not constitute approval.
8. Run `validate.mjs --pack /private/pets/slug` after essential slots are complete. Use `--strict` only when every optional slot has an exported file instead of being deliberately reused/omitted.

## Phase C - separate pilot (not yet engineered)
9. Build a **separate** copy/tenant preview with its own origin, with the Captain page and Card Vault routes disabled. Never copy flagship Supabase/Gmail credentials or connect to its customer data. Keep account, Secret Santa server and email functionality disabled until properly isolated.
10. Test iPhone, iPad and desktop pages, navigation, cropped art, QR scanning, storage, any active backend routes and fallback behavior. Compare RosieVerse's baseline before/after to confirm no changes.
11. Mark each slot in `approvals.json` as `approved`, `reuse` (with explicit written reason) or `omit` (optional only). Set `profile.reviewStatus` to `approved`, `characterApproved` to true, and the mobile/tablet/desktop/content review flags only after manual verification.
12. Run `review-gate.mjs --pack /private/pets/slug` to check the artwork gate. **It never authorizes a deployment**. Publish only after separate runtime/backend isolation verification and explicit release authorization.

Source assets in `public/` and `src/` belong to RosieVerse and are never overwritten. Asset duplication or publication is not an automated step.
