import assert from "node:assert/strict";
import {test} from "node:test";
import {newRun,updateRun,RUN_DURATION,tunnelCenter,DRILL_ANCHOR} from "../src/emberDrillEngine.js";
import {atlasFrameRect,EMBER_EXPANSION_ATLASES} from "../src/emberExpansionCatalog.js";
import {excavationNotice} from "../src/emberBreakableFeedback.js";

function collectSpecial(stageIndex,kind){
  const s=newRun(1467,stageIndex);
  const bonus=s.objects.find(x=>x.kind===kind);
  assert.ok(bonus,"special asset must be spawned in selected world");
  assert.equal(bonus.y,tunnelCenter(bonus.x),"bonus rests at the corridor's safe center");
  s.objects=[bonus];s.breakables=[];s.crystalShutters=[];s.worldHazards=[];
  s.hitCooldown=99;s.pitch=0;s.y=bonus.y;
  s.scroll=bonus.x-DRILL_ANCHOR;
  updateRun(s,.016);
  assert.equal(bonus.taken,true);
  const event=s.events.find(e=>e.type==="bonus-"+kind);
  return {s,bonus,event};
}
test("Classic retains its exact 75-second route, never spawning or loading special rewards",()=>{
  const c=newRun(1467);
  assert.equal(c.duration,RUN_DURATION);
  assert.equal(c.objects.some(o=>o.kind==="time"||o.kind==="canister"),false);
  assert.equal(newRun(1467,2).objects.some(o=>o.kind==="time"||o.kind==="canister"),false);
});
test("Barkroot Turbo canister is centered, grants charge once, and uses original sixth atlas cell",()=>{
  const s0=newRun(1467,0);
  const bonus=s0.objects.find(o=>o.kind==="canister");
  assert.ok(bonus);
  const s=newRun(1467,0);
  const o=s.objects.find(o=>o.kind==="canister");
  s.objects=[o];s.breakables=[];s.crystalShutters=[];s.worldHazards=[];
  s.hitCooldown=99;s.scroll=o.x-DRILL_ANCHOR;s.y=o.y;s.pitch=0;s.charge=20;
  updateRun(s,.016);
  assert.equal(o.taken,true);
  assert.equal(s.charge,85);
  assert.equal(s.score,175);
  assert.ok(s.events.some(e=>e.type==="bonus-canister"&&e.points===175));
  assert.match(excavationNotice({type:"bonus-canister",points:175}).title,/TURBO/);
  updateRun(s,.016);
  assert.equal(s.score,175);
  assert.equal(s.charge,85);
  assert.equal(atlasFrameRect("bonus-pickups",5).sx,2*512);
});
test("Ruby time pickup adds three seconds only once, without changing Classic or boss timers",()=>{
  const s=newRun(1467,1);
  const o=s.objects.find(o=>o.kind==="time");
  assert.ok(o);
  s.objects=[o];s.breakables=[];s.crystalShutters=[];s.worldHazards=[];
  s.hitCooldown=99;s.scroll=o.x-DRILL_ANCHOR;s.y=o.y;s.pitch=0;
  assert.equal(s.duration,15);
  updateRun(s,.016);
  assert.equal(o.taken,true);
  assert.equal(s.duration,18);
  assert.equal(s.score,200);
  assert.ok(s.events.some(e=>e.type==="bonus-time"&&e.seconds===3));
  assert.match(excavationNotice({type:"bonus-time",points:200}).detail,/3 seconds/);
  updateRun(s,.016);
  assert.equal(s.duration,18);
  assert.equal(s.score,200);
  assert.equal(newRun(1467,2).duration,30);
  assert.equal(newRun(1467,3).duration,40);
  assert.equal(newRun(1467,4).duration,40);
  assert.equal(EMBER_EXPANSION_ATLASES["bonus-pickups"].frames,6);
  assert.equal(atlasFrameRect("bonus-pickups",4).sx,512);
  assert.equal(atlasFrameRect("bonus-pickups",4).sy,512);
});
