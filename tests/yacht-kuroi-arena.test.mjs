import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ARENA, ARENA_BACKGROUNDS, ARENA_SPRITES, ARENA_FURNITURE,
  ARENA_SPRITE_NORM, ARENA_KUROI_HULL_BOTTOM, ARENA_ROSIE_HULL_BOTTOM,
  arenaSpriteNormStyle,
  arenaInitial, arenaFinaleStart, arenaStep, arenaFacing, arenaPhaseGoal,
  finaleBaitReady,
  arenaBackgroundIndex, arenaPerimeterPoint, arenaEdgeExit,
  nearestPerimeterS } from "../src/yachtArenaBoss.js";

const root = path.resolve("src", "..");
const mainSource = fs.readFileSync(path.join(root, "src", "main.jsx"), "utf-8");
const cssSource = fs.readFileSync(path.join(root, "src", "yachtDashExpansion.css"), "utf-8");
const TICK = 50;

const lineDistance = (px, py, x1, y1, dx, dy) =>
  Math.abs((px - x1) * dy - (py - y1) * dx);

/** The dodge policy a player reading Kuroi's body language would run:
 * leave his facing line sideways (during the wind-up he is turned
 * through Rosie's lock position; in the finale the line runs from him
 * to the laser dot on the barge), leave bomb marks, cross rocket lines
 * early, otherwise hold near the center. Dash when the line is close. */
function dodgeInput(state) {
  const r = state.rosie;
  const k = state.kuroi;
  let tx = null, ty = null;
  if ((k.mode === "windup" || k.mode === "charge" ||
       k.mode === "finaleCharge") && k.furniture) {
    const d = lineDistance(r.x, r.y, k.chargeFromX, k.chargeFromY, k.chargeDirX, k.chargeDirY);
    if (d < 15) {
      const side = Math.sign((r.x - k.chargeFromX) * k.chargeDirY -
        (r.y - k.chargeFromY) * k.chargeDirX) || 1;
      tx = r.x + k.chargeDirY * side * 26;
      ty = r.y - k.chargeDirX * side * 26;
    }
  }
  if (tx === null && k.mode === "laserLock" && state.barge) {
    // The coming charge runs from Kuroi to the dot on the barge: step
    // off that line before the stare ends.
    const dx = state.barge.x - k.x, dy = state.barge.y - k.y;
    const len = Math.hypot(dx, dy) || 1;
    const d = lineDistance(r.x, r.y, k.x, k.y, dx / len, dy / len);
    if (d < 15) {
      const side = Math.sign((r.x - k.x) * (dy / len) - (r.y - k.y) * (dx / len)) || 1;
      tx = r.x + (dy / len) * side * 26;
      ty = r.y - (dx / len) * side * 26;
    }
  }
  if (tx === null) {
    for (const w of state.weapons) {
      if (w.kind === "bomb" && w.state === "armed" &&
          Math.hypot(r.x - w.x, r.y - w.y) < ARENA.bombRadius + 4) {
        const d = Math.hypot(r.x - w.x, r.y - w.y) || 1;
        tx = w.x + (r.x - w.x) / d * (ARENA.bombRadius + 10);
        ty = w.y + (r.y - w.y) / d * (ARENA.bombRadius + 10);
        break;
      }
    }
  }
  if (tx === null) {
    for (const w of state.weapons) {
      if (w.kind === "rocket" && (w.state === "warn" || w.state === "fly") &&
          lineDistance(r.x, r.y, w.x1, w.y1, w.ux, w.uy) < 8) {
        const side = Math.sign((r.x - w.x1) * w.uy - (r.y - w.y1) * w.ux) || 1;
        tx = r.x + w.uy * side * 20;
        ty = r.y - w.ux * side * 20;
        break;
      }
    }
  }
  if (tx === null) { tx = 50; ty = 54; }
  const dx = tx - r.x, dy = ty - r.y;
  const len = Math.hypot(dx, dy);
  if (len < 1.5) return { x: 0, y: 0, dash: false };
  let dash = false;
  if ((k.mode === "windup" || k.mode === "laserLock") && k.furniture &&
      lineDistance(r.x, r.y, k.chargeFromX, k.chargeFromY, k.chargeDirX, k.chargeDirY) < 9) {
    dash = true;
  }
  return { x: dx / len, y: dy / len, dash };
}

function runFight(policy, seed = 1467, maxTicks = 24000) {
  let state = arenaInitial(seed);
  const log = [];
  const history = [];
  for (let tick = 0; tick < maxTicks; tick++) {
    history.push(state);
    let input = { x: 0, y: 0, dash: false };
    if (policy === "dodge") input = dodgeInput(state);
    else if (policy === "lazy") input = lazyInput(history);
    const out = arenaStep(state, TICK, input);
    state = out.state;
    for (const event of out.events) log.push({ ...event, atMs: state.elapsedMs, mode: state.kuroi.mode });
    if (state.status === "won" || state.status === "lost") break;
  }
  return { state, log };
}

/** The lazy policy from the tuning notes: reacts 900ms late (it reads
 * the fight as it was 18 ticks ago), never dashes, and only ever dodges
 * Kuroi's facing line — weapon marks are ignored entirely. */
function lazyInput(history) {
  const delayed = history[Math.max(0, history.length - 1 - 18)];
  const current = history[history.length - 1];
  const r = current.rosie;
  const k = delayed.kuroi;
  let tx = null, ty = null;
  if ((k.mode === "windup" || k.mode === "charge" || k.mode === "finaleCharge") && k.furniture) {
    const d = lineDistance(r.x, r.y, k.chargeFromX, k.chargeFromY, k.chargeDirX, k.chargeDirY);
    if (d < 15) {
      const side = Math.sign((r.x - k.chargeFromX) * k.chargeDirY -
        (r.y - k.chargeFromY) * k.chargeDirX) || 1;
      tx = r.x + k.chargeDirY * side * 26;
      ty = r.y - k.chargeDirX * side * 26;
    }
  }
  if (tx === null && k.mode === "laserLock" && delayed.barge) {
    const dx = delayed.barge.x - k.x, dy = delayed.barge.y - k.y;
    const len = Math.hypot(dx, dy) || 1;
    const d = lineDistance(r.x, r.y, k.x, k.y, dx / len, dy / len);
    if (d < 15) {
      const side = Math.sign((r.x - k.x) * (dy / len) - (r.y - k.y) * (dx / len)) || 1;
      tx = r.x + (dy / len) * side * 26;
      ty = r.y - (dx / len) * side * 26;
    }
  }
  if (tx === null) { tx = 50; ty = 54; }
  const dx = tx - r.x, dy = ty - r.y;
  const len = Math.hypot(dx, dy);
  if (len < 1.5) return { x: 0, y: 0, dash: false };
  return { x: dx / len, y: dy / len, dash: false };
}

test("arena opens with Rosie centered, Kuroi circling, full hull", () => {
  const state = arenaInitial();
  assert.equal(state.rosie.x, 50);
  assert.equal(state.rosie.y, 50);
  assert.equal(state.hull, ARENA.startHull);
  assert.equal(state.phase, 0);
  assert.equal(state.kuroi.mode, "circle");
  assert.equal(state.status, "fighting");
});

test("perimeter points stay on the inset rectangle and edge exits are exact", () => {
  for (let s = 0; s < 400; s += 17) {
    const p = arenaPerimeterPoint(s, 1);
    assert.ok(p.x >= ARENA.margin && p.x <= 100 - ARENA.margin, `x at s=${s}`);
    // Round 8: the rectangle's top edge is the asymmetric marginTop;
    // the bottom stays at 100 - marginY.
    assert.ok(p.y >= ARENA.marginTop && p.y <= 100 - ARENA.marginY, `y at s=${s}`);
    assert.ok(Math.abs(p.x - ARENA.margin) < 0.01 || Math.abs(p.x - (100 - ARENA.margin)) < 0.01 ||
      Math.abs(p.y - ARENA.marginTop) < 0.01 || Math.abs(p.y - (100 - ARENA.marginY)) < 0.01,
      `point not on the rectangle at s=${s}`);
  }
  const exit = arenaEdgeExit(50, 50, 1, 0);
  assert.equal(exit.x, 100 - ARENA.margin);
  assert.equal(exit.y, 50);
  // Vertical exits stop at the vertical insets — the top one is
  // marginTop (round 8), not the horizontal inset or marginY.
  const exitUp = arenaEdgeExit(50, 50, 0, -1);
  assert.equal(exitUp.x, 50);
  assert.equal(exitUp.y, ARENA.marginTop);
  const exitDown = arenaEdgeExit(50, 50, 0, 1);
  assert.equal(exitDown.y, 100 - ARENA.marginY);
  const back = arenaPerimeterPoint(nearestPerimeterS(50, ARENA.marginTop), 1);
  assert.equal(back.y, ARENA.marginTop);
});

test("backgrounds phase with the fight: two per phase, triumphant last", () => {
  assert.equal(ARENA_BACKGROUNDS.length, 7);
  const base = arenaInitial();
  assert.equal(arenaBackgroundIndex(base), 0);
  assert.equal(arenaBackgroundIndex({ ...base, crashesInPhase: 1 }), 1);
  assert.equal(arenaBackgroundIndex({ ...base, phase: 1 }), 2);
  assert.equal(arenaBackgroundIndex({ ...base, phase: 1, crashesInPhase: 2 }), 3);
  assert.equal(arenaBackgroundIndex({ ...base, phase: 2 }), 4);
  // Round 8 (Item B): phase 3 holds setting-05 for BOTH steps — its
  // old second step (setting-06, fires dead) read as the fight going
  // backwards. Setting-06 is now exclusively the finale hold below.
  assert.equal(arenaBackgroundIndex({ ...base, phase: 2, crashesInPhase: 1 }), 4);
  assert.equal(arenaBackgroundIndex({ ...base, phase: 2, crashesInPhase: 2 }), 4);
  // The finale hold: the 8th crash resets crashesInPhase to 0 as it arms
  // the barge — without the guard that state would index setting-05 (4)
  // again. Armed, erupting: the brink (5). Won still wins the triumphant.
  const armed = { ...base, phase: 2, crashesInPhase: 0, totalCrashes: 8,
    finaleArmed: true, barge: { x: 50, y: ARENA.bargeY, side: "top" } };
  assert.equal(arenaBackgroundIndex(armed), 5);
  assert.equal(arenaBackgroundIndex({ ...armed, status: "eruption" }), 5);
  assert.equal(arenaBackgroundIndex({ ...armed, status: "won" }), 6);
  assert.equal(arenaBackgroundIndex({ ...base, status: "won" }), 6);
  assert.equal(arenaPhaseGoal(0), 3);
  assert.equal(arenaPhaseGoal(1), 3);
  assert.equal(arenaPhaseGoal(2), 3);
});

