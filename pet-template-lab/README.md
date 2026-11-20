# Pet Template Lab - isolated, non-production groundwork

**RosieVerse remains the flagship.** This folder is not loaded, imported, built, or used by the running Rosie App. Draft PR #191 is intentionally left unmerged.

## Safety boundary

1. All changes live exclusively in `pet-template-lab/` on a development branch. Never overwrite files in `src/`, `public/`, the existing app manifests, APIs or build configuration.
2. No deployment or new Vercel project is created by these tools. The preparation scripts use **no network**.
3. The public GitHub repository must never contain customer reference photos, private correspondence, credentials, or unreleased pet artwork. Keep all individualized pet folders outside the repo.
4. Accounts, cloud notes, Secret Santa persistence and email default to **disabled** for each new dog. See `RUNTIME-ISOLATION.md` for the current Rosie-specific Supabase/Gmail dependencies.
5. Captain arcade and Card Vault remain excluded. Do not expose those routes in a future pet copy.
6. A completed artwork review is **not permission to publish**. A separately hosted pilot still needs backend isolation, functional testing, and explicit approval.

## Work prepared before dog photos arrive

- `asset-catalog.json` - 72 source-verified candidate artwork slots across 13 pages (45 essential, 27 optional); an inventory, not a guarantee that each image needs recreation.
- `PHOTO-INTAKE.md` - specific ten-photo collection guide.
- `STYLE-GUIDE.md` - fixed character-consistency rules and page-specific constraints.
- `PRODUCTION-BATCHES.md` - practical ChatGPT generation and approval sequence.
- `examples/profile.example.json` - safe dog profile schema with all connected services off.
- `scripts/prepare.mjs` - initializes a **new private package**, creates its approval checklist, creates prompts, reports per-page image status, and produces a standalone local artwork review gallery.
- `scripts/validate.mjs` - **read-only** source and private asset validation, checking missing files, unsafe paths, image signatures, and backend isolation settings.
- `scripts/review-gate.mjs` - **read-only** manual art approval gate. Its output always reports `deployAuthorized: false`.
- `scripts/test-prepare.mjs` - self-contained offline tests in a synthetic repository; verifies safe private writes, image checks, approval defaults and symlink protections.
- `RUNTIME-ISOLATION.md` and `PILOT-DESIGN.md` - documented release blockers and a safe future pilot architecture.

## Local commands (Node 22+; no dependencies to install)

From the Rosie-App checkout:

```sh
node --test pet-template-lab/scripts/test-prepare.mjs
node pet-template-lab/scripts/validate.mjs --catalog
```

After the owner shares the new dog's photos, choose a **private existing parent directory outside this repository**, and use its pet name:

```sh
node pet-template-lab/scripts/prepare.mjs init --out /private/pets/buddy --id buddy --name Buddy
node pet-template-lab/scripts/prepare.mjs prompts --pack /private/pets/buddy
node pet-template-lab/scripts/prepare.mjs status --pack /private/pets/buddy
node pet-template-lab/scripts/prepare.mjs review --pack /private/pets/buddy
node pet-template-lab/scripts/validate.mjs --pack /private/pets/buddy
node pet-template-lab/scripts/review-gate.mjs --pack /private/pets/buddy
```

The initializer creates `profile.json`, `approvals.json`, `assets/`, `masters/`, and `photos/` inside the private output folder. The generated `prompts.md` and `review.html` also stay there. Use `--replace` **only** when deliberately regenerating those two reports; existing assets and photos are never overwritten.

For a completed draft, mark each required asset `approved` in `approvals.json` and review the optional assets as `approved`, `reuse` (with a written reason), or `omit`. Approve the canonical dog, profile and visual QA only after actual review. The gate never deploys.

**Not built yet:** pet-tenant runtime resolver, route-specific renaming, a separate isolated deployment, or new pet art. Those require a pilot, not changes to Rosie's production app.
