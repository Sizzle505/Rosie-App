// Battle bridge for the selectable Clockwork, Molten and Royal Treasury Expedition stages.
// Physics stays deterministic and independent of React. The character art is
// a procedural placeholder until reviewed sprite atlases are imported.
import {
  createBossEncounter,advanceBossEncounter,hitBossDuringRecovery,getBossConfig
} from "./emberBossEncounter.js";
import {EMBER_BATCH_D_MECHANISMS,batchDFrameAt} from "./emberExpansionCatalog.js";

// Seconds of tunneling before the arena entrance in boss worlds.
// 2026-11-25 (Mitchell's overnight directive): the boss routes were an
// ~8.5s hop; they are now a full ~30s expedition tunnel, matching the
// remade 30s Barkroot/Ruby routes. The fight itself still runs on its
// own clock (BOSS_TIME_SECONDS) once the arena is entered.
export const BOSS_INTRO_TIME=30;
export const BOSS_SCREEN_X=482;
// One boss Turbo press lasts 0.72s (not the 4.8s excavation boost): a
// single deliberate strike, not a shield that auto-hits later recoveries.
export const BOSS_TURBO_SECONDS=0.72;
// Dedicated boss clock (seconds of fight time from arena entry). The boss
// used to share the route timer, so a player who reached Copperjack with
// hull left had only ~21s left to land 2 hits and the run ended at TIME 0
// ("THE BOSS ESCAPED") with hull remaining. Each guardian now gets a full
// window of its own; route durations and boss HP are unchanged.
// 2026-11-25 feedback round (Mitchell): all three guardians fight at
// Mole King difficulty — 4 health, a 55s clock, and the Mole King's
// attack pacing (warning 1.40/1.30, active 0.65, recovery 1.55/1.45).
// Each boss keeps its own attacks, hazards and rewards.
export const BOSS_TIME_SECONDS=Object.freeze({copperjack:55,cinderclaw:55,"mole-king":55});
// Vertical half-window for a Turbo strike to connect. Was 112: the 0.72s
// boss boost cannot close a larger vertical gap by hand, so strikes fired
// while roughly aligned with the guardian missed. 160 + the boost auto-aim
// below makes a strike landable without removing the recovery-window skill.
export const BOSS_STRIKE_VERTICAL_WINDOW=160;
// Vehicle screen x for reward collection. This is DRILL_ANCHOR in
// emberDrillEngine.js, kept local to avoid an engine<->stage module cycle.
const VEHICLE_X=210;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Earned-Turbo reward loop (batch D, INTEGRATION.md section 3). Exactly four
// real reward objects per attack, 25% charge each, no passive charge, no
// extra scoring. Partial charge carries forward across cycles.
export const BOSS_REWARD_COUNT=4;
export const BOSS_REWARD_CHARGE=25;
// Rewards fly slowly enough to collect (was 260px/s: they crossed the
// 350px to the drill in 1.3s, spread over a lane up to 500px tall, so a
// player collected ~1 per attack cycle and a recharge took ~25s). At
// 150px/s with a 3.2s life they linger in front of the drill, and they
// home toward its height across the whole corridor.
export const BOSS_REWARD_SPEED=150;
export const BOSS_REWARD_LIFE=3.2;
// Rewards home toward the drill fast enough to cross the corridor:
// at 110px/s a flight could not close a ~380px gap in its 2.33s flight,
// so a drill dodging a projectile attack on the far side (below a
// spark-bolt) collected ~0 gears and Copperjack recharges stalled at
// 75% (3 of 4 gears). Measured on the real engine, below-dodge play,
// after the fix: recharge-after-hit-1 3.10s, 16/16 gears collected,
// fight completes with 22.7s of the 35s clock left (see
// tests/ember-boss-round5.test.mjs). The before-state was measured by
// the round-6 investigator's focused sim at 6.3s (7/12 gears).
export const BOSS_REWARD_HOME_SPEED=330;
// Homing is clamped to the whole vertical corridor, not one attack's
// safe lane (see updateBossRewards).
export const BOSS_REWARD_CORRIDOR={top:70,bottom:750};
// The release animation is 850ms; frame 4 starts at 360ms. The opening
// begins 360ms before the end of warning so frame 4 coincides with the
// existing boss-attack event, without delaying the rewards.
export const MECHANISM_RELEASE_LEAD_SECONDS=0.36;
export const MECHANISM_RELEASE_SECONDS=0.85;

