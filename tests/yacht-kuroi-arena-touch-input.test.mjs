import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ARENA_JOYSTICK, ArenaJoystickInput, arenaJoystickKnobOffset,
  arenaJoystickMagnitude, arenaJoystickVector,
  arenaJoystickZoneContains } from "../src/yachtArenaTouchInput.js";

const root = path.resolve("src", "..");
const mainSource = fs.readFileSync(path.join(root, "src", "main.jsx"), "utf-8");
const cssSource = fs.readFileSync(path.join(root, "src", "yachtDashExpansion.css"), "utf-8");
const touchSource = fs.readFileSync(path.join(root, "src", "yachtArenaTouchInput.js"), "utf-8");

// The tall phone cabinet: ~376px wide x ~700px tall for the 100x100
// arena — one unit is ~3.76px in x but ~7px in y. This is the rect
// that broke v1's raw pixel math (a 45-degree drag rendered as
// ~62-degree travel); the joystick's direction is taken in unit
// space, so it must stay true here.
const TALL_RECT = { left: 0, top: 0, width: 376, height: 700 };
const DESKTOP_RECT = { left: 0, top: 0, width: 1047, height: 875 };
// The joystick base as rendered on that phone: 112px across, 16px
// from the arena's right and bottom edges.
const PHONE_BASE = { left: 376 - 16 - 112, top: 700 - 16 - 112, width: 112, height: 112,
  right: 376 - 16, bottom: 700 - 16 };

test("engagement zone: the base rect, generously padded — and nothing without a base", () => {
  const cx = PHONE_BASE.left + 56;
  const cy = PHONE_BASE.top + 56;
  assert.equal(arenaJoystickZoneContains(cx, cy, PHONE_BASE), true, "the center engages");
  assert.equal(arenaJoystickZoneContains(PHONE_BASE.left, PHONE_BASE.top, PHONE_BASE), true,
    "the base's own corner engages");
  assert.equal(arenaJoystickZoneContains(PHONE_BASE.left - ARENA_JOYSTICK.hitPadPx, cy, PHONE_BASE), true,
    "the pad ring still engages");
  assert.equal(arenaJoystickZoneContains(PHONE_BASE.left - ARENA_JOYSTICK.hitPadPx - 1, cy, PHONE_BASE), false,
    "one pixel past the pad does not");
  assert.equal(arenaJoystickZoneContains(40, 120, PHONE_BASE), false,
    "the far side of the arena is not the stick");
  assert.equal(arenaJoystickZoneContains(cx, cy, null), false,
    "no mounted base (a mouse player) contains nothing");
  assert.equal(arenaJoystickZoneContains(cx, cy, { left: 0, top: 0, width: 0, height: 0 }), false);
});

test("sensitivity: dead zone, linear ramp, full deflection at 36px (26px was 'a little too easy')", () => {
  assert.equal(ARENA_JOYSTICK.fullDeflectionPx, 36);
  assert.equal(ARENA_JOYSTICK.deadZonePx, 6);

  assert.equal(arenaJoystickMagnitude(0), 0);
  assert.equal(arenaJoystickMagnitude(ARENA_JOYSTICK.deadZonePx), 0,
    "travel at the dead-zone edge is still zero");
  assert.equal(arenaJoystickMagnitude(21), 0.5,
    "halfway from dead zone to full deflection is half input");
  assert.equal(arenaJoystickMagnitude(ARENA_JOYSTICK.fullDeflectionPx), 1,
    "36px of travel is full speed — the middle step between v1's 48px and v3's 26px");
  assert.equal(arenaJoystickMagnitude(80), 1, "travel past full deflection clamps");

  assert.deepEqual(arenaJoystickVector(3, 0, TALL_RECT), { x: 0, y: 0, magnitude: 0 },
    "a 3px nudge inside the dead zone moves nothing");
  assert.deepEqual(arenaJoystickVector(0, -6, TALL_RECT), { x: 0, y: 0, magnitude: 0 });

  const half = arenaJoystickVector(21, 0, TALL_RECT);
  assert.equal(half.magnitude, 0.5);
  assert.equal(half.x, 0.5);
  assert.equal(half.y, 0);

  const full = arenaJoystickVector(36, 0, TALL_RECT);
  assert.equal(full.magnitude, 1);
  assert.equal(full.x, 1);
  const clamped = arenaJoystickVector(90, 0, TALL_RECT);
  assert.equal(clamped.magnitude, 1);
  assert.equal(clamped.x, 1, "a long push saturates instead of overshooting");

  assert.deepEqual(arenaJoystickVector(30, 30, null), { x: 0, y: 0, magnitude: 0 },
    "without an arena rect there is no trustworthy direction");
  assert.deepEqual(arenaJoystickVector(30, 30, { left: 0, top: 0, width: 0, height: 0 }),
    { x: 0, y: 0, magnitude: 0 });
});

