# RosieVerse visual reference registry - V1 (2026-11-23)

**Primary index:** [art-reference-registry.json](art-reference-registry.json)

This is a **small, curated reference selector**, not a list of every illustration and not an AI training set. It supplements - and does not replace - the existing Yacht Dash, Cosmic Odyssey, Tunnel, Haiku and pet-template inventories. No game runtime reads this file.

## What this first pass establishes

- Five character entries: Rosie (with game-specific variants), Jett, Kitty, Chip, and Kuroi.
- Six art contexts: home, Yacht Dash, Cosmic Odyssey, Tunnel Drill, Haiku/Meditation, and Card Vault.
- Exact existing GitHub paths are recorded as **lookup candidates**. Paths were confirmed by GitHub directory listings. **Pixels were not visually compared in this pass.** A candidate is not newly declared canonical or approved merely because it is in the repo.
- Kuroi's approved-by-user black-cat/goggles concept is known, but **the actual master is not located** in the checked GitHub/Dropbox filenames. The older Yacht Dash rival yacht sprites are not substituted for him.

## Reference selection - deliberately light

For a **character illustration**, use the *fewest necessary* images:

1. **One identity anchor:** the correct subject and variant (e.g., Captain Rosie in Cosmic Odyssey, not a generic Shiba or a meditation portrait).
2. **One style example:** select **one relevant** stage/section reference, not the entire folder. Prefer the correct chapter over the first asset in the directory.
3. **Optional one action/composition example:** only if the prompt asks for a difficult turn, crash, pose, or structural layout.

**Maximum 3 image references, normally 2.** For backgrounds and props without characters, omit the identity anchor. Never automatically attach a generic pose or copy the same scene into successive images.

The roles must stay separate:
- **Identity** controls recognizable facial anatomy, coat markings, ears, body proportions and established costume/vehicle *for the requested variant* - not pose or scenery.
- **Style** controls medium, material rendering, brushwork, edge treatment, environmental palette and contrast appropriate to the app section - not character anatomy or exact composition.
- **Action/composition** controls camera, pose, direction, clearance and output geometry - not character redesign.

**Variation is intentional:** change camera distance, gesture, lighting, background arrangement, prop detail, and (within chapter) palette when not fixed by the brief. For Card Vault, don't impose a global picture-style lock at all; the collectible card frame and project identity persist while individual illustrations can vary dramatically.

## Required operational gate

1. Resolve the task's subject + section + target slot.
2. Open the actual referenced image files and visually inspect them. If the current tool path only provides filenames, mark the review as unverified.
3. **Attach/pass the actual chosen images to the generator or image-editing operation.** Merely referencing a repository path or Dropbox folder in a text prompt **does not transfer its pixels** to the generator. If the tool cannot take those visual inputs in this session, disclose the limitation and do not pretend visual conditioning occurred.
4. Preserve approved pixels/layers through editing or compositing where practical. Do not regenerate intact characters or vehicles unnecessarily.
5. Compare output to the identity anchor and local game assets. Reject wrong animal, wrong facial markings, costume drift, generic style, copied pose, opaque supposed-transparent asset, alpha artifacts, and inconsistent gameplay size.
6. Record any new **user-approved** anchor explicitly in the registry with source path and provenance. Never quietly upgrade a candidate to canonical. Keep rejected variants out of positive reference selection.
7. Do not merge/deploy new artwork merely because it passes file-format checks.

## Examples

**Captain Rosie Cosmic Odyssey, new bank-and-fire pose**
- Identity: `public/cosmic-odyssey/assets/rosie-cruise.webp`
- Style: `public/cosmic-odyssey/assets/scene-nebula.webp` (or the actual target level)
- Action only if necessary: `public/cosmic-odyssey/assets/rosie-bank-left.webp`
- Keep the same Captain and spaceship, but make a genuinely new bank-and-fire orientation.

**Yacht Dash Kuroi crash sprite**
- **Do not generate yet from a generic black-cat description.** Find the user-approved goggles-on Kuroi artwork; confirm its file/master and then register it as the identity anchor.
- Choose one appropriate Yacht Dash chapter painting for visual rendering. Use an approved yacht collision frame for dynamics *if available*, not for cat identity.

**New Card Vault illustration**
- Character identity: approved Rosie face master for the role.
- Frame: choose the currently approved card format only if needed; do not use a particular card's scenic art to constrain every subsequent theme.
- New scene/role controls composition and stylistic interpretation.

## Existing detailed source inventories (keep intact)

- `public/yacht-dash/asset-manifest.json` and `docs/Yacht-Dash-Expansion-Asset-Import.md`
- `public/cosmic-odyssey/ASSET_AUDIT.md` and `public/cosmic-odyssey/assets/art-import-manifest.json`
- `docs/ember-asset-reconciliation.md`
- `docs/haiku-final-art-manifest.md`
- `pet-template-lab/asset-catalog.json` - **separate pet-template replacement catalog, not Rosie's character canon**

## Initial outstanding approvals

The registry explicitly uses `candidate_requires_visual_confirmation` for Rosie's anchors, rather than asserting a master without inspection. The next useful step is to visually compare a very small set of the candidate Rosie references with your approved original and mark **one identity master per materially different costume/medium**. Do not freeze a single Rosie pose for all scenes.

This registry is documentation only. No original image, game asset, interface, or production release is changed by adding it.
