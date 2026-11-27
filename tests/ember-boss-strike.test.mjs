import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {newRun,updateRun,triggerTurbo,DRILL_TIP_VERTICAL_OFFSET,tunnelCenter,tunnelRadius} from "../src/emberDrillEngine.js";
import {BOSS_INTRO_TIME,BOSS_STRIKE_VERTICAL_WINDOW,BOSS_TIME_SECONDS,BOSS_TURBO_SECONDS,expeditionBossKind,startExpeditionBoss} from "../src/emberExpeditionBossStage.js";
import {bossSecondsUntilVulnerable,getBossConfig} from "../src/emberBossEncounter.js";
import {expeditionBossFrame} from "../src/emberExpeditionBossPainter.js";
import {excavationNotice} from "../src/emberBreakableFeedback.js";

// Same boss-entry helper as the other ember tests: a clean run into the
// arena, without requiring the player to repeat the tunnel gauntlet.
function intoBoss(index){
  const s=newRun(1467,index);
  s.objects=[];s.breakables=[];s.crystalShutters=[];s.worldHazards=[];
  s.formationHits=[];
  s.hitCooldown=100;
  for(let i=0;i<720&&s.running&&!s.boss;i++){
    s.y=402;s.pitch=0;
    updateRun(s,.045);
  }
  assert.ok(s.boss,"boss did not spawn after its introduction");
  assert.ok(s.time>=BOSS_INTRO_TIME);
  return s;
}
function intoBossWithHull(index,hull){
  const s=newRun(1467,index);
  s.objects=[];s.breakables=[];s.crystalShutters=[];s.worldHazards=[];
  s.formationHits=[];
  s.hitCooldown=100;
  s.hull=hull;s.damageTaken=5-hull;
  for(let i=0;i<720&&s.running&&!s.boss;i++){
    s.y=402;s.pitch=0;
    updateRun(s,.045);
  }
  assert.ok(s.boss,"boss did not spawn");
  return s;
}
// Wait for a recovery window, fire one Turbo with the auger offset from the
// guardian by `offset` px vertically, and report the boss health change.
// Charge is set explicitly as the earned precondition, as in the other hit tests.
function strikeOnce(s,{offset=0}={}){
  for(let i=0;i<200&&s.running;i++){
    if(s.boss.phase==="recovery"&&!s.boss.hitThisRecovery)break;
    s.y=s.bossY-DRILL_TIP_VERTICAL_OFFSET;s.pitch=0;
    updateRun(s,.045);
  }
  assert.equal(s.boss.phase,"recovery","no recovery window arrived");
  s.charge=100;
  s.y=s.bossY-DRILL_TIP_VERTICAL_OFFSET+offset;s.pitch=0;
  // Round 4: the strike lands at click time (triggerTurbo), not on a later
  // frame, so capture the health before firing.
  const before=s.boss.health;
  triggerTurbo(s);
  assert.ok(s.boostTime>0,"turbo did not fire");
  for(let i=0;i<20&&s.running;i++)updateRun(s,.045);
  return {before,after:s.boss.health};
}

test("strike window is 160px vertically, not the old 112px",()=>{
  assert.equal(BOSS_STRIKE_VERTICAL_WINDOW,160);
});

test("a Turbo strike lands when the auger is aligned with the guardian",()=>{
  const s=intoBoss(2);
  const {before,after}=strikeOnce(s,{offset:0});
  assert.equal(after,before-1,"an aligned strike must damage the boss");
});

test("aim assist pulls a roughly-aligned strike onto the guardian",()=>{
  // 250px off is far outside the 160px window, but the 0.72s boost steers
  // the auger toward the guardian fast enough to close the gap.
  const s=intoBoss(2);
  const {before,after}=strikeOnce(s,{offset:250});
  assert.equal(after,before-1,"a strike fired 250px off must still land via auto-aim");
});

test("a strike fired far from the guardian still misses",()=>{
  // 400px is beyond the assist's 300px engagement gate and beyond what
  // the 160px window can catch, so a wildly misaligned strike must miss.
  const s=intoBoss(2);
  const {before,after}=strikeOnce(s,{offset:400});
  assert.equal(after,before,"a strike fired 400px off must miss");
});

test("boss entry patches one hull, capped at five, and flags it",()=>{
  const hurt=intoBossWithHull(2,3);
  assert.equal(hurt.hull,4,"arrival at the arena must restore one hull");
  assert.ok(hurt.events.some(e=>e.type==="boss-spawn"&&e.patched===true),
    "the spawn event must flag the patch so the notice can say so");
  const full=intoBossWithHull(2,5);
  assert.equal(full.hull,5,"a full hull must not overfill");
  assert.ok(!full.events.some(e=>e.type==="boss-spawn"&&e.patched===true),
    "no patch flag when nothing was restored");
  // Since the 2026-11-25 text diet the spawn notice is title-only:
  // the patch shows in the hull pips, not in a sentence.
  const cue=excavationNotice({type:"boss-spawn",boss:"copperjack",patched:true});
  assert.equal(cue.detail,undefined);
});