test("direction fidelity: a screen-space heading is the heading she travels", () => {
  // For several screen angles, push the stick a full deflection at
  // that angle on the tall rect, then project the returned unit-space
  // vector back onto the screen: its angle must equal the chosen one
  // (the v2 standard, <0.75 degrees — raw pixel math missed by ~17).
  for (const degrees of [0, 15, 45, 80, 90, 135, 180, 225, 270, 315]) {
    const rad = degrees * Math.PI / 180;
    const dx = Math.cos(rad) * ARENA_JOYSTICK.fullDeflectionPx;
    const dy = Math.sin(rad) * ARENA_JOYSTICK.fullDeflectionPx;
    const vector = arenaJoystickVector(dx, dy, TALL_RECT);
    assert.ok(Math.abs(vector.magnitude - 1) < 1e-9,
      `${degrees} deg: full deflection is full speed`);
    const screenAngle = Math.atan2(
      vector.y * TALL_RECT.height / 100, vector.x * TALL_RECT.width / 100) * 180 / Math.PI;
    const normalized = (screenAngle + 360) % 360;
    assert.ok(Math.abs(normalized - degrees) < 0.75,
      `${degrees} deg on screen must stay ${degrees} deg, got ${normalized}`);
  }
  // Fidelity is not a full-deflection accident: a partial push at 45
  // degrees keeps the angle and carries the partial magnitude.
  const partial = arenaJoystickVector(21 / Math.SQRT2, 21 / Math.SQRT2, TALL_RECT);
  assert.ok(Math.abs(partial.magnitude - 0.5) < 1e-9,
    "a 21px push is half deflection");
  const partialAngle = Math.atan2(
    partial.y * TALL_RECT.height / 100, partial.x * TALL_RECT.width / 100) * 180 / Math.PI;
  assert.ok(Math.abs(partialAngle - 45) < 0.75, `partial 45 deg push stays 45, got ${partialAngle}`);
  // And on a desktop-shaped rect the same math is true as well.
  const desktop = arenaJoystickVector(0, ARENA_JOYSTICK.fullDeflectionPx, DESKTOP_RECT);
  assert.equal(desktop.x, 0);
  assert.equal(desktop.y, 1);
});

test("knob offset: centered in the dead zone, rim-capped at full deflection, never out of the base", () => {
  assert.deepEqual(arenaJoystickKnobOffset(0, 0), { x: 0, y: 0 });
  assert.deepEqual(arenaJoystickKnobOffset(3, -2), { x: 0, y: 0 },
    "inside the dead zone the knob rests at center — no jitter");
  assert.deepEqual(arenaJoystickKnobOffset(21, 0), { x: 18, y: 0 },
    "half deflection renders half the (uncapped) knob travel");
  // At 36px full deflection the raw knob travel (36px) would push
  // the knob's edge 4px past the base's rim, so the render caps at
  // base radius - knob radius = 32px: flush with the rim, never out.
  const rim = (ARENA_JOYSTICK.baseDiameterPx - ARENA_JOYSTICK.knobDiameterPx) / 2;
  assert.deepEqual(arenaJoystickKnobOffset(36, 0), { x: rim, y: 0 });
  const long = arenaJoystickKnobOffset(120, 90);
  assert.ok(Math.abs(Math.hypot(long.x, long.y) - rim) < 1e-9,
    "a long push pins the knob at the rim cap, in the push's direction");
  assert.ok(Math.hypot(long.x, long.y) + ARENA_JOYSTICK.knobDiameterPx / 2 <=
    ARENA_JOYSTICK.baseDiameterPx / 2, "the knob never leaves the base");
});