export function expeditionBossKind(stageIndex){
  return stageIndex===2?"copperjack":stageIndex===3?"cinderclaw":stageIndex===4?"mole-king":null;
}
export function bossDefeatReward(kind){
  return kind==="mole-king"?2600:kind==="copperjack"?1400:1750;
}
export function startExpeditionBoss(s,center){
  const kind=expeditionBossKind(s.stageIndex);
  if(!kind||s.boss)return false;
  s.boss=createBossEncounter(kind);
  s.bossY=center(s.scroll+BOSS_SCREEN_X);
  s.bossAttackHitCycle=-1;
  s.bossSpawnedAt=s.time;
  s.bossRewards=[];
  // The fight runs on its own clock from arena entry (see BOSS_TIME_SECONDS).
  s.bossTimeLeft=BOSS_TIME_SECONDS[kind];
  // A regular excavation boost must not auto-hit the boss during recovery.
  s.boostTime=0;
  // Earned Turbo only: charge is whatever the route earned. There is no
  // refill here and none on recovery; the four rewards per attack are the
  // only way to charge during a boss fight.
  // The route into the arena is hard: patch one hull on arrival so a fight
  // that needs 2-4 landed strikes is not lost to opening scrapes.
  if(s.hull<5){
    s.hull++;
    const spawn=s.boss.events.find(e=>e.type==="boss-spawn");
    if(spawn)spawn.patched=true;
  }
  s.events.push(...s.boss.events);
  return true;
}

