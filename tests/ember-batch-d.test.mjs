import assert from "node:assert/strict";
import fs from "node:fs";
import {test} from "node:test";
import {
  BATCH_D_ROOT,EMBER_BATCH_D_ATLASES,EMBER_BATCH_D_ARENAS,EMBER_BATCH_D_RIBBONS,
  EMBER_BATCH_D_GATES,EMBER_BATCH_D_MECHANISMS,EMBER_BATCH_D_PICKUP_BY_STAGE,
  EMBER_BATCH_D_ROCK_BY_STAGE,EMBER_BATCH_D_SPIKE_BY_STAGE,
  atlasFrameRect,batchDFrameAt,batchDFileUrl
} from "../src/emberExpansionCatalog.js";
import {
  createBossEncounter,getBossConfig,advanceBossEncounter,
  hitBossDuringRecovery,bossPresentation
} from "../src/emberBossEncounter.js";
import {
  BOSS_INTRO_TIME,expeditionBossKind,bossDangerLane,bossSafeLane,
  spillBossRewards,updateBossRewards,bossMechanismState,startExpeditionBoss,
  BOSS_REWARD_COUNT,BOSS_REWARD_CHARGE
} from "../src/emberExpeditionBossStage.js";
import {attackVfxFrame} from "../src/emberBossAttackVfx.js";
import {expeditionBossFrame} from "../src/emberExpeditionBossPainter.js";
import {newRun,updateRun,triggerTurbo,DRILL_ANCHOR,DRILL_TIP_VERTICAL_OFFSET,tunnelCenter} from "../src/emberDrillEngine.js";
import {EXPEDITION_STAGES,EXPEDITION_STAGE_SECONDS} from "../src/emberExpeditionStages.js";

const batchDFile=(relative)=>{
  const bytes=fs.readFileSync("public/ember-drill/expansion-batch-d/"+relative);
  assert.ok(bytes.length>1000,relative+" appears truncated");
  assert.equal(bytes.toString("ascii",0,4),"RIFF",relative);
  assert.equal(bytes.toString("ascii",8,12),"WEBP",relative);
  return bytes;
};
const advanceTo=(b,phase)=>{
  for(let i=0;i<600;i++){
    if(b.phase===phase)return;
    advanceBossEncounter(b,.045);
  }
  throw new Error("Did not reach boss phase "+phase);
};
// Same boss-entry helper as ember-expedition-boss-stage.test.mjs, but the
// earned-Turbo design means charge is NOT refilled at the boss.
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

test("batch-D attack atlases carry phase frames, flip and recovery window",()=>{
  assert.equal(BATCH_D_ROOT,"/ember-drill/expansion-batch-d/");
  const attacks=["gear-sweep","spark-bolt","fireball","burrow","quake","earth-burst"];
  for(const id of attacks){
    const a=EMBER_BATCH_D_ATLASES[id];
    assert.ok(a,id+" missing from the batch-D registry");
    assert.equal(a.columns,4);assert.equal(a.rows,2);
    assert.equal(a.cell,384);assert.equal(a.frames,8);
    assert.deepEqual(a.phaseFrames.warning,[0,1,2]);
    assert.deepEqual(a.phaseFrames.active,[3,4,5]);
    assert.deepEqual(a.phaseFrames.recovery,[6,7]);
    assert.equal(a.recoveryVisualSeconds,0.35);
    assert.equal(a.flipX,id==="spark-bolt"||id==="fireball");
    assert.equal(batchDFileUrl(a.file),BATCH_D_ROOT+a.file);
    batchDFile(a.file);
    assert.deepEqual(atlasFrameRect(id,0),{sx:0,sy:0,sw:384,sh:384});
    assert.deepEqual(atlasFrameRect(id,7),{sx:1152,sy:384,sw:384,sh:384});
  }
});

