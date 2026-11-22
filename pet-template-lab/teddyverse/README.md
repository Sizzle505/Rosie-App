# TeddyVerse - isolated, reproducible source overlay

**Scope:** Teddy-only staging. This directory lives on the branch `work/teddyverse-isolated-integration-20261122`. Neither RosieVerse `main` nor its production deployment is modified by this branch.

## Assets recovered

- 72 of 72 approved/exported files exist in the private Dropbox handoff: `/Rosie App/TeddyVerse-72-Final/assets/`.
- The public text-only `asset-manifest.json` contains the 72 slot IDs, source paths, dimensions, SHA-256 hashes and file names. The actual images, photos, and secrets stay **out of public GitHub**.
- A separate Vercel SHA-256 gallery has verified **72 of 72 files (62,929,395 bytes)**. It is a QA gallery, not the app.
- Nine correction-round files are marked pending final visual review in the source manifest, despite passing file-hash verification.

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
