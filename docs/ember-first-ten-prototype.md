# Ember Tunnel - First Ten Assets / Playable Prototype

## Scope
This branch adds the first gameplay mechanic from the five-level proposal to the current 75-second Tunnel course without changing the approved player vehicle, the two existing passages, or the live deployment.

- Five optional geological discovery sites: two earth walls, two crystal deposits, and one concealed royal chamber.
- Earth and the secret entrance yield to normal drilling. Crystal requires Burrow Turbo.
- Initial -> cracked -> destroyed state, using the established world-anchored drill tip and dt-based contact rather than click targets.
- Breaking formations awards score/Turbo charge, and the chamber unlocks the first relic and spawns a cache.
- HUD/result counts, local relic discovery flag, rock-burst visuals, deterministic engine tests.
- Original Rosie cockpit and sprites remain unchanged.

## Art handoff
The 10-file refined concept pack exists outside the repository as **Ember Tunnel First 10 Assets v2.zip**.
It includes transparent PNG/WebP prototypes, matched dimensions for damage-state swaps, a source contact sheet and manifest:
1. earth intact
2. earth cracked
3. crystal intact
4. crystal cracked
5. entrance closed
6. entrance open
7. Rosie drilling effort
8. Rosie excited discovery
9. royal bone medallion
10. rock/crystal VFX atlas (5 columns x 2 rows)

**Do not mark these ten image binaries as imported into GitHub.** The prototype renders using current `public/ember-drill` art while binary transfer and scene registration are pending. Generated Rosie portraits are *not approved* and must not replace the original Rosie image or vehicle. The pack's displayed 2x resolution is an export upscale from a smaller study, not independently painted native high-res masters.

## Next integration step
After the two Rosie reactions pass likeness review, import the PNG/WebP pack under `public/ember-drill/breakables/` and register the eight world sprites in `DRILL_ART`. Use state-matched positions from the pack manifest, keeping existing collision and vehicle coordinate registration; replace only the prototype formations, not full cave backgrounds.

## QA
- Test collisions at the actual pitched drill tip, including dt clamping, repeat attempts, and Turbo physics.
- Verify landings on iPhone portrait, iPad, and desktop that small crystal targets can be reached without unavoidable formation collisions.
- Verify image load, texture seams, motion reduction, and no regressions to current score/boost systems.
- Do not merge or deploy before visual QA.
