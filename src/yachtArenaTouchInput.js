/* Touch input for the Kuroi arena chapter.
 *
 * Desktop arena input remains in main.jsx: keyboard vectors plus the
 * long-standing mouse hold-to-steer pointer. This module is deliberately
 * separate and is only fed touch/pen pointer events from the arena.
 *
 * The steering model is a FIXED VIRTUAL JOYSTICK — Mitchell's direct
 * specification after thumb-testing two earlier models on his phone:
 * the floating-origin stick (v1: direction measured from wherever the
 * thumb landed, in raw pixels) and follow-the-finger (v2: Rosie chases
 * an offset target). Neither felt right; what he asked for is a
 * visible stick in a fixed place — bottom-right of the arena, beside
 * the DASH pill — and MORE SENSITIVE than v1.
 *
 * How it works: the base sits fixed in the arena's bottom-right. A
 * touch that lands in the stick's zone (the base, generously padded)
 * engages it; displacement is measured from the GRAB point, so a thumb
 * landing off-center does not drift her — pushing from where you
 * grabbed is the direction, and ARENA_JOYSTICK.fullDeflectionPx of
 * travel is full speed. The response is linear past the dead zone —
 * no curve. Sensitivity history: v1's floating stick needed 48px;
 * v3 shipped 26px / 4px dead zone at Mitchell's "more sensitive"
 * request, and his thumb test found that "a little too easy", so the
 * current values are the middle step back — 36px / 6px.
 *
 * Direction math stays aspect-correct, the v2 diagnosis that must not
 * regress: the pixel displacement is converted into arena unit space
 * through the arena rect BEFORE its direction is taken, so a 45-degree
 * drag is a 45-degree course even on the tall phone cabinet (~376px
 * wide x ~700px tall for the same 100 units, where raw pixel math
 * bent a 45-degree drag to ~62 degrees). Magnitude is physical: it
 * comes from the pixel travel against fullDeflectionPx, the same on
 * every screen shape.
 *
 * Multi-touch: while the stick is engaged, any additional pointerdown
 * anywhere on the arena is a dash tap (direction = the stick's current
 * vector), exactly as in v1/v2; the DASH pill is untouched and remains
 * the primary tap dash. A lone touch OUTSIDE the stick zone does
 * nothing — no steering, no dash: the fixed stick is the only steering
 * surface. There is deliberately no tap dash and no flick dash under
 * this model: grabbing and releasing the stick is how you hold and
 * stop, so a release must never read as a dash.
 */

export const ARENA_JOYSTICK = Object.freeze({
  // Thumb travel from the grab point that reads as full deflection.
  // v1's floating stick needed 48px; v3 shipped 26px ("more
  // sensitive") and Mitchell found it "a little too easy", so this
  // is the middle step back toward 48.
  fullDeflectionPx: 36,
  // Travel at or below this is no input at all (and the knob stays
  // centered, so a resting thumb does not jitter her).
  deadZonePx: 6,
  // The engagement zone is the base's rect grown by this much on
  // every side — a thumb aimed at the stick should never miss it.
  hitPadPx: 16,
  // Mirror the CSS geometry (yachtDashExpansion.css) so tests and
  // layout reasoning share one set of numbers.
  baseDiameterPx: 112,
  knobDiameterPx: 48
});

const clamp01 = (value) => Math.max(0, Math.min(1, value));

/** The fraction of full deflection for a pixel travel length: zero
 * inside the dead zone, then linear to full at fullDeflectionPx.
 * Shared by the input vector and the knob's rendered travel so what
 * the thumb sees is what Rosie does. */
export function arenaJoystickMagnitude(travelPx) {
  const { deadZonePx, fullDeflectionPx } = ARENA_JOYSTICK;
  if (!(travelPx > deadZonePx)) return 0;
  return clamp01((travelPx - deadZonePx) / (fullDeflectionPx - deadZonePx));
}

/** Whether a client point lands in the stick's engagement zone: the
 * base element's rect grown by hitPadPx on every side. A missing or
 * area-less rect (the cluster is not mounted — a mouse player, or the
 * very first touch on a fine-pointer device) contains nothing. */
export function arenaJoystickZoneContains(clientX, clientY, baseRect) {
  if (!baseRect || !baseRect.width || !baseRect.height) return false;
  const pad = ARENA_JOYSTICK.hitPadPx;
  return clientX >= baseRect.left - pad && clientX <= baseRect.right + pad &&
    clientY >= baseRect.top - pad && clientY <= baseRect.bottom + pad;
}

