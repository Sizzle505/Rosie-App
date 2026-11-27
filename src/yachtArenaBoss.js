/* Kuroi EPIC ARENA — pure rules for the Yacht Dash climax.
 *
 * The lane finale's successor: Rosie sails freely around a portrait arena
 * (the Emperor's harbor, ringed by the crowd) while Kuroi circles the edge
 * and charges clean across it. Every decision below is a pure function of
 * (state, tickMs, input), so the whole fight is simulatable in tests with a
 * virtual clock — the same discipline as the Tunnel boss sims and the lane
 * finale's kuroiBossStep. Timings are tick-driven (elapsed, not wall clock),
 * so pausing the game freezes the machine too.
 *
 * Coordinates are arena units, 0..100 on both axes, y growing downward
 * (screen space). Rosie starts at the center. Kuroi patrols the inset
 * rectangle's perimeter, stops at the edge to wind up — turned to face
 * Rosie's position, revving in place (his body language is the tell;
 * no line is ever drawn) — then charges to the harbor furniture waiting
 * where his course leaves the arena. Dodge and he crashes; stay in his
 * path and he rams her. Phase 2 adds water-bombs and regatta rockets
 * (volley, then charge). Phase 3 fires the volley WHILE he charges, and
 * after two crashes the fireworks barge is towed in for the finale:
 * Captain Rosie shines her laser pointer onto the barge, the dot dances
 * there, and Kuroi — a cat — locks onto the DOT and charges it, straight
 * into the barge. The sky erupts.
 */

const art = (file) => "/yacht-dash/kuroi-arena/" + file + ".webp";
const obstacleArt = (file) => "/yacht-dash/obstacles/" + file + ".webp";

export const ARENA_BACKGROUNDS = Object.freeze([
  art("setting-01"), art("setting-02"),
  art("setting-03"), art("setting-04"),
  art("setting-05"), art("setting-06"),
  art("setting-07")
]);

export const ARENA_SPRITES = Object.freeze({
  rosie: {
    up: art("rosie-ship-up"), down: art("rosie-ship-down"),
    left: art("rosie-ship-left"), right: art("rosie-ship-right"),
    braced: art("rosie-braced"), dash: art("rosie-dash"),
    startled: art("rosie-startled"), triumphant: art("rosie-triumphant")
  },
  kuroi: {
    down: art("kuroi-charge-down"), up: art("kuroi-charge-up"),
    side: art("kuroi-charge-side"), firing: art("kuroi-firing"),
    dazed: art("kuroi-dazed")
  },
  waterbomb: art("weapon-waterbomb"),
  rocket: art("weapon-rocket"),
  barge: obstacleArt("fireworks-barge")
});

/** Crash furniture waiting at the far end of a charge line. The finale
 * barge is separate (ARENA_SPRITES.barge); these cycle for variety. */
export const ARENA_FURNITURE = Object.freeze([
  { kind: "buoy", asset: obstacleArt("storm-buoy"), label: "Storm buoy" },
  { kind: "pylons", asset: obstacleArt("harbor-pylons"), label: "Harbor pylons" },
  { kind: "raft", asset: obstacleArt("lantern-raft"), label: "Moored lantern raft" },
  { kind: "rocks", asset: obstacleArt("reef-rocks"), label: "Reef rocks" }
]);

/* Round 8 (Item C): per-sprite size normalization. Every sprite is a
 * 640x640 canvas, but the painted boat's extent and center differ per
 * facing/pose (PIL-measured, alpha > 8): Kuroi's firing content is
 * 100.0x77.3 sitting low (center y 55.9%) while his charge-down is
 * 90.5x100.0 centered; Rosie's ship-down content is 78.4 wide against
 * 98.0 for ship-up. Rendered raw at one box size, every sprite swap
 * visibly rescaled and shifted the boat — worst: Kuroi dropped ~1.4
 * units and shrank whenever the firing sprite appeared.
 *
 * 2026-11-26: rosie-ship-down was REGENERATED (Mitchell: the original
 * asset was cropped at the top — mast and sail peak sliced off — and
 * Rosie was painted ~2x too large vs the other facings). The new art
 * carries the complete mast, finial and sail and Rosie at family
 * scale; it is narrower in canvas (78.4 wide) because a bow view is,
 * so its width factor (1.198) exceeds the +/-7.5% band the original
 * art set happened to land in. The family means below are recomputed
 * with the new measurement, so every rosieV factor shifted slightly.
 *
 * The fix renders each sprite through the independent CSS `scale`
 * and `translate` properties (they compose with — and survive — the
 * transform keyframes used by the windup rev and dazed animations,
 * which is why the correction does not live in `transform`):
 * - scale: anamorphic factors so the content bounding box matches
 *   its FACING FAMILY's target extent (horizontal family = the
 *   broadside sprites; vertical family = bow/stern/pose sprites).
 *   Within a family every sprite then occupies one identical
 *   on-screen box; across families the box changes only as a real
 *   boat's silhouette does when it turns (length vs beam). All
 *   factors were within +/-7.5% for the original art set — a static,
 *   mild correction (the 2026-11-26 bow sprite is the one exception,
 *   see above).
 * - translate: shifts the content CENTER onto the machine anchor, so
 *   swaps never move the boat. Kuroi's side sprite gets no x shift:
 *   it is the one sprite mirrored via scaleX(-1), which would mirror
 *   the offset too (its x error is 0.55% of box — 0.13 units, moot).
 *
 * Family targets are the per-family means of the measured extents.
 * The arena suite recomputes these factors from the measured table
 * and pins them, and re-derives the Defect-2 hull geometry from the
 * normalized side/firing/down values. */
