import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  yachtAssetScale,
  yachtRivalAttackLane,
  yachtRivalSpriteFor,
  yachtThreatForecast,
  yachtWaveFor,
  yachtCatchStart,
  yachtFollowUpRewardLane
} from "../src/yachtDashExpansion.js";

const asset = (name) => `/yacht-dash/obstacles/${name}.webp`;

test("Kuroi continues straight when Rosie remains in his lane", () => {
  for (const lane of [0, 1, 2]) {
    assert.equal(yachtRivalAttackLane(lane, lane), lane);
  }
  assert.match(
    yachtRivalSpriteFor({ kind: "rival", lane: 1, drifted: true, turned: false }),
    /kuroi-charge\.webp$/
  );
});

test("Kuroi turns no more than one lane toward Rosie", () => {
  assert.equal(yachtRivalAttackLane(0, 1), 1);
  assert.equal(yachtRivalAttackLane(1, 0), 0);
  assert.equal(yachtRivalAttackLane(1, 2), 2);
  assert.equal(yachtRivalAttackLane(2, 1), 1);
  assert.equal(yachtRivalAttackLane(0, 2), 1);
  assert.equal(yachtRivalAttackLane(2, 0), 1);
  assert.match(
    yachtRivalSpriteFor({ kind: "rival", drifted: true, turned: true, driftFrom: 2, driftTo: 1 }),
    /kuroi-turn-port\.webp$/
  );
  assert.match(
    yachtRivalSpriteFor({ kind: "rival", drifted: true, turned: true, driftFrom: 0, driftTo: 1 }),
    /kuroi-turn-starboard\.webp$/
  );
});

test("Forecast and follow-up treats account for Rosie's current attack lane", () => {
  const incoming = [{ kind: "rival", lane: 0, y: 45, drifted: false }];
  assert.deepEqual(yachtThreatForecast(incoming, 0).blocked, [0]);
  assert.deepEqual(yachtThreatForecast(incoming, 1).blocked, [1]);
  assert.equal(yachtFollowUpRewardLane([{ kind: "rival", lane: 0 }], 0), 1);
});

test("Kuroi's authored waves do not force a turn away from Rosie", () => {
  const encounter = yachtWaveFor("moonlight", 4, () => 0)[0];
  assert.equal(encounter.kind, "rival");
  assert.equal(Object.hasOwn(encounter, "driftTo"), false);
  assert.equal(yachtCatchStart(encounter), 74);
});

test("Latest Yacht Dash sizing changes are exact relative to the previous release", () => {
  const previous = {
    "fishing-skiff": 2.7, "fan-raft": 1.27,
    "moonlight-race-buoy": 2.76, "regatta-beacon": 2.76,
    "barrel-raft": 0.78, "taiko-barge": 0.80,
    "cargo-crate": 1.20, "drift-net": 1
  };
  const multiplier = {
    "fishing-skiff": 1.30, "fan-raft": 1.40,
    "moonlight-race-buoy": 1.20, "regatta-beacon": 1.20,
    "barrel-raft": 0.75, "taiko-barge": 0.80,
    "cargo-crate": 1.25, "drift-net": 1.65
  };
  for (const [name, scale] of Object.entries(previous)) {
    const expected = scale * multiplier[name];
    assert.ok(Math.abs(yachtAssetScale(asset(name)) - expected) < 1e-9,
      `${name}: expected ${expected}x`);
  }
  for (const phase of ["kuroi-charge", "kuroi-turn-port", "kuroi-turn-starboard"]) {
    assert.ok(Math.abs(yachtAssetScale(`/yacht-dash/kuroi/${phase}.webp`) -
      (1.35 * 1.65 * 1.20)) < 1e-9,
      `${phase} must not shrink when Kuroi starts turning`);
  }
});

test("All authored Yacht Dash hazards have real WebP files, not invisible sprites", () => {
  for (const name of [
    "storm-buoy", "fishing-skiff", "drift-net", "fallen-stone-lantern",
    "moonlight-race-buoy", "regatta-beacon", "fan-raft", "reef-rocks",
    "driftwood", "lantern-raft", "taiko-barge", "barrel-raft", "cargo-crate"
  ]) {
    const bytes = readFileSync(new URL(`../public/yacht-dash/obstacles/${name}.webp`, import.meta.url));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", name);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", name);
    assert.ok(bytes.length > 10000, `${name} artwork is not empty`);
  }
  for (const name of ["kuroi-charge", "kuroi-turn-port", "kuroi-turn-starboard", "torii-passage"]) {
    const bytes = readFileSync(new URL(`../public/yacht-dash/kuroi/${name}.webp`, import.meta.url));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", name);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", name);
    assert.ok(bytes.length > 10000, `${name} artwork is not empty`);
  }
});

test("Lantern raft is 35% smaller, while all Kuroi attack frames are 20% larger", () => {
  assert.equal(yachtAssetScale(asset("lantern-raft")), .65);
  for (const name of ["kuroi-charge", "kuroi-turn-port", "kuroi-turn-starboard"]) {
    assert.ok(Math.abs(yachtAssetScale(`/yacht-dash/kuroi/${name}.webp`) - 2.673) < 1e-9);
  }
});

test("Native-resolution render for fan, crescent markers and Kuroi preserves image proportions", () => {
  const game = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/yachtDashExpansion.css", import.meta.url), "utf8");
  assert.match(game, /const nativeResArt = item.kind === "rival"/);
  assert.match(game, /"fan-raft.webp", "moonlight-race-buoy.webp", "regatta-beacon.webp"/);
  assert.match(game, /const visualScale = nativeResArt \? 1 : artScale/);
  assert.match(css, /yacht-native-resolution\.sea-pickup-rival/);
  assert.match(css, /width:calc\(98px \* var\(--yacht-asset-multiplier, 1\)\)/);
  assert.match(css, /object-fit:contain/);
});

test("The red phantom obstacle bar is removed without losing helm threat forecasts", () => {
  const game = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(game, /className="yacht-course-lane-cues"/);
  assert.match(game, /yacht-lane-forecast/);
  assert.match(game, /threatForecast\?\.blocked\.includes\(index\)/);
});

test("Torii maintains 4:3 proportions and fades above Rosie rather than popping forward", () => {
  const game = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/yachtDashExpansion.css", import.meta.url), "utf8");
  assert.match(game, /item\.footprint === "arch" && item\.y >= 54 && item\.y < 108/);
  assert.match(game, /foregroundOpacity = Math\.min\(1, Math\.max\(0, \(item\.y - 54\) \/ 19\)\)/);
  assert.match(game, /yacht-torii-foreground/);
  assert.match(css, /aspect-ratio:4 \/ 3/);
  assert.match(css, /\.yacht-footprint-arch\.yacht-torii-foreground\s*\{\s*z-index:24;/);
});

test("Driftwood master is present and is a valid RIFF WebP image", () => {
  const bytes = readFileSync(new URL("../public/yacht-dash/obstacles/driftwood.webp", import.meta.url));
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  assert.ok(bytes.length > 10000);
});
