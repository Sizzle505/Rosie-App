import test from "node:test";
import assert from "node:assert/strict";
import { EXPEDITION_STAGES, expeditionStarCount } from "./emberExpeditionStages.js";
import {
  EMBER_VICTORY_WORLDS, EMBER_VICTORY_DRILL, EMBER_VICTORY_MARKERS,
  victoryMarkerPosition, victoryReport, sampleVictoryHud
} from "./emberVictoryPresentation.js";

test("all five active worlds map to existing asset paths", () => {
  assert.equal(EMBER_VICTORY_WORLDS.length, EXPEDITION_STAGES.length);
  assert.equal(EMBER_VICTORY_DRILL, "/ember-drill/drill-body.webp");
  assert.match(EMBER_VICTORY_MARKERS, /world-markers-atlas\.webp$/);
  EMBER_VICTORY_WORLDS.forEach((world, index) => {
    assert.equal(world.id, EXPEDITION_STAGES[index].id);
    assert.equal(world.name, EXPEDITION_STAGES[index].name);
    assert.match(world.backdrop, /^\/ember-drill\/.*\.webp$/);
  });
});

test("review star variants match the actual expedition scoring, never fixed at three", () => {
  for (let index = 0; index < EXPEDITION_STAGES.length; index++) {
    for (const expected of [1, 2, 3]) {
      const sample = sampleVictoryHud(index, expected);
      assert.equal(sample.stageIndex, index);
      assert.equal(expeditionStarCount(sample), expected);
    }
  }
});

test("world-marker atlas slots correspond to its three-column, two-row sheet", () => {
  assert.deepEqual(victoryMarkerPosition(0),
    { backgroundPosition: "0% 0%", backgroundSize: "300% 200%" });
  assert.deepEqual(victoryMarkerPosition(2),
    { backgroundPosition: "100% 0%", backgroundSize: "300% 200%" });
  assert.deepEqual(victoryMarkerPosition(3),
    { backgroundPosition: "0% 100%", backgroundSize: "300% 200%" });
  assert.deepEqual(victoryMarkerPosition(4),
    { backgroundPosition: "50% 100%", backgroundSize: "300% 200%" });
  assert.throws(() => victoryMarkerPosition(5), RangeError);
});

test("actual result values stay data-driven and do not mutate the run", () => {
  const original = {
    score: 32850, distance: 1171, gems: 19, boosts: 4, secrets: 2,
    shards: 7, wallsBroken: 3, damageTaken: 2, worldObjective: false,
    bossDefeated: true
  };
  const source = structuredClone(original);
  assert.deepEqual(victoryReport(original), {
    score: 32850, distance: 1171, gems: 19, boosts: 4, secrets: 2,
    rocks: 10, damage: 2, objectiveComplete: false, bossDefeated: true
  });
  assert.deepEqual(original, source);
  assert.equal(expeditionStarCount({...original, stageIndex: 2, result:"complete"}), 1);
});
