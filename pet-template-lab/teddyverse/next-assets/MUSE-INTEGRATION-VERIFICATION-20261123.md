# Muse B01-B11 integration verification - November 23, 2026

## Current status
**All 107 delivered Muse masters are integrated in a separate TeddyVerse QA build and protected asset library. No change to RosieVerse `main`. The production short URL `teddyverse26.vercel.app` remains on its pre-Muse deployment pending release signoff.**

The newer Dropbox package README and export-manifest (`/Rosie App/TeddyVerse-Next-Assets/manifest/export-manifest.json`) report 107 of 107 masters approved by the owner. The older `INTEGRATION-ADVISORY.md` was written before close-out and lists only 103 approved; it is superseded by the newer close-out manifest. Do not use the old advisory as a current file-count source.

- Source package: `/Rosie App/TeddyVerse-Next-Assets` (107 masters, 98 PNG and 9 SVG)
- First-stage package: `/Rosie App/TeddyVerse-72-Final` (72 previously integrated; no source path collisions)
- Signed-off master manifest: [muse-export-manifest.json](muse-export-manifest.json), committed to the isolated branch without binary files or secrets
- Verified immutable QA master library: `https://teddyverse-muse-art-qa.vercel.app/masters/TV001.png` etc., **SSO/automation-bypass protected**
- Muse library deployment: `dpl_FH57mfViBm1cyrvB7NuzgF91LxNx`; protected gallery project `teddyverse-muse-art-qa` (`prj_yWtHMbSBH3JJahPmpT5TZQ53ezWu`)
- Current Muse-enhanced QA app preview: look up the latest deployment of `teddyverse-rebuilt-staging` from [build-muse-qa.mjs](build-muse-qa.mjs). Do not confuse its public preview URL with the short production URL.

## What was physically verified

1. Dropbox `masters/` contains exactly 107 individual `TV###` filenames.
2. Retrieved all 107 originals into a disposable isolated Vercel sandbox, totaling **138,097,660 bytes**, and recalculated SHA-256 for every file; **107/107 exact matches**, zero errors.
3. Pixel dimensions / formats match the handoff manifest; the nine original SVGs render with correct viewBox dimensions, and four custom SVGs contain complete embedded Teddy/vector art.
4. All 107 source path mappings and original Git blob IDs match the isolated branch. **Zero overlaps** with the 72 first-stage Teddy replacement paths.
5. Retrieved all first-stage 72 originals as well (**62,929,395 bytes**) and reverified their SHA-256.
6. Imported all 107 into a disposable isolated checkout using [apply-muse-107.mjs](apply-muse-107.mjs): **107 files / 0 errors**, output **88 WebP, 9 PNG, 9 SVG and 1 JPEG**. Total converted output about **52.2 MB**. Whole SVG wrappers kept intact; PNGs converted to matching runtime format and native source dimensions. Original files backed up locally.
7. The build compiling with the first 72 and all 107 passes Vite. A separate QA checkout temporarily turns on Captain and Haiku while Vault remains off, and it compiles. The isolated repository's governing `feature-gates.json` remains OFF; QA never commits a gate bypass.
8. Source-level Captain and Haiku browser checks using Playwright at iPhone **393×852**, desktop **1440×900** and Tesla-like **1280×800**: 11 enabled routes accessible, no broken images, blank pages, horizontal overflow, JavaScript errors, visible Rosie text or cross-app backend requests. Haiku Compose/Meditate/Journal interact. Yacht Dash `CAST OFF` clicked. **Full game physics, all levels, QR scans and real iPhone/Tesla hardware remain unverified.**
9. Additional UI text corrections applied in `rebrand-isolated.mjs`: remove visible "The Way of the Shiba", "Shiba judgment", "ask her", incorrect Captain gendered line and "Shiba Sunrise Hash"; preserve recipe's legacy static image slug, rather than introducing broken artwork.
10. Protected master library can be rebuilt without expiring Dropbox links: its gallery bypass key is stored only as an encrypted Vercel environment variable in the isolated staging project (`TEDDY_MUSE_QA_BYPASS_SECRET`). The separate first-stage gallery credential (`TEDDY_QA_BYPASS_SECRET`) remains encrypted.

## Release safeguards
- **Never** merge these pet-specific changes to RosieVerse `main`; no changes to flagship files, deployment, database, or services.
- The source's `feature-gates.json` still has `captain:false`, `haiku:false`, `vault:false`. The disposable [build-muse-qa.mjs](build-muse-qa.mjs) deliberately bypasses only the **preview's** readiness gate for visual/functional testing and refuses Vercel production target. It is **not** a production release script.
- [check-readiness.mjs](check-readiness.mjs) requires additional recorded reviews and QA evidence; the original **173 visual-review decisions** and **313 Card Vault assets** are not implicitly approved by Muse's 107-master manifest. For a public Captain/Haiku release, reconcile that list against the actual active art and record the necessary QA evidence.
- Cloud accounts, mail, Supabase, and Secret Santa persistence are disabled, as in the prior isolated TeddyVerse production build.
- Preserve an immutable rollback of the previous public TeddyVerse deployment.
- Don't claim comprehensive visual approval from successful hashes alone. Hashes prove byte identity and provenance, not artistic suitability.

## Next decision
This job has **implemented and verified all 107 asset replacements in a QA preview**. Before assigning the public `teddyverse26.vercel.app` alias, inspect the Captain gameplay and Haiku meditation interactions, check any pet-specific art still found among the visual-review candidates, and ensure release gates have actual evidence. The user should be able to see Captain and Haiku in preview while public TeddyVerse stays stable.
