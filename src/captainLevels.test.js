import test from "node:test";
import assert from "node:assert/strict";
import { CAPTAIN_LEVELS, captainTrafficWave } from "./captainLevels.js";

test("five chapters keep an intentional order and distinct backgrounds", () => {
  assert.deepEqual(CAPTAIN_LEVELS.map(({ id }) => id),
    ["sunrise", "twilight", "tempest", "moonlight", "golden"]);
  assert.equal(new Set(CAPTAIN_LEVELS.map(({ background }) => background)).size, 5);
  for (const stage of CAPTAIN_LEVELS) {
    assert.ok(stage.challenge && stage.name && stage.cadence > 0);
  }
});

test("every traffic pattern leaves at least one lane free from collision", () => {
  for (const stage of CAPTAIN_LEVELS) {
    for (let step = 0; step < 120; step++) {
      for (let lane = 0; lane < 3; lane++) {
        const wave = captainTrafficWave(stage.id, step, () => lane);
        assert.ok(wave.length >= 1 && wave.length <= 3, stage.id);
        for (const item of wave) {
          assert.ok([0,1,2].includes(item.lane), stage.id);
          if (item.driftTo !== undefined) {
            assert.ok([0,1,2].includes(item.driftTo));
            assert.notEqual(item.lane, item.driftTo);
          }
          assert.ok(["buoy", "rival", "ball", "treat", "cheese"].includes(item.kind));
        }
        const occupied = new Set(wave
          .filter((item) => item.kind === "buoy" || item.kind === "rival")
          .map((item) => item.driftTo ?? item.lane));
        assert.ok(occupied.size < 3, stage.id + " step " + step);
      }
    }
  }
});

test("rivals arrive only in the regatta and final passage; storm provides double hazards", () => {
  assert.ok(captainTrafficWave("tempest", 3, () => 0).filter((item) => item.kind === "buoy").length === 2);
  assert.equal(captainTrafficWave("moonlight", 3, () => 0)[0].kind, "rival");
  assert.equal(captainTrafficWave("golden", 4, () => 0)[0].kind, "rival");
  for (const stage of ["sunrise", "twilight", "tempest"]) {
    assert.ok(Array.from({length: 30}, (_, i) => captainTrafficWave(stage, i, () => i % 3))
      .flat().every((item) => item.kind !== "rival"));
  }
});
