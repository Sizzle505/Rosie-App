# TeddyVerse - remaining artwork production groundwork
**Prepared:** 22 November 2026  
**Source:** `Sizzle505/Rosie-App`, isolated branch `work/teddyverse-isolated-integration-20261122`  
**Release posture:** Planning only. The live TeddyVerse website is unchanged. Captain, Haiku and Card Vault remain disabled.

## Verified scope
A Git tree enumeration found **1,202 images**, including the **72** already in the first TeddyVerse handoff. All 1,202 are individually listed in [source-inventory.json](source-inventory.json) with source path, Git blob ID, source size, section and triage category. This is a **filename/path triage, not a visual confirmation**. The remaining files break down as:

| Current category | Files | Treatment |
|---|---:|---|
| First Teddy handoff | 72 | Existing export; nine correction images still await final visual approval |
| Likely replacement illustrations | **98** | Each has a uniquely numbered generation brief, measured source dimensions and a proposed PNG master |
| Must inspect before deciding | **173** | Review whether the art actually depicts Rosie, contains embedded branding, or is reusable |
| Likely reusable generic art | **546** | Reuse conservatively; remaining candidates can be promoted after visual review |
| Card Vault | **313** | Dedicated, separately gated inventory; not equivalent to 313 required new illustrations |
| **Total** | **1,202** | Source-tree inventory reconciles exactly |

Nine initially queued SVGs were investigated: five are reusable decorative graphics; four require vector-safe inspection or derivation from approved Teddy material. They are **not** sent to the raster image generator.

## Captain, Haiku and remaining work

| Section | New art queued | Visual inspections | Release status |
|---|---:|---:|---|
| Captain arcade, Cosmic Odyssey, Yacht Dash, Ember Tunnel | **39** | **72** | OFF, gated |
| Haiku, Zen Garden, Compose, Journal and Meditations | **26** | **76** | OFF, gated |
| All other active features | **33** | **25** | Existing live routes stay as-is |
| Card Vault | Inventory of **313** | Independent review | OFF, separate scope |

**Captain's artwork sequence:** hero/helmsman portraits and ship views; Cosmic Odyssey gameplay sprites (directions, boost, banking, dodge, damage, laser, rockets and rear/forward views); front/back Captain character cards; completed-sector/victory illustrations; Yacht Dash portraits and win scenes; Ember Tunnel pilot, drillcraft and celebration sprites. Keep Jett, Kitty and Chip unchanged unless a specific asset review establishes Rosie is embedded in it. Environmental obstacles, walls, lasers, oceans and scenery are reusable when they do not depict Rosie.

**Haiku's artwork sequence:** the core Teddy facial-expression and calligraphy variants; four meditation outfit poses, greeting/bowing sensei variants, breathing and enlightened states; meditation entry scenes, scroll and journal, postcard and save/share decorations. Review iPhone-specific meditation backdrops and full-height crops individually. Existing petals, butterflies, lanterns, sand/water effects and similar generic garden imagery should be retained whenever possible rather than regenerated.

**Important:** The 26 + 39 counts represent high-confidence filename-derived replacement candidates, not the entire completeness test. Each of the 148 associated visual-review decisions can reveal additional illustration work, especially large backgrounds and grouped hero art.

## Production assets and handoff format
- [generation-queue.json](generation-queue.json): **107 original candidate slots**, of which **98** are actionable raster artwork requests and **nine** are documented SVG reuse/derivation exceptions. Slot IDs (TV001...) remain stable; do not renumber.
- [visual-review-queue.json](visual-review-queue.json): 173 original image candidates with exact dimensions, alpha metadata and individual review IDs (RV001...).
- [vault-scope-inventory.json](vault-scope-inventory.json): 313 Card Vault-related source files (311 card-vault files plus two entry images), held separately.
- [approval-ledger.json](approval-ledger.json): empty, audit-ready signoff ledger; **no approvals fabricated**.
- [feature-gates.json](feature-gates.json): Captain, Haiku and Vault flags **all false**, with required device and functional QA checks.
- [check-readiness.mjs](check-readiness.mjs): fail-closed readiness report.
- [audit-runtime-references.mjs](audit-runtime-references.mjs): scans 187 application source text files for literal asset references; **absence of a literal reference is not proof the asset is unused**.
- [review-gallery.mjs](review-gallery.mjs): a local, read-only contact-sheet interface for inspecting original assets and exporting an unverified decision worksheet.
- [CHARACTER-STANDARD.md](CHARACTER-STANDARD.md): Teddy likeness, Captain game-sprite consistency, Haiku meditation states and acceptance criteria.
- [stage-approved.mjs](stage-approved.mjs): offline, dry-run-first SHA-256-verified importer with an isolated-branch check and rollback backups.
- [batches/B01.md](batches/B01.md) through [batches/B11.md](batches/B11.md): 11 production briefs containing output filenames, source image paths, pixel dimensions, transparency rules, reference instructions and a copyable prompt for each asset.

