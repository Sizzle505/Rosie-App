## Next artwork production program

**Captain, Haiku and all remaining asset preparation:** [next-assets/README.md](next-assets/README.md). This includes 1,202 source files inventoried, 98 proposed new illustrations, 173 visual reviews, 546 likely reusable files, 313 gated Card Vault images and the original 72 exports. The [11 batch briefs](next-assets/batches/B01.md), [Teddy character standard](next-assets/CHARACTER-STANDARD.md), [local review gallery](next-assets/review-gallery.mjs), [approval ledger](next-assets/approval-ledger.json), [hash-checked importer](next-assets/stage-approved.mjs) and [feature gates](next-assets/feature-gates.json) are prepared on this branch. All expansion flags remain OFF and the live TeddyVerse build is not changed by this preparation.

Run `node --test pet-template-lab/teddyverse/next-assets/inventory.test.mjs` to verify the frozen inventory, and `node pet-template-lab/teddyverse/next-assets/check-readiness.mjs --enforce` to confirm no unapproved tab can be activated.

# TeddyVerse - isolated, reproducible source overlay

**Scope:** Teddy-only staging. This directory lives on the branch `work/teddyverse-isolated-integration-20261122`. Neither RosieVerse `main` nor its production deployment is modified by this branch.

## Assets recovered

- 72 of 72 approved/exported files exist in the private Dropbox handoff: `/Rosie App/TeddyVerse-72-Final/assets/`.
- The public text-only `asset-manifest.json` contains the 72 slot IDs, source paths, dimensions, SHA-256 hashes and file names. The actual images, photos, and secrets stay **out of public GitHub**.
- A separate Vercel SHA-256 gallery has verified **72 of 72 files (62,929,395 bytes)**. It is a QA gallery, not the app.
- Nine correction-round files are marked pending final visual review in the source manifest, despite passing file-hash verification.

## Durable protected QA source

The 72 source art files are also retained in the separate **teddyverse-asset-qa** Vercel project's immutable verified deployment. The static gallery has Vercel Authentication enabled. Each file is available at `https://teddyverse-asset-qa.vercel.app/assets/<exported_filename>` only with authorized access.

The isolated **teddyverse-rebuilt-staging** project holds its own encrypted `TEDDY_QA_BYPASS_SECRET`, created for this exact QA project. The asset fetcher sends this credential only to that exact hostname, does not follow redirects, and verifies the complete SHA-256 against the manifest before modifying a disposable source checkout. Neither the credential nor temporary Dropbox links belong in GitHub.

Verified reproducible staging deployment (November 22, 2026): **72/72 source hashes passed, Vite build passed, 14 automated application tests passed, Vercel READY**. This build is **not yet approved as a fully branded, visually verified public release**.

## Two integration paths

`integrate-assets.py` applies and audits replacement artwork against an **already built**, separately extracted TeddyVerse `dist/`. It is dry-run-first and preserves QR apertures.

`build-isolated.mjs` applies all 72 images to a **disposable source copy before the Vite build**. It explicitly checks sha256 and dimensions, converts formats with Sharp, protects hollow QR frames, replaces current nav imports and coin fallbacks, removes Captain/Vault/Haiku from the homepage and main route allowlist, patches selected branding strings and produces an offline API response. This script must not run in the flagship checkout. Use only a disposable checkout and `TEDDY_ISOLATED_STAGE=1`, with either `--assets-dir` or 72 short-lived private asset URLs.

### Local disposable source build

Run these inside a **fresh disposable clone of the isolated integration branch**, not in the flagship working tree:

```sh
npm ci
npm install --no-save sharp
TEDDY_ISOLATED_STAGE=1 node pet-template-lab/teddyverse/build-isolated.mjs \
  --assets-dir '/private/TeddyVerse-72-Final/assets' --allow-local-disposable
npm run build
```

Deploy `dist/` to an isolated Vercel project with filesystem-first routing, `/api/*` mapped to `/offline-api.json`, and SPA fallback to `/index.html`. **Do not use a remote RosieVerse fallback.**

## Non-negotiable release checks

This source overlay is not by itself a fully validated pet product. It does not retouch all noncataloged Rosie artwork, and a 72/72 hash pass is not a visual approval. Before switching `teddyverse26.vercel.app` or approving family sharing:

1. Verify no visible Rosie-specific pet art, fallback images, text, or email sender references remain on every enabled page.
2. Check all QR frame cutouts and scan readability on iPhone, desktop and tablet; validate the 41 format conversions in a rendered browser.
3. Review the 9 corrected assets, plus iPhone crops and transparent edges.
4. Confirm Captain, Card Vault, Haiku and other excluded routes cannot be reached even by direct navigation.
5. Confirm every `/api/*` route is locally disabled; no production Supabase, Gmail, auth, or RosieVerse application domain is contacted.
6. Confirm no source or deployment setting in RosieVerse changed.
7. Promote **only after** functional and visual QA. Keep the original TeddyVerse deployment as rollback.

The original Vercel TeddyVerse production build was made from an opaque private archive not exposed to the tools here. The isolated branch and private Dropbox package provide a reproducible replacement pipeline independently of that archive.