test("every charge is wound up facing Rosie from the edge, with a real dodge window", () => {
  let state = arenaInitial();
  let windupAt = null;
  let rosieAtLock = null;
  for (let tick = 0; tick < 4000; tick++) {
    const before = state;
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    for (const event of out.events) {
      if (event.type === "windup" && windupAt === null) {
        windupAt = state.elapsedMs;
        rosieAtLock = { ...before.rosie };
        // His course starts at Kuroi and passes through Rosie's lock
        // position — the aim the (now removed) telegraph line used to
        // draw. The read is his facing, not a line.
        const d = lineDistance(rosieAtLock.x, rosieAtLock.y,
          event.x1, event.y1, state.kuroi.chargeDirX, state.kuroi.chargeDirY);
        assert.ok(d < 0.51, `charge course misses Rosie's lock position by ${d}`);
        assert.ok(event.furniture, "wind-up names the crash furniture");
        // He winds up stopped ON the arena edge (the patrol rectangle)…
        const k = state.kuroi;
        const onEdge = Math.abs(k.x - ARENA.margin) < 0.51 || Math.abs(k.x - (100 - ARENA.margin)) < 0.51 ||
          Math.abs(k.y - ARENA.marginTop) < 0.51 || Math.abs(k.y - (100 - ARENA.marginY)) < 0.51;
        assert.ok(onEdge, `Kuroi wound up off the edge at ${k.x},${k.y}`);
        // …and turned to face her.
        const want = Math.atan2(rosieAtLock.y - k.y, rosieAtLock.x - k.x);
        let diff = Math.abs(k.heading - want) % (Math.PI * 2);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        assert.ok(diff < 0.2, `Kuroi's heading is ${diff} rad off Rosie during the wind-up`);
      }
      if (event.type === "charge") {
        assert.ok(windupAt !== null, "charge without a wind-up");
        assert.ok(state.elapsedMs - windupAt >= ARENA.windupMs[0],
          "charge began before the wind-up window elapsed");
        return;
      }
    }
  }
  assert.fail("no charge ever began");
});

test("phase 1 has no weapons: rams only", () => {
  const { log } = runFight("still");
  assert.ok(!log.some((e) => e.type === "bomb-armed" || e.type === "rocket-warn"),
    "a weapon appeared in phase 1");
});

test("a stationary Rosie is rammed and loses — no crash ever lands", () => {
  const { state, log } = runFight("still");
  assert.equal(state.status, "lost");
  assert.equal(state.totalCrashes, 0);
  assert.equal(log.filter((e) => e.type === "ram").length, ARENA.startHull);
  assert.ok(log.some((e) => e.type === "defeat"));
});

test("full fight sim: phases at 3 and 6 crashes, barge at 8, eruption, victory", () => {
  const { state, log } = runFight("dodge");
  assert.equal(state.status, "won");
  assert.equal(state.totalCrashes, ARENA.totalCrashes);
  const phaseEvents = log.filter((e) => e.type === "phase");
  assert.deepEqual(phaseEvents.map((e) => e.phase), [1, 2]);
  const crashTotals = log.filter((e) => e.type === "crash" && !e.finale)
    .map((e) => e.totalCrashes);
  assert.deepEqual(crashTotals, [1, 2, 3, 4, 5, 6, 7, 8]);
  const bargeIndex = log.findIndex((e) => e.type === "barge");
  assert.ok(bargeIndex >= 0, "barge never entered");
  const eighthCrashIndex = log.findIndex((e) => e.type === "crash" && e.totalCrashes === 8);
  assert.ok(eighthCrashIndex >= 0 && bargeIndex > eighthCrashIndex,
    "barge arrived before the 8th crash resolved");
  assert.ok(!log.slice(0, eighthCrashIndex).some((e) => e.type === "barge"),
    "barge appeared before phase 3's second crash");
  const barge = log[bargeIndex];
  const laser = log.find((e) => e.type === "laser");
  assert.ok(laser && laser.atMs > barge.atMs,
    "the laser was not lit after the barge arrived");
  const finaleCharge = log.find((e) => e.type === "charge" && e.finale);
  assert.ok(finaleCharge && finaleCharge.atMs > laser.atMs,
    "the finale charge did not follow the laser lock");
  const eruption = log.find((e) => e.type === "eruption");
  const victory = log.find((e) => e.type === "victory");
  assert.ok(eruption && victory, "eruption/victory missing");
  assert.ok(victory.atMs - eruption.atMs >= ARENA.eruptionMs,
    "victory arrived before the eruption finished");
  // A flawless run's floor: the machine's own cycle times dominate.
  assert.ok(state.elapsedMs > 60000 && state.elapsedMs < 240000,
    `winning run took ${state.elapsedMs}ms`);
});

test("the brink holds through the finale and the eruption (no step back to setting-05)", () => {
  let state = arenaInitial();
  let sawFinale = false;
  let sawEruption = false;
  for (let tick = 0; tick < 24000; tick++) {
    const out = arenaStep(state, TICK, dodgeInput(state));
    state = out.state;
    if (state.finaleArmed) {
      sawFinale = true;
      const expected = state.status === "won" ? 6 : 5;
      assert.equal(arenaBackgroundIndex(state), expected,
        `background left the brink during the finale (status ${state.status})`);
    }
    if (state.status === "eruption") sawEruption = true;
    if (state.status === "won" || state.status === "lost") break;
  }
  assert.equal(state.status, "won");
  assert.ok(sawFinale, "sim never armed the finale");
  assert.ok(sawEruption, "sim never reached the eruption");
});

test("a ram spends the charge: hull lost, no crash, Kuroi stunned", () => {
  let state = arenaInitial();
  // Sit on the line: never move. The first contact must be a ram.
  for (let tick = 0; tick < 4000; tick++) {
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    const ram = out.events.find((e) => e.type === "ram");
    if (ram) {
      assert.equal(ram.hull, ARENA.startHull - 1);
      assert.equal(state.totalCrashes, 0);
      assert.equal(state.kuroi.mode, "dazed");
      return;
    }
    assert.ok(!out.events.some((e) => e.type === "crash"), "crash landed on a stationary Rosie");
  }
  assert.fail("Kuroi never rammed a stationary Rosie");
});

test("a crash patches one hull back (capped)", () => {
  let state = arenaInitial();
  state = { ...state, hull: 1 };
  for (let tick = 0; tick < 24000; tick++) {
    const out = arenaStep(state, TICK, dodgeInput(state));
    state = out.state;
    const crash = out.events.find((e) => e.type === "crash");
    if (crash) {
      assert.equal(crash.hull, 2);
      assert.equal(state.hull, 2);
      return;
    }
    if (state.status !== "fighting") break;
  }
  assert.fail("no crash landed to test the hull patch");
});

test("dash is a burst on a cooldown, not a held speed", () => {
  let state = arenaInitial();
  const walk = arenaStep(state, 500, { x: 1, y: 0, dash: false }).state;
  const dashed = arenaStep(state, 500, { x: 1, y: 0, dash: true }).state;
  assert.ok(dashed.rosie.x > walk.rosie.x + 5,
    `dash moved ${dashed.rosie.x - 50} vs walk ${walk.rosie.x - 50}`);
  // An immediate second dash inside the cooldown does nothing extra.
  const again = arenaStep(dashed, 100, { x: 1, y: 0, dash: true }).state;
  assert.ok(again.rosie.dashUntilMs <= dashed.rosie.dashUntilMs + 100);
});

test("touch-tuning round: Rosie's top bound keeps her in the water, her other bounds are unchanged", () => {
  // Drive her straight up for a full minute of game time: she must
  // stop at rosieMarginTop (not the old shared marginY top), and a
  // dash upward must respect the same bound.
  let state = arenaInitial();
  for (let i = 0; i < 120; i++) {
    state = arenaStep(state, TICK, { x: 0, y: -1, dash: i === 60 }).state;
  }
  assert.equal(state.rosie.y, ARENA.rosieMarginTop,
    `Rosie sailed to y=${state.rosie.y}, past her water bound ${ARENA.rosieMarginTop}`);
  // Bottom and sides keep their long-standing bounds.
  let down = arenaInitial();
  for (let i = 0; i < 120; i++) {
    down = arenaStep(down, TICK, { x: -1, y: 1, dash: false }).state;
  }
  assert.equal(down.rosie.y, 100 - ARENA.marginY, "Rosie's bottom bound moved");
  assert.equal(down.rosie.x, ARENA.margin, "Rosie's side bound moved");
});

test("water-bombs damage only inside the marked ripple, only after the fuse", () => {
  const base = arenaInitial();
  const armed = { ...base, phase: 1, elapsedMs: 10000,
    rosie: { ...base.rosie, x: 50, y: 50, invulnUntilMs: 0 },
    weapons: [{ id: 1, kind: "bomb", x: 50, y: 50, fuseAtMs: 11000, state: "armed", boomAtMs: 0 }] };
  // Before the fuse: nothing.
  let out = arenaStep(armed, 500, { x: 0, y: 0, dash: false });
  assert.ok(!out.events.some((e) => e.type === "bomb-boom"));
  assert.equal(out.state.hull, ARENA.startHull);
  // At the fuse, inside the circle: a hit.
  out = arenaStep({ ...armed, elapsedMs: 10950 }, 100, { x: 0, y: 0, dash: false });
  const boom = out.events.find((e) => e.type === "bomb-boom");
  assert.ok(boom && boom.hit, "bomb at Rosie's feet did not hit");
  assert.equal(out.state.hull, ARENA.startHull - 1);
  // At the fuse, outside the circle: a clean miss.
  const outside = { ...armed, rosie: { ...armed.rosie, x: 85, y: 85 } };
  out = arenaStep({ ...outside, elapsedMs: 10950 }, 100, { x: 0, y: 0, dash: false });
  const miss = out.events.find((e) => e.type === "bomb-boom");
  assert.ok(miss && !miss.hit, "bomb hit Rosie outside its circle");
  assert.equal(out.state.hull, ARENA.startHull);
});