test("batch-D combat-effect atlases carry frame times and display sizes",()=>{
  const effects={
    "treasure-absorb":{ms:65,size:144,loop:false},
    "turbo-ready":{ms:90,size:230,loop:true},
    "turbo-exhaust":{ms:65,size:300,loop:true},
    "drill-impact":{ms:35,size:185,loop:false},
    "treasure-spill":{ms:50,size:180,loop:false},
    "defeat-copperjack":{ms:75,size:290,loop:false},
    "defeat-cinderclaw":{ms:75,size:290,loop:false},
    "defeat-moleking":{ms:75,size:290,loop:false}
  };
  for(const [id,expected] of Object.entries(effects)){
    const a=EMBER_BATCH_D_ATLASES[id];
    assert.ok(a,id+" missing");
    assert.equal(a.columns,4);assert.equal(a.rows,3);
    assert.equal(a.cell,384);assert.equal(a.frames,12);
    assert.equal(a.frameDurationMs,expected.ms);
    assert.equal(a.displaySize,expected.size);
    assert.equal(a.loop,expected.loop);
    batchDFile(a.file);
  }
  // Looping effects wrap; one-shot effects hold the last frame.
  assert.equal(batchDFrameAt("turbo-ready",0),0);
  assert.equal(batchDFrameAt("turbo-ready",90),1);
  assert.equal(batchDFrameAt("turbo-ready",1080),0);
  assert.equal(batchDFrameAt("drill-impact",0),0);
  assert.equal(batchDFrameAt("drill-impact",420),11);
  assert.equal(batchDFrameAt("drill-impact",5000),11);
  assert.throws(()=>batchDFrameAt("missing",0),RangeError);
});

test("batch-D arenas are opaque 1035x1230 scenic bases, one per boss",()=>{
  for(const kind of ["copperjack","cinderclaw","mole-king"]){
    const arena=EMBER_BATCH_D_ARENAS[kind];
    assert.equal(arena.width,1035);assert.equal(arena.height,1230);
    batchDFile(arena.file);
  }
});

test("batch-D ribbons map stage indices 0-4 to the five kingdoms",()=>{
  const kingdoms=["barkroot-passage","ruby-temple","clockwork-catacombs","molten-depths","royal-treasury"];
  assert.equal(EMBER_BATCH_D_RIBBONS.length,5);
  EMBER_BATCH_D_RIBBONS.forEach((pair,index)=>{
    assert.ok(pair.ceiling.startsWith("terrain/"+kingdoms[index]+"-"),pair.ceiling);
    assert.ok(pair.floor.startsWith("terrain/"+kingdoms[index]+"-"),pair.floor);
    batchDFile(pair.ceiling);batchDFile(pair.floor);
  });
  // The batch-D Barkroot pair is a different file from the existing edge
  // pair Classic keeps; it is not a silent duplicate.
  assert.notEqual(EMBER_BATCH_D_RIBBONS[0].ceiling,"edge/barkroot-top.webp");
});

test("batch-D gates pair an entrance and exit per kingdom; openings play once",()=>{
  const expected=[
    ["46-barkroot-entrance.webp","47-barkroot-exit.webp"],
    ["48-ruby-temple-entrance.webp","49-ruby-temple-exit.webp"],
    ["51-clockwork-gateway-opening.webp","50-clockwork-gateway-closed.webp"],
    ["52-molten-depths-entrance.webp","53-molten-depths-cooled-exit.webp"],
    ["55-royal-treasury-vault-opening.webp","54-royal-treasury-vault-closed.webp"]
  ];
  assert.equal(EMBER_BATCH_D_GATES.length,5);
  EMBER_BATCH_D_GATES.forEach((gates,index)=>{
    assert.equal(gates.entrance.file.split("/").pop(),expected[index][0]);
    assert.equal(gates.exit.file.split("/").pop(),expected[index][1]);
    batchDFile(gates.entrance.file);batchDFile(gates.exit.file);
  });
  // Gate 51: 8 frames at 110ms = 880ms, then hold last. Gate 55: 12 at 100ms.
  assert.equal(batchDFrameAt("gate-clockwork-opening",0),0);
  assert.equal(batchDFrameAt("gate-clockwork-opening",879),7);
  assert.equal(batchDFrameAt("gate-clockwork-opening",5000),7);
  assert.equal(batchDFrameAt("gate-royal-treasury-opening",0),0);
  assert.equal(batchDFrameAt("gate-royal-treasury-opening",1199),11);
  assert.equal(batchDFrameAt("gate-royal-treasury-opening",5000),11);
});