// Shared render/physics bounds - keep the warning and the actual damage lane identical.
// Unbounded ends are clipped to the Canvas by the painter.
export function bossDangerLane(attack,bossY){
  if(!Number.isFinite(bossY))return null;
  switch(attack){
    case "fireball":
    case "spark-bolt":return {top:bossY-96,bottom:bossY+96};
    case "gear-sweep":
    case "quake":return {top:bossY+25,bottom:Infinity};
    case "burrow":return {top:bossY+50,bottom:Infinity};
    case "earth-burst":return {top:-Infinity,bottom:bossY-35};
    default:return null;
  }
}
export function bossAttackDanger(boss,bodyY,bossY){
  if(!boss||boss.phase!=="active"||!Number.isFinite(bodyY))return false;
  // Hit-test the drill BODY, not the auger tip: the tip sits 35px below
  // the body at pitch 0 and up to 128px below when pitched down, so the
  // old tip test punished a drill whose body was visibly clear of the
  // dashed danger line — "steered out of the marked zone" still took the
  // hit, worst while diving away from a floor attack. The drawn lane is
  // now exactly the body boundary the player sees.
  const lane=bossDangerLane(boss.attack,bossY);
  return !!lane&&bodyY>lane.top&&bodyY<lane.bottom;
}
// The safe reward lane is the complement of the danger lane inside the
// playable corridor (vehicle y range 65-755, kept to 70-750 here). Rewards
// only ever spawn and fly inside it. There is no bossRewardY in main; this
// is the equivalent, derived from the same bossDangerLane geometry.
export function bossSafeLane(attack,bossY){
  if(!Number.isFinite(bossY))return null;
  const top=70,bottom=750;
  switch(attack){
    case "fireball":
    case "spark-bolt":{
      const above={top,bottom:bossY-110},below={top:bossY+110,bottom};
      const aboveH=above.bottom-above.top,belowH=below.bottom-below.top;
      return aboveH>=belowH?above:below;
    }
    case "gear-sweep":
    case "quake":return {top,bottom:bossY+10};
    case "burrow":return {top,bottom:bossY+35};
    case "earth-burst":return {top:bossY-20,bottom};
    default:return null;
  }
}
// Spawn exactly four real reward objects for one attack, from the mechanism
// mouth on the boss side, flying left through the safe lane toward the
// vehicle. Charge only, no points. Called once per boss-attack event.
export function spillBossRewards(s){
  const b=s.boss;
  if(!b||!Number.isFinite(s.bossY))return [];
  const lane=bossSafeLane(b.attack,s.bossY);
  if(!lane)return [];
  const mechanism=EMBER_BATCH_D_MECHANISMS[b.kind];
  const kind=mechanism?.pickup||"gem";
  const height=Math.max(40,lane.bottom-lane.top);
  const rewards=[];
  for(let i=0;i<BOSS_REWARD_COUNT;i++){
    rewards.push({
      x:560-i*30,y:lane.top+(i+0.5)/BOSS_REWARD_COUNT*height,
      vx:-BOSS_REWARD_SPEED,vy:0,kind,radius:22,taken:false,age:0,
      life:BOSS_REWARD_LIFE,chargeValue:BOSS_REWARD_CHARGE
    });
  }
  s.bossRewards=[...(s.bossRewards||[]),...rewards];
  return rewards;
}
// Move boss rewards left and collect them with the same overlap math as the
// normal route loop (elliptical core, radius+45 for boss rewards). Each
// collected reward is +25 charge and nothing else; partial charge carries
// forward. Rewards drift toward the drill's height, clamped to the whole
// corridor (70-750) rather than the current attack's safe lane: a drill
// dodging on the far side of a projectile attack must still be able to
// collect the flight, or the recharge stalls (see BOSS_REWARD_HOME_SPEED).
export function updateBossRewards(s,dt){
  const rewards=s.bossRewards;
  if(!rewards||rewards.length===0)return;
  for(const r of rewards){
    if(r.taken)continue;
    r.age+=dt;
    r.x+=r.vx*dt;r.y+=r.vy*dt;
    const dy=s.y-r.y;
    const step=Math.max(-BOSS_REWARD_HOME_SPEED*dt,Math.min(BOSS_REWARD_HOME_SPEED*dt,dy));
    r.y=clamp(r.y+step,BOSS_REWARD_CORRIDOR.top,BOSS_REWARD_CORRIDOR.bottom);
    if(r.age>=r.life||r.x<40){r.taken=true;continue;}
    const distance=Math.hypot((r.x-VEHICLE_X)*0.78,r.y-s.y);
    if(distance<r.radius+45){
      r.taken=true;
      s.charge=clamp(s.charge+r.chargeValue,0,100);
      s.events.push({type:"boss-reward",kind:r.kind,x:r.x,y:r.y,charge:s.charge});
    }
  }
  s.bossRewards=rewards.filter(r=>!r.taken);
}
// One shared strike path for the boost-overlap hit (updateExpeditionBoss)
// and the click-time hit (triggerTurbo): a strike that is aligned while
// the guardian is vulnerable always deals exactly one damage, and a strike
// that cannot land never consumes the hit.
export function strikeBoss(s,{turbo=false,tipX=NaN,tipY=NaN}={}){
  const b=s.boss;
  if(!b)return false;
  const inRange=Math.abs(tipX-BOSS_SCREEN_X)<200&&Math.abs(tipY-s.bossY)<BOSS_STRIKE_VERTICAL_WINDOW;
  if(!hitBossDuringRecovery(b,{turbo,inRange}))return false;
  // A LANDED hit restores one hull (capped at 5) — the restore lives here,
  // the single strike path, so every landed hit heals exactly once and a
  // press that misses restores nothing. The old per-press restore in
  // triggerTurbo healed misaligned presses and was netted out by the next
  // attack before the player could read it.
  const healed=s.hull<5;
  if(healed)s.hull++;
  for(const event of b.events.filter(e=>e.type==="boss-hit"||e.type==="boss-defeated")){
    if(event.type==="boss-hit")event.healed=healed;
    s.events.push({...event});
  }
  if(b.defeated){
    const reward=bossDefeatReward(b.kind);
    s.bossDefeated=true;
    s.score+=reward;
    s.events.push({type:"boss-victory",boss:b.kind,points:reward});
  }
  return true;
}
// Treasure-mechanism animation state, derived from the encounter clock.
// The release begins 360ms before the end of warning so frame 4 coincides
// with the boss-attack spawn event; it plays through depletion during the
// first 0.49s of active, then holds depleted until the next warning.
export function bossMechanismState(b){
  if(!b)return {state:"idle",frame:null};
  const config=getBossConfig(b.kind);
  const attack=config?.attacks.find(a=>a.id===b.attack)||config?.attacks[0];
  const warnDur=attack?.warning??1.2;
  const releaseId=EMBER_BATCH_D_MECHANISMS[b.kind]?.release;
  if(!releaseId)return {state:"idle",frame:null};
  const releaseStart=Math.max(0,warnDur-MECHANISM_RELEASE_LEAD_SECONDS);
  if(b.phase==="warning"){
    if(b.elapsed<releaseStart)return {state:"idle",frame:null};
    return {state:"release",frame:batchDFrameAt(releaseId,(b.elapsed-releaseStart)*1000)};
  }
  if(b.phase==="active"){
    const releaseElapsed=MECHANISM_RELEASE_LEAD_SECONDS+b.elapsed;
    if(releaseElapsed>=MECHANISM_RELEASE_SECONDS)return {state:"depleted",frame:null};
    return {state:"release",frame:batchDFrameAt(releaseId,releaseElapsed*1000)};
  }
  if(b.phase==="recovery"||b.phase==="defeated")return {state:"depleted",frame:null};
  return {state:"idle",frame:null};
}
export function updateExpeditionBoss(s,dt,{tipX,tipY,boosted,onHit}){
  const b=s.boss;
  if(!b||b.defeated)return;
  advanceBossEncounter(b,dt);
  for(const event of b.events){
    s.events.push({...event});
    // One reward spill per attack, from the stage handler only. The
    // mechanism is a visual; it never spawns rewards itself.
    if(event.type==="boss-attack")spillBossRewards(s);
  }
  // Apply at most one damaging strike per attack cycle. The hit test uses
  // the drill body (s.y), not the auger tip — see bossAttackDanger.
  if(b.phase==="active"&&!boosted&&s.bossAttackHitCycle!==b.cycle
    &&bossAttackDanger(b,s.y,s.bossY)){
    s.bossAttackHitCycle=b.cycle;
    if(s.hitCooldown<=0)onHit(s);
    s.events.push({type:"boss-attack-contact",boss:b.kind,attack:b.attack});
  }
  // Pitching downward shifts the auger tip rearward in screen space. Turbo's
  // 200px reach prevents a visually aligned downward strike from missing on
  // a horizontal-only technicality; vertical aiming still matters.
  strikeBoss(s,{turbo:boosted,tipX,tipY});
  updateBossRewards(s,dt);
}
export function finishExpeditionBossStage(s){
  if(!s.boss||!s.bossDefeated)return false;
  s.running=false;s.ended=true;s.result="complete";
  s.events.push({type:"end",result:"complete",boss:s.boss.kind});
  return true;
}