test("rockets damage only on their line as they pass", () => {
  const base = arenaInitial();
  const rocket = { id: 1, kind: "rocket", x1: 10, y1: 50, x2: 93, y2: 50,
    ux: 1, uy: 0, length: 83, warnUntilMs: 500, progress: 0, state: "warn", hitChecked: false };
  const onLine = { ...base, phase: 1, elapsedMs: 0,
    rosie: { ...base.rosie, x: 50, y: 50, invulnUntilMs: 0 }, weapons: [rocket] };
  let state = onLine;
  let pass = null;
  for (let tick = 0; tick < 200 && !pass; tick++) {
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    pass = out.events.find((e) => e.type === "rocket-pass") || pass;
  }
  assert.ok(pass && pass.hit, "rocket passed through Rosie without a hit");
  assert.equal(state.hull, ARENA.startHull - 1);
  // Off the line: a clean pass.
  const offLine = { ...onLine, rosie: { ...onLine.rosie, y: 75 } };
  state = offLine;
  pass = null;
  for (let tick = 0; tick < 200 && !pass; tick++) {
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    pass = out.events.find((e) => e.type === "rocket-pass") || pass;
  }
  assert.ok(pass && !pass.hit, "rocket hit Rosie off its line");
  assert.equal(state.hull, ARENA.startHull);
});

test("phase 3 fires its volley WHILE Kuroi charges", () => {
  // Start one crash into phase 3 and play the dodge until a charge begins.
  let state = { ...arenaInitial(99), phase: 2, crashesInPhase: 1, totalCrashes: 7 };
  let sawChargeVolley = false;
  let boomDuringCharge = false;
  for (let tick = 0; tick < 6000 && state.status === "fighting"; tick++) {
    const out = arenaStep(state, TICK, dodgeInput(state));
    state = out.state;
    for (const event of out.events) {
      if (event.type === "bomb-armed" && event.when === "charge") sawChargeVolley = true;
      if (event.type === "bomb-boom" && state.kuroi.mode === "charge") boomDuringCharge = true;
    }
    if (sawChargeVolley && boomDuringCharge) break;
  }
  assert.ok(sawChargeVolley, "no volley was fired with the phase-3 charge");
  assert.ok(boomDuringCharge, "no bomb detonated while Kuroi was charging");
});

test("the finale can be rammed and retried: the barge stays, Kuroi re-locks the dot", () => {
  // Natural finale (Mitchell, 2026-11-25): no staging — Kuroi patrols
  // and the laser appears when his circling carries him far enough
  // from the barge. Rosie sits squarely on the line from his patrol's
  // bottom midpoint to the dot, so his first natural charge rams her;
  // he shakes it off, resumes patrolling, and locks the dot again on
  // his own.
  let state = arenaFinaleStart(7);
  state.rosie.x = 50;
  state.rosie.y = 62;
  let rammed = false;
  let relocked = false;
  for (let tick = 0; tick < 6000 && state.status === "fighting"; tick++) {
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    for (const event of out.events) {
      if (event.type === "ram") rammed = true;
      else if (rammed && event.type === "laser") relocked = true;
      assert.ok(event.type !== "eruption", "eruption fired without a dodge");
    }
    if (relocked) break;
  }
  assert.ok(rammed, "stationary Rosie was not rammed in the finale");
  assert.ok(relocked, "Kuroi never re-locked the laser after the ram");
  assert.ok(state.barge, "the barge left the arena after a ram");
});

test("finale staging (Mitchell, 2026-11-25): the bait needs Kuroi at the bottom AND Rosie between him and the barge", () => {
  const base = arenaFinaleStart(7); // barge in, Kuroi bottom (50, 80), Rosie between (50, 66)
  assert.equal(finaleBaitReady(base), true, "bottom + between should bait");
  const top = arenaFinaleStart(7);
  top.kuroi.y = ARENA.marginTop; top.kuroi.x = 50;
  assert.equal(finaleBaitReady(top), false, "Kuroi at the top must not bait, even with Rosie between");
  const aside = arenaFinaleStart(7);
  aside.rosie.x = 14; aside.rosie.y = 66; // bottom pass, but Rosie off to the side — not between
  assert.equal(finaleBaitReady(aside), false, "Rosie not between must not bait");
  const beyond = arenaFinaleStart(7);
  beyond.rosie.y = ARENA.bargeY - 4; // past the barge — no longer between
  assert.equal(finaleBaitReady(beyond), false, "Rosie beyond the barge must not bait");
});

test("laser finale: the dot dances on the barge, Kuroi tracks it, then charges IT", () => {
  let state = arenaFinaleStart(7);
  let sawLock = false;
  let lockSamples = 0;
  let dotAtCharge = null;
  let chargeLine = null;
  const order = [];
  for (let tick = 0; tick < 6000 && state.status !== "won" && state.status !== "lost"; tick++) {
    const out = arenaStep(state, TICK, dodgeInput(state));
    state = out.state;
    for (const event of out.events) {
      if (event.type === "laser") { sawLock = true; order.push("laser"); }
      if (event.type === "charge" && event.finale) {
        order.push("charge");
        dotAtCharge = state.laser ? { ...state.laser } : null;
        chargeLine = { x: state.kuroi.chargeFromX, y: state.kuroi.chargeFromY,
          dx: state.kuroi.chargeDirX, dy: state.kuroi.chargeDirY };
      }
      if (event.type === "eruption") order.push("eruption");
      if (event.type === "victory") order.push("victory");
    }
    if (state.kuroi.mode === "laserLock") {
      // The dot stays ON the barge while it dances…
      assert.ok(state.laser && state.laser.active, "laser off during the lock");
      assert.ok(Math.abs(state.laser.x - state.barge.x) <= 2.5,
        `dot wandered ${state.laser.x - state.barge.x} off the barge`);
      assert.ok(Math.abs(state.laser.y - (state.barge.y - ARENA.laserDotLift)) <= 1.2,
        `dot left the barge's rocket deck at y=${state.laser.y}`);
      // …and Kuroi's heading tracks it.
      if (tick % 6 === 0) {
        lockSamples++;
        const want = Math.atan2(state.laser.y - state.kuroi.y, state.laser.x - state.kuroi.x);
        let diff = Math.abs(state.kuroi.heading - want) % (Math.PI * 2);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        assert.ok(diff < 0.3, `Kuroi is not tracking the dot (${diff} rad off)`);
      }
    }
    if (state.status === "won") break;
  }
  assert.ok(sawLock, "the laser never lit");
  assert.ok(lockSamples >= 3, "the lock was too brief to sample");
  assert.deepEqual(order, ["laser", "charge", "eruption", "victory"]);
  // He charged the dot: his course passes through where the dot was
  // when the stare ended (the barge anchor is within the dance radius).
  assert.ok(dotAtCharge, "laser was gone when the charge began");
  const d = lineDistance(dotAtCharge.x, dotAtCharge.y,
    chargeLine.x, chargeLine.y, chargeLine.dx, chargeLine.dy);
  assert.ok(d < 0.51, `finale charge misses the laser dot by ${d}`);
  assert.equal(state.status, "won");
  assert.equal(state.totalCrashes, ARENA.totalCrashes);
  assert.equal(state.laser, null, "laser still lit after the eruption");
});

test("the finale test-hook start is the armed state, and only that", () => {
  const hooked = arenaFinaleStart(99);
  assert.equal(hooked.status, "fighting");
  assert.equal(hooked.phase, 2);
  assert.equal(hooked.totalCrashes, 8);
  assert.equal(hooked.crashesInPhase, 0);
  assert.equal(hooked.finaleArmed, true);
  assert.deepEqual(hooked.barge, { x: 50, y: ARENA.bargeY, side: "top" });
  assert.equal(hooked.hull, ARENA.startHull);
  assert.equal(hooked.kuroi.mode, "circle");
  const plain = arenaInitial(99);
  assert.equal(plain.finaleArmed, false);
  assert.equal(plain.barge, null);
  assert.equal(plain.laser, null);
  assert.equal(plain.totalCrashes, 0);
});

test("round-3 difficulty + Mitchell 2026-11-25: charges 20% faster again, weapons unchanged", () => {
  // Round 3 put charges at [57, 68, 79]; Mitchell then directed
  // every charge in this battle 20% faster — [68.4, 81.6, 94.8] —
  // with weapons explicitly unchanged (rocket speed pinned below).
  assert.deepEqual([...ARENA.chargeSpeed], [68.4, 81.6, 94.8]);
  assert.equal(ARENA.rocketSpeed, 95, "rocket speed changed — Mitchell said weapons stay the same");
  assert.deepEqual([...ARENA.windupMs], [1350, 1125, 945]);
  assert.deepEqual([...ARENA.circleMs], [4140, 3780, 3420]);
  assert.equal(ARENA.bombFuseMs, 1530);
  // Round 5 walks the rocket warning back up at Mitchell's word
  // ("the missiles might need a bit more warning") — 900 -> 1300ms;
  // every other round-3 delta stands.
  assert.equal(ARENA.rocketWarnMs, 1300);
  assert.equal(ARENA.laserLockMs, 1500);
});

test("the lazy policy still wins at round-3 difficulty — but bloodied", () => {
  const { state, log } = runFight("lazy");
  assert.equal(state.status, "won",
    `lazy policy ${state.status} at ${state.totalCrashes} crashes, hull ${state.hull}`);
  const hits = log.filter((e) => e.type === "ram" || e.type === "bomb-hit" || e.type === "rocket-hit");
  assert.ok(hits.length >= 2, `lazy policy took only ${hits.length} hits — not bloodied`);
});

