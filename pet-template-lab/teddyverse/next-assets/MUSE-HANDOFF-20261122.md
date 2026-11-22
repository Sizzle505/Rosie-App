# MUSE HANDOFF - TeddyVerse remaining artwork

**Issued:** November 22, 2026  
**Role:** Muse is the **art-production owner** for new TeddyVerse images. The development account remains responsible for source audits, approvals, integration, gameplay QA, deployment and rollback.  
**State:** Ready for Muse to accept. **No new images have been generated, reviewed or approved in this handoff.**

## 1. Your mission - start here

Generate all remaining **Teddy** artwork for the isolated TeddyVerse app. This **new pet is Teddy, not Rosie**. The source project contains Rosie illustrations; use those originals only as references for scene composition, wardrobe, pose, camera view, dimensions and placement. The dog's actual coat, ears, muzzle, body, facial proportions and expression must come from the private Teddy photo reference pack. **Never deliver a generic Shiba or an image still depicting Rosie.**

**Priority 1: Captain (39 new illustrations), then Haiku/meditation (26).** Other active TeddyVerse features account for 33 additional high-confidence new illustrations. The 98 new-generation slots are frozen as TV001...TV107 with nine separately classified SVG reuse/derivation exceptions. **Do not bulk-generate 98 without reviewing source art.** Another 173 existing images require a reuse/replace decision. Card Vault has 313 tracked source files but is a **separate gated scope**, not an instruction to generate 313 pictures.

The first 72 Teddy assets were already integrated in the current isolated site; **do not recreate or overwrite them**. Nine late corrections from that package still retain pending visual-approval metadata - they are not automatically approved references.

The November 19 instructions in this Space excluded Captain and Haiku. **For TeddyVerse specifically, this November 22 handoff supersedes those exclusions: Captain and Haiku are now included in image production but NOT re-enabled in the public app.** Card Vault remains inventory-only pending a separate production decision.

## 2. Where everything is

- **Current public TeddyVerse (reference only):** https://teddyverse26.vercel.app
- **GitHub source/production briefs - isolated Teddy branch (read only for Muse):** https://github.com/Sizzle505/Rosie-App/tree/work/teddyverse-isolated-integration-20261122/pet-template-lab/teddyverse/next-assets
- **Production instructions and scope:** [next-assets/README.md](next-assets/README.md)
- **All numbered artwork tasks, prompts, dimensions and alpha status:** [generation-queue.json](next-assets/generation-queue.json)
- **Individual batch briefs B01-B11:** [batches/](next-assets/batches/)
- **First batch:** [B01.md](next-assets/batches/B01.md)
- **Visual review queue (173):** [visual-review-queue.json](next-assets/visual-review-queue.json)
- **Source-wide inventory (1,202):** [source-inventory.json](next-assets/source-inventory.json)
- **Canonical identity, Captain sprites and Haiku standards:** [CHARACTER-STANDARD.md](next-assets/CHARACTER-STANDARD.md)
- **Approval status:** [approval-ledger.json](next-assets/approval-ledger.json) (empty, because none of the next-stage images have been approved)
- **Private photo-upload page:** https://chatgpt.com/space/page_467c05f55d688191a97220d14cc9e9c3

The private photo-upload Page has ZIP and JPEG references attached. **Verify you can actually open and inspect Teddy's photographs before generating.** Merely reading the filenames, a prompt or old Rosie artwork is insufficient. If that photo pack is not accessible from Muse's account, request access to the private shared project; do not guess Teddy's appearance. Keep the pet photographs, full-resolution artwork and review composites off public GitHub.

Muse needs no GitHub-write, Dropbox or Vercel access. The links above are for read-only directions. Deliver artwork into the private shared project or an explicitly provided private upload folder; the development account will transfer, hash-check and integrate the approved masters.

## 3. The precise first assignment: B01

Before B01, compare actual Teddy photos against the **approved** existing TeddyVerse artwork. Reuse any valid canonical character sheet if genuinely approved; otherwise produce a separate multi-angle Teddy likeness sheet (front/three-quarter/profile, seated/standing, neutral/focused/happy) and obtain owner approval. Establish a consistent **Captain Teddy** uniform, cap and vehicle look; preserve it across all three Captain games.

Then generate **B01**, ten **separate** full-resolution PNG master files. Each source must be opened and inspected visually (GitHub paths are not image contents). Keep the source aspect ratio, sprite anchor, orientation, color language and transparent margins.

| Slot | Replacement source reference | Minimum/source size | Background |
|---|---|---|---|
| TV001 | `public/captain-rosie-deck.webp` | 207 x 240 | True alpha |
| TV002 | `public/captain-rosie-illustrated.webp` | 207 x 240 | Opaque |
| TV003 | `public/captain-rosie-ship.webp` | 364 x 631 | True alpha |
| TV004 | `public/captain-rosie.webp` | 360 x 345 | Opaque |
| TV005 | `public/cosmic-odyssey/assets/rosie-bank-left.webp` | 800 x 600 | True alpha |
| TV006 | `public/cosmic-odyssey/assets/rosie-bank-right.webp` | 800 x 600 | True alpha |
| TV007 | `public/cosmic-odyssey/assets/rosie-boost.webp` | 800 x 600 | True alpha |
| TV008 | `public/cosmic-odyssey/assets/rosie-cruise.webp` | 800 x 600 | True alpha |
| TV009 | `public/cosmic-odyssey/assets/rosie-damage.webp` | 420 x 280 | True alpha |
| TV010 | `public/cosmic-odyssey/assets/rosie-dodge.webp` | 800 x 600 | True alpha |