export const ARENA_SPRITE_NORM = Object.freeze({
  // basename: { w, h, cx, cy (measured content, % of canvas),
  //             sx, sy, tx, ty (applied scale / translate, %) }
  "kuroi-charge-down":  { w: 90.5, h: 100.0, cx: 49.84, cy: 49.92, sx: 1.039, sy: 0.999, tx: 0, ty: 0 },
  "kuroi-charge-up":    { w: 93.9, h: 99.8,  cx: 48.28, cy: 50.00, sx: 1.001, sy: 1.001, tx: 1.72, ty: 0 },
  "kuroi-dazed":        { w: 97.7, h: 100.0, cx: 50.16, cy: 49.92, sx: 0.962, sy: 0.999, tx: 0, ty: 0 },
  "kuroi-charge-side":  { w: 99.1, h: 82.7,  cx: 49.45, cy: 52.03, sx: 1.005, sy: 0.967, tx: 0, ty: -2.03 },
  "kuroi-firing":       { w: 100.0, h: 77.3, cx: 49.92, cy: 55.94, sx: 0.996, sy: 1.035, tx: 0, ty: -5.94 },
  "rosie-ship-down":    { w: 78.4, h: 100.0, cx: 50.00, cy: 50.00, sx: 1.198, sy: 1.000, tx: 0, ty: 0 },
  "rosie-ship-up":      { w: 98.0, h: 100.0, cx: 49.84, cy: 49.92, sx: 0.958, sy: 1.000, tx: 0, ty: 0 },
  "rosie-braced":       { w: 97.5, h: 100.0, cx: 49.77, cy: 49.92, sx: 0.963, sy: 1.000, tx: 0, ty: 0 },
  "rosie-dash":         { w: 99.5, h: 99.8,  cx: 50.16, cy: 50.00, sx: 0.944, sy: 1.002, tx: 0, ty: 0 },
  "rosie-startled":     { w: 96.9, h: 100.0, cx: 49.61, cy: 49.92, sx: 0.969, sy: 1.000, tx: 0, ty: 0 },
  "rosie-triumphant":   { w: 93.3, h: 100.0, cx: 49.53, cy: 49.92, sx: 1.007, sy: 1.000, tx: 0, ty: 0 },
  "rosie-ship-left":    { w: 98.6, h: 99.4,  cx: 50.00, cy: 49.61, sx: 0.995, sy: 0.995, tx: 0, ty: 0 },
  "rosie-ship-right":   { w: 97.7, h: 98.4,  cx: 49.38, cy: 49.92, sx: 1.005, sy: 1.005, tx: 0, ty: 0 }
});

/** Painted HULL bottom per Kuroi sprite (% of canvas), PIL-measured
 * with the warm-hull rule (central 40% of columns, alpha >= 200,
 * R-B >= 40) so the translucent wake below the hull is excluded.
 * Round 8 Defect 2: round 7 used the side sprite's ALPHA bottom
 * (93.4% — wake) and the hull floated. */
export const ARENA_KUROI_HULL_BOTTOM = Object.freeze({
  "kuroi-charge-side": 76.4,
  "kuroi-firing": 78.6,
  "kuroi-charge-down": 87.3,
  "kuroi-charge-up": 77.5,
  "kuroi-dazed": 91.7
});

/** Painted HULL bottom per Rosie sprite (% of canvas), PIL-measured
 * with the round-8 warm-hull rule (central 40% of columns,
 * alpha >= 200, R-B >= 40) applied as a ROW-DENSITY threshold: a row
 * counts as hull while >= 25% of its central columns are warm-hull.
 * The plain last-warm-row rule used for Kuroi fails on her sprites —
 * her foam carries golden sparkle pixels to the canvas bottom (the
 * naive rule reads 86.7-93.4%, inside the foam) — while the density
 * rows land exactly where the wooden hull visibly meets the foam in
 * the art (checked against the sprites). Her wake/foam below these
 * lines is translucent spray, not hull. */
export const ARENA_ROSIE_HULL_BOTTOM = Object.freeze({
  "rosie-ship-down": 81.6,
  "rosie-ship-up": 84.7,
  "rosie-ship-left": 85.9,
  "rosie-ship-right": 87.0,
  "rosie-dash": 80.5,
  "rosie-braced": 76.6,
  "rosie-startled": 82.5
});

/** Inline style for an arena actor img: the normalization above as
 * independent CSS properties. Returns undefined for unlisted sprites
 * (weapons, barge) so their rendering is untouched. */
export function arenaSpriteNormStyle(src) {
  if (!src) return undefined;
  const base = String(src).split("/").pop().replace(/\.webp$/, "");
  const norm = ARENA_SPRITE_NORM[base];
  if (!norm) return undefined;
  const style = {};
  if (norm.sx !== 1 || norm.sy !== 1) style.scale = `${norm.sx} ${norm.sy}`;
  if (norm.tx !== 0 || norm.ty !== 0) style.translate = `${norm.tx}% ${norm.ty}%`;
  return Object.keys(style).length ? style : undefined;
}