test("opening wall grace: no hull loss in the first 3s outside the corridor",()=>{
  const s=newRun(1467,0);
  s.objects=[];s.breakables=[];s.crystalShutters=[];s.worldHazards=[];
  s.formationHits=[];
  // Park the drill hard against the floor from t=0. Without the grace this
  // costs hull on the very first step; with it, nothing for 3s.
  for(let i=0;i<60;i++){
    s.y=755;s.pitch=0;
    updateRun(s,.045);
  }
  assert.equal(s.hull,5,"wall must not damage during the 3s settle-in");
  // After the grace, the same position costs hull again: find a scroll where
  // the parked drill is definitely outside the corridor and step once.
  let sc=s.scroll;
  while(Math.abs(755-tunnelCenter(sc+210))<=tunnelRadius(sc+210)-43)sc+=10;
  s.scroll=sc;s.time=5;s.y=755;s.pitch=0;s.hitCooldown=0;
  updateRun(s,.045);
  assert.ok(s.hull<5,"wall must damage again once the grace expires");
});

// Fix round 4: a Turbo fired while the boss is vulnerable and the drill is
// aligned must always deal damage, and a Turbo fired while the next
// vulnerable window is out of reach must be refused with the charge kept —
// never silently drained.
function align(s){
  s.y=s.bossY-DRILL_TIP_VERTICAL_OFFSET;s.pitch=0;
}
function driveTo(s,phase,frac){
  const b=s.boss;
  const cfg=getBossConfig(b.kind);
  let guard=0;
  while(s.running&&guard++<600){
    align(s);
    updateRun(s,.045);
    if(b.phase===phase){
      const a=cfg.attacks[b.cycle%cfg.attacks.length];
      const dur=phase==="warning"?a.warning:phase==="active"?a.active:a.recovery;
      if(b.elapsed>=dur*frac)return true;
    }
  }
  return false;
}

test("aligned Turbo during vulnerability deals exactly one damage",()=>{
  const s=intoBoss(2);
  assert.ok(driveTo(s,"recovery",0),"could not reach recovery");
  const b=s.boss;
  const healthBefore=b.health;
  s.charge=100;s.boostTime=0;
  align(s);
  assert.equal(triggerTurbo(s),true,"strike must fire");
  assert.equal(b.health,healthBefore-1,"exactly one damage");
  assert.equal(s.charge,0,"the strike is consumed because it dealt damage");
  // One hit per recovery: a second aligned Turbo in the same recovery
  // cannot double-dip.
  assert.equal(b.hitThisRecovery,true);
});

test("Turbo fired early in the warning is refused with charge kept",()=>{
  const s=intoBoss(2);
  assert.ok(driveTo(s,"warning",0),"could not reach warning");
  const b=s.boss;
  assert.ok(bossSecondsUntilVulnerable(b)>BOSS_TURBO_SECONDS-0.12,
    "test setup: next window must be out of reach (untilVuln "+bossSecondsUntilVulnerable(b).toFixed(2)+"s)");
  const healthBefore=b.health;
  s.charge=100;s.boostTime=0;
  align(s);
  assert.equal(triggerTurbo(s),false,"early strike must be refused");
  assert.equal(s.charge,100,"charge is kept, not drained");
  assert.equal(b.health,healthBefore,"no damage from a refused strike");
  assert.equal(s.boostTime,0,"no boost is spent");
  // The refusal is announced, not swallowed.
  const cue=excavationNotice({type:"boss-strike-early"});
  assert.match(cue.title,/TOO EARLY/);
});

test("Turbo fired in the last frame of recovery still hits (click-time strike)",()=>{
  const s=intoBoss(2);
  // 97% through recovery: the window lapses before the next updateRun,
  // so only the click-time hit in triggerTurbo can land it.
  assert.ok(driveTo(s,"recovery",0.97),"could not reach late recovery");
  const b=s.boss;
  const healthBefore=b.health;
  s.charge=100;s.boostTime=0;
  align(s);
  assert.equal(triggerTurbo(s),true,"strike must fire");
  assert.equal(b.health,healthBefore-1,"click-time hit lands even at 97% through recovery");
});

test("a strike that cannot reach the window is refused even at 0.70s out",()=>{
  const s=intoBoss(2);
  // Warning 96% (gear-sweep warning is now 1.40s): ~0.71s to the next
  // recovery, inside the 0.72s boost on paper — but the boost is
  // evaluated in 0.045s substeps, so the recovery opens in the last
  // 0.02s of the boost and the hit check never runs while both are
  // true (measured: allowed-but-missed before the fix).
  assert.ok(driveTo(s,"warning",0.96),"could not reach late warning");
  const b=s.boss;
  const untilVuln=bossSecondsUntilVulnerable(b);
  assert.ok(untilVuln>0.60&&untilVuln<=0.72,"test setup: untilVuln "+untilVuln.toFixed(2)+"s");
  s.charge=100;s.boostTime=0;
  align(s);
  assert.equal(triggerTurbo(s),false,"strike 0.70s out must be refused");
  assert.equal(s.charge,100,"charge is kept");
});

