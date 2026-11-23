import test from "node:test";
import assert from "node:assert/strict";
import {EMBER_CANONICAL_DRILL,EMBER_CANONICAL_VICTORY_BACKDROPS,victoryBackdropForStage} from "../src/emberCanonicalVictory.js";

test("five distinct victory scenes reuse native Tunnel artwork",()=>{
  assert.equal(EMBER_CANONICAL_VICTORY_BACKDROPS.length,5);
  assert.equal(new Set(EMBER_CANONICAL_VICTORY_BACKDROPS).size,5);
  for(let i=0;i<5;i++){
    assert.equal(victoryBackdropForStage(i),EMBER_CANONICAL_VICTORY_BACKDROPS[i]);
    assert.match(victoryBackdropForStage(i),/^\/ember-drill\//);
  }
  assert.equal(EMBER_CANONICAL_DRILL,"/ember-drill/drill-body.webp");
});
test("missing or classic stages cannot display an unrelated victory",()=>{
  for(const bad of [-2,-1,5,999,null,undefined,"2",2.5]){
    assert.equal(victoryBackdropForStage(bad),null);
  }
});