/** The machine input for a stick displacement: direction taken in
 * arena unit space (the pixel displacement divided by the arena
 * rect's dimensions before normalizing — the aspect correction), scaled
 * by the deflection magnitude. `rect` is the arena element's bounding
 * rect; without a usable rect there is no trustworthy direction, so
 * the vector is zero. */
export function arenaJoystickVector(dxPx, dyPx, rect) {
  if (!rect || !rect.width || !rect.height) return { x: 0, y: 0, magnitude: 0 };
  const magnitude = arenaJoystickMagnitude(Math.hypot(dxPx, dyPx));
  if (magnitude <= 0) return { x: 0, y: 0, magnitude: 0 };
  const ux = dxPx / rect.width;
  const uy = dyPx / rect.height;
  const ulen = Math.hypot(ux, uy);
  if (!ulen) return { x: 0, y: 0, magnitude: 0 };
  return { x: ux / ulen * magnitude, y: uy / ulen * magnitude, magnitude };
}

/** Where the knob renders, in pixels from the base's center: along
 * the thumb's screen direction, traveling magnitude x
 * fullDeflectionPx — it rests dead-center inside the dead zone and
 * saturates toward the rim as the input saturates. The rendered
 * travel is capped at the base radius minus the knob radius
 * ((112 - 48) / 2 = 32px): at 36px full deflection the uncapped
 * travel would push the knob's edge 4px past the base's rim, so the
 * knob reaches the rim just before the input tops out and never
 * leaves the base. */
export function arenaJoystickKnobOffset(dxPx, dyPx) {
  const travel = Math.hypot(dxPx, dyPx);
  const magnitude = arenaJoystickMagnitude(travel);
  if (magnitude <= 0 || !travel) return { x: 0, y: 0 };
  const maxKnobTravel = (ARENA_JOYSTICK.baseDiameterPx - ARENA_JOYSTICK.knobDiameterPx) / 2;
  const knobTravel = Math.min(magnitude * ARENA_JOYSTICK.fullDeflectionPx, maxKnobTravel);
  return { x: dxPx / travel * knobTravel, y: dyPx / travel * knobTravel };
}

/** Pointer bookkeeping for the joystick: one engaged stick finger
 * plus any number of simultaneous dash-only fingers. A dash finger
 * never becomes the stick when the stick finger is released; the next
 * fresh pointerdown inside the zone starts a new engagement. A
 * pointerdown outside the zone while no stick is engaged is reported
 * as "outside" and deliberately not tracked — it steers nothing and
 * dashes nothing. The class only records positions; the caller
 * samples the displacement (on animation frames) and converts it with
 * arenaJoystickVector / arenaJoystickKnobOffset. */
export class ArenaJoystickInput {
  constructor() {
    this.clear();
  }

  clear() {
    this.pointerId = null;
    this.grabX = 0;
    this.grabY = 0;
    this.x = 0;
    this.y = 0;
    this.dashPointerIds = new Set();
  }

  get active() {
    return this.pointerId !== null;
  }

  /** The stick's current displacement from its grab point, in client
   * pixels, or null when no stick is engaged. */
  displacement() {
    if (!this.active) return null;
    return { dx: this.x - this.grabX, dy: this.y - this.grabY };
  }

  pointerDown(pointerId, x, y, inZone) {
    if (this.active) {
      if (pointerId === this.pointerId || this.dashPointerIds.has(pointerId)) {
        return { type: "ignored" };
      }
      this.dashPointerIds.add(pointerId);
      return { type: "dash" };
    }
    if (this.dashPointerIds.has(pointerId)) return { type: "ignored" };
    if (!inZone) return { type: "outside" };
    this.pointerId = pointerId;
    this.grabX = x;
    this.grabY = y;
    this.x = x;
    this.y = y;
    return { type: "stick" };
  }

  pointerMove(pointerId, x, y) {
    if (this.active && pointerId === this.pointerId) {
      this.x = x;
      this.y = y;
      return { type: "stick" };
    }
    if (this.dashPointerIds.has(pointerId)) return { type: "dash-pointer" };
    return { type: "ignored" };
  }

  /** End a pointer. Ending the stick finger recenters the stick:
   * the engagement is forgotten entirely, so the next sample reads
   * no displacement and the caller resets the knob. */
  pointerEnd(pointerId) {
    if (this.active && pointerId === this.pointerId) {
      this.pointerId = null;
      return { type: "stick-ended" };
    }
    if (this.dashPointerIds.delete(pointerId)) return { type: "dash-ended" };
    return { type: "ignored" };
  }
}
