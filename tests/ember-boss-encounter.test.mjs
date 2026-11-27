import assert from "node:assert/strict";
import {test} from "node:test";
import {createBossEncounter,getBossConfig,advanceBossEncounter,
  bossCanTakeHit,hitBossDuringRecovery,bossPresentation} from "../src/emberBossEncounter.js";
const advanceTo=(s,phase)=>{
 for(let i=0;i<600;i++){
   if(s.phase===phase)return;
   advanceBossEncounter(s,.045);
 }
 throw new Error("Did not reach boss phase "+phase);
};
test("both world bosses have deterministic warning-first scripted encounters",()=>{
 for(const kind of ["cinderclaw","mole-king"]){
   const s=createBossEncounter(kind),conf=getBossConfig(kind);
   assert.equal(s.health,conf.maxHealth);
   assert.equal(s.phase,"warning");
   assert.equal(s.attack,conf.attacks[0].id);
   assert.equal(s.events.filter(e=>e.type==="boss-warning").length,1);
   assert.equal(bossPresentation(s).activeHazard,null);
   assert.throws(()=>createBossEncounter("unsupported"),RangeError);
 }
});
test("the Cinderclaw fireball has a visible warning, attack and recovery",()=>{
 const s=createBossEncounter("cinderclaw");
 advanceBossEncounter(s,1.14);
 assert.equal(s.phase,"warning");
 assert.equal(s.health,3);
 advanceBossEncounter(s,.02);
 assert.equal(s.phase,"active");
 assert.equal(s.events.filter(e=>e.type==="boss-attack").length,1);
 assert.equal(bossPresentation(s).activeHazard,"projectile");
 advanceBossEncounter(s,.55);
 assert.equal(s.phase,"recovery");
 assert.equal(bossPresentation(s).vulnerable,true);
 assert.ok(s.events.some(e=>e.type==="boss-vulnerable"));
});
test("Turbo only damages a boss in reach and during the one recovery opening",()=>{
 const s=createBossEncounter("mole-king");
 assert.equal(hitBossDuringRecovery(s,{turbo:true,inRange:true}),false);
 advanceTo(s,"active");
 assert.equal(hitBossDuringRecovery(s,{turbo:true,inRange:true}),false);
 advanceTo(s,"recovery");
 assert.equal(bossCanTakeHit(s,{turbo:true,inRange:false}),false);
 assert.equal(hitBossDuringRecovery(s,{turbo:false,inRange:true}),false);
 assert.equal(hitBossDuringRecovery(s,{turbo:true,inRange:true}),true);
 assert.equal(s.health,3);
 assert.equal(hitBossDuringRecovery(s,{turbo:true,inRange:true}),false);
 assert.equal(s.stats.successfulHits,1);
});
test("Cinderclaw alternates a projectile fireball and burrowing warning",()=>{
 const s=createBossEncounter("cinderclaw");
 advanceTo(s,"recovery");
 advanceTo(s,"warning");
 assert.equal(s.phase,"warning");
 assert.equal(s.attack,"burrow");
 assert.ok(s.events.some(e=>e.type==="boss-warning"&&e.text.includes("FLOOR")));
 advanceTo(s,"active");
 assert.equal(bossPresentation(s).activeHazard,"ground");
});
test("successful exposed hits eventually defeat a boss exactly once",()=>{
 const s=createBossEncounter("cinderclaw");
 for(let i=0;i<3;i++){
   advanceTo(s,"recovery");
   assert.equal(hitBossDuringRecovery(s,{turbo:true,inRange:true}),true);
   assert.equal(s.health,2-i);
   if(i<2){
     advanceTo(s,"warning");
     advanceTo(s,"active");
   }
 }
 assert.equal(s.phase,"defeated");
 assert.ok(s.events.some(e=>e.type==="boss-defeated"&&e.reward===1750));
 advanceBossEncounter(s,.8);
 assert.deepEqual(s.events,[]);
 assert.equal(hitBossDuringRecovery(s,{turbo:true,inRange:true}),false);
});
test("large frame ticks cannot skip all telegraphs, NaN dt never changes state",()=>{
 const s=createBossEncounter("mole-king");
 advanceBossEncounter(s,Number.NaN);
 assert.equal(s.phase,"warning");
 advanceBossEncounter(s,100);
 assert.equal(s.phase,"active");
 assert.equal(s.cycle,0);
});


test("Copperjack has three health bars and pain timing is triggered only by successful strikes",()=>{
 const b=createBossEncounter("copperjack");
 assert.equal(b.health,3);
 assert.equal(b.maxHealth,3);
 assert.equal(b.hitFlash,0);
 advanceTo(b,"recovery");
 assert.equal(b.hitFlash,0);
 assert.equal(hitBossDuringRecovery(b,{turbo:false,inRange:true}),false);
 assert.equal(b.hitFlash,0);
 assert.equal(hitBossDuringRecovery(b,{turbo:true,inRange:true}),true);
 assert.equal(b.hitFlash,.65);
 advanceBossEncounter(b,.7);
 assert.equal(b.hitFlash,0);
 assert.equal(b.hitThisRecovery,true);
});