test("a close dodge earns a near miss, a wide one does not", () => {
  // Hand-build a charge down the center line; Rosie waits 10 units off it.
  const base = arenaInitial();
  const mkCharge = (rosieX) => ({
    ...base, elapsedMs: 5000,
    rosie: { ...base.rosie, x: rosieX, y: 50, invulnUntilMs: 0 },
    kuroi: { ...base.kuroi, mode: "charge", modeElapsedMs: 0,
      x: 50, y: 10, heading: Math.PI / 2,
      chargeFromX: 50, chargeFromY: 10, chargeDirX: 0, chargeDirY: 1,
      chargeTravel: 0, chargeLength: 76, nearMissChecked: false,
      furniture: { kind: "buoy", asset: ARENA_FURNITURE[0].asset, label: "Storm buoy", x: 50, y: 86 } }
  });
  let state = mkCharge(60);
  let nearMiss = false;
  for (let tick = 0; tick < 200 && state.kuroi.mode === "charge"; tick++) {
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    nearMiss ||= out.events.some((e) => e.type === "near-miss");
  }
  assert.ok(nearMiss, "passing 10 units away earned no near miss");
  state = mkCharge(80);
  nearMiss = false;
  for (let tick = 0; tick < 200 && state.kuroi.mode === "charge"; tick++) {
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    nearMiss ||= out.events.some((e) => e.type === "near-miss");
  }
  assert.ok(!nearMiss, "passing 30 units away wrongly earned a near miss");
});

test("facing follows the dominant movement axis", () => {
  assert.equal(arenaFacing(1, 0), "right");
  assert.equal(arenaFacing(-1, 0), "left");
  assert.equal(arenaFacing(0, 1), "down");
  assert.equal(arenaFacing(0, -1), "up");
  assert.equal(arenaFacing(0.3, -1), "up");
  assert.equal(arenaFacing(0, 0, "left"), "left");
});

test("arena art is wired: backgrounds, sprites and the barge exist and are manifested", () => {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(root, "public", "yacht-dash", "asset-manifest.json"), "utf-8"));
  const approved = new Set(manifest.assets.map((a) => a.file));
  const files = [...ARENA_BACKGROUNDS,
    ...Object.values(ARENA_SPRITES.rosie), ...Object.values(ARENA_SPRITES.kuroi),
    ARENA_SPRITES.waterbomb, ARENA_SPRITES.rocket, ARENA_SPRITES.barge,
    ...ARENA_FURNITURE.map((f) => f.asset)];
  for (const file of files) {
    assert.ok(fs.existsSync(path.join(root, "public", file.slice(1))), `missing arena art: ${file}`);
    assert.ok(approved.has(file), `arena art not in the manifest: ${file}`);
  }
});

test("main.jsx drives the arena machine and renders the arena layer", () => {
  assert.ok(mainSource.includes("arenaStep("), "tick never drives the arena machine");
  assert.ok(mainSource.includes("yacht-arena"), "arena layer missing");
  assert.ok(mainSource.includes("KuroiFireworksCanvas"), "canvas eruption missing");
  assert.ok(mainSource.includes("arenaPhaseGoal"), "HUD has no phase-goal pips");
  assert.ok(mainSource.includes("Kuroi crashes"), "results panel has no crash line");
  assert.ok(mainSource.includes("BOSS FINALE"), "picker has no finale badge");
  assert.ok(mainSource.includes("arenaDashRef"), "dash input missing");
  assert.ok(!mainSource.includes("kuroiBossStep("), "lane finale machine still wired");
  assert.ok(cssSource.includes(".yacht-arena"), "arena CSS missing");
  assert.ok(cssSource.includes(".yacht-arena-dash-button"), "dash button CSS missing");
  assert.ok(cssSource.includes(".yacht-boss-badge"), "boss badge CSS missing");
  assert.ok(cssSource.includes("prefers-reduced-motion"), "reduced-motion rules missing");
});

test("round 3: no charge lines, no banner pill, no hint text — subtle tells and the laser instead", () => {
  // The charge telegraph line is gone from renderer and stylesheet.
  assert.ok(!mainSource.includes("arena-line"), "charge line still rendered");
  assert.ok(!cssSource.includes(".arena-line"), "charge-line CSS remains");
  assert.ok(!mainSource.includes("arena-bomb-zone") && !mainSource.includes("arena-bomb-fuse"),
    "the bright bomb circle / fuse ring is still rendered");
  assert.ok(mainSource.includes("arena-bomb-ripple"), "soft bomb ripple missing");
  assert.ok(mainSource.includes("yacht-arena-bomb-shadow"), "bomb shadow cue missing");
  assert.ok(cssSource.includes(".arena-bomb-ripple"), "bomb ripple CSS missing");
  // The banner pill no longer renders for the boss chapter, and the
  // phase-notice shouts are gated off for it.
  assert.ok(!mainSource.includes("PHASE {arenaView.phase + 1} OF 3"),
    "boss banner heading still rendered");
  assert.ok(!mainSource.includes("captain-course-banner-message"),
    "boss banner message line still rendered");
  assert.ok(mainSource.includes('if (!isBoss) announcePhase(phase.name.toUpperCase())'),
    "phase notices not gated for the boss");
  // No helm-hint overlay text, no deck copy, no eruption title.
  assert.ok(!mainSource.includes("yacht-arena-helm-overlay"), "helm overlay still rendered");
  assert.ok(!mainSource.includes("yacht-arena-deck-copy"), "deck hint copy still rendered");
  assert.ok(!mainSource.includes("yacht-arena-eruption-title"), "eruption title still rendered");
  // The one allowed callout: the fireworks barge.
  assert.ok(mainSource.includes("yacht-arena-barge-callout"), "barge callout missing");
  assert.ok(mainSource.includes("THE FIREWORKS BARGE!"), "barge callout text missing");
  assert.ok(cssSource.includes(".yacht-arena-barge-callout"), "barge callout CSS missing");
  assert.ok(cssSource.includes("@keyframes yachtBargeCallout"),
    "barge callout has no defined keyframes (the old eruption title's were missing)");
  // Kuroi's body-language tell: the revving wake cue.
  assert.ok(mainSource.includes("yacht-arena-wake-cue"), "wake cue missing");
  assert.ok(cssSource.includes(".yacht-arena-wake-cue"), "wake cue CSS missing");
  assert.ok(mainSource.includes("is-winding"), "Kuroi rev state missing");
  // The laser finale is rendered from machine state.
  assert.ok(mainSource.includes("arena-laser-beam"), "laser beam missing");
  assert.ok(mainSource.includes("arena-laser-dot"), "laser dot missing");
  assert.ok(cssSource.includes(".arena-laser-dot"), "laser dot CSS missing");
  // The finale test hook is wired into run start.
  assert.ok(mainSource.includes("finaleHookRequested"), "finale hook reader missing");
  assert.ok(mainSource.includes("arenaFinaleStart("), "finale hook start missing");
});

test("round 4: the finale hook hands a passive Rosie the laser, untouched", () => {
  // The live-check scenario that failed: finale=1 start, Rosie never
  // moves, and she was sunk by rams at ~10s with no laser ever seen.
  // The set-piece must begin promptly and the dot charge must begin
  // with NO hit of any kind before it — Kuroi runs no phase-3 modes,
  // fires nothing, and the only charge in the finale is at the dot.
  let state = arenaFinaleStart(1467);
  let laserAtMs = null;
  let chargeAtMs = null;
  const modesSeen = new Set();
  for (let tick = 0; tick < 200 && chargeAtMs === null; tick++) {
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    modesSeen.add(state.kuroi.mode);
    assert.equal(state.weapons.length, 0,
      "a weapon exists during the finale set-piece");
    for (const event of out.events) {
      assert.ok(event.type !== "ram" && event.type !== "bomb-hit" &&
        event.type !== "rocket-hit",
        `Rosie was hit (${event.type}) before the dot charge began`);
      assert.ok(event.type !== "bomb-armed" && event.type !== "rocket-warn",
        "a volley was fired during the finale set-piece");
      if (event.type === "laser") laserAtMs = state.elapsedMs;
      if (event.type === "charge" && event.finale) chargeAtMs = state.elapsedMs;
    }
  }
  assert.ok(laserAtMs !== null, "the laser never lit from the hook start");
  assert.ok(laserAtMs <= 4000,
    `laser lock began at ${laserAtMs}ms after the finale armed — not prompt`);
  assert.ok(chargeAtMs !== null && chargeAtMs > laserAtMs,
    "the dot charge never followed the laser lock");
  assert.equal(state.hull, ARENA.startHull,
    "passive Rosie lost hull before the dot charge began");
  for (const mode of modesSeen) {
    assert.ok(["reposition", "laserLock", "finaleCharge"].includes(mode),
      `Kuroi ran a phase-3 mode (${mode}) during the finale`);
  }
});

test("round 7: a wall-pinned Rosie still gets the barge eruption, unrammed", () => {
  // The round-6 page test's strategy at machine level: from the hook
  // start, hold hard left — Rosie pins herself to the wall at the
  // barge's own height (bargeY 51). The reposition clamp used to
  // stage Kuroi on top of her there, so every dot charge rammed her
  // at point-blank and the eruption never came. The staging slide
  // must keep him clear: no ram, and the charge ends in the barge.
  let state = arenaFinaleStart(1467);
  let eruptionAtMs = null;
  for (let tick = 0; tick < 400 && eruptionAtMs === null; tick++) {
    const out = arenaStep(state, TICK, { x: -1, y: 0, dash: false });
    state = out.state;
    for (const event of out.events) {
      assert.ok(event.type !== "ram",
        "Kuroi rammed the wall-pinned Rosie during the finale");
      if (event.type === "eruption") eruptionAtMs = state.elapsedMs;
    }
    assert.equal(state.hull, ARENA.startHull, "the pinned Rosie lost hull");
  }
  assert.ok(eruptionAtMs !== null,
    "the dot charge never reached the barge with Rosie pinned to the wall");
});

