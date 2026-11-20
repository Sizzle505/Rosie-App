import assert from "node:assert/strict";
import {test} from "node:test";
import {RUN_DURATION,DRILL_ANCHOR,tunnelCenter,newRun,updateRun} from "../src/emberDrillEngine.js";
import {EXPEDITION_STAGES,EXPEDITION_STAGE_SECONDS,getExpeditionStage,
 expeditionStarCount,safeStoredExpeditionStars} from "../src/emberExpeditionStages.js";

test("all five stages are playable and independently addressable",()=>{
 assert.equal(EXPEDITION_STAGES.length,5);
 assert.deepEqual(EXPEDITION_STAGES.map(s=>s.id),["barkroot","ruby","clockwork","molten","treasury"]);
 assert.equal(new Set(EXPEDITION_STAGES.map(s=>s.startX)).size,5);
 assert.equal(getExpeditionStage(0)?.id,"barkroot");
 assert.equal(getExpeditionStage(4)?.id,"treasury");
 assert.equal(getExpeditionStage(-1),null);
 assert.equal(getExpeditionStage("2"),null);
});
test("original classic run duration and starting coordinates remain unchanged",()=>{
 const classic=newRun(1467);
 assert.equal(classic.stageIndex,null);
 assert.equal(classic.duration,RUN_DURATION);
 assert.equal(classic.scroll,0);
 assert.equal(classic.y,tunnelCenter(DRILL_ANCHOR));
 const malformed=newRun(1467,99);
 assert.equal(malformed.stageIndex,null);
 assert.equal(malformed.duration,RUN_DURATION);
});
test("stage routes start in the selected world and end at 15 seconds",()=>{
 for(let i=0;i<EXPEDITION_STAGES.length;i++){
   const s=newRun(1467,i);
   assert.equal(s.stageIndex,i);
   assert.equal(s.scroll,EXPEDITION_STAGES[i].startX);
   assert.equal(s.y,tunnelCenter(s.scroll+DRILL_ANCHOR));
   assert.equal(s.duration,EXPEDITION_STAGE_SECONDS);
   s.objects=[];s.breakables=[];s.crystalShutters=[];s.worldHazards=[];
   s.hitCooldown=30;s.hull=5;
   for(let t=0;t<400&&s.running;t++)updateRun(s,.045);
   assert.equal(s.running,false);
   assert.equal(s.time,EXPEDITION_STAGE_SECONDS);
   assert.equal(s.result,"complete");
   assert.ok(s.distance>0&&s.distance<8000,"stage distance is relative, not world offset");
 }
});
test("three-star stage grading cannot be earned from a failed run",()=>{
 assert.equal(expeditionStarCount({stageIndex:2,result:"hull",damageTaken:0,worldObjective:true}),0);
 assert.equal(expeditionStarCount({stageIndex:null,result:"complete",damageTaken:0,worldObjective:true}),0);
 assert.equal(expeditionStarCount({stageIndex:2,result:"complete",damageTaken:3,worldObjective:false}),1);
 assert.equal(expeditionStarCount({stageIndex:2,result:"complete",damageTaken:0,worldObjective:false}),2);
 assert.equal(expeditionStarCount({stageIndex:2,result:"complete",damageTaken:1,worldObjective:true}),3);
});
test("saved stage progress is bounded and robust to invalid localStorage values",()=>{
 assert.deepEqual(safeStoredExpeditionStars("broken"),{});
 const r=safeStoredExpeditionStars('{"barkroot":7,"ruby":-2,"clockwork":2,"molten":"x","treasury":1}');
 assert.equal(r.barkroot,3);assert.equal(r.ruby,0);assert.equal(r.clockwork,2);
 assert.equal(r.molten,0);assert.equal(r.treasury,1);
});