test("the intended loop defeats every boss inside its clock with margin",()=>{
  // Steer to the guardian, collect its rewards, strike when vulnerable.
  // Measured (seed 1467, perfect steering): Copperjack 14.3s/35s,
  // Cinderclaw 19.2s/45s, Mole King 16.1s/55s — all under 45% of their
  // clocks. The bound is 60% so a 2x recharge slowdown still fails.
  for(const [index,clock] of [[2,55],[3,55],[4,55]]){
    const s=intoBoss(index);
    const kind=expeditionBossKind(index);
    assert.equal(BOSS_TIME_SECONDS[kind],clock,kind+" clock");
    const t0=s.time;
    let strikes=0,guard=0;
    while(s.running&&!s.bossDefeated&&guard++<Math.ceil((clock+5)/0.045)){
      const b=s.boss;
      const dy=(s.bossY??s.y)-s.y;
      s.y+=Math.max(-14,Math.min(14,dy));
      s.pitch=0;
      if(b&&b.phase==="recovery"&&!b.hitThisRecovery&&s.charge>=100&&s.boostTime<=0){
        if(triggerTurbo(s))strikes++;
      }
      updateRun(s,.045);
    }
    const fightTime=s.time-t0;
    assert.equal(s.bossDefeated,true,kind+" must be defeated by the intended loop");
    assert.ok(fightTime<clock*0.6,kind+" fight took "+fightTime.toFixed(1)+"s of "+clock+"s");
    assert.equal(strikes,s.boss.maxHealth,kind+" needs exactly its HP in strikes");
  }
});

test("pain pose shows for the full 0.65s after a hit, across the phase change",()=>{
  const s=intoBoss(2);
  // Strike at 97% through recovery (Copperjack gear-sweep recovery is
  // 1.4s): the recovery ends ~0.04s after the hit, so the phase changes
  // to warning while the 0.65s pain window is still open. A hit does not
  // change the phase itself — it stays "recovery" until the duration
  // elapses — so the old code, which only returned the pain frame inside
  // the recovery branch, cut the pose off the instant the phase changed.
  assert.ok(driveTo(s,"recovery",0.97),"could not reach late recovery");
  const b=s.boss;
  s.charge=100;s.boostTime=0;
  align(s);
  assert.equal(triggerTurbo(s),true);
  assert.equal(b.phase,"recovery","a hit does not change the phase");
  assert.equal(expeditionBossFrame(b),9,"Copperjack pain frame");
  // 0.1s later the recovery has elapsed and the phase is warning, but the
  // pain pose must still show (only 0.1s of the 0.65s window has passed).
  for(let i=0;i<3;i++)updateRun(s,.045);
  assert.equal(b.phase,"warning");
  assert.equal(expeditionBossFrame(b),9,"pain pose persists across the phase change");
  // Past 0.65s since the hit it returns to the attack stance.
  for(let i=0;i<13;i++)updateRun(s,.045);
  assert.notEqual(expeditionBossFrame(b),9,"pain pose ends after 0.65s");
});

test("boss clocks are Mole King difficulty for all three (55s)",()=>{
  assert.deepEqual(BOSS_TIME_SECONDS,{copperjack:55,cinderclaw:55,"mole-king":55});
  for(const [index,seconds] of [[2,55],[3,55],[4,55]]){
    const s=newRun(1467,index);
    assert.equal(startExpeditionBoss(s,tunnelCenter),true);
    assert.equal(s.bossTimeLeft,seconds,expeditionBossKind(index)+" clock");
  }
});

test("Tunnel Space ignites Turbo and never scrolls while the game is on screen",()=>{
  const jsx=readFileSync(new URL("../src/EmberTunnelDrill.jsx",import.meta.url),"utf8");
  // The old handler returned before preventDefault whenever the mode was
  // not "running", so a Space press at the edge of a run scrolled the page
  // to Cosmic Odyssey instead of igniting Turbo. The handler now scopes
  // Space/arrows to the Tunnel stage (or the page's focused game with
  // focus on the page body) for running AND paused, and interactive
  // elements keep their own keys.
  assert.ok(jsx.includes('stage.current&&target&&stage.current.contains(target)'));
  assert.ok(jsx.includes('dataset.focusedGame==="tunnel"'));
  assert.ok(jsx.includes('modeRef.current==="paused"&&key===" "&&e.type==="keydown"&&!e.repeat'));
  assert.ok(jsx.includes('closest("button,input,select,textarea,a,[contenteditable]")'));
  // The too-early refusal is announced from turbo(), not swallowed.
  assert.ok(jsx.includes('cueType="boss-strike-early"'));
  assert.ok(jsx.includes('excavationNotice({type:cueType},s.charge)'));
  assert.ok(jsx.includes('bossHealthBefore'));
});