export const ARENA = Object.freeze({
  margin: 11,                   // horizontal inset from the arena walls;
                                // 11 keeps the widest sprite (Kuroi at 20%
                                // width, half-extent 10) fully inside the
                                // frame on his patrol rectangle instead of
                                // clipping at the corners (was 7)
  marginY: 20,                  // vertical inset for the patrol
                                // rectangle's BOTTOM row and ROSIE's
                                // BOTTOM clamp (her top clamp is the
                                // separate rosieMarginTop below —
                                // round 7 derivation: at the
                                // bottom row every sprite's content
                                // stays inside the frame — tallest
                                // half-height 11.97 -> 91.97 <= 100 —
                                // and Rosie's half-height, 8.5 x 1.197
                                // = 10.18, clears 20 with room).
  marginTop: 44,                // Mitchell's ceiling line (2026-11-25):
                                // he marked the highest point either
                                // ship may reach in the final battle on
                                // his iPhone screenshot of the arena —
                                // a line across the water just below
                                // the pavilion, at 44% of the arena's
                                // height (measured: the mark sits at
                                // 43.8% of the frame). The patrol
                                // rectangle's top row is that line.
                                // (Supersedes the round-8 desktop-band
                                // derivation, which put the top row at
                                // 35 from the temple-front waterline.)
  rosieMarginTop: 44,           // Rosie's OWN top bound — the same
                                // ceiling line Mitchell marked for
                                // both ships (2026-11-25, see marginTop
                                // above): neither hull sails above 44% of
                                // the arena height. (Supersedes the
                                // earlier 25, derived from the desktop
                                // band's far-shore waterline.)
  bargeY: 51,                   // the fireworks barge's anchor — its
                                // HULL WATERLINE point: the renderer
                                // hangs the sprite from this point at
                                // its ~90% row (the wide hull's bottom;
                                // the keel tip dips just below). At the
                                // round-7 band, y=51 maps to image
                                // 50.0% — the hull rests ON the water
                                // (alpha hull line ~89% of the canvas,
                                // keel tip at 98% -> box 53.4, image
                                // 51.1%) directly in front of the
                                // temple's base, and the sprite's top
                                // (barge is 25% wide: 29.93 units tall,
                                // 0.90 x 29.93 = 26.9 above the anchor)
                                // stays at box 24.1, inside the frame,
                                // its painted top (alpha top 0.6%)
                                // reaching image ~37.4% — the temple
                                // base itself. (Rounds 3-6 anchored it
                                // at 31 under their lower bands; the
                                // round-7 band sits higher, so the
                                // anchor moves down the box to keep the
                                // hull on the same water.)
  laserDotLift: 9,              // the laser dot dances this many units
                                // ABOVE the barge anchor — on the rocket
                                // deck (the sprite's ~60% row: 0.30 of
                                // its 29.93-unit height above the hull
                                // line), not in the water at the hull.
  rosieRadius: 4.2,
  kuroiRadius: 5.0,
  rosieSpeed: 30,               // units per second
  dashSpeed: 80,
  dashMs: 240,
  dashCooldownMs: 1500,
  hitInvulnMs: 1600,
  startHull: 3,
  maxHull: 3,
  crashScore: 200,
  finaleScore: 400,
  nearMissScore: 25,
  nearMissRange: 11,
  crashesPerPhase: [3, 3, 2],   // phase 3's two crashes arm the barge finale
  totalCrashes: 9,              // 3 + 3 + 2 furniture crashes + the barge
  // Round 3 difficulty pass (Mitchell: ~10% harder): charge speeds x1.1,
  // wind-up and weapon fuse times x0.9, circle (cycle) times x0.9 so
  // volleys and charges also arrive on a slightly tighter cadence.
  circleMs: [4140, 3780, 3420],
  circleSpeed: 17,              // perimeter units per second
  windupMs: [1350, 1125, 945],
  laserLockMs: 1500,            // the stare: dot dances, Kuroi tracks it
  // Mitchell (2026-11-25, later): every charge in this battle runs
  // 20% faster again — [57, 68, 79] x 1.2. This one array drives the
  // phase charges AND the finale charge (same step code), so the
  // barge run is faster too. Weapons are explicitly NOT sped up:
  // rocketSpeed, bombFuseMs and rocketWarnMs keep their values.
  chargeSpeed: [68.4, 81.6, 94.8],
  dazedMs: 2200,
  ramDazedMs: 1200,
  finaleDazedMs: 900,           // the barge-arming crash stuns him only
                                // briefly — then he shakes it off and
                                // resumes his patrol (see below)
  minWindupRange: 26,           // Kuroi never begins a windup closer
                                // than this to Rosie — he keeps circling
                                // until he has a fair run at her. Under
                                // Mitchell's 44% ceiling the patrol's top
                                // row passes ~10 units from the arena's
                                // middle water, and a point-blank windup
                                // there left no dodge window at all (the
                                // lazy-policy calibration died to it in
                                // every seed); a charge must start far
                                // enough away to be answered.
  finaleBottomY: 76,            // Mitchell (2026-11-25, later — this
                                // supersedes the same-day 24-unit
                                // distance trigger): the laser bait is
                                // staged by position, not distance.
                                // Kuroi must have carried himself to
                                // the BOTTOM of the arena on his own
                                // patrol (the patrol's bottom row is
                                // y=80; 76 catches him on it) ...
  finaleBetweenMin: 0.1,        // ... AND Rosie must be BETWEEN him
  finaleBetweenMax: 0.95,       // and the barge: her projection onto
                                // the Kuroi->barge line falls within
                                // [min, max] of the way across ...
  finaleBetweenTolerance: 15,   // ... within this many units of that
                                // line. Only then does she lift the
                                // laser pointer and bait the charge.
                                // Nothing is staged or slid: he arrives
                                // at the bottom by circling, she is
                                // there because the player sailed her
                                // there. (The old "reposition" mode
                                // walked him into a computed spot;
                                // removed 2026-11-25 and not returning.)
  bombFuseMs: 1530,
  bombRadius: 11.5,
  bombBoomMs: 380,
  rocketWarnMs: 1300,           // round 5 (Mitchell): the rockets need
                                // a bit MORE warning than round 3's +10%
                                // pass left them — 900 -> 1300ms, and the
                                // dashed tell swells in its final third.
                                // Every other round-3 delta stands.
  rocketSpeed: 95,
  rocketHitWidth: 5.2,
  eruptionMs: 6500
});

