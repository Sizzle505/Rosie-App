import { FORMATION_LAYOUT, formationClearance } from "./emberTunnelLayout.js";
// Deterministic, frame-rate-independent 75-second Ember Tunnel Drill course.
// All collision and scoring logic stays independent of React and rendering.
export const DRILL_WIDTH = 690;
export const DRILL_HEIGHT = 820;
export const DRILL_ANCHOR = 210;
export const RUN_DURATION = 75;
export const TURBO_DURATION = 4.8;

export function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
export function tunnelCenter(x) {
  return 402 + 113 * Math.sin(x / 720 + 0.12) + 48 * Math.sin(x / 1340 + 1.35);
}
export function tunnelRadius(x) {
  return 233 + 12 * Math.sin(x / 1050 + 1.1);
}
function randomGenerator(seed) {
  let value = seed >>> 0;
  return function () { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}
export function makeCourse(seed = 1467) {
  const rand = randomGenerator(seed);
  const objects = [];
  let id = 0;
  // Curved, spaced, hand-constrained pickup chains rather than impossible random hazards.
  for (let x = 900; x < 30000; x += 610) {
    const motif = Math.floor(x / 610) % 6;
    const offset = motif === 2 ? -60 : motif === 4 ? 62 : motif === 5 ? -30 : 20;
    const kind = motif === 0 ? "bone" : motif === 3 ? "cheese" : "gem";
    for (let j = 0; j < 5; j++) {
      const pos = x + j * 68;
      const y = clamp(tunnelCenter(pos) + offset + Math.sin(j / 4 * Math.PI) * (motif % 2 ? 24 : -24), 95, 725);
      objects.push({ id: ++id, kind: j === 4 && motif === 3 ? "cache" : kind, x: pos, y, radius: 20, taken: false });
    }
    // Place obstacles after introductory stretch, avoiding the nearest pickup chains.
    if (x > 1900 && motif % 2 === 1) {
      const pos = x + 425;
      // Sculpted original rocks replace nearby generic hazards, not stack
      // two untelegraphed collision volumes on the same screen.
      if (FORMATION_LAYOUT.some(f=>f.obstacle && Math.abs(f.at-pos)<f.width*.42)) continue;
      const side = rand() < 0.5 ? -1 : 1;
      objects.push({ id: ++id, kind: motif === 5 ? "spike" : "rock", x: pos,
        y: clamp(tunnelCenter(pos) + side * 112, 90, 720), radius: motif === 5 ? 37 : 42, taken: false });
    }
  }
  // An early, visible temple wheel teaches the player that historic machinery
  // protrudes from the walls. It leaves the central route clear for new players.
  const firstWheelX=2280;
  objects.push({id:++id,kind:"spike",x:firstWheelX,
    y:tunnelCenter(firstWheelX)-tunnelRadius(firstWheelX)+52,
    radius:37,taken:false});
  return objects;
}
export function newRun(seed = 1467) {
  return { running: true, ended: false, time: 0, scroll: 0, y: tunnelCenter(DRILL_ANCHOR), pitch: 0,
    score: 0, hull: 3, charge: 0, boostTime: 0, combo: 0, lastCatch: -10,
    gems: 0, bones: 0, cheese: 0, passage: 1, hitCooldown: 0, shock: 0,
    objects: makeCourse(seed), formationHits: [], events: [], result: null, distance: 0 };
}
export function triggerTurbo(s) {
  if (!s.running || s.charge < 100 || s.boostTime > 0) return false;
  s.boostTime = TURBO_DURATION; s.charge = 0;
  s.events.push({ type: "turbo", x: DRILL_ANCHOR, y: s.y });
  return true;
}
export function intersectsSculpture(f, worldX, y) {
  const intrude=formationClearance(f,worldX);
  if(intrude<=0)return false;
  const edge=tunnelCenter(worldX)+f.side*tunnelRadius(worldX);
  // 24px fair hull allowance. Only the central, visibly solid relief hits.
  return f.side*(y-edge)>-intrude-24;
}
export function updateRun(s, dt, up = false, down = false) {
  if (!s.running) return s;
  dt = clamp(dt, 0, 0.045);
  s.events.length = 0;
  const target = up && !down ? -0.72 : down && !up ? 0.72 : 0;
  s.pitch += (target - s.pitch) * Math.min(1, dt * 6.5);
  s.y = clamp(s.y + Math.sin(s.pitch) * 330 * dt, 65, DRILL_HEIGHT - 65);
  const boosted = s.boostTime > 0;
  const speed = boosted ? 480 : 310 + Math.min(42, s.time * 0.48);
  s.scroll += speed * dt;
  s.distance = s.scroll;
  s.time += dt;
  s.boostTime = Math.max(0, s.boostTime - dt);
  s.hitCooldown = Math.max(0, s.hitCooldown - dt);
  s.shock = Math.max(0, s.shock - dt);
  s.passage = clamp(1 + Math.floor(s.time / 15), 1, 5);
  const worldX = s.scroll + DRILL_ANCHOR;
  const routeMid = tunnelCenter(worldX);
  const outside = Math.abs(s.y - routeMid) > tunnelRadius(worldX) - 43;
  if (outside && s.hitCooldown <= 0 && !boosted) takeHit(s);
  // Collision follows the SAME world-anchored illustrated overhangs/floor rises.
  // A smaller elliptical core, not the full rectangular transparent image,
  // creates fair dodges. Check toward the real drill nose, not the cockpit.
  const tipWorldX = worldX + 105;
  for (const formation of FORMATION_LAYOUT) {
    if (!formation.obstacle || s.formationHits.includes(formation.at)) continue;
    if (!intersectsSculpture(formation, tipWorldX, s.y)) continue;
    s.formationHits.push(formation.at); // One contact per geological obstacle.
    if (boosted) {
      s.score += 125;
      s.events.push({type:"shatter",x:DRILL_ANCHOR+105,y:s.y});
    } else if (s.hitCooldown<=0) takeHit(s);
  }
  for (let i = 0; i < s.objects.length; i++) {
    const obj = s.objects[i];
    if (obj.taken || obj.x < worldX - 95 || obj.x > worldX + 85) continue;
    const deltaX = obj.x - worldX;
    const deltaY = obj.y - s.y;
    const distance = Math.hypot(deltaX * 0.78, deltaY);
    if (distance >= obj.radius + (obj.kind === "spike" ? 32 : 30)) continue;
    obj.taken = true;
    if (obj.kind === "rock" || obj.kind === "spike") {
      if (boosted) {
        s.score += 125;
        s.events.push({ type: "shatter", x: DRILL_ANCHOR + deltaX, y: obj.y });
      } else if (s.hitCooldown <= 0) takeHit(s);
      continue;
    }
    if (s.time - s.lastCatch > 2.3) s.combo = 0;
    s.combo = Math.min(12, s.combo + 1);
    s.lastCatch = s.time;
    const value = obj.kind === "bone" ? 70 : obj.kind === "cheese" ? 110 : obj.kind === "cache" ? 480 : 90;
    s.score += value * Math.max(1, Math.ceil(s.combo / 3)) * (boosted ? 2 : 1);
    s.charge = clamp(s.charge + (obj.kind === "cache" ? 32 : 6), 0, 100);
    if (obj.kind === "bone") s.bones++;
    else if (obj.kind === "cheese") s.cheese++;
    else if (obj.kind === "gem" || obj.kind === "cache") s.gems++;
    s.events.push({ type: "pickup", kind: obj.kind, x: DRILL_ANCHOR + deltaX, y: obj.y, combo: s.combo });
  }
  if (s.hull <= 0 || s.time >= RUN_DURATION) {
    s.running = false; s.ended = true;
    s.result = s.hull > 0 ? "complete" : "hull";
    s.time = Math.min(RUN_DURATION, s.time);
    s.events.push({ type: "end", result: s.result });
  }
  return s;
}
function takeHit(s) {
  s.hull--; s.hitCooldown = 1.45; s.shock = 0.42; s.combo = 0;
  s.events.push({ type: "hit", x: DRILL_ANCHOR, y: s.y });
}