test("batch-D treasure mechanisms carry closed, release and depleted states",()=>{
  const mechanisms={
    copperjack:{closed:"16-brass-dispenser-closed.webp",release:"mechanism-brass-dispenser",depleted:"18-brass-dispenser-emptied.webp",pickup:"gameplay/pickups/clockwork-cog.webp"},
    cinderclaw:{closed:"19-volcanic-deposit-intact.webp",release:"mechanism-volcanic-deposit",depleted:"21-volcanic-deposit-depleted.webp",pickup:"gameplay/pickups/ruby-treasure.webp"},
    "mole-king":{closed:"22-royal-chest-closed.webp",release:"mechanism-royal-chest",depleted:"24-royal-chest-emptied.webp",pickup:"gameplay/pickups/royal-crown.webp"}
  };
  for(const [kind,expected] of Object.entries(mechanisms)){
    const m=EMBER_BATCH_D_MECHANISMS[kind];
    assert.equal(m.closed.split("/").pop(),expected.closed);
    assert.equal(m.release,expected.release);
    assert.equal(m.depleted.split("/").pop(),expected.depleted);
    assert.equal(m.pickup,expected.pickup);
    assert.deepEqual(m.anchor,[160,296]);
    assert.equal(m.displayWidth,145);
    batchDFile(m.closed);batchDFile(m.depleted);
    batchDFile(EMBER_BATCH_D_ATLASES[m.release].file);
  }
  // Release frame 4 starts at 360ms (durations 80+90+90+100).
  assert.equal(batchDFrameAt("mechanism-brass-dispenser",359),3);
  assert.equal(batchDFrameAt("mechanism-brass-dispenser",360),4);
  assert.equal(batchDFrameAt("mechanism-brass-dispenser",850),7);
  assert.equal(batchDFrameAt("mechanism-brass-dispenser",5000),7);
});

test("batch-D pickup and obstacle mappings exist per kingdom",()=>{
  assert.deepEqual(EMBER_BATCH_D_PICKUP_BY_STAGE,[
    "gameplay/pickups/barkroot-acorn.webp",
    "gameplay/pickups/ruby-treasure.webp",
    "gameplay/pickups/clockwork-cog.webp",
    "gameplay/pickups/cheese-treat.webp",
    "gameplay/pickups/royal-crown.webp"
  ]);
  for(const file of EMBER_BATCH_D_PICKUP_BY_STAGE)batchDFile(file);
  assert.deepEqual(EMBER_BATCH_D_ROCK_BY_STAGE,[
    null,
    "gameplay/obstacles/ruby-crystal-spikes.webp",
    "gameplay/obstacles/clockwork-gear.webp",
    "gameplay/obstacles/molten-obsidian-boulder.webp",
    "gameplay/obstacles/royal-vault-rock.webp"
  ]);
  assert.deepEqual(EMBER_BATCH_D_SPIKE_BY_STAGE,[null,null,"gameplay/obstacles/clockwork-gear.webp",null,null]);
  for(const file of [...EMBER_BATCH_D_ROCK_BY_STAGE,...EMBER_BATCH_D_SPIKE_BY_STAGE]){
    if(file)batchDFile(file);
  }
});

test("boss health counts are Mole King difficulty for all three (4/4/4)",()=>{
  // Mitchell's 2026-11-25 feedback-round directive superseded the
  // shipped 2/3/4: every guardian fights at Mole King difficulty.
  assert.equal(getBossConfig("copperjack").maxHealth,4);
  assert.equal(getBossConfig("cinderclaw").maxHealth,4);
  assert.equal(getBossConfig("mole-king").maxHealth,4);
});

test("stage durations are the 2026-11-25 remake values (30s routes everywhere)",()=>{
  // Mitchell's overnight directive 2026-11-25 superseded the shipped
  // 15/15/30/40/40: Barkroot and Ruby were remade as full 30s routes and
  // the boss worlds tunnel ~30s before the arena (BOSS_INTRO_TIME=30),
  // so every stage duration is 30. Boss HP and boss clocks unchanged.
  assert.equal(EXPEDITION_STAGE_SECONDS,30);
  assert.deepEqual(EXPEDITION_STAGES.map(s=>s.duration||EXPEDITION_STAGE_SECONDS),[30,30,30,30,30]);
  assert.equal(newRun(1467,0).duration,30);
  assert.equal(newRun(1467,1).duration,30);
  assert.equal(newRun(1467,2).duration,30);
  assert.equal(newRun(1467,3).duration,30);
  assert.equal(newRun(1467,4).duration,30);
  assert.equal(newRun().duration,75);
});

test("no passive charge: boss start does not refill charge",()=>{
  for(const index of [2,3,4]){
    const s=intoBoss(index);
    assert.equal(s.charge,0,"charge must be earned, not refilled at boss start");
    assert.equal(s.boss.health,s.boss.maxHealth);
  }
});