test("round 4, restaged 2026-11-25: the natural finale waits for the bottom + between staging, with no pressure in between", () => {
  // Mitchell's staging: after the barge, the laser waits until Kuroi
  // patrols himself to the bottom with Rosie between him and the
  // barge — the wait IS the direction, so the old 4s promptness bound
  // (written for the distance trigger) is replaced by a one-lap
  // bound: daze (0.9s) + a full patrol lap (228 units at 17 u/s
  // = ~13.4s) is the longest the staging can ever take.
  const { log } = runFight("dodge");
  const barge = log.find((e) => e.type === "barge");
  const laser = log.find((e) => e.type === "laser");
  assert.ok(barge && laser, "the natural fight never reached the laser");
  assert.ok(laser.atMs - barge.atMs <= 14500,
    `barge-in → laser lock took ${laser.atMs - barge.atMs}ms (over one patrol lap)`);
  const pressure = log.filter((e) => (e.type === "ram" || e.type === "bomb-hit" ||
    e.type === "rocket-hit" || e.type === "bomb-armed" || e.type === "rocket-warn") &&
    e.atMs > barge.atMs && e.atMs <= laser.atMs);
  assert.deepEqual(pressure, [],
    "phase-3 pressure leaked into the finale handover");
});

test("rounds 6+8, reversed 2026-11-25: the Captain game sits behind an error boundary, and the eruption runs at FULL designed density", () => {
  // The black-page defect class (round 6): the app had no error
  // boundary anywhere, so any throw in a render or effect unmounted
  // the whole React root onto the near-black page background. The
  // yacht game now renders inside CaptainGameBoundary, whose fallback
  // is a readable panel with a restart that remounts the game.
  assert.ok(mainSource.includes("class CaptainGameBoundary extends React.Component"),
    "the Captain game error boundary is missing");
  assert.ok(mainSource.includes("static getDerivedStateFromError(error)"),
    "the boundary never converts an error into its fallback");
  assert.ok(/<CaptainGameBoundary>\s*<CaptainRosieGame/.test(mainSource),
    "CaptainRosieGame is not wrapped by the boundary");
  assert.ok(mainSource.includes("yacht-game-error-panel"),
    "the boundary fallback panel is missing");
  assert.ok(cssSource.includes(".yacht-game-error-panel"),
    "the fallback panel has no styles");
  // The eruption canvas's sizing path stays guarded like its painter
  // (the round-10 root cause — a missing React import at this mount —
  // is fixed and pinned by react-classic-runtime.test.mjs, and the
  // boundary above still stands). But the round 6+8 paint-load CAPS
  // are reversed at Mitchell's explicit direction (2026-11-25): the
  // display he designed runs FULL — no live-shell cap, original mote
  // counts, trails on every mote, DPR cap back at 2.
  const canvasSource = fs.readFileSync(
    path.join(root, "src", "KuroiFireworksCanvas.jsx"), "utf-8");
  assert.ok(!canvasSource.includes("MAX_LIVE_SHELLS"),
    "the eruption's live shells are capped again (Mitchell ordered the full display)");
  assert.ok(canvasSource.includes("big ? 90 : 46 + Math.floor(rng() * 26)"),
    "the eruption's mote counts are not at the original designed density");
  assert.ok(canvasSource.includes("Math.min(2, window.devicePixelRatio || 1)"),
    "the eruption's backing-store resolution is not at the original DPR cap");
});

test("finale cinematic (Mitchell, 2026-11-25): boss win -> full fireworks -> video autoplays fullscreen -> victory art", () => {
  // The video asset ships in public/ and is the only finale video.
  assert.ok(fs.existsSync(path.join(root, "public", "yacht-dash", "kuroi-arena", "kuroi-finale-video.mp4")),
    "the cohesive finale video is missing from public/");
  // finishGame branches boss wins to the video, other wins straight
  // to the victory art, and re-fullscreens for the cinematic.
  assert.ok(mainSource.includes('YACHT_CHAPTERS[chapterIndex]?.mode === "boss"'),
    "finishGame does not branch boss wins to the finale video");
  assert.ok(mainSource.includes("setShowFinaleVideo(true)"),
    "a boss win never mounts the finale video");
  // The video element autoplays with no controls and hands off on end
  // (and on error, so a failed file can never trap the victory).
  assert.ok(mainSource.includes("yacht-finale-video-overlay"),
    "the finale video overlay is not rendered");
  assert.ok(/<video className="yacht-finale-video"[^>]*autoPlay playsInline/.test(mainSource),
    "the finale video does not autoplay inline");
  assert.ok(!/<video className="yacht-finale-video"[^>]*controls/.test(mainSource),
    "the finale video must not carry controls (no button to press)");
  assert.ok(mainSource.includes("onEnded={finishFinaleVideo}"),
    "the video's end does not hand off to the victory art");
  assert.ok(mainSource.includes("onError={finishFinaleVideo}"),
    "a video error does not fall through to the victory art");
  // The overlay fills the screen at the victory layer.
  assert.ok(cssSource.includes(".yacht-finale-video-overlay"),
    "the finale video overlay has no styles");
  assert.ok(/\.yacht-finale-video\s*\{[^}]*object-fit:contain/.test(cssSource),
    "the finale video is not contained whole on screen");
});

test("round 4: the windup tell reads, and the laser rides above the barge", () => {
  // Facing during the windup comes from sprite selection on the machine
  // heading. Phase 3 spawns its volley AS the windup begins, so a
  // "recent volley" firing sprite must never mask the turned bow during
  // the windup itself — the patrol is the only place it may show.
  assert.ok(mainSource.includes('volleyRecent && k.mode === "circle"'),
    "the firing sprite can still mask Kuroi's facing during the windup");
  // The rev shudder animates `transform`, which overrides the img's
  // inline transform while it runs — so both keyframe sets must carry
  // the base composition themselves (anchor translate in both, the
  // mirror flip in the flipped set), or the sprite would jump/flip.
  const rev = cssSource.match(/@keyframes yachtArenaRev\{[^}]*\}/)?.[0] || "";
  assert.ok(rev.includes("translate(-50%,-50%)"),
    "the rev shudder drops the anchor translate");
  const revFlip = cssSource.match(/@keyframes yachtArenaRevFlip\{[^}]*\}/)?.[0] || "";
  assert.ok(revFlip.includes("translate(-50%,-50%) scaleX(-1)"),
    "the flipped rev shudder drops the anchor translate or the flip");
  // The laser dot dances ON the barge: its layer must paint above the
  // barge sprite (z-index 5), not in the tells layer (z-index 4) where
  // the barge's hull buried it in the live check.
  assert.ok(mainSource.includes("yacht-arena-laser"), "laser layer missing");
  assert.ok(/\.yacht-arena-laser\{[^}]*z-index:10/.test(cssSource),
    "the laser layer does not ride above the barge and the actors");
  // The hook start fires the barge callout itself: the constructed
  // state emits no "barge" event for the tick handler to hang it on.
  const callouts = mainSource.match(/setBargeCallout\("THE FIREWORKS BARGE!"\)/g) || [];
  assert.ok(callouts.length >= 2,
    "the finale hook start never fires the barge callout");
});

test("round 5: bombs are launched FROM Kuroi — the volley carries his position", () => {
  // Mitchell: "the bombs seem to magically appear instead of being
  // spawned by Kuroi." Drive a real fight until a volley fires and pin
  // the bomb's origin to Kuroi (within one tick of his movement), far
  // from the mark it will land on.
  let state = arenaInitial(99);
  let bomb = null;
  let kuroiBefore = null;
  for (let tick = 0; tick < 6000 && !bomb; tick++) {
    kuroiBefore = { x: state.kuroi.x, y: state.kuroi.y };
    const out = arenaStep(state, TICK, dodgeInput(state));
    state = out.state;
    if (out.events.some((e) => e.type === "bomb-armed")) {
      bomb = state.weapons.find((w) => w.kind === "bomb" && w.state === "armed");
    }
  }
  assert.ok(bomb, "no bomb was ever armed");
  assert.equal(typeof bomb.fromX, "number");
  assert.equal(typeof bomb.fromY, "number");
  assert.equal(bomb.armedAtMs, state.elapsedMs);
  const fromKuroi = Math.hypot(bomb.fromX - kuroiBefore.x, bomb.fromY - kuroiBefore.y);
  assert.ok(fromKuroi <= 1.0, `bomb spawned ${fromKuroi} units from Kuroi`);
  const fromMark = Math.hypot(bomb.fromX - bomb.x, bomb.fromY - bomb.y);
  assert.ok(fromMark > 5, "the bomb still materializes at its mark");
});

test("round 5: rockets burst where they land — on Rosie when they hit, at the edge when dodged", () => {
  const base = arenaInitial();
  const rocket = { id: 1, kind: "rocket", x1: 10, y1: 50, x2: 93, y2: 50,
    ux: 1, uy: 0, length: 83, warnUntilMs: 500, progress: 0, state: "warn", hitChecked: false };
  // Hit: the burst is at Rosie and the rocket is spent there.
  let state = { ...base, phase: 1, elapsedMs: 0,
    rosie: { ...base.rosie, x: 50, y: 50, invulnUntilMs: 0 }, weapons: [rocket] };
  let boom = null;
  for (let tick = 0; tick < 200 && !boom; tick++) {
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    boom = out.events.find((e) => e.type === "rocket-boom") || boom;
  }
  assert.ok(boom && boom.hit, "no burst when the rocket hit");
  assert.deepEqual({ x: boom.x, y: boom.y }, { x: 50, y: 50 });
  assert.ok(!state.weapons.some((w) => w.kind === "rocket"),
    "the rocket flew on after bursting on Rosie");
  // Dodged: the burst is at the line's end, where it leaves the arena.
  state = { ...base, phase: 1, elapsedMs: 0,
    rosie: { ...base.rosie, x: 50, y: 75, invulnUntilMs: 0 }, weapons: [rocket] };
  boom = null;
  for (let tick = 0; tick < 400 && !boom; tick++) {
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    boom = out.events.find((e) => e.type === "rocket-boom") || boom;
  }
  assert.ok(boom && !boom.hit, "no burst when the rocket was dodged");
  assert.deepEqual({ x: boom.x, y: boom.y }, { x: 93, y: 50 });
  assert.equal(state.hull, ARENA.startHull);
});

