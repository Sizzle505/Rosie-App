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

test("Approved Yacht Dash props have individually calibrated sizes", () => {
  assert.ok(yachtAssetScale(asset("fishing-skiff")) > 2.072);
  assert.ok(yachtAssetScale(asset("fan-raft")) > 1);
  assert.ok(yachtAssetScale(asset("moonlight-race-buoy")) > 2.208);
  assert.ok(yachtAssetScale(asset("regatta-beacon")) > 2.208);
  assert.ok(yachtAssetScale(asset("barrel-raft")) < 1);
  assert.ok(yachtAssetScale(asset("taiko-barge")) < 1);
  assert.ok(yachtAssetScale("/yacht-dash/kuroi/kuroi-charge.webp") > 1);
  assert.ok(yachtAssetScale(asset("cargo-crate")) > 1);
});

test("Driftwood master is present and is a valid RIFF WebP image", () => {
  const bytes = readFileSync(new URL("../public/yacht-dash/obstacles/driftwood.webp", import.meta.url));
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  assert.ok(bytes.length > 10000);
});