test("no passive charge: recovery does not refill charge",()=>{
  const s=intoBoss(2);
  let sawVulnerable=false;
  for(let i=0;i<400&&s.running&&!sawVulnerable;i++){
    s.y=402;s.pitch=0;
    updateRun(s,.045);
    // Rewards need ~1s to fly from the mechanism to the vehicle; the
    // vulnerable event fires ~0.6s after the spawn, so no reward can have
    // been collected yet at this point.
    if(s.events.some(e=>e.type==="boss-vulnerable")){
      sawVulnerable=true;
      assert.equal(s.charge,0,"charge must not refill on recovery");
    }
    // Discard rewards so later collection cannot mask a refill.
    s.bossRewards=[];
  }
  assert.ok(sawVulnerable,"never reached a recovery opening");
});

test("exactly four rewards per attack, 25% charge each, in the safe lane",()=>{
  assert.equal(BOSS_REWARD_COUNT,4);
  assert.equal(BOSS_REWARD_CHARGE,25);
  for(const index of [2,3,4]){
    const s=intoBoss(index);
    const scoreAtSpawn=s.score;
    let spawned=null;
    for(let i=0;i<200&&!spawned;i++){
      s.y=402;s.pitch=0;
      updateRun(s,.045);
      if(s.bossRewards.length>0)spawned=[...s.bossRewards];
    }
    assert.ok(spawned,"no rewards spawned on the first attack");
    assert.equal(spawned.length,4,"exactly four rewards per attack");
    const lane=bossSafeLane(s.boss.attack,s.bossY);
    assert.ok(lane,"no safe lane for "+s.boss.attack);
    for(const r of spawned){
      assert.equal(r.chargeValue,25);
      assert.ok(r.y>=lane.top&&r.y<=lane.bottom,"reward outside the safe lane");
      assert.ok(r.x>=440&&r.x<=580,"reward did not spawn near the mechanism mouth");
    }
    assert.equal(s.score,scoreAtSpawn,"rewards must not add score");
  }
});

test("collecting all four rewards fills Turbo with no score",()=>{
  const s=newRun(1467,2);
  s.objects=[];s.breakables=[];s.crystalShutters=[];s.worldHazards=[];
  assert.equal(startExpeditionBoss(s,tunnelCenter),true);
  assert.equal(s.charge,0);
  const spawned=spillBossRewards(s);
  assert.equal(spawned.length,4);
  const scoreBefore=s.score;
  for(const r of [...s.bossRewards]){
    s.y=r.y;
    r.x=DRILL_ANCHOR;
    updateBossRewards(s,.045);
  }
  assert.equal(s.bossRewards.length,0);
  assert.equal(s.charge,100);
  assert.equal(s.score,scoreBefore);
  // A fifth reward is never spawned by the same attack.
  assert.equal(spillBossRewards(s).length,4);
  assert.equal(s.bossRewards.length,4);
});

test("safe lane is disjoint from the danger lane for every attack",()=>{
  for(const attack of ["gear-sweep","spark-bolt","fireball","burrow","quake","earth-burst"]){
    const danger=bossDangerLane(attack,402);
    const safe=bossSafeLane(attack,402);
    assert.ok(safe,"no safe lane for "+attack);
    assert.ok(safe.bottom<=danger.top||safe.top>=danger.bottom,
      attack+" safe lane overlaps its danger lane");
    assert.ok(safe.top>=70&&safe.bottom<=750,"safe lane outside the corridor");
  }
});

test("mechanism release starts 360ms before warning ends; frame 4 is the spawn",()=>{
  const b=createBossEncounter("copperjack");
  // First attack is gear-sweep, warning 1.40s (Mole King pacing).
  assert.deepEqual(bossMechanismState(b),{state:"idle",frame:null});
  advanceBossEncounter(b,1.03);
  assert.equal(b.phase,"warning");
  assert.deepEqual(bossMechanismState(b),{state:"idle",frame:null});
  advanceBossEncounter(b,0.02);
  assert.equal(bossMechanismState(b).state,"release");
  assert.equal(bossMechanismState(b).frame,0);
  advanceBossEncounter(b,0.35);
  assert.equal(bossMechanismState(b).state,"release");
  assert.equal(bossMechanismState(b).frame,4);
  advanceBossEncounter(b,0.02);
  assert.equal(b.phase,"active");
  assert.equal(bossMechanismState(b).state,"release");
  assert.equal(bossMechanismState(b).frame,4);
  advanceBossEncounter(b,0.5);
  assert.deepEqual(bossMechanismState(b),{state:"depleted",frame:null});
  advanceTo(b,"recovery");
  assert.deepEqual(bossMechanismState(b),{state:"depleted",frame:null});
  advanceTo(b,"warning");
  assert.deepEqual(bossMechanismState(b),{state:"idle",frame:null});
});

