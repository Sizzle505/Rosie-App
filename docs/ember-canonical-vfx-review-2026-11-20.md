# Ember Tunnel - canonical visual continuity and boss FX handoff (2026-11-20)

## Source-of-truth art direction

The original **Captain Rosie Ember Tunnel Asset Production Brief** governs new terrain art: richly painted bark, braided roots, dark rootstone, warm amber lantern light, sparse moss and ruby/amber crystals; visually integrated into the tunnel. Do not use fantasy trading cards, heavy black outlines, flat vector panels, labeled montages, unrelated sci-fi materials, rectangular background plates, white matte borders or reinvented characters.

The existing game uses **approved Rosie/drillcraft and currently imported boss atlases**. Keep those unchanged. Copperjack is the existing brass clockwork sentry; Cinderclaw is the existing dark volcanic, ember-fissured guardian; Mole King is the existing caped mole monarch. Any effect art must be separate from those identities.

## Implemented on draft PR #192

- `bossDangerLane` in `src/emberExpeditionBossStage.js` is now the shared source for real hit detection and painter warning bounds. In particular, Cinderclaw's burrow warning begins at `bossY+50`, not `bossY+25`.
- `src/emberBossAttackVfx.js` adds *code-rendered, lightweight, optional* non-character effects for six existing attacks. These paint behind the existing boss atlas without changing attack scheduling, damage, Turbo, scores or game physics.
- Spark bolt and fireball use restrained moving light with trails; gear sweep uses brass components; burrow and quake use a dark rootstone fissure; earth-burst falls from the upper lane, accurately matching its existing ceiling-side damage zone.
- Every effect clips to the exact damage lane. No false floor-up Mole King pillar image is shown.
- `tests/ember-boss-telegraph-geometry.test.mjs` and `tests/ember-boss-attack-vfx.test.mjs` cover hazard boundaries, warning/recovery safety and clipping; QA workflow includes both.
- All 12 effect/phase combinations passed a Canvas API smoke test; production build and cross-browser visual QA still require CI completion.

## Review-only generated images, *not* installed

Dropbox: `/Rosie-App-Transfer/Ember Tunnel FX - Three Reviewed Candidates.zip` (8,624,100 bytes).

Contains three source-derived eight-frame (4x2, 448px cell) lossless WebP atlases, 24 PNG frames, cave-background QA previews and a manifest. The alpha matte has been reduced, but the images have **not** been validated against the running game and are **not loaded in the application**.

- Copperjack spark bolt: effects-only candidate, inspect glare/alpha and centerline travel.
- Cinderclaw burrow: effects-only candidate, align imagery to lower hazard lane and prevent floating ground.
- Mole King earth pillars: **HOLD/REJECT for integration**. The concept rises from the floor, but the current earth-burst attack damages above the guardian; using it would communicate the wrong hazard. Rebuild from ceiling-fall artwork or change engine physics only after separate gameplay review.

## Non-production acceptance gate

1. Compare effects against the actual approved game using screenshots in Desktop Chromium, iPhone WebKit and iPad WebKit.
2. Ensure warning-only light does not appear to hit, active effects are clipped to physics, and recovery remains attack-free.
3. Compare any sprite candidate against the existing native game art at in-game scale, including all alpha edges.
4. Keep rejected Batch D collages excluded. No character redesign, no asset activation, no production merge or promotion without visual acceptance.


## New source-consistent environment candidate

Dropbox: `/Rosie-App-Transfer/ember-passage-arrival-lantern-gate.png` (597,806 bytes; transparent 700×700 PNG, SHA-256 `7afeb3e2a0c777ba97e103be6d5acfc5c925b3ecffa1644c3ffc2636914b229d`).

A rootstone-and-bark cavern arch with two warm amber lanterns, scattered ruby/amber crystals and an unobstructed, **truly transparent** center. This deliberately follows the original brief's `ember-passage-arrival-lantern-gate` slot. It is environment scenery, not a character sprite, label, card or standalone background. Approximately 54% of the registered image is fully transparent. The generated master and dark-cave preview have been inspected and the 700px PNG has been exported.

**Hold for screenshot acceptance at actual gameplay scale before activating.** Specifically check that it can be embedded into the 2D tunnel without looking pasted on, that the open center aligns with the passage, and that it creates no new collision or UI occlusion. The Classic course remains unaffected.