test("rounds 7+8: the final frame — full round-2 height, full painting width, band at image 26-73%", () => {
  // The settings are 941x1672 (aspect 0.5628). The desktop course
  // fills the shell's height again (round-2 rule) and the painting
  // renders at full width under cover, so the visible fraction is
  // the band Mitchell settled: image 26-73% (47% of the height),
  // making the box aspect 941/786 (~1.197). object-position 49.1%
  // (26/53) anchors the band; the CSS pins below lock the stylesheet
  // to the same numbers.
  const imgAspect = 941 / 1672, boxAspect = 941 / 786;
  const frac = imgAspect / boxAspect;
  const bandTop = 0.491 * (1 - frac) * 100;
  const img = (y) => bandTop + frac * y;
  assert.ok(Math.abs(bandTop - 26) < 0.5, `band top at image ${bandTop}%`);
  assert.ok(Math.abs(img(100) - 73) < 0.5, `band bottom at image ${img(100)}%`);
  assert.ok(Math.abs(img(50) - 49.5) < 0.5, "box center must sit on the water at the ring");
  // B (Mitchell's ceiling line, 2026-11-25 — supersedes the round-8
  // temple-front waterline derivation): Mitchell marked the highest
  // point either ship may reach on his iPhone screenshot — a line
  // across the water just below the pavilion, at 43.8% of the arena's
  // height on the phone's full-painting view. Both top bounds are now
  // that line (box 44): at his top row Kuroi's HULL bottoms (the PIL
  // warm-hull measurements, ARENA_KUROI_HULL_BOTTOM, taken from each
  // sprite's CONTENT CENTER through the normalized canvas height)
  // land at image ~49-51% in this desktop band — below the marked
  // line's image position, in the open water.
  const kuroiH = 20 * boxAspect;
  const hullImage = (base) => {
    const norm = ARENA_SPRITE_NORM[base];
    const offset = (ARENA_KUROI_HULL_BOTTOM[base] - norm.cy) / 100 * kuroiH * norm.sy;
    return img(ARENA.marginTop + offset);
  };
  assert.equal(ARENA.marginTop, 44);
  for (const base of ["kuroi-charge-side", "kuroi-firing", "kuroi-charge-down"]) {
    const at = hullImage(base);
    assert.ok(at >= 49 && at <= 51,
      `${base} hull bottom at image ${at.toFixed(1)}% — above Mitchell's ceiling line`);
  }
  // B2: ROSIE's top bound is the same marked line (ARENA.rosieMarginTop
  // 44): every sprite she can display keeps its HULL bottom at image
  // ~49-51% at the bound (offsets from ARENA_ROSIE_HULL_BOTTOM through
  // each sprite's content center, exactly as Kuroi's above; her canvas
  // height is 17 x boxAspect units).
  const rosieH = 17 * boxAspect;
  const rosieHullImage = (base) => {
    const norm = ARENA_SPRITE_NORM[base];
    const offset = (ARENA_ROSIE_HULL_BOTTOM[base] - norm.cy) / 100 * rosieH * norm.sy;
    return img(ARENA.rosieMarginTop + offset);
  };
  assert.equal(ARENA.rosieMarginTop, 44);
  for (const base of Object.keys(ARENA_ROSIE_HULL_BOTTOM)) {
    const at = rosieHullImage(base);
    assert.ok(at >= 49 && at <= 51,
      `${base} hull bottom at image ${at.toFixed(1)}% at Rosie's top bound — above Mitchell's ceiling line`);
  }
  assert.ok(ARENA.rosieMarginTop === ARENA.marginTop,
    "Rosie's top bound is the same ceiling line Mitchell marked for Kuroi");
  // Nothing clips at the new top row: the tallest normalized content
  // top (full-canvas sprites, content center ~49.9%, half-height
  // ~11.97 units) stays inside the frame, and the bottom row is
  // unchanged from round 7's derivation.
  assert.ok(ARENA.marginTop - kuroiH / 2 >= 0, "Kuroi would clip at the frame edge");
  assert.ok(ARENA.marginY >= 8.5 * boxAspect, "Rosie would clip");
  assert.ok(ARENA.marginTop > ARENA.marginY, "the top inset must be the asymmetric one");
  // C: the barge's hull line rests on the water in front of the
  // temple base (image ~50%), its sprite top inside the frame, and
  // the laser dot rides the rocket deck — 30% of the sprite's
  // height above the hull line.
  assert.ok(img(ARENA.bargeY) >= 49 && img(ARENA.bargeY) <= 51,
    `barge hull line at image ${img(ARENA.bargeY)}%`);
  const bargeH = 25 * boxAspect;
  assert.ok(ARENA.bargeY - 0.9 * bargeH >= 0, "the barge's top clips the frame");
  assert.ok(Math.abs(ARENA.laserDotLift - 0.30 * bargeH) < 0.5,
    "the laser dot is not on the rocket deck");
});

test("round 5: shell hug, warn ramp, bursts, laser size and the sticky hook are pinned in source", () => {
  // A (as amended by round 7): the desktop boss block — the course
  // fills the shell's height at aspect 941/786, the 49.1% band
  // anchor, and the shell pulled in to the arena's own width.
  assert.ok(cssSource.includes("aspect-ratio:941 / 786"), "desktop arena is not at the round-7 aspect");
  assert.ok(/\.yacht-course\{[^}]*flex:1 1 auto;height:auto/.test(cssSource),
    "arena does not fill the shell height (round-2 rule)");
  assert.ok(cssSource.includes("object-position:center 49.1%"),
    "background band anchor moved");
  assert.ok(cssSource.includes("(100dvh - 113px) * 1.1972 + 24px"),
    "the shell does not hug the arena");
  // C: the barge sprite is 25% wide and hung from its hull line.
  assert.ok(/\.yacht-arena-barge\{[^}]*width:25%/.test(cssSource),
    "barge sprite size changed");
  assert.ok(cssSource.includes("translate(-50%,-90%)"),
    "barge anchor is not its hull line");
  // D: the warn tell swells over the warning, driven by the machine's
  // own warn constant (1300ms, pinned in the difficulty test above).
  assert.ok(mainSource.includes("warnFrac") && mainSource.includes("ARENA.rocketWarnMs"),
    "the rocket warn ramp is gone");
  // E/F: the bomb arc reads the launch point; bursts render from
  // machine events with code-drawn keyframes.
  assert.ok(mainSource.includes("w.fromX"), "the bomb arc lost its launch point");
  assert.ok(mainSource.includes("rocket-boom") && mainSource.includes("yacht-arena-boom"),
    "weapon bursts are not rendered");
  assert.ok(cssSource.includes("@keyframes yachtBoomRing"), "burst keyframes missing");
  // G: the dot is unmistakable (halo r 3.4, core r 1.3 arena units)
  // and the finale hook sticks for the tab session once seen.
  assert.ok(mainSource.includes("r={3.4}") && mainSource.includes("r={1.3}"),
    "the laser dot shrank back");
  assert.ok(mainSource.includes('sessionStorage.setItem("rosieFinaleHook", "1")') &&
    mainSource.includes('sessionStorage.getItem("rosieFinaleHook")'),
    "the finale hook is not sticky for the session");
});

