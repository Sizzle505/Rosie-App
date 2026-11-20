import assert from "node:assert/strict";
import {test} from "node:test";
import {newRun,updateRun,triggerTurbo,DRILL_TIP_VERTICAL_OFFSET} from "../src/emberDrillEngine.js";
import {BOSS_INTRO_TIME,expeditionBossKind,bossAttackDanger} from "../src/emberExpeditionBossStage.js";
import {excavationNotice} from "../src/emberBreakableFeedback.js";

function intoBoss(index){
  const s=newRun(1467,index);
  // The separate boss mechanics should be testable without requiring the
  // player to repeat the tunnel gauntlet, while preserving actual stage physics.
  s.objects=[];s.breakables=[];s.crystalShutters=[];s.worldHazards=[];
  s.formationHits=[];
  s.hitCooldown=100;
  for(let i=0;i<230&&s.running&&!s.boss;i++){
    s.y=402;s.pitch=0;
    updateRun(s,.045);
  }
  assert.ok(s.boss,"boss did not spawn after its introduction");
  assert.ok(s.time>=BOSS_INTRO_TIME);
  assert.equal(s.charge,100);
  return s;
}
test("three advanced worlds have bosses; Classic remains unchanged",()=>{
  assert.equal(expeditionBossKind(null),null);
  assert.equal(expeditionBossKind(2),"copperjack");
  assert.equal(expeditionBossKind(3),"cinderclaw");
  assert.equal(expeditionBossKind(4),"mole-king");
  assert.equal(newRun().boss,null);
  assert.equal(newRun().duration,75);
});
test("each boss begins with an explicit warning and freezes world movement",()=>{
  for(const index of [2,3,4]){
    const s=intoBoss(index);
    const scroll=s.scroll;
    assert.ok(s.events.some(e=>e.type==="boss-spawn"));
    assert.ok(s.events.some(e=>e.type==="boss-warning"));
    for(let i=0;i<15;i++)updateRun(s,.045);
    assert.equal(s.scroll,scroll,"boss encounter should not scroll the cave");
    assert.equal(s.boss.health,s.boss.maxHealth);
  }
});
test("danger zones correspond to warned attacks, not the entire screen",()=>{
  for(const attack of ["gear-sweep","spark-bolt","fireball","burrow","quake","earth-burst"]){
    const b={phase:"active",attack};
    assert.equal(bossAttackDanger({...b,phase:"warning"},402,402),false);
  }
  assert.equal(bossAttackDanger({phase:"active",attack:"gear-sweep"},450,402),true);
  assert.equal(bossAttackDanger({phase:"active",attack:"gear-sweep"},330,402),false);
  assert.equal(bossAttackDanger({phase:"active",attack:"spark-bolt"},402,402),true);
  assert.equal(bossAttackDanger({phase:"active",attack:"spark-bolt"},250,402),false);
  assert.equal(bossAttackDanger({phase:"active",attack:"fireball"},402,402),true);
  assert.equal(bossAttackDanger({phase:"active",attack:"fireball"},210,402),false);
  assert.equal(bossAttackDanger({phase:"active",attack:"burrow"},480,402),true);
  assert.equal(bossAttackDanger({phase:"active",attack:"burrow"},300,402),false);
  assert.equal(bossAttackDanger({phase:"active",attack:"quake"},450,402),true);
  assert.equal(bossAttackDanger({phase:"active",attack:"quake"},325,402),false);
  assert.equal(bossAttackDanger({phase:"active",attack:"earth-burst"},300,402),true);
  assert.equal(bossAttackDanger({phase:"active",attack:"earth-burst"},460,402),false);
});
test("Copperjack requires two separate openings and awards 1400 points",()=>{
  const s=intoBoss(2);
  const initial=s.score;
  for(let i=0;i<650&&s.running;i++){
    s.y=s.bossY-DRILL_TIP_VERTICAL_OFFSET;s.pitch=0;
    if(s.boss.phase==="recovery"&&!s.boss.hitThisRecovery&&s.boostTime<=0&&s.charge>=100)
      triggerTurbo(s);
    updateRun(s,.045);
  }
  assert.equal(s.boss.stats.successfulHits,2);
  assert.equal(s.bossDefeated,true);
  assert.equal(s.result,"complete");
  assert.ok(s.score>=initial+1400);
});
test("Cinderclaw accepts exactly one Turbo strike per recovery, then can be defeated",()=>{
  const s=intoBoss(3);
  const startingScore=s.score;
  let previousHealth=s.boss.health;
  let strikes=0;
  for(let i=0;i<760&&s.running;i++){
    // Hold a direct line toward the illustrated boss and press Turbo only on
    // opening frames. Ordinary drill movement is insufficient for a hit.
    s.y=s.bossY-DRILL_TIP_VERTICAL_OFFSET;s.pitch=0;
    if(s.boss.phase==="recovery"&&!s.boss.hitThisRecovery&&s.boostTime===0&&s.charge>=100)
      triggerTurbo(s);
    updateRun(s,.045);
    if(s.boss.health<previousHealth){
      assert.equal(previousHealth-s.boss.health,1);
      previousHealth=s.boss.health;strikes++;
    }
  }
  assert.equal(strikes,3);
  assert.equal(s.bossDefeated,true);
  assert.equal(s.result,"complete");
  assert.ok(s.score>=startingScore+1750);
  assert.equal(s.boss.health,0);
  assert.equal(s.running,false);
});
test("Mole King requires four distinct recovery hits and grants royal reward",()=>{
  const s=intoBoss(4);
  const initialScore=s.score;
  for(let i=0;i<840&&s.running;i++){
    s.y=s.bossY-DRILL_TIP_VERTICAL_OFFSET;s.pitch=0;
    if(s.boss.phase==="recovery"&&!s.boss.hitThisRecovery&&s.boostTime<=0&&s.charge>=100)
      triggerTurbo(s);
    updateRun(s,.045);
  }
  assert.equal(s.boss.stats.successfulHits,4);
  assert.equal(s.bossDefeated,true);
  assert.equal(s.result,"complete");
  assert.ok(s.score>=initialScore+2600);
});
test("running out of time without defeating the boss never grants a victory",()=>{
  const s=intoBoss(4);
  s.boostTime=0;s.charge=0;s.hitCooldown=100;
  for(let i=0;i<1100&&s.running;i++){
    s.y=s.bossY-DRILL_TIP_VERTICAL_OFFSET;s.pitch=0;
    updateRun(s,.045);
  }
  assert.equal(s.result,"boss-timeout");
  assert.equal(s.bossDefeated,false);
  assert.equal(s.score<2600,true);
});
test("boss recovery text explains how to strike",()=>{
 const n=excavationNotice({type:"boss-vulnerable"});
 assert.match(n.detail,/Turbo/i);
 assert.match(excavationNotice({type:"boss-victory",boss:"mole-king",points:2600}).detail,/2600/);
});
