import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {newRun,updateRun,tunnelCenter,DRILL_ANCHOR,DRILL_TIP_VERTICAL_OFFSET} from "../src/emberDrillEngine.js";
import {BOSS_INTRO_TIME,BOSS_TIME_SECONDS,expeditionBossKind,startExpeditionBoss} from "../src/emberExpeditionBossStage.js";
import {excavationNotice} from "../src/emberBreakableFeedback.js";
import {openingGraceSeconds} from "../src/emberExpeditionStages.js";

// Boss-fairness fixes (fix round 3): a dedicated boss clock, a survivable
// opening, a visible hull-patch notice, an honest Turbo banner, and an aim
// guide that reads on every arena. Engine behaviour is tested live;
// JSX/CSS behaviour is pinned by source assertions, as in the cosmic tests.

function intoBoss(index){
  const s=newRun(1467,index);
  // The separate boss mechanics should be testable without requiring the
  // player to repeat the tunnel gauntlet, while preserving actual stage physics.
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

test("each boss starts with its own fight clock",()=>{
  // Round 4 lengthened clocks from 30/40/45 to 35/45/55; the
  // 2026-11-25 feedback round equalized all three at the Mole King's
  // 55s (Mitchell: every boss as difficult as the Mole King), with
  // health 4/4/4 and Mole King attack pacing in BOSS_CONFIG.
  assert.deepEqual(BOSS_TIME_SECONDS,{copperjack:55,cinderclaw:55,"mole-king":55});
  for(const [index,seconds] of [[2,55],[3,55],[4,55]]){
    const s=newRun(1467,index);
    assert.equal(startExpeditionBoss(s,tunnelCenter),true);
    assert.equal(s.bossTimeLeft,seconds,expeditionBossKind(index)+" clock");
  }
});

test("a boss fight outlives the route timer and ends on its own clock",()=>{
  const s=intoBoss(2); // Copperjack: route 30s, boss clock 35s
  s.boostTime=0;s.charge=0;s.hitCooldown=100;
  // The old shared timer ended the run at route-time 30s (21.5s of fight).
  // The fight must still be running there.
  for(let i=0;i<600&&s.running;i++){
    s.y=s.bossY-DRILL_TIP_VERTICAL_OFFSET;s.pitch=0;
    updateRun(s,.045);
    if(s.time>=30)break;
  }
  assert.equal(s.running,true,"fight continues past the old route deadline");
  assert.equal(s.result,null);
  // ...and it ends only when the boss clock runs out.
  let guard=0;
  while(s.running&&guard++<1500){
    s.y=s.bossY-DRILL_TIP_VERTICAL_OFFSET;s.pitch=0;
    updateRun(s,.045);
  }
  assert.equal(s.result,"boss-timeout");
  assert.equal(s.bossDefeated,false);
});

test("boss clock is shown as its own HUD chip",()=>{
  const jsx=readFileSync(new URL("../src/EmberTunnelDrill.jsx",import.meta.url),"utf8");
  assert.ok(jsx.includes("timeLeft:s.bossTimeLeft??null"));
  assert.ok(jsx.includes("<small>BOSS TIME</small>"));
});

function openingRun(index,seconds){
  const s=newRun(1467,index);
  const steps=Math.ceil(seconds/0.045);
  for(let i=0;i<steps&&s.running;i++){
    // Hold the tip on the route centre (minimal steering, as a new player would).
    s.y=tunnelCenter(s.scroll+DRILL_ANCHOR)-DRILL_TIP_VERTICAL_OFFSET;
    s.pitch=0;
    updateRun(s,.045);
  }
  return s;
}

function openingRunUnsteered(index,seconds){
  const s=newRun(1467,index);
  const steps=Math.ceil(seconds/0.045);
  // Never touch y or pitch: the drill sits exactly where it spawns while
  // the corridor dives away underneath it, as an idle player (or a slow
  // checker) experiences it.
  for(let i=0;i<steps&&s.running;i++)updateRun(s,.045);
  return s;
}

test("boss-world openings: no damage in the first 8s, steered or unsteered",()=>{
  // Round 5: the 5s grace did not fix the opening — the unsteered Royal
  // drill still lost a hull at t=8.01, the first frame past the 8s grace,
  // with the drill at y=253 far outside the corridor (the centre line
  // dives ~270px in the first seconds while the drill spawns frozen at
  // the top of it). The grace now runs to arena entry (8.5s =
  // BOSS_INTRO_TIME). Measured (seed 1467): 0 damage in 8s for all three
  // boss worlds, centre-held and unsteered. Hull is still lost for bad
  // steering after the opening.
  assert.equal(openingGraceSeconds(2),8.5);
  assert.equal(openingGraceSeconds(4),8.5);
  assert.equal(openingGraceSeconds(0),3);
  assert.equal(openingGraceSeconds(1),3);
  for(const [index,name] of [[2,"Clockwork"],[3,"Molten"],[4,"Royal"]]){
    for(const [mode,run] of [["centre-held",openingRun(index,8)],["unsteered",openingRunUnsteered(index,8)]]){
      assert.equal(run.damageTaken,0,name+" "+mode+" opening must not hurt in the first 8s");
      assert.equal(run.hull,5,name+" "+mode+" hull after 8s");
    }
  }
});

test("arena-entry hull patch notice is not clobbered by the first warning",()=>{
  const jsx=readFileSync(new URL("../src/EmberTunnelDrill.jsx",import.meta.url),"utf8");
  // The spawn and first-warning cues arrive in one batch; the loop must hold
  // the spawn notice for its duration.
  assert.ok(jsx.includes('noticeRef.current?.eventType==="boss-spawn"'));
  assert.ok(jsx.includes('event.type==="boss-warning"&&spawnShowing'));
  assert.ok(jsx.includes("eventType:event.type"));
  // The patch itself still fires (the spawn event flags it); since the
  // 2026-11-25 text diet the notice is title-only — the hull pips in
  // the HUD show the restored hull, no sentence is printed.
  const cue=excavationNotice({type:"boss-spawn",boss:"copperjack",patched:true});
  assert.match(cue.title,/COPPERJACK/);
  assert.equal(cue.detail,undefined);
});

test("aim guide draws the same way in every boss arena",()=>{
  const painter=readFileSync(new URL("../src/emberExpeditionBossPainter.js",import.meta.url),"utf8");
  // Dark under-stroke + bright gold line, so it reads on Clockwork's brass
  // arena as well as Molten's dark one.
  assert.ok(painter.includes('c.strokeStyle="rgba(20,12,8,.65)"'));
  assert.ok(painter.includes('c.strokeStyle="rgba(255,224,161,.9)"'));
  assert.ok(painter.includes('c.fillText("VULNERABLE - TURBO STRIKE"'));
  // No per-boss branch in the guide itself: it is inside if(p.vulnerable),
  // which is kind-independent.
  const start=painter.indexOf("// Aim guide:");
  assert.ok(start>=0);
  const end=painter.indexOf('c.fillText("VULNERABLE - TURBO STRIKE"',start);
  const guide=painter.slice(start,end);
  assert.equal(guide.includes("boss.kind"),false);
  assert.equal(guide.includes("copperjack"),false);
  assert.equal(guide.includes("cinderclaw"),false);
  assert.equal(guide.includes("mole-king"),false);
});

test("report footer shows the stored expedition total, not this run only",()=>{
  const jsx=readFileSync(new URL("../src/EmberTunnelDrill.jsx",import.meta.url),"utf8");
  assert.ok(jsx.includes("expeditionTotalStars=EXPEDITION_STAGES.reduce"));
  assert.ok(jsx.includes("EXPEDITION TOTAL: {expeditionTotalStars} OF 15 STARS"));
  assert.ok(jsx.includes("EXPEDITION {expeditionTotalStars}/15"));
});

test("ended report fits the desktop stage: medals and replay above the fold",()=>{
  const css=readFileSync(new URL("../src/ember-tunnel-drill.css",import.meta.url),"utf8");
  const jsx=readFileSync(new URL("../src/EmberTunnelDrill.jsx",import.meta.url),"utf8");
  // Taller stage (the canvas is 820 logical units) + ended compaction at
  // every width, not only phones.
  assert.ok(css.includes("height:clamp(470px,73vw,820px)"));
  assert.ok(css.includes(".ember-start-overlay.is-ended .ember-victory-art{max-height:140px"));
  assert.ok(css.includes(".ember-start-overlay.is-ended .ember-results{grid-template-columns:repeat(4,minmax(0,1fr))"));
  // Order in the ended overlay: results, medals, replay, picker — the
  // star criteria and REPLAY sit above the fold, the picker last.
  const resultsAt=jsx.indexOf('className="ember-results"');
  const medalsAt=jsx.indexOf('className="ember-expedition-medals"');
  const replayAt=jsx.indexOf("REPLAY THIS WORLD");
  const pickAt=jsx.indexOf('className="ember-expedition-pick"');
  assert.ok(resultsAt>=0&&medalsAt>resultsAt&&replayAt>medalsAt&&pickAt>replayAt);
  // The film button leaves the ended report (it stays on the start overlay).
  assert.ok(jsx.includes('{mode!=="ended"&&<button type="button" className="ember-watch-opening"'));
});

test("ended report: WORLD MISSION and boss status spans do not overlap (tidy round)",()=>{
  const css=readFileSync(new URL("../src/ember-tunnel-drill.css",import.meta.url),"utf8");
  const jsx=readFileSync(new URL("../src/EmberTunnelDrill.jsx",import.meta.url),"utf8");
  // Round-6 verification saw "COMPLETE" and "DEFEATED" overlap on one line
  // (DOM read "COMPLETEDEFEATED"). Root cause: the ended grid is 4 columns
  // across max-width 330px with 5px gaps, so a single cell is ~79px — but
  // the status words are 15px bold single words with no wrapping point.
  // Measured with the widest likely fallback serif (DejaVu Serif Bold 15px):
  // COMPLETE 97px, DEFEATED 93px — both overflow a 79px cell into the next.
  // The two status spans now take two columns each (~163px), which fits
  // every status word (longest: UNSCATHED 110px) with room to spare.
  assert.ok(jsx.includes('<span className="ember-result-wide"><b>{hud.worldObjective?"COMPLETE":"MISSED"}</b> WORLD MISSION</span>'));
  assert.ok(jsx.includes('<span className="ember-result-wide"><b>{hud.bossDefeated?"DEFEATED":"UNDEFEATED"}</b>'));
  assert.ok(css.includes(".ember-start-overlay.is-ended .ember-results .ember-result-wide{grid-column:span 2}"));
  const singleCell=(330-3*5)/4, wideCell=2*singleCell+5;
  assert.ok(singleCell<98,"single cell unexpectedly wide: "+singleCell);
  assert.ok(wideCell>110,"wide cell too narrow for UNSCATHED: "+wideCell);
});
