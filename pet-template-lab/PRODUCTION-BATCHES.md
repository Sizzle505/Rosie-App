# Production batches for ChatGPT artwork

Generate assets interactively in manageable batches. This is an operator's storyboard, **not** an unattended generation request.

1. **Canonical dog reference**: identity sheet before all other assets. Approve head-on, profiles, seated, standing, expression set. No themed backgrounds.
2. **Home / Fortune**: iconic homepage art and title, navigation illustrations; Madame portrait and head-turn companion.
3. **Cheese**: ten distinct examiner expressions, doctor and graduation portraits, diploma symbols, card back.
4. **Randomizers / Santa**: coin heads/tails, dice family (same physical die, six correct pip counts), casino header, Secret Santa character, banner and emblem.
5. **Utility pages**: four QR frames (scannable white center kept clear), clock lever poses, calculations hero/toolkit, recipes hero/title, reviews header, reminders desktop/mobile, resources crest and optional account art.

## Batch acceptance gate
For every candidate: verify dog likeness, exact art role, aspect/crop, alpha background, accurate text (if any), color and lighting, UI safe zones, no extra limbs or tails, filetype matching target. Generate a second attempt if any high-visibility defect is present.

The canonical reference is an approval checkpoint, not a one-time style suggestion; if a pose drifts from the pet's actual face or body, reject that single asset rather than updating the reference to match it.

The exact 72 candidate slots and source paths are in `asset-catalog.json`. 45 are currently marked essential; 27 optional means they may be inherited or deferred subject to visual audit. This is not a commitment to 72 generated images.

## Art transfer rule
Store the approved output in a **private** per-pet `assets/<page>/<slot>.<ext>` folder. The preparatory scripts do not upload to Dropbox, GitHub or Vercel.
