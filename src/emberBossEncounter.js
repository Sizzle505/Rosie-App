// Deterministic encounter timing for future Ember Tunnel boss stages.
// Not wired into the active 75-second course until the world maps and assets pass QA.
// Physics/collision belongs to the stage; this module only controls boss phases
// and one-time, clearly telegraphed damage opportunities.
const BOSS_CONFIG = Object.freeze({
  copperjack:Object.freeze({
    id:"copperjack",maxHealth:2,reward:1400,
    attacks:Object.freeze([
      Object.freeze({id:"gear-sweep",warning:1.1,active:0.55,recovery:1.4,
        hazard:"floor",warningText:"GEAR SWEEP - RISE ABOVE THE MECHANISM"}),
      Object.freeze({id:"spark-bolt",warning:1.2,active:0.65,recovery:1.4,
        hazard:"projectile",warningText:"SPARK BOLT - LEAVE THE CENTER"})
    ])
  }),
  cinderclaw:Object.freeze({
    id:"cinderclaw",maxHealth:3,reward:1750,
    attacks:Object.freeze([
      Object.freeze({id:"fireball",warning:1.15,active:0.55,recovery:1.30,
        hazard:"projectile",warningText:"FIREBALL - DODGE THE FLAME"}),
      Object.freeze({id:"burrow",warning:1.35,active:0.70,recovery:1.45,
        hazard:"ground",warningText:"BURROWING - WATCH THE FLOOR"})
    ])
  }),
  "mole-king":Object.freeze({
    id:"mole-king",maxHealth:4,reward:2600,
    attacks:Object.freeze([
      Object.freeze({id:"quake",warning:1.40,active:0.65,recovery:1.55,
        hazard:"floor",warningText:"ROYAL QUAKE - CLIMB AWAY"}),
      Object.freeze({id:"earth-burst",warning:1.30,active:0.65,recovery:1.45,
        hazard:"projectile",warningText:"EARTH BURST - DODGE THE ROCKS"})
    ])
  })
});
export const getBossConfig=kind=>BOSS_CONFIG[kind]||null;
const attackFor=b=>BOSS_CONFIG[b.kind].attacks[b.cycle%BOSS_CONFIG[b.kind].attacks.length];
export function createBossEncounter(kind){
  const config=getBossConfig(kind);
  if(!config)throw new RangeError("Unknown Tunnel boss: "+kind);
  const first=config.attacks[0];
  return {
    kind,health:config.maxHealth,maxHealth:config.maxHealth,phase:"warning",
    cycle:0,elapsed:0,attack:first.id,defeated:false,hitThisRecovery:false,
    events:[{type:"boss-spawn",boss:kind},{type:"boss-warning",boss:kind,attack:first.id,text:first.warningText}],
    stats:{successfulHits:0,attackCycles:0}
  };
}
function phaseDuration(b){
  const a=attackFor(b);
  return b.phase==="warning"?a.warning:b.phase==="active"?a.active:a.recovery;
}
function transition(b){
  const a=attackFor(b);
  if(b.phase==="warning"){
    b.phase="active";
    b.events.push({type:"boss-attack",boss:b.kind,attack:a.id,hazard:a.hazard});
    return;
  }
  if(b.phase==="active"){
    b.phase="recovery";b.hitThisRecovery=false;
    b.events.push({type:"boss-vulnerable",boss:b.kind,attack:a.id});
    return;
  }
  b.cycle++;b.stats.attackCycles++;
  b.phase="warning";b.hitThisRecovery=false;
  const next=attackFor(b);b.attack=next.id;
  b.events.push({type:"boss-warning",boss:b.kind,attack:next.id,text:next.warningText});
}
export function advanceBossEncounter(b,dt){
  // Prevent suspended-tab time jumps from skipping all warnings at once.
  const remainingTime=Number.isFinite(dt)?Math.max(0,Math.min(1.5,dt)):0;
  b.events=[];
  if(b.defeated||remainingTime===0)return b;
  let remaining=remainingTime;
  for(let i=0;i<16&&remaining>0.000001;i++){
    const duration=phaseDuration(b),step=Math.min(remaining,Math.max(0,duration-b.elapsed));
    b.elapsed+=step;remaining-=step;
    if(b.elapsed>=duration-0.000001){
      b.elapsed=0;transition(b);
    }
  }
  return b;
}
export function bossCanTakeHit(b,{turbo=false,inRange=false}={}){
  return Boolean(!b.defeated&&b.phase==="recovery"&&!b.hitThisRecovery&&turbo&&inRange);
}
export function hitBossDuringRecovery(b,contact={}){
  if(!bossCanTakeHit(b,contact))return false;
  b.hitThisRecovery=true;
  b.health=Math.max(0,b.health-1);
  b.stats.successfulHits++;
  b.events.push({type:"boss-hit",boss:b.kind,health:b.health});
  if(b.health===0){
    b.defeated=true;b.phase="defeated";
    b.events.push({type:"boss-defeated",boss:b.kind,reward:BOSS_CONFIG[b.kind].reward});
  }
  return true;
}
export function bossPresentation(b){
  const a=attackFor(b);
  return {
    boss:b.kind,attack:a.id,phase:b.phase,
    progress:b.defeated?1:Math.min(1,b.elapsed/phaseDuration(b)),
    vulnerable:b.phase==="recovery"&&!b.hitThisRecovery&&!b.defeated,
    activeHazard:b.phase==="active"?a.hazard:null,
    warning:b.phase==="warning"?a.warningText:null
  };
}