Name the finished masters **TV001.png ... TV010.png**. Each must be its own image; **no contact-sheet substitute**. You may render larger at the *same aspect ratio*, but don't create an inferior low-resolution master. Preserve true alpha rather than a painted checkerboard; no white outlines, watermarks, invented text or duplicate limbs. For Cosmic sprites, match gameplay silhouette, banking directions, pilot/canopy placement and matching weapon or damage state. Keep **Jett, Kitty and Chip** unchanged.

**Before requesting approval:** supply a compact visual proof for B01 with each generated Teddy image beside its original source, noting dimensions, alpha, fidelity and any issues. The proof is for review only; the ten original PNG files remain individually deliverable. Do not say a batch is approved until the user explicitly approves it.

Detailed individualized prompts and full file references: [B01.md](next-assets/batches/B01.md). Continue B02-B04 for remaining Cosmic Odyssey and Ember Tunnel, B04-B07 for Haiku characters and meditation artwork, and B07-B11 for remaining cross-app work. Use the actual [generation queue](next-assets/generation-queue.json) as the authoritative slot order because batches cross module boundaries.

## 4. Haiku is mandatory, not an optional cosmetic pass

The Haiku work must include Teddy's expressive poetic poses, calligraphy, meditating outfit variants, greeting/bowing sensei, breathing and enlightenment states. Assess **iPhone portrait meditation backgrounds**, Zen Garden, Compose, Journal, scroll transparency, animated petals, butterflies and lanterns for actual missing pet art; reuse generic atmospheric pieces wherever visually clean.

For animated breathing or sequential action sprites: preserve character position/scale and frame continuity. Do not stretch source art, bake fake transparency into scrolls, obscure poem text or add incorrect decorative syllables. Design with portrait phone readability, and retain the user-facing app's 5-7-5 logic as a **development QA check**, not something to fix in an illustration.

## 5. Required production routine

1. **Verify Teddy identity:** inspect private photos and an approved canonical reference; if absent/unapproved, make and submit a likeness sheet before batch artwork.
2. **Review source composition:** open the exact original source image for every TV slot and read the matching JSON/Markdown brief. Preserve background, other characters, lighting, focal point and negative space.
3. **Generate one file per slot:** save PNG master `TV###.png` in a private destination, ideally `TeddyVerse-Next-Assets/drafts/B##/`. If a correction is needed, label revisions `TV###-v2.png`, retaining the chosen final as `TV###.png`.
4. **Quality assurance:** verify Teddy coat/muzzle/ears, output size, alpha or opaque treatment, composition and crop; inspect at native size and on a phone-sized proof.
5. **Submit a numbered batch for owner approval:** show a source-vs-output proof and a brief pass/fail note per slot. **Do not mark approved yourself or infer approval from successful generation.**
6. **Transfer approved masters:** development account places them in a private `masters/` folder, records approval and SHA-256 in its ledger, runs the importer and tests in a **disposable TeddyVerse branch**. Muse should not edit or deploy any website.
7. **Resolve visual review queue:** before any tab reactivation, inspect every related RV record and mark reuse / generate / derive / vector. If more art is required, request a new numbered slot from development rather than overwriting previous IDs.
8. **Report results:** give the exact produced slot IDs, number finished, number requiring revision, missing inputs, deliverable location and next batch. Do not claim completion of unstarted items.

## 6. Boundaries and release gates

**Absolutely no changes** to RosieVerse `main`, Rosie App production, the live TeddyVerse domain, Vercel, Supabase, mail systems, payments, repositories, login behavior or design logic. Never upload pet photos to the public repository. Do not expose secret URLs or private access tokens.

Captain, Haiku and Card Vault remain disabled in the current public TeddyVerse. Only the development account can enable them, **after** approved art, visual-review decisions, iPhone/desktop and relevant tablet/Tesla checks, game-controls/VFX/physics for Captain, meditation/poem-scroll QA for Haiku and zero cross-app requests. The [feature-gates.json](next-assets/feature-gates.json) file intentionally has all three disabled.

The user has requested artwork **groundwork and takeover**. That does **not** authorize automatic mass generation charges, access-sharing changes or publication. Muse may proceed with the 10-item B01 work using accessible private references and its normal image tools, then present artwork for review.

## 7. Muse's first response / acknowledgment

Report: **"I have located the Teddy photos and B01 source artwork; I am using the approved Teddy likeness, not Rosie's appearance. I understand Captain and Haiku are in scope, Card Vault is separately gated, and I will deliver TV001-TV010 as individual PNG masters for review without touching production."** Do **not** claim this unless you actually accessed the photos and sources. If access is missing, state exactly which files or permissions are missing.

**Handoff status:** Ready and awaiting acknowledgment by Muse. This document is not proof that Muse was notified, has access, or has begun generation.
