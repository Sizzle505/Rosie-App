# Future pilot implementation - zero-contamination architecture

This is a **design contract only**; none of it is installed in RosieVerse.

## Preferred topology
- Keep existing Rosie App repo `Sizzle505/Rosie-App` and Vercel project `Apex/rosie-app-git` untouched.
- Use an independently controlled **private pilot repository** or separate build project for the new dog. Rebase/sync only from a reviewed RosieVerse release; never make the pet project a direct writer to the flagship's main branch.
- Use a separate Vercel project and test URL; do not create production aliases until explicit approval.
- The pet's original ten photos, character canon and working PNGs stay in private storage. Only public-facing optimized art goes to the pet deployment.

## Adaptation layer in pilot only
1. Implement `petProfile` identity and feature manifest with a stable slug and display name. Keep `rosie` as the immutable default for flagship code if a shared core is eventually extracted.
2. Resolve approved asset slots through a manifest with versioned per-pet paths. **Never silently fall back to a Rosie portrait** if a pet-specific required asset is missing; fail a preview check instead. Only reuse an existing image if the artwork has been manually approved as truly pet-neutral.
3. Replace every hardcoded visible Rosie name and legacy link in the **pilot code** with pet-specific strings. Do not bulk-edit or rename original RosieVerse assets.
4. Filter routes and links at the router level - Captain and Card Vault must be unreachable, not merely visually hidden.
5. Keep account, notes, Secret Santa API and outbound email disabled until separately provisioned; do not copy flagship environment variables, Supabase secrets or SMTP keys. Client-side-only dice, roulette and other utilities may remain enabled.
6. Namespace browser storage per pet and per origin. No migration or browser storage access to RosieVerse.
7. Run existing app build and device QA **on the pilot**. Verify QR frame scanning/printing, clock controls, card games, responsive layout, and no stray `Rosie` text or artwork.
8. Require human approval for any final pet website.

## Comparison and rollback
- Record flagship `main` commit and Vercel production deployment before creating the pilot.
- Inspect Git diff of pet-template preparation: it must contain only `pet-template-lab/` files.
- A problem in the pilot should be fixed on the pilot branch/repo, not in `main`.
- Production rollback procedures remain wholly independent of the pet website.

## What is deliberately deferred
The user has not supplied a dog name/photos, so no pet-specific build, character art, branded domains or Vercel project is created. The current isolated branch provides preparation and QA tools, **not** a working cloned application. Build the runtime adapter against the first actual dog, with live visual review, so shape/cropping assumptions are grounded.