export function arenaPhaseGoal(phase) {
  // Pips for the HUD: phases 1-2 need their furniture crashes; phase 3
  // needs two crashes plus the barge finale.
  return phase >= 2 ? ARENA.crashesPerPhase[2] + 1 : ARENA.crashesPerPhase[phase];
}

export function arenaBackgroundIndex(state) {
  if (!state || state.status === "won") return 6;
  // Finale hold: the 8th crash arms the barge finale and resets
  // crashesInPhase to 0 in phase 3, which would step the index back from
  // 5 (setting-06, the brink) to 4 (setting-05) for the whole finale
  // sequence and the eruption. The brink — primed, unlit, the moment
  // just before the fight ends — is the backdrop the fight ends on, so
  // once the finale is armed (and through the eruption) it holds at 5.
  if (state.status === "eruption" || state.finaleArmed) return 5;
  const phase = Math.max(0, Math.min(2, state.phase || 0));
  // Two backgrounds per phase: the second, more battered one arrives with
  // the phase's first crash. Round 8 (Item B): phase 3 is the exception —
  // its pair was setting-05 (the harbor BURNS) stepping to setting-06
  // (fires dead to embers), which read as the fight going backwards at
  // crashes 6-8. Phase 3 now holds setting-05 for both of its steps, and
  // setting-06 belongs exclusively to the finale hold above (the held
  // breath from finale-arming through the eruption). The full sequence
  // 0,1,2,3,4,4,5,6 is non-decreasing; the arena suite pins it.
  if (phase >= 2) return 4;
  return phase * 2 + (state.crashesInPhase > 0 ? 1 : 0);
}

