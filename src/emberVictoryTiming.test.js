import test from "node:test";
import assert from "node:assert/strict";
import {BOSS_VICTORY_REVEAL_DELAY_MS,shouldHoldBossVictory} from "./emberVictoryTiming.js";
test("victorious boss gets exactly 2.5 seconds before result overlay",()=>{
  assert.equal(BOSS_VICTORY_REVEAL_DELAY_MS,2500);
  assert.equal(shouldHoldBossVictory({result:"complete",bossDefeated:true}),true);
});
test("ordinary completion, timeout and hull loss display results without boss delay",()=>{
  assert.equal(shouldHoldBossVictory({result:"complete",bossDefeated:false}),false);
  assert.equal(shouldHoldBossVictory({result:"boss-timeout",bossDefeated:false}),false);
  assert.equal(shouldHoldBossVictory({result:"hull",bossDefeated:false}),false);
  assert.equal(shouldHoldBossVictory(null),false);
});
