import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {BOSS_VICTORY_REVEAL_DELAY_MS, WORLD_VICTORY_REVEAL_DELAY_MS,
  shouldHoldBossVictory, shouldHoldWorldVictory} from "../src/emberVictoryTiming.js";

// 2026-11-25 remake: victory presentation timing + integration guards.
test("boss victories hold for the defeat animation, world victories for the gate crossing", () => {
  assert.equal(BOSS_VICTORY_REVEAL_DELAY_MS, 2500);
  assert.equal(WORLD_VICTORY_REVEAL_DELAY_MS, 1400);
  assert.equal(shouldHoldBossVictory({result: "complete", bossDefeated: true}), true);
  assert.equal(shouldHoldBossVictory({result: "complete", bossDefeated: false}), false);
  assert.equal(shouldHoldBossVictory({result: "hull", bossDefeated: true}), false);
  // Non-boss world completions hold; boss completions are the boss hold's
  // job; Classic (stageIndex null) and failures never hold.
  assert.equal(shouldHoldWorldVictory({result: "complete", stageIndex: 0, bossDefeated: false}), true);
  assert.equal(shouldHoldWorldVictory({result: "complete", stageIndex: 1}), true);
  assert.equal(shouldHoldWorldVictory({result: "complete", stageIndex: 2, bossDefeated: true}), false);
  assert.equal(shouldHoldWorldVictory({result: "complete", stageIndex: null}), false);
  assert.equal(shouldHoldWorldVictory({result: "hull", stageIndex: 0}), false);
  assert.equal(shouldHoldWorldVictory(null), false);
});

test("the victory painting is a full-stage backdrop, not a panel thumbnail", () => {
  const jsx = readFileSync(new URL("../src/EmberTunnelDrill.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/ember-tunnel-drill.css", import.meta.url), "utf8");
  assert.ok(jsx.includes('className="ember-victory-backdrop"'),
    "ended world completions render the victory backdrop");
  assert.ok(jsx.includes('" is-victory"'), "the report panel takes the victory sheet styling");
  assert.ok(!jsx.includes('className="ember-victory-art"'),
    "the old inset thumbnail is gone");
  assert.ok(css.includes(".ember-victory-backdrop"), "backdrop styling exists");
  assert.ok(css.includes("object-fit:cover"), "the painting fills the stage");
});

test("the victory report is a compact stars-first sheet (feedback round)", () => {
  // Mitchell on iPhone: the full report panel covered the victory
  // painting entirely. The sheet shows title, stars and one summary
  // line; the stats grid, medals, relic and world picker render only
  // when the player opens DETAILS & WORLDS.
  const jsx = readFileSync(new URL("../src/EmberTunnelDrill.jsx", import.meta.url), "utf8");
  assert.ok(jsx.includes('className="ember-victory-summary"'), "stars-first summary exists");
  assert.ok(jsx.includes('className="ember-victory-stars"'), "big stars are the summary");
  assert.ok(jsx.includes('(!isVictory||victoryMore)&&<div className="ember-results">'),
    "the stats grid is behind the details toggle on victory");
  assert.ok(jsx.includes('(!isVictory||victoryMore)&&<div className="ember-expedition-pick"'),
    "the world picker is behind the details toggle on victory");
  assert.ok(jsx.includes('"DETAILS & WORLDS"'), "the toggle is labelled");
});