test("engagement: only a zone touch steers; a lone outside touch does nothing", () => {
  const input = new ArenaJoystickInput();
  assert.equal(input.active, false);
  assert.equal(input.displacement(), null);

  assert.deepEqual(input.pointerDown(5, 40, 120, false), { type: "outside" },
    "a touch away from the stick is not tracked at all");
  assert.equal(input.active, false);
  assert.deepEqual(input.pointerMove(5, 90, 160), { type: "ignored" },
    "dragging an outside touch across the arena steers nothing");
  assert.deepEqual(input.pointerEnd(5), { type: "ignored" });

  assert.deepEqual(input.pointerDown(7, 300, 620, true), { type: "stick" });
  assert.equal(input.active, true);
  assert.deepEqual(input.displacement(), { dx: 0, dy: 0 },
    "displacement is measured from the grab point — an off-center grab does not drift her");
  assert.deepEqual(input.pointerMove(7, 326, 620), { type: "stick" });
  assert.deepEqual(input.displacement(), { dx: 26, dy: 0 });

  assert.deepEqual(input.pointerMove(99, 0, 0), { type: "ignored" },
    "an unrelated pointer cannot move the stick");
  assert.deepEqual(input.displacement(), { dx: 26, dy: 0 });
});

test("multi-touch dash: a second finger dashes while the stick is engaged, and never steers", () => {
  const input = new ArenaJoystickInput();
  input.pointerDown(7, 300, 620, true);
  input.pointerMove(7, 320, 600);

  assert.deepEqual(input.pointerDown(8, 60, 80, false), { type: "dash" },
    "any additional pointerdown while engaged is a dash — zone or not");
  assert.deepEqual(input.pointerDown(9, 310, 610, true), { type: "dash" },
    "even a second finger landing in the zone dashes instead of stealing the stick");
  assert.deepEqual(input.pointerMove(8, 90, 110), { type: "dash-pointer" });
  assert.deepEqual(input.displacement(), { dx: 20, dy: -20 },
    "dash fingers never move the stick");
  assert.deepEqual(input.pointerEnd(8), { type: "dash-ended" });
  assert.equal(input.active, true, "the stick survives its dash fingers lifting");

  assert.deepEqual(input.pointerEnd(7), { type: "stick-ended" });
  assert.equal(input.active, false);
  assert.deepEqual(input.pointerMove(9, 330, 590), { type: "dash-pointer" },
    "a dash finger still down after the stick ends does not become the stick");
  assert.deepEqual(input.pointerDown(11, 300, 620, true), { type: "stick" },
    "the next fresh zone touch engages a new stick");
  assert.deepEqual(input.displacement(), { dx: 0, dy: 0 });
});

test("release and cancel recenter: no displacement, no knob offset, no tap dash", () => {
  const input = new ArenaJoystickInput();
  input.pointerDown(1, 300, 620, true);
  input.pointerMove(1, 340, 580);
  assert.deepEqual(input.displacement(), { dx: 40, dy: -40 });
  const end = input.pointerEnd(1);
  assert.deepEqual(end, { type: "stick-ended" });
  assert.ok(!("tap" in end),
    "releasing the stick is never read as a dash tap — grabbing and letting go is how you stop");
  assert.equal(input.active, false);
  assert.equal(input.displacement(), null, "a released stick leaves no residual input");

  // A grab-and-release with no travel (the old tap-dash shape) is
  // simply a release under this model.
  const tapShape = new ArenaJoystickInput();
  tapShape.pointerDown(1, 300, 620, true);
  assert.deepEqual(tapShape.pointerEnd(1), { type: "stick-ended" });

  const cleared = new ArenaJoystickInput();
  cleared.pointerDown(1, 300, 620, true);
  cleared.pointerDown(2, 60, 80, false);
  cleared.clear();
  assert.equal(cleared.active, false);
  assert.equal(cleared.displacement(), null);
  assert.deepEqual(cleared.pointerEnd(2), { type: "ignored" },
    "a dash finger held through a clear is forgotten, not stuck");
  assert.deepEqual(cleared.pointerDown(3, 300, 620, true), { type: "stick" },
    "the next fresh zone touch engages normally");
});