### Visual triage workstation

From a local disposable checkout run:

```sh
node pet-template-lab/teddyverse/next-assets/review-gallery.mjs
# Open http://127.0.0.1:4174 (local computer only)
node pet-template-lab/teddyverse/next-assets/audit-runtime-references.mjs
```

Filter by module (Captain, Haiku, etc.), inspect source art and record "reuse / replace / derive / vector" decisions. The gallery is **not** an image-generation tool and it exports only an unapproved review worksheet. Actual QA signoffs remain separate.

### Private destination layout (reserved, not created in Dropbox)
```text
/Rosie App/TeddyVerse-Next-Assets/
    references/                 15 Teddy master photographs - private
    source-thumbnails/          read-only comparison images
    drafts/B01/ ... B11/        iterative attempts, unapproved
    masters/TV001.png ...       approved image masters
    proofs/B01/ ... B11/        before-after and phone-scale comparisons
    manifests/                  generated export/checksums and approvals
```
**Do not overwrite** `/Rosie App/TeddyVerse-72-Final`. Neither original pet photographs nor full image masters should ever enter the public GitHub repository.

## Generation order and acceptance
Work through **B01-B07 first** (Captain and Haiku, plus a few adjoining source assets). The generator must receive the actual original Teddy reference photos, a sample of already approved TeddyVerse artwork, and the exact original image as a *composition reference*. The generated subject is **Teddy**, not Rosie or a generic Shiba. Generate one slot at a time, save the full-resolution master with its frozen TV ID, and preserve source aspect ratio, negative space and true alpha wherever indicated.

After generation, create a side-by-side and iPhone-sized proof. Inspect the pet's coat, ears, muzzle and proportions; retained environmental characters; frame alignment; transparency edges; mobile crop; and animation registration. Record reviewer, timestamp and SHA-256 in `approval-ledger.json` only after actual signoff. Next resolve RV decisions: **reuse**, **generate**, **derive from approved art**, or **rebuild vector**. Any newly discovered pet image gets an appended TV ID, never an overwrite of an earlier one.

Use B08-B11 for remaining active-site imagery after the core game/meditation work. Card Vault includes two navigation-entry images in addition to 311 card-vault files and has its own independent future batch program; no mass generation is assumed.

## Isolated integration and release gates
From a **disposable clone of the isolated branch**, with Sharp installed:
```sh
node pet-template-lab/teddyverse/next-assets/check-readiness.mjs
node pet-template-lab/teddyverse/next-assets/stage-approved.mjs \
  --assets-dir '/private/TeddyVerse-Next-Assets/masters'
TEDDY_ISOLATED_STAGE=1 node pet-template-lab/teddyverse/next-assets/stage-approved.mjs \
  --assets-dir '/private/TeddyVerse-Next-Assets/masters' --apply --confirm-disposable
```
The default command writes nothing. The apply command requires explicit disposable checkout confirmation, approved and hash-verified files, correct source dimensions/alpha and validation with Sharp. This is **not** a live deploy.

To enable Captain or Haiku, the relevant flag must first pass **every** new-image approval, every relevant visual inspection, mobile/desktop/tablet or Tesla QA as appropriate, VFX and gameplay controls (Captain), meditation and scrolling behavior (Haiku), no Rosie residue and zero cross-app backend requests. The isolated overlay, navigation cleanup and asset purge read the flags; with flags false they retain the current live-release exclusions. No changes are made to RosieVerse `main`, its assets or deployment.

### QA minimums
- Captain: keyboard/gamepad/touch joystick, shooting/aim controls, death and victory, life/boost animations, player sprite alignment across directions, all three game backgrounds and modal transitions, iPhone landscape and desktop/Tesla.
- Haiku: 5-7-5 composition, animated sensei and breathing cycles, scroll text contrast, journal and postcards, all meditation background modes, iPhone portrait, desktop and tablet.
- Both: no false transparency, no original-pet fallback, no broken image, no layout regressions, and **no live RosieVerse services or authentication**.