test("round 8 (Item B): the background sequence never steps backwards across a whole win", () => {
  // Mitchell: the backgrounds "regress from burning to not burning
  // around 6-8" — phase 3's old second step was setting-06 (fires
  // dead). Play a full winning run and record every background index
  // the renderer would show; the sequence must be non-decreasing
  // across phase transitions, crash steps, finale-arming, the
  // eruption and victory, and phase 3 must sit on setting-05 (4)
  // for its whole duration.
  let state = arenaInitial();
  const seen = [];
  let lastPhase3Index = null;
  for (let tick = 0; tick < 24000; tick++) {
    const out = arenaStep(state, TICK, dodgeInput(state));
    state = out.state;
    const idx = arenaBackgroundIndex(state);
    if (!seen.length || seen[seen.length - 1] !== idx) seen.push(idx);
    if (state.phase === 2 && !state.finaleArmed) lastPhase3Index = idx;
    if (state.status === "won" || state.status === "lost") break;
  }
  assert.equal(state.status, "won");
  for (let i = 1; i < seen.length; i++) {
    assert.ok(seen[i] >= seen[i - 1],
      `background stepped backwards: ${seen.join(",")}`);
  }
  assert.deepEqual(seen, [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(lastPhase3Index, 4, "phase 3 must hold setting-05 until the finale arms");
});

test("round 8 (Item C): sprite normalization is pinned to the measured content table", () => {
  // Family targets are the per-family means of the measured content
  // extents; each sprite's stored scale must be the factor that maps
  // its measured extent onto its family target (within rounding),
  // and its translate must center the measured content center (the
  // flippable side sprite's x excepted — see the table's comment).
  const families = {
    kuroiV: ["kuroi-charge-down", "kuroi-charge-up", "kuroi-dazed"],
    kuroiH: ["kuroi-charge-side", "kuroi-firing"],
    rosieV: ["rosie-ship-down", "rosie-ship-up", "rosie-braced", "rosie-dash", "rosie-startled", "rosie-triumphant"],
    rosieH: ["rosie-ship-left", "rosie-ship-right"]
  };
  for (const [family, members] of Object.entries(families)) {
    const targetW = members.reduce((a, b) => a + ARENA_SPRITE_NORM[b].w, 0) / members.length;
    const targetH = members.reduce((a, b) => a + ARENA_SPRITE_NORM[b].h, 0) / members.length;
    for (const base of members) {
      const n = ARENA_SPRITE_NORM[base];
      assert.ok(Math.abs(n.sx - targetW / n.w) < 0.002,
        `${base} scaleX ${n.sx} != family target factor ${(targetW / n.w).toFixed(3)} (${family})`);
      assert.ok(Math.abs(n.sy - targetH / n.h) < 0.002,
        `${base} scaleY ${n.sy} != family target factor ${(targetH / n.h).toFixed(3)} (${family})`);
      // After normalization every family member renders its content
      // at the same on-screen extent.
      assert.ok(Math.abs(n.w * n.sx - targetW) < 0.35, `${base} rendered width drifts`);
      assert.ok(Math.abs(n.h * n.sy - targetH) < 0.35, `${base} rendered height drifts`);
      // Centering rule: a content-center offset of 0.65% of box or
      // more (~0.16 units) must be corrected exactly; smaller ones
      // are intentionally left at zero (sub-pixel at play size).
      for (const [t, c, axis] of [[n.tx, n.cx, "x"], [n.ty, n.cy, "y"]]) {
        if (base === "kuroi-charge-side" && axis === "x") continue; // mirrored sprite
        const want = 50 - c;
        if (Math.abs(want) >= 0.65) {
          assert.ok(Math.abs(t - want) < 0.05, `${base} translate${axis} ${t} != ${want}`);
        } else {
          assert.equal(t, 0, `${base} translate${axis} should be zeroed, got ${t}`);
        }
      }
      // The renderer helper must hand back exactly these factors.
      const style = arenaSpriteNormStyle(`/yacht-dash/kuroi-arena/${base}.webp`);
      if (n.sx !== 1 || n.sy !== 1) assert.equal(style.scale, `${n.sx} ${n.sy}`, `${base} style scale`);
      if (n.tx !== 0 || n.ty !== 0) assert.equal(style.translate, `${n.tx}% ${n.ty}%`, `${base} style translate`);
    }
  }
  // Unlisted sprites (weapons, barge) render unnormalized.
  assert.equal(arenaSpriteNormStyle("/yacht-dash/kuroi-arena/weapon-rocket.webp"), undefined);
  assert.equal(arenaSpriteNormStyle("/yacht-dash/obstacles/fireworks-barge.webp"), undefined);
  // The two actors' imgs in main.jsx consume the helper (the
  // normalization must reach the screen, not just the table).
  assert.ok(mainSource.includes("arenaSpriteNormStyle(kuroiSprite)"), "Kuroi's img is not normalized");
  assert.ok(mainSource.includes("arenaSpriteNormStyle(rosieSprite)"), "Rosie's img is not normalized");
});

test("rounds 8-10: fullscreen locks the arena to the page aspect and grows the side panel", () => {
  // The fullscreen arena rules must (a) keep aspect 941/786 on the
  // course, (b) shrink-wrap the shell, (c) hand the leftover width
  // to the page grid's side-panel column.
  assert.ok(cssSource.includes("grid-template-columns:minmax(300px,1fr) auto!important;"),
    "fullscreen grid does not expand the side panel for the arena chapter");
  assert.ok(cssSource.includes(".captain-arena-chapter .yacht-course{\n    box-sizing:border-box!important;\n    flex:0 0 auto!important;\n    width:auto!important;height:calc(100dvh - 113px)!important;"),
    "fullscreen arena course must fill the available viewport height");
  const fsBlock = cssSource.slice(cssSource.indexOf("Round 10"));
  assert.ok(fsBlock.includes("aspect-ratio:941 / 786!important"), "fullscreen arena aspect missing");
  // Round 10: rounds 8 AND 9 both collapsed live to the same ~62px
  // strip. Round 9's width DID win its cascade, but the formula
  // min(calc(...),100%) contains a percentage, and the shell is a
  // grid item in an `auto` track: a percentage width is cyclic
  // there, so the track was sized by the shell's max-content
  // (~62px — the arena is absolutely positioned and contributes no
  // intrinsic width) and the percentage then resolved against the
  // collapsed track. The round-10 shell width must therefore be
  // percentage-free: the page-view formula capped by a
  // viewport-width term that only guards small landscape screens.
  assert.ok(fsBlock.includes("width:min(calc((100dvh - 113px) * 1.1972 + 24px), calc(100vw - 354px))!important"),
    "fullscreen shell does not carry the percentage-free page-view width formula");
  assert.ok(!fsBlock.includes("width:min(calc((100dvh - 113px) * 1.1972 + 24px),100%)!important"),
    "fullscreen shell fell back to the cyclic percentage-capped width");
  const shellRule = fsBlock.slice(fsBlock.indexOf(".yacht-game-shell{"),
    fsBlock.indexOf(".yacht-course{"));
  const shellWidth = /width:([^;]+);/.exec(shellRule)?.[1] || "";
  assert.ok(shellWidth && !shellWidth.includes("%"),
    "fullscreen shell width contains a percentage (cyclic in its auto grid track)");
  // The block re-declares the full chain at arena-chapter
  // specificity: page grid, side-panel placement, shell, course.
  for (const pin of [
    "grid-template-rows:auto auto minmax(0,1fr)!important;",
    ".captain-arena-chapter .captain-hero{",
    ".captain-arena-chapter .captain-route-strip{",
    ".captain-arena-chapter .captain-hud{",
    "grid-column:2!important;grid-row:1/4!important;",
    "padding:11px!important;",
    "max-width:100%!important;\n    margin:8px 0 0!important;",
  ]) assert.ok(fsBlock.includes(pin), `fullscreen arena block is missing: ${pin}`);
  // The page-view band pin still holds (object-position 49.1%).
  assert.ok(cssSource.includes("object-position:center 49.1%"), "the 26-73 band anchor is gone");
});

test("mobile scope (Mitchell's rule): the desktop arena frame never reaches phone widths", () => {
  // Mitchell (2026-11-24): fitting the tall vertical aspect into the
  // view — aspect caps, height limits, band cropping, dvh-derived
  // shell widths — is DESKTOP-only, for every game. Mobile keeps a
  // large vertically oriented aspect. Guard: in the comment-stripped
  // CSS, every arena-frame marker (the 941/786 aspect and every
  // captain-arena-chapter rule) must sit inside the desktop query
  // (min-width:900px + landscape); the file's @media blocks are flat,
  // so the nearest preceding @media header is the enclosing one.
  const stripped = cssSource.replace(/\/\*[\s\S]*?\*\//g, "");
  const enclosingHeader = (at) => {
    const mediaAt = stripped.lastIndexOf("@media", at);
    assert.ok(mediaAt !== -1, "frame marker outside any media query");
    return stripped.slice(mediaAt, stripped.indexOf("{", mediaAt));
  };
  let seen = 0;
  for (const marker of ["941 / 786", "captain-arena-chapter"]) {
    let idx = 0;
    while ((idx = stripped.indexOf(marker, idx)) !== -1) {
      const header = enclosingHeader(idx);
      assert.ok(header.includes("min-width:900px") && header.includes("orientation:landscape"),
        `${marker} escaped the desktop query into: ${header.trim()}`);
      seen++; idx += marker.length;
    }
  }
  assert.ok(seen >= 4, "the desktop arena frame pins vanished");
  // The round-8 phone-fullscreen aspect lock is gone: no coarse
  // phone block may name the arena chapter at all.
  assert.ok(!/@media\(max-width:720px\)\s*and\s*\(pointer:coarse\)\s*\{[^}]*captain-arena-chapter/.test(stripped),
    "a phone fullscreen block still singles out the arena chapter");
  // And the original iPhone fullscreen cabinet still gives the
  // course its tall shape: flex-filled height, no aspect cap — the
  // arena chapter now rides it like every other Yacht chapter.
  const cabinetAt = stripped.indexOf("100dvh!important;\n    overflow:hidden!important;\n  }\n  .captain-fs-yacht");
  assert.ok(cabinetAt !== -1, "the iPhone fullscreen cabinet block is missing");
  const cabinet = stripped.slice(cabinetAt, stripped.indexOf("@media", cabinetAt + 10));
  const courseRule = /\.yacht-course\{([^}]*)\}/.exec(cabinet)?.[1] || "";
  assert.ok(courseRule.includes("flex:1 1 0!important") && courseRule.includes("height:auto!important"),
    "the iPhone cabinet no longer flex-fills the course height");
  assert.ok(!courseRule.includes("aspect-ratio"),
    "the iPhone cabinet course gained an aspect cap");
  // The phone arena frame outside fullscreen is the original one:
  // the painting stays anchored at center 30% (the desktop 49.1%
  // band lives only in the desktop block asserted above).
  assert.ok(cssSource.includes("object-position:center 30%"), "the mobile arena band anchor is gone");
});

test("round 9 (Item 3): the offset finale hook reaches the barge with zero input", () => {
  // ?finale=1&offset=1 starts Rosie pinned in the bait corridor off
  // the charge line. The first finale charge must miss her (no ram,
  // no hull loss) and end in the barge — the dodge → barge-impact
  // path with no operator steering for live checks to depend on.
  let state = arenaFinaleStart(1467, { offset: true });
  // Restaged 2026-11-25: the offset pin is (24, 63) — inside the
  // bait corridor (so the laser lights with zero input) but off the
  // charge line (so the charge still misses her). The old left-wall
  // pin predates the bottom + between staging and could never bait.
  assert.equal(state.rosie.x, 24, "offset start is not at its bait-corridor pin");
  assert.equal(state.rosie.y, 63, "offset start is not at its bait-corridor pin");
  let eruptionAtMs = null, chargeAtMs = null;
  for (let tick = 0; tick < 400 && eruptionAtMs === null; tick++) {
    const out = arenaStep(state, TICK, { x: 0, y: 0, dash: false });
    state = out.state;
    for (const event of out.events) {
      assert.ok(event.type !== "ram",
        "the offset start's first finale charge rammed the pinned Rosie");
      if (event.type === "charge" && event.finale) chargeAtMs = state.elapsedMs;
      if (event.type === "eruption") eruptionAtMs = state.elapsedMs;
    }
    assert.equal(state.hull, ARENA.startHull, "the offset Rosie lost hull");
  }
  assert.ok(chargeAtMs !== null, "the offset start never fired the finale charge");
  assert.ok(eruptionAtMs !== null,
    "the offset start's charge never reached the barge (no eruption)");
  // The plain hook start: Rosie between Kuroi (bottom row) and the
  // barge, per Mitchell's staging — (50, 66), not the old (50, 50)
  // which sat ON the barge anchor, outside the between corridor.
  const plain = arenaFinaleStart(1467);
  assert.equal(plain.rosie.x, 50, "the plain finale hook start moved Rosie");
  assert.equal(plain.rosie.y, 66, "the plain finale hook start moved Rosie");
  // Source wiring: the offset is read from the live URL only (never
  // sticky), behind the same run-start path as the finale hook.
  assert.ok(mainSource.includes("function finaleOffsetRequested()"),
    "main.jsx has no offset hook reader");
  assert.ok(mainSource.includes("{ offset: hookOffset }"),
    "startGame does not pass the offset into arenaFinaleStart");
  assert.ok(!mainSource.includes("rosieFinaleOffset"),
    "the offset became sticky — it must read the live URL only");
});

test("round 9 (Item 2): an actor's rendered size comes ONLY from its box width and norm entry", () => {
  // The size audit: there is no y-, distance- or state-dependent
  // scaling of the arena actors anywhere. The actor boxes are one
  // fixed fraction of the arena each...
  assert.ok(cssSource.includes(".yacht-arena-kuroi{width:20%"),
    "Kuroi's arena box width is not the fixed 20%");
  assert.ok(cssSource.includes(".yacht-arena-rosie{width:17%"),
    "Rosie's arena box width is not the fixed 17%");
  // ...the actor keyframes (windup rev, flipped rev, dazed rock)
  // animate rotate/translate only — the single scale anywhere in
  // them is the side sprite's mirror, scaleX(-1)...
  const keyframes = cssSource.slice(cssSource.indexOf("@keyframes yachtArenaRev"),
    cssSource.indexOf(".captain-game-page .yacht-arena-furniture"));
  assert.ok(!(keyframes.match(/scale\(/g) || []).length,
    "an actor keyframe scales the sprite (only scaleX(-1) may appear)");
  assert.ok(keyframes.includes("scaleX(-1)"), "the flipped rev lost its mirror");
  // ...and the renderer's only approach/perspective scaling is the
  // LANE chapters' item perspective (two custom properties, both in
  // the lane renderer) — it never reaches the arena actors, whose
  // imgs take arenaSpriteNormStyle and nothing else (pinned in the
  // round-8 Item C test above).
  assert.equal((mainSource.match(/--approach-scale/g) || []).length, 2,
    "approach scaling appeared somewhere new in main.jsx");
});

test("round 8 (Defect 1): the boundary fallback renders the caught error on screen", () => {
  // No DevTools exists where this game is checked, so the panel
  // itself must carry the error's name/message/stack as DOM text.
  assert.ok(mainSource.includes('className="captain-boundary-error"'),
    "the fallback panel does not render the error details element");
  assert.ok(mainSource.includes("error.name || \"Error\"") && mainSource.includes("error.message"),
    "the fallback does not render the error name and message");
  assert.ok(mainSource.includes("captainBoundaryError"),
    "the boundary no longer keeps a sessionStorage copy of the catch");
});

test("animation round: a crash shows exactly ONE Kuroi — the crash cluster carries no figure", () => {
  // Mitchell: "it often appears as if there are two Kurois when he
  // crashes." Root cause, in two halves. (1) The machine parks the
  // DAZED ACTOR at the crash point: drive the dodge policy to a
  // crash and pin that the event's coordinates are Kuroi's own, with
  // him in dazed mode — the actor img (dazed sprite) renders there.
  let state = arenaInitial(1467);
  let crashEvent = null;
  for (let tick = 0; tick < 4000 && !crashEvent; tick++) {
    const out = arenaStep(state, TICK, dodgeInput(state));
    state = out.state;
    crashEvent = out.events.find((e) => e.type === "crash") || null;
  }
  assert.ok(crashEvent, "the dodge policy never crashed Kuroi");
  assert.equal(state.kuroi.mode, "dazed",
    "Kuroi is not dazed at the crash — the doubling analysis does not hold");
  assert.equal(state.kuroi.x, crashEvent.x,
    "the crash event is not at the dazed actor's position");
  assert.equal(state.kuroi.y, crashEvent.y,
    "the crash event is not at the dazed actor's position");
  // (2) The cluster that renders AT that point used to carry the
  // recoil painting as a second img — and that painting is
  // byte-identical to the actor's dazed sprite (same SHA-256), at
  // ~19% of arena width against the actor's 20%, for the 1.5s the
  // cluster lives inside his 2.2s daze. Two copies of one painting,
  // one anchor: two Kurois. The cluster must be foam ONLY — exactly
  // one img, the splash — and the recoil painting may render exactly
  // once in the whole file: the LANE chapters' collision overlay,
  // where no actor element exists to double.
  const fxStart = mainSource.indexOf("yacht-arena-crashfx");
  assert.ok(fxStart >= 0, "crash cluster missing");
  const fxBlock = mainSource.slice(fxStart, mainSource.indexOf("</div>", fxStart));
  assert.equal((fxBlock.match(/<img/g) || []).length, 1,
    "the crash cluster carries more than the splash foam");
  assert.ok(fxBlock.includes("kuroi-collision-splash"),
    "the crash cluster lost its splash foam");
  assert.equal((mainSource.match(/kuroi-recoil\.webp/g) || []).length, 1,
    "the recoil painting renders somewhere besides the lane overlay");
});

test("animation round: boats float, turns settle, the daze decays, the rev rocks back", () => {
  // (a) Idle sway: independent-`rotate` keyframes on both actor base
  // rules, different periods so the boats stay out of sync, with the
  // one-shot turn settle listed after the sway.
  assert.ok(cssSource.includes("@keyframes yachtArenaSwayRosie"), "Rosie's sway missing");
  assert.ok(cssSource.includes("@keyframes yachtArenaSwayKuroi"), "Kuroi's sway missing");
  assert.ok(/\.yacht-arena-rosie\{[^}]*yachtArenaSwayRosie 2\.9s/.test(cssSource),
    "Rosie's base rule lost its sway");
  assert.ok(/\.yacht-arena-kuroi\{[^}]*yachtArenaSwayKuroi 3\.7s/.test(cssSource),
    "Kuroi's base rule lost its sway");
  assert.ok(/\.yacht-arena-rosie\{[^}]*yachtArenaTurn/.test(cssSource),
    "the turn settle is not on Rosie's base rule");
  assert.ok(/\.yacht-arena-kuroi\{[^}]*yachtArenaTurn/.test(cssSource),
    "the turn settle is not on Kuroi's base rule");
  // The sway/settle animate the `rotate` PROPERTY only — a transform
  // here would override the anchor translate and drop the mirror.
  const sway = cssSource.slice(cssSource.indexOf("@keyframes yachtArenaSwayRosie"),
    cssSource.indexOf("@keyframes yachtArenaTurn") + 80);
  assert.ok(sway.includes("rotate:"), "the sway does not use the rotate property");
  assert.ok(!sway.includes("transform:"), "the sway touches transform");
  // (b) Facing swaps replay the settle: the actor imgs are keyed by
  // their sprite, so a swap remounts and the one-shot runs.
  assert.ok(mainSource.includes("key={kuroiSprite}"), "Kuroi's img is not keyed by sprite");
  assert.ok(mainSource.includes("key={rosieSprite}"), "Rosie's img is not keyed by sprite");
  // (c) The daze is one finite decaying track — an impact jolt, then
  // smaller and smaller rocks to rest — not the old infinite rock.
  assert.ok(cssSource.includes("animation:yachtArenaDazed 2.2s ease-out both"),
    "the dazed animation is not the finite 2.2s settle");
  assert.ok(!/\.yacht-arena-kuroi\.is-dazed\{[^}]*infinite/.test(cssSource),
    "the dazed animation still loops forever");
  const dazed = cssSource.slice(cssSource.indexOf("@keyframes yachtArenaDazed"),
    cssSource.indexOf(".captain-game-page .yacht-arena-furniture"));
  assert.ok(dazed.includes("rotate(-9deg)"), "the dazed impact jolt is missing");
  assert.ok(dazed.includes("rotate(1.1deg)"), "the dazed decay tail is missing");
  // (e) The rev's backward rock rides CSS vars the renderer aims
  // opposite Kuroi's locked charge direction while he winds up.
  const rev = cssSource.slice(cssSource.indexOf("@keyframes yachtArenaRev{"),
    cssSource.indexOf("@keyframes yachtArenaRevFlip"));
  assert.ok(rev.includes("var(--revx"), "the rev lost its backward-rock var");
  const revFlip = cssSource.slice(cssSource.indexOf("@keyframes yachtArenaRevFlip{"),
    cssSource.indexOf("@keyframes yachtArenaInvuln"));
  assert.ok(revFlip.includes("var(--revx"), "the flipped rev lost its backward-rock var");
  assert.ok(mainSource.includes('"--revx"'), "the renderer never sets the rock vars");
  assert.ok(mainSource.includes("chargeDirX"), "the rock is not aimed by the charge direction");
  // (c)+(d) The impact starburst and Rosie's dash wake feed the
  // round-5 boom system from the machine's events.
  assert.ok(mainSource.includes('kind: "crash"'), "the crash starburst is not fired");
  assert.ok(mainSource.includes('event.type === "dash"'), "the dash event is unhandled");
  assert.ok(mainSource.includes('kind: "dash"'), "the dash wake is not fired");
  assert.ok(cssSource.includes(".yacht-arena-boom.is-crash"), "the crash burst style is missing");
  assert.ok(cssSource.includes(".yacht-arena-boom.is-dash"), "the dash wake style is missing");
  // The wake churn joined the windup cue, and reduced motion stills
  // the round's new animation with everything else.
  assert.ok(cssSource.includes(".yacht-arena-wake-cue::after"), "the wake churn ring is missing");
  const calloutAt = cssSource.indexOf(".yacht-arena-barge-callout{animation:none!important;}");
  const rmBlock = cssSource.slice(Math.max(0, calloutAt - 1600), calloutAt + 60);
  assert.ok(rmBlock.includes("yacht-arena-wake-cue::after"),
    "reduced motion does not still the wake churn");
});