test("follow model is gone: no target, no offset, no ring — and no flick machinery either", () => {
  assert.ok(!touchSource.includes("ARENA_TOUCH_FOLLOW") &&
    !touchSource.includes("arenaFollowVector") &&
    !touchSource.includes("arenaTouchTarget"),
    "the touch module owns the joystick mapping only");
  assert.ok(!mainSource.includes("yacht-arena-touch-target") &&
    !mainSource.includes("arenaTouchTarget") &&
    !mainSource.includes("arenaFollowVector"),
    "the wiring consumes no follow target");
  assert.ok(!cssSource.includes(".yacht-arena-touch-target"),
    "the follow target ring's styles are gone");
  assert.ok(Object.keys(ARENA_JOYSTICK).every((key) => !/flick/i.test(key)) &&
    !touchSource.includes("flickLatched") && !mainSource.includes(".flick"),
    "no flick trigger survives in module or wiring");
});

test("source pins: joystick cluster, sensitivity constants, rAF sampling, 50ms tick, gates, ONE dash plaque", () => {
  assert.ok(mainSource.includes("yacht-arena-joystick") &&
    mainSource.includes("yacht-arena-joystick-knob"),
    "the fixed joystick renders in the arena for touch players");
  assert.ok(mainSource.includes("has-touch-controls"),
    "the arena carries the touch-controls class that raises the DASH pill beside the stick");
  assert.ok(mainSource.includes('window.matchMedia("(pointer: coarse)").matches') &&
    mainSource.includes("setArenaTouchUi(true)"),
    "the cluster shows for coarse pointers / from the first touch — never for mouse players");
  assert.ok(cssSource.includes(".yacht-arena-joystick{") &&
    cssSource.includes("width:112px;height:112px"),
    "the base is the specified 112px circle in the bottom-right");
  assert.ok(cssSource.includes(".yacht-arena.has-touch-controls .yacht-arena-dash-overlay") &&
    cssSource.includes("left:16px") && cssSource.includes("bottom:44px"),
    "under touch controls the DASH pill sits opposite the joystick, bottom-left (Mitchell, 2026-11-25)");

  assert.ok(mainSource.includes("arenaJoystickZoneContains") &&
    mainSource.includes("arenaJoystickKnobOffset") &&
    mainSource.includes("arenaJoystickVector"),
    "the wiring runs engagement, knob and vector through the module");
  assert.ok(mainSource.includes("arenaJoystickKnobRef") &&
    mainSource.includes("style.transform"),
    "the knob is positioned imperatively — no per-move re-render");
  assert.ok(mainSource.includes("startArenaTouchSampling") &&
    mainSource.includes("arenaTouchRafRef") &&
    mainSource.includes("window.requestAnimationFrame(loop)"),
    "the stick state is re-sampled on animation frames, not only on pointermove");

  assert.ok(!mainSource.includes("? 84 : 50"),
    "the arena no longer ticks at 84ms on mobile");
  assert.ok(mainSource.includes("const tickMs = 50;"),
    "the boss arena ticks at the desktop 50ms on every screen");
  assert.ok(mainSource.includes("? 84 : 70"),
    "the lane loop's tick is untouched");

  assert.ok(mainSource.includes(
    "return event.pointerType === \"touch\" || event.pointerType === \"pen\";"),
    "the scheme stays gated to touch/pen pointers");
  assert.ok(mainSource.includes("onLostPointerCapture={onArenaLostPointerCapture}"),
    "lost pointer capture still ends the gesture");
  assert.ok(mainSource.includes("yacht-arena-dash-overlay") &&
    mainSource.includes("arenaDashRef.current = true"),
    "the DASH plaque still queues a dash exactly as before");
  // Touch-tuning round (Mitchell): exactly ONE dash control — the
  // in-arena plaque. The deck DASH button is removed outright, the
  // plaque is a generated asset, and nothing on the button
  // references the spacebar (Space remains keyboard input only).
  assert.equal(mainSource.split("yacht-arena-dash-button").length - 1, 1,
    "exactly one dash button renders — the in-arena plaque");
  assert.ok(!mainSource.includes("yacht-arena-deck"),
    "the boss chapter's deck (and its duplicate dash button) is gone");
  assert.ok(mainSource.includes("/yacht-dash/kuroi-arena/ui-dash-plaque.webp"),
    "the dash control is the generated plaque asset");
  assert.ok(!mainSource.includes("<small>SPACE</small>"),
    "no spacebar reference on the button — the word lives in the artwork");
  assert.ok(cssSource.includes("url('/yacht-dash/kuroi-arena/ui-joystick-base.webp')") &&
    cssSource.includes("url('/yacht-dash/kuroi-arena/ui-joystick-knob.webp')"),
    "the joystick base and knob render the generated medallion assets");
});