test("boss pain shows only on a confirmed hit, for 0.65s, then neutral",()=>{
  for(const [kind,neutral,pain] of [["copperjack",8,9],["mole-king",8,9]]){
    const b=createBossEncounter(kind);
    advanceTo(b,"recovery");
    assert.equal(expeditionBossFrame(b),neutral,"recovery without a hit must not show pain");
    assert.equal(hitBossDuringRecovery(b,{turbo:true,inRange:true}),true);
    assert.equal(expeditionBossFrame(b),pain);
    advanceBossEncounter(b,0.6);
    assert.equal(b.phase,"recovery");
    assert.equal(expeditionBossFrame(b),pain);
    advanceBossEncounter(b,0.1);
    assert.equal(b.phase,"recovery");
    assert.equal(expeditionBossFrame(b),neutral,"pain must end 0.65s after the hit");
  }
  // Cinderclaw has no dedicated pain frame: it flashes its defeat frame
  // briefly on a hit, then returns to idle instead of holding it.
  const c=createBossEncounter("cinderclaw");
  advanceTo(c,"recovery");
  assert.ok([0,1,2,3].includes(expeditionBossFrame(c)),"cinderclaw recovery without a hit must idle");
  assert.equal(hitBossDuringRecovery(c,{turbo:true,inRange:true}),true);
  assert.equal(expeditionBossFrame(c),11);
  advanceBossEncounter(c,0.7);
  assert.equal(c.phase,"recovery");
  assert.ok([0,1,2,3].includes(expeditionBossFrame(c)),"cinderclaw must stop flashing pain after 0.65s");
});

test("attack VFX maps phase progress to atlas frames, recovery only 0.35s",()=>{
  assert.equal(attackVfxFrame("gear-sweep","warning",0,1.4),0);
  assert.equal(attackVfxFrame("gear-sweep","warning",0.5,1.4),1);
  assert.equal(attackVfxFrame("gear-sweep","warning",0.99,1.4),2);
  assert.equal(attackVfxFrame("gear-sweep","active",0,0.55),3);
  assert.equal(attackVfxFrame("gear-sweep","active",0.5,0.55),4);
  assert.equal(attackVfxFrame("gear-sweep","active",0.99,0.55),5);
  assert.equal(attackVfxFrame("gear-sweep","recovery",0,1.4),6);
  assert.equal(attackVfxFrame("gear-sweep","recovery",0.1,1.4),6);
  assert.equal(attackVfxFrame("gear-sweep","recovery",0.2,1.4),7);
  assert.equal(attackVfxFrame("gear-sweep","recovery",0.5,1.4),-1);
  assert.equal(attackVfxFrame("gear-sweep","idle",0,1.4),-1);
  assert.equal(attackVfxFrame("missing","warning",0,1.4),-1);
});

test("five victory screens are installed, one per world",()=>{
  const worlds=["barkroot","ruby","clockwork","molten","treasury"];
  for(const world of worlds){
    const bytes=fs.readFileSync("public/ember-drill/victory/victory-"+world+".webp");
    assert.ok(bytes.length>100000,"victory-"+world+".webp appears truncated");
    assert.equal(bytes.toString("ascii",8,12),"WEBP");
  }
});

test("earned-Turbo boss fights still end in defeat with the shipped rewards",()=>{
  // The existing hit tests set charge explicitly as the earned precondition;
  // here the rewards must actually earn it: collect all four, strike, repeat.
  const s=intoBoss(2);
  const initial=s.score;
  for(let i=0;i<900&&s.running;i++){
    s.y=s.bossY-DRILL_TIP_VERTICAL_OFFSET;s.pitch=0;
    // Steer onto each live reward as it flies past the vehicle.
    for(const r of [...(s.bossRewards||[])]){
      if(!r.taken&&Math.abs(r.x-DRILL_ANCHOR)<60){
        s.y=r.y;
        break;
      }
    }
    if(s.boss.phase==="recovery"&&!s.boss.hitThisRecovery&&s.boostTime<=0&&s.charge>=100)
      triggerTurbo(s);
    updateRun(s,.045);
  }
  assert.equal(s.boss.stats.successfulHits,4);
  assert.equal(s.bossDefeated,true);
  assert.equal(s.result,"complete");
  assert.ok(s.score>=initial+1400);
});
