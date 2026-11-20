// Battle bridge for the selectable Clockwork, Molten and Royal Treasury Expedition stages.
// Physics stays deterministic and independent of React. The character art is
// a procedural placeholder until reviewed sprite atlases are imported.
import {
  createBossEncounter,advanceBossEncounter,hitBossDuringRecovery
} from "./emberBossEncounter.js";

export const BOSS_INTRO_TIME=8.5;
export const BOSS_SCREEN_X=482;

export function expeditionBossKind(stageIndex){
  return stageIndex===2?"copperjack":stageIndex===3?"cinderclaw":stageIndex===4?"mole-king":null;
}
export function startExpeditionBoss(s,center){
  const kind=expeditionBossKind(s.stageIndex);
  if(!kind||s.boss)return false;
  s.boss=createBossEncounter(kind);
  s.bossY=center(s.scroll+BOSS_SCREEN_X);
  s.bossAttackHitCycle=-1;
  // A regular excavation boost must not auto-hit the boss during recovery.
  s.boostTime=0;
  s.charge=100; // Each timed strike must be explicitly initiated.
  s.events.push(...s.boss.events);
  return true;
}

export function bossAttackDanger(boss,tipY,bossY){
  if(!boss||boss.phase!=="active")return false;
  const delta=tipY-bossY;
  switch(boss.attack){
    case "fireball":return Math.abs(delta)<96;
    case "spark-bolt":return Math.abs(delta)<96;
    case "gear-sweep":return delta>25;
    case "burrow":return delta>50;
    case "quake":return delta>25;
    case "earth-burst":return delta< -35;
    default:return false;
  }
}
export function updateExpeditionBoss(s,dt,{tipX,tipY,boosted,onHit}){
  const b=s.boss;
  if(!b||b.defeated)return;
  advanceBossEncounter(b,dt);
  for(const event of b.events){
    s.events.push({...event});
    // Charge only once at the start of each recovery; there is no need to
    // farm ordinary pickups while the scroll is stopped at the boss arena.
    if(event.type==="boss-vulnerable")s.charge=Math.max(s.charge,100);
  }
  // Apply at most one damaging strike per attack cycle.
  if(b.phase==="active"&&!boosted&&s.bossAttackHitCycle!==b.cycle
    &&bossAttackDanger(b,tipY,s.bossY)){
    s.bossAttackHitCycle=b.cycle;
    if(s.hitCooldown<=0)onHit(s);
    s.events.push({type:"boss-attack-contact",boss:b.kind,attack:b.attack});
  }
  const inRange=Math.abs(tipX-BOSS_SCREEN_X)<140&&Math.abs(tipY-s.bossY)<112;
  if(hitBossDuringRecovery(b,{turbo:boosted,inRange})){
    // hitBossDuringRecovery appends events after advance's transitions.
    for(const event of b.events.filter(e=>e.type==="boss-hit"||e.type==="boss-defeated"))
      s.events.push({...event});
    if(b.defeated){
      const reward=b.kind==="mole-king"?2600:b.kind==="copperjack"?1400:1750;
      s.bossDefeated=true;
      s.score+=reward;
      s.events.push({type:"boss-victory",boss:b.kind,points:reward});
    }
  }
}
export function finishExpeditionBossStage(s){
  if(!s.boss||!s.bossDefeated)return false;
  s.running=false;s.ended=true;s.result="complete";
  s.events.push({type:"end",result:"complete",boss:s.boss.kind});
  return true;
}
