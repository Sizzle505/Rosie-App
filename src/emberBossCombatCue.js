// Concise, collision-aligned coaching for Tunnel guardians.
// This describes the existing boss attack lanes; it never alters their physics.
export const BOSS_ATTACK_HINTS=Object.freeze({
  "gear-sweep":"Rise above the floor mechanism",
  "spark-bolt":"Leave the middle lane",
  "fireball":"Dodge outside the middle lane",
  "burrow":"Rise clear of the floor",
  "quake":"Climb above the ground strike",
  "earth-burst":"Dive below the falling rocks"
});

export function getBossCombatCue(boss){
  if(!boss)return null;
  if(boss.defeated||boss.phase==="defeated"){
    return {tone:"victory",title:"GUARDIAN DEFEATED",detail:"The route is yours"};
  }
  const hint=BOSS_ATTACK_HINTS[boss.attack]||"Steer outside the marked danger lane";
  if(boss.phase==="warning"){
    return {tone:"warning",title:"ATTACK INCOMING",detail:hint};
  }
  if(boss.phase==="active"){
    return {tone:"danger",title:"DODGE NOW",detail:hint};
  }
  if(boss.phase==="recovery"){
    return boss.hitThisRecovery
      ? {tone:"landed",title:"DIRECT HIT",detail:"Hold position for the next opening"}
      : {tone:"strike",title:"TURBO STRIKE NOW",detail:"Align the auger, then activate Turbo"};
  }
  return null;
}