/** Deterministic RNG (mulberry32) carried inside the state. */
function nextRandom(state) {
  let a = (state.rngState + 0x6D2B79F5) | 0;
  state.rngState = a;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

/** Point at distance s along the inset rectangle's perimeter, with the
 * heading of travel. s wraps; direction +1 runs clockwise on screen. */
export function arenaPerimeterPoint(s, direction = 1) {
  // Round 8: the rectangle's top edge is ARENA.marginTop (35), not
  // marginY — the asymmetric inset that puts Kuroi's hull on the
  // temple-front waterline at his top row (see ARENA.marginTop).
  const mx = ARENA.margin, my = ARENA.marginTop;
  const w = 100 - 2 * mx, h = (100 - ARENA.marginY) - my;
  const perimeter = 2 * (w + h);
  let t = ((s % perimeter) + perimeter) % perimeter;
  if (direction < 0) t = (perimeter - t) % perimeter;
  // Segments: top (left->right), right (top->bottom), bottom (right->left),
  // left (bottom->top). Heading is the direction of travel in radians.
  if (t < w) return { x: mx + t, y: my, heading: 0 };
  if (t < w + h) return { x: mx + w, y: my + (t - w), heading: Math.PI / 2 };
  if (t < 2 * w + h) return { x: mx + w - (t - w - h), y: my + h, heading: Math.PI };
  return { x: mx, y: my + h - (t - 2 * w - h), heading: -Math.PI / 2 };
}

/** Where a ray from (x, y) along (dx, dy) leaves the inset rectangle. */
export function arenaEdgeExit(x, y, dx, dy) {
  const mx = ARENA.margin, myTop = ARENA.marginTop, myBottom = ARENA.marginY;
  let best = Infinity;
  if (dx > 1e-9) best = Math.min(best, (100 - mx - x) / dx);
  if (dx < -1e-9) best = Math.min(best, (mx - x) / dx);
  if (dy > 1e-9) best = Math.min(best, (100 - myBottom - y) / dy);
  if (dy < -1e-9) best = Math.min(best, (myTop - y) / dy);
  if (!Number.isFinite(best)) best = 0;
  return { x: x + dx * best, y: y + dy * best, t: best };
}

/** Sprite facing for a movement/heading vector, in the renderer's terms. */
export function arenaFacing(dx, dy, fallback = "down") {
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return fallback;
  if (Math.abs(dy) >= Math.abs(dx)) return dy >= 0 ? "down" : "up";
  return dx >= 0 ? "right" : "left";
}

export function arenaInitial(seed = 1467) {
  const start = arenaPerimeterPoint(0, 1);
  return {
    status: "fighting",
    elapsedMs: 0,
    phase: 0,
    crashesInPhase: 0,
    totalCrashes: 0,
    hull: ARENA.startHull,
    scoreEvents: 0,
    rosie: {
      x: 50, y: 50, dir: "down",
      dashUntilMs: -1, dashReadyAtMs: 0, invulnUntilMs: 0,
      moving: false, dashing: false, hitAtMs: -1, nearMissAtMs: -1
    },
    kuroi: {
      mode: "circle", modeElapsedMs: 0,
      x: start.x, y: start.y, heading: start.heading,
      perimeterS: 0, circleDir: 1,
      chargeFromX: 0, chargeFromY: 0, chargeDirX: 0, chargeDirY: 1,
      chargeTravel: 0, chargeLength: 0, nearMissChecked: false,
      furniture: null
    },
    weapons: [],
    nextWeaponId: 1,
    lastVolleyAtMs: -100000,
    barge: null,
    laser: null,
    finaleArmed: false,
    eruptionElapsedMs: 0,
    rngState: seed | 0
  };
}

/** Test-hook start (main.jsx's ?finale=1): the fight already at the
 * finale — barge towed in, Kuroi patrolling the arena. Identical in
 * shape to the state resolveCrash leaves behind when the 8th crash
 * arms the finale, so the laser sequence, the eruption and the
 * victory all run through the ordinary machine.
 *
 * Rosie starts BETWEEN Kuroi and the barge (50, 66) — the staging
 * Mitchell directed (2026-11-25): Kuroi begins on the bottom row,
 * so the bait condition is met on his first ticks and the laser
 * sequence runs promptly for verification.
 *
 * The `offset` variant (?finale=1&offset=1) instead pins Rosie at
 * (24, 63): still inside the bait corridor of the line from Kuroi's
 * bottom pass to the barge (projection ~0.31, ~11-13 units off the
 * line as he crosses the bottom), so the laser still lights with
 * ZERO input — but ~9-12 units off the eventual charge line, outside
 * the 8.2-unit ram reach, so the first finale charge misses her and
 * ends in the barge: the dodge → barge-impact path, deterministically,
 * with no operator steering for live verification to depend on. */
export function arenaFinaleStart(seed = 1467, options = {}) {
  const state = arenaInitial(seed);
  state.phase = 2;
  state.totalCrashes = ARENA.crashesPerPhase[0] + ARENA.crashesPerPhase[1] +
    ARENA.crashesPerPhase[2];
  state.finaleArmed = true;
  state.barge = { x: 50, y: ARENA.bargeY, side: "top" };
  state.kuroi.mode = "circle";
  state.kuroi.x = 50;
  state.kuroi.y = 100 - ARENA.marginY;
  state.kuroi.perimeterS = nearestPerimeterS(state.kuroi.x, state.kuroi.y);
  state.rosie.x = 50;
  state.rosie.y = 66;
  if (options.offset) {
    state.rosie.x = 24;
    state.rosie.y = 63;
  }
  return state;
}

function rosieHit(next, events, kind, x, y) {
  next.hull = Math.max(0, next.hull - 1);
  next.rosie.invulnUntilMs = next.elapsedMs + ARENA.hitInvulnMs;
  next.rosie.hitAtMs = next.elapsedMs;
  events.push({ type: kind, x, y, hull: next.hull });
  if (next.hull <= 0) {
    next.status = "lost";
    events.push({ type: "defeat" });
  }
}

function spawnVolley(next, events, when) {
  next.lastVolleyAtMs = next.elapsedMs;
  // Water-bombs arc onto Rosie's position as the volley is fired (a
  // snapshot — she dodges by leaving the rippling mark before the fuse).
  const phase = next.phase;
  const bombCount = phase === 0 ? 0 : 2;
  for (let i = 0; i < bombCount; i++) {
    let bx = next.rosie.x, by = next.rosie.y;
    if (i === 1) {
      bx = clamp(bx + (nextRandom(next) * 22 - 11), ARENA.margin + 4, 100 - ARENA.margin - 4);
      by = clamp(by + (nextRandom(next) * 16 - 8), ARENA.rosieMarginTop + 4, 100 - ARENA.marginY - 4);
    }
    const id = next.nextWeaponId++;
    // Round 5 (Mitchell): bombs must be SEEN to come from Kuroi — they
    // used to simply appear at the target. Each bomb now carries its
    // launch point (Kuroi's position at fire time) and launch clock,
    // and the renderer arcs a visible projectile from him to the mark
    // across the fuse; the shadow/ripple at the mark stay as the
    // landing read, and they agree with where the arc comes down.
    next.weapons.push({ id, kind: "bomb", x: bx, y: by,
      fromX: next.kuroi.x, fromY: next.kuroi.y, armedAtMs: next.elapsedMs,
      fuseAtMs: next.elapsedMs + ARENA.bombFuseMs, state: "armed", boomAtMs: 0 });
    events.push({ type: "bomb-armed", id, x: bx, y: by, when });
  }
  if (phase > 0) {
    // One regatta rocket per volley, fired from Kuroi's position along a
    // line through Rosie's position at fire time.
    const dx = next.rosie.x - next.kuroi.x;
    const dy = next.rosie.y - next.kuroi.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const exit = arenaEdgeExit(next.kuroi.x, next.kuroi.y, ux, uy);
    const id = next.nextWeaponId++;
    next.weapons.push({ id, kind: "rocket",
      x1: next.kuroi.x, y1: next.kuroi.y, x2: exit.x, y2: exit.y,
      ux, uy, length: exit.t,
      warnUntilMs: next.elapsedMs + ARENA.rocketWarnMs,
      progress: 0, state: "warn", hitChecked: false });
    events.push({ type: "rocket-warn", id, when,
      x1: next.kuroi.x, y1: next.kuroi.y, x2: exit.x, y2: exit.y });
  }
}

function beginWindup(next, events) {
  const k = next.kuroi;
  k.mode = "windup";
  k.modeElapsedMs = 0;
  k.chargeFromX = k.x; k.chargeFromY = k.y;
  // The aim is locked through Rosie's position at wind-up start — the
  // same read the old telegraph line drew. The line is gone; what the
  // player reads now is Kuroi himself: stopped at the edge, turned to
  // face her (heading below), revving.
  const dx = next.rosie.x - k.x, dy = next.rosie.y - k.y;
  const len = Math.hypot(dx, dy) || 1;
  k.chargeDirX = dx / len; k.chargeDirY = dy / len;
  const exit = arenaEdgeExit(k.x, k.y, k.chargeDirX, k.chargeDirY);
  k.chargeLength = exit.t;
  k.chargeTravel = 0;
  k.nearMissChecked = false;
  const furniture = ARENA_FURNITURE[next.totalCrashes % ARENA_FURNITURE.length];
  k.furniture = { ...furniture, x: exit.x, y: exit.y };
  k.heading = Math.atan2(k.chargeDirY, k.chargeDirX);
  events.push({ type: "windup",
    x1: k.x, y1: k.y, x2: exit.x, y2: exit.y,
    furniture: k.furniture, phase: next.phase });
  // Phase 3 fires its volley as the charge is wound up, so the bombs
  // and the rocket land WHILE he charges. Never once the finale is
  // armed: the set-piece runs with no Rosie-targeted fire at all.
  if (next.phase === 2 && !next.finaleArmed) spawnVolley(next, events, "charge");
}

/** The natural bait condition (Mitchell, 2026-11-25): Kuroi has
 * patrolled himself to the bottom of the arena, and Rosie sits
 * between him and the fireworks barge — in the corridor of the
 * Kuroi->barge line, partway across, not at either end. */
export function finaleBaitReady(state) {
  const k = state.kuroi, r = state.rosie, b = state.barge;
  if (!b || !k || !r) return false;
  if (k.y < ARENA.finaleBottomY) return false;
  const dx = b.x - k.x, dy = b.y - k.y;
  const len2 = dx * dx + dy * dy;
  if (!len2) return false;
  const t = ((r.x - k.x) * dx + (r.y - k.y) * dy) / len2;
  if (t < ARENA.finaleBetweenMin || t > ARENA.finaleBetweenMax) return false;
  const perp = Math.abs((r.x - k.x) * dy - (r.y - k.y) * dx) / Math.sqrt(len2);
  return perp <= ARENA.finaleBetweenTolerance;
}

/** The laser finale's opening beat: the dot appears ON the barge and
 * dances there; Kuroi turns to track it. After the stare he charges
 * the dot — which sits on the fireworks barge. */
function beginLaserLock(next, events) {
  const k = next.kuroi;
  k.mode = "laserLock";
  k.modeElapsedMs = 0;
  next.laser = { active: true, x: next.barge.x, y: next.barge.y - ARENA.laserDotLift };
  k.heading = Math.atan2(next.laser.y - k.y, next.laser.x - k.x);
  events.push({ type: "laser", x: next.laser.x, y: next.laser.y });
}

function beginFinaleCharge(next, events) {
  const k = next.kuroi;
  k.mode = "finaleCharge";
  k.modeElapsedMs = 0;
  k.chargeFromX = k.x; k.chargeFromY = k.y;
  // He charges the DOT (its position as the stare ends), not Rosie.
  const dot = next.laser || { x: next.barge.x, y: next.barge.y };
  const dx = dot.x - k.x, dy = dot.y - k.y;
  const len = Math.hypot(dx, dy) || 1;
  k.chargeDirX = dx / len; k.chargeDirY = dy / len;
  const exit = arenaEdgeExit(k.x, k.y, k.chargeDirX, k.chargeDirY);
  k.chargeLength = exit.t;
  k.chargeTravel = 0;
  k.nearMissChecked = false;
  k.furniture = { kind: "barge", asset: ARENA_SPRITES.barge,
    label: "Fireworks barge", x: next.barge.x, y: next.barge.y };
  k.heading = Math.atan2(k.chargeDirY, k.chargeDirX);
  events.push({ type: "charge", finale: true, phase: next.phase });
}

function beginCharge(next, events) {
  const k = next.kuroi;
  k.mode = "charge";
  k.modeElapsedMs = 0;
  events.push({ type: "charge", finale: false, phase: next.phase });
}

function resolveCrash(next, events, finale) {
  const k = next.kuroi;
  const at = { x: k.furniture.x, y: k.furniture.y, kind: k.furniture.kind };
  k.mode = "dazed";
  k.modeElapsedMs = 0;
  k.x = k.furniture.x; k.y = k.furniture.y;
  if (finale) {
    next.totalCrashes += 1;
    next.status = "eruption";
    next.eruptionElapsedMs = 0;
    next.laser = null;
    events.push({ type: "crash", finale: true, ...at,
      totalCrashes: next.totalCrashes, phase: next.phase });
    events.push({ type: "eruption", x: at.x, y: at.y });
    return;
  }
  next.crashesInPhase += 1;
  next.totalCrashes += 1;
  next.hull = Math.min(ARENA.maxHull, next.hull + 1);
  events.push({ type: "crash", finale: false, ...at,
    crashesInPhase: next.crashesInPhase, totalCrashes: next.totalCrashes,
    phase: next.phase, hull: next.hull });
  if (next.crashesInPhase >= ARENA.crashesPerPhase[next.phase]) {
    if (next.phase < 2) {
      next.phase += 1;
      next.crashesInPhase = 0;
      events.push({ type: "phase", phase: next.phase });
    } else {
      // Phase 3's furniture crashes are done: tow the barge in. He stays
      // dazed at the wreck first; the dazed resolution returns him to
      // his patrol, and the finale waits for him to circle into
      // position on his own (Mitchell, 2026-11-25).
      next.crashesInPhase = 0;
      next.finaleArmed = true;
      next.barge = { x: 50, y: ARENA.bargeY, side: "top" };
      // The set-piece takes over NOW: anything still in flight from
      // the last phase-3 volley is swept away, so no Rosie-targeted
      // weapon can land during the finale handover, and his stun is
      // the short finale one — the laser follows promptly.
      next.weapons = [];
      k.finaleDazed = true;
      k.pendingBarge = true;
      events.push({ type: "barge", x: next.barge.x, y: next.barge.y });
    }
  }
}

function stepWeapons(next, events, dtSec) {
  const kept = [];
  for (const weapon of next.weapons) {
    if (weapon.kind === "bomb") {
      if (weapon.state === "armed" && next.elapsedMs >= weapon.fuseAtMs) {
        weapon.state = "boom";
        weapon.boomAtMs = next.elapsedMs;
        const hit = next.status === "fighting" &&
          next.elapsedMs >= next.rosie.invulnUntilMs &&
          dist(next.rosie.x, next.rosie.y, weapon.x, weapon.y) <= ARENA.bombRadius;
        events.push({ type: "bomb-boom", id: weapon.id, x: weapon.x, y: weapon.y, hit });
        if (hit) rosieHit(next, events, "bomb-hit", weapon.x, weapon.y);
        kept.push(weapon);
      } else if (weapon.state === "boom" &&
          next.elapsedMs - weapon.boomAtMs > ARENA.bombBoomMs) {
        // Splash spent; drop it.
      } else {
        kept.push(weapon);
      }
    } else if (weapon.kind === "rocket") {
      if (weapon.state === "warn" && next.elapsedMs >= weapon.warnUntilMs) {
        weapon.state = "fly";
      }
      if (weapon.state === "fly") {
        weapon.progress += ARENA.rocketSpeed * dtSec;
        // Round 5: a rocket ends in a visible burst wherever it lands —
        // on Rosie when it hits (and it is spent there), or at the
        // water/edge where its line leaves the arena when dodged. The
        // renderer draws the burst from this event; damage is unchanged.
        let spent = false;
        if (!weapon.hitChecked && next.status === "fighting") {
          // Rosie's projection onto the rocket's line: check her as the
          // rocket's head passes that point.
          const rx = next.rosie.x - weapon.x1, ry = next.rosie.y - weapon.y1;
          const along = rx * weapon.ux + ry * weapon.uy;
          if (weapon.progress >= along) {
            weapon.hitChecked = true;
            const perp = Math.abs(rx * weapon.uy - ry * weapon.ux);
            const hit = perp <= ARENA.rocketHitWidth &&
              next.elapsedMs >= next.rosie.invulnUntilMs;
            events.push({ type: "rocket-pass", id: weapon.id, hit,
              x: next.rosie.x, y: next.rosie.y });
            if (hit) {
              rosieHit(next, events, "rocket-hit", next.rosie.x, next.rosie.y);
              events.push({ type: "rocket-boom", id: weapon.id, hit: true,
                x: next.rosie.x, y: next.rosie.y });
              spent = true;
            }
          }
        }
        if (!spent && weapon.progress >= weapon.length + 6) {
          events.push({ type: "rocket-boom", id: weapon.id, hit: false,
            x: weapon.x2, y: weapon.y2 });
          spent = true;
        }
        if (!spent) kept.push(weapon);
      } else {
        kept.push(weapon);
      }
    }
  }
  next.weapons = kept;
}

/** One tick of the arena fight. `input` is {x, y, dash} — a movement
 * intent in arena units (components in -1..1) plus the dash verb. */
export function arenaStep(state, tickMs, input = {}) {
  const events = [];
  const next = {
    ...state,
    rosie: { ...state.rosie },
    kuroi: { ...state.kuroi, furniture: state.kuroi.furniture ? { ...state.kuroi.furniture } : null },
    weapons: state.weapons.map((w) => ({ ...w })),
    barge: state.barge ? { ...state.barge } : null,
    laser: state.laser ? { ...state.laser } : null
  };
  const dtMs = Math.max(0, Number(tickMs) || 0);
  const dtSec = dtMs / 1000;
  if (next.status === "won" || next.status === "lost") return { state: next, events };
  next.elapsedMs += dtMs;

  // --- The eruption runs on its own clock, then the fight is won. ---
  if (next.status === "eruption") {
    next.eruptionElapsedMs += dtMs;
    if (next.eruptionElapsedMs >= ARENA.eruptionMs) {
      next.status = "won";
      events.push({ type: "victory", totalCrashes: next.totalCrashes,
        elapsedMs: next.elapsedMs });
    }
    return { state: next, events };
  }

  const rosie = next.rosie;
  const k = next.kuroi;

  // --- Rosie: free movement + dash, the core dodge verb. ---
  let ix = clamp(Number(input.x) || 0, -1, 1);
  let iy = clamp(Number(input.y) || 0, -1, 1);
  const iLen = Math.hypot(ix, iy);
  if (iLen > 1) { ix /= iLen; iy /= iLen; }
  if (input.dash && next.elapsedMs >= rosie.dashReadyAtMs) {
    rosie.dashUntilMs = next.elapsedMs + ARENA.dashMs;
    rosie.dashReadyAtMs = next.elapsedMs + ARENA.dashCooldownMs;
    events.push({ type: "dash", x: rosie.x, y: rosie.y });
  }
  rosie.dashing = next.elapsedMs < rosie.dashUntilMs;
  rosie.moving = iLen > 0.01;
  if (rosie.moving) {
    rosie.dir = arenaFacing(ix, iy, rosie.dir);
    const speed = rosie.dashing ? ARENA.dashSpeed : ARENA.rosieSpeed;
    rosie.x = clamp(rosie.x + ix * speed * dtSec, ARENA.margin, 100 - ARENA.margin);
    rosie.y = clamp(rosie.y + iy * speed * dtSec, ARENA.rosieMarginTop, 100 - ARENA.marginY);
  }

  // --- Weapons tick independently of Kuroi's mode. ---
  stepWeapons(next, events, dtSec);
  if (next.status !== "fighting") return { state: next, events };

  // --- Kuroi. ---
  k.modeElapsedMs += dtMs;
  if (k.mode === "circle") {
    k.perimeterS += ARENA.circleSpeed * dtSec * k.circleDir;
    const point = arenaPerimeterPoint(k.perimeterS, 1);
    // perimeterS already encodes travel; heading follows the segment.
    k.x = point.x; k.y = point.y; k.heading = point.heading;
    if (next.finaleArmed && next.barge) {
      // The finale waits for the natural staging (Mitchell,
      // 2026-11-25): Kuroi keeps patrolling after the barge comes in,
      // and the laser appears only when his own circling has carried
      // him to the bottom of the arena AND Rosie is between him and
      // the barge — the moment in the film where she lifts the laser
      // pointer and baits the charge. No staged slide, no computed
      // spot: he gets into position on his own, and she is between
      // because the player sailed her there.
      if (finaleBaitReady(next)) {
        beginLaserLock(next, events);
      }
    } else if (k.modeElapsedMs >= ARENA.circleMs[next.phase] &&
        dist(k.x, k.y, next.rosie.x, next.rosie.y) >= ARENA.minWindupRange) {
      // The range gate (see ARENA.minWindupRange): if he is too close
      // when the circle timer ends he simply keeps patrolling until
      // the charge can be fairly answered.
      beginWindup(next, events);
    }
  } else if (k.mode === "laserLock") {
    // The dot dances on the barge (a deterministic wiggle off the
    // fight clock, so sims see the same dance as the renderer); Kuroi
    // turns to track it for the whole stare, then charges it.
    const t = next.elapsedMs;
    next.laser.x = next.barge.x + Math.sin(t / 260) * 2.4;
    next.laser.y = next.barge.y - ARENA.laserDotLift + Math.cos(t / 330) * 0.7;
    k.heading = Math.atan2(next.laser.y - k.y, next.laser.x - k.x);
    if (k.modeElapsedMs >= ARENA.laserLockMs) beginFinaleCharge(next, events);
  } else if (k.mode === "windup") {
    if (k.modeElapsedMs >= ARENA.windupMs[next.phase]) beginCharge(next, events);
  } else if (k.mode === "charge" || k.mode === "finaleCharge") {
    const finale = k.mode === "finaleCharge";
    const speed = ARENA.chargeSpeed[next.phase];
    const step = speed * dtSec;
    k.chargeTravel += step;
    k.x = k.chargeFromX + k.chargeDirX * k.chargeTravel;
    k.y = k.chargeFromY + k.chargeDirY * k.chargeTravel;
    // Ram: his hull reaches Rosie while she is on the line.
    const dRosie = dist(k.x, k.y, rosie.x, rosie.y);
    if (dRosie <= ARENA.rosieRadius + ARENA.kuroiRadius - 1) {
      if (next.elapsedMs >= rosie.invulnUntilMs) {
        rosieHit(next, events, "ram", rosie.x, rosie.y);
        k.mode = "dazed";
        k.modeElapsedMs = 0;
        k.dazedFromRam = true;
        if (next.status === "fighting" && finale) {
          // The barge stays; he peels off and lines up again.
          k.pendingFinaleRetry = true;
        }
        return { state: next, events };
      }
      // Invulnerable (just hit): he slides past her without a second hit.
    } else if (!k.nearMissChecked && dRosie <= ARENA.nearMissRange) {
      // He is passing close but will miss: count the near miss once the
      // charge is clearly past her (his travel exceeds her projection).
      const along = (rosie.x - k.chargeFromX) * k.chargeDirX +
        (rosie.y - k.chargeFromY) * k.chargeDirY;
      if (k.chargeTravel > along) {
        k.nearMissChecked = true;
        rosie.nearMissAtMs = next.elapsedMs;
        events.push({ type: "near-miss", x: rosie.x, y: rosie.y });
      }
    }
    if (k.chargeTravel >= k.chargeLength) {
      resolveCrash(next, events, finale);
    }
  } else if (k.mode === "dazed") {
    const wait = k.dazedFromRam ? ARENA.ramDazedMs
      : k.finaleDazed ? ARENA.finaleDazedMs : ARENA.dazedMs;
    if (k.modeElapsedMs >= wait) {
      k.dazedFromRam = false;
      k.finaleDazed = false;
      k.pendingFinaleRetry = false;
      k.pendingBarge = false;
      // Re-enter the patrol at the nearest perimeter point — always,
      // including after the barge comes in: the finale's laser waits
      // for his own circling to carry him into position (Mitchell,
      // 2026-11-25). Entering a fresh circle in phases 2-3 opens with
      // the volley: its fuses burn during the circle, so the charge
      // itself comes after — volley, then charge. The volley stays
      // suppressed once the finale is armed.
      k.mode = "circle";
      k.perimeterS = nearestPerimeterS(k.x, k.y);
      if (next.phase > 0 && !next.finaleArmed) spawnVolley(next, events, "circle");
      k.modeElapsedMs = 0;
      k.furniture = null;
      events.push({ type: "recover", x: k.x, y: k.y });
    }
  }
  return { state: next, events };
}

/** Perimeter parameter of the point on the inset rectangle nearest (x, y). */
export function nearestPerimeterS(x, y) {
  const mx = ARENA.margin, my = ARENA.marginTop;
  const w = 100 - 2 * mx, h = (100 - ARENA.marginY) - my;
  const cx = clamp(x, mx, mx + w), cy = clamp(y, my, my + h);
  const candidates = [
    { s: cx - mx, d: Math.abs(y - my) },                        // top
    { s: w + (cy - my), d: Math.abs(x - (mx + w)) },            // right
    { s: w + h + (mx + w - cx), d: Math.abs(y - (my + h)) },    // bottom
    { s: 2 * w + h + (my + h - cy), d: Math.abs(x - mx) }       // left
  ];
  candidates.sort((a, b) => a.d - b.d);
  return candidates[0].s;
}
