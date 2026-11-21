// Small deterministic UI helpers for the Ember dig milestone.
// The messages do not affect physics, and no generated character portraits are used.
export function excavationNotice(event) {
  if(!event)return null;
  if(event.type==="boss-spawn")return {
    kind:"tip",title:event.boss==="mole-king"?"THE MOLE KING AWAKENS":event.boss==="copperjack"?"COPPERJACK ACTIVATED":"CINDERCLAW EMERGES",
    detail:"Dodge attacks. Strike with Turbo when the guardian recovers.",duration:2.4
  };
  if(event.type==="boss-warning")return {
    kind:"tip",title:"BOSS ATTACK INCOMING",
    detail:event.text||"Read the danger zone and steer away.",duration:1.3
  };
  if(event.type==="boss-vulnerable")return {
    kind:"success",title:"BOSS VULNERABLE",
    detail:"Turbo is recharged - align the auger and strike!",duration:1.0
  };
  if(event.type==="boss-hit")return {
    kind:"success",title:"DIRECT HIT",
    detail:event.health+" health remaining",duration:.85
  };
  if(event.type==="boss-victory")return {
    kind:"success",title:event.boss==="mole-king"?"THE KING SURRENDERS":event.boss==="copperjack"?"COPPERJACK DISABLED":"CINDERCLAW DEFEATED",
    detail:"Boss reward +"+event.points+" points",duration:3.0
  };
  const hazardNames={crystal:"CRYSTAL SPIKES",piston:"CLOCKWORK PISTON",geyser:"MOLTEN GEYSER",basalt:"FALLING BASALT",quake:"ROYAL ROCK BURST"};
  if(event.type==="world-hazard-warning")return {
    kind:"tip",placement:event.side<0?"bottom":"top",
    title:(hazardNames[event.kind]||"CAVE HAZARD")+" AHEAD",
    detail:event.kind==="basalt"?"The ceiling is cracking - drop toward the clear lane, or use Turbo.":"Steer toward the center; Turbo can break through.",duration:1.8
  };
  if(event.type==="world-hazard-dodged")return {
    kind:"success",title:"CLEAN ESCAPE",
    detail:"+125 points · +10 Turbo charge",duration:1.25
  };
  if(event.type==="world-hazard-shatter")return {
    kind:"success",title:"HAZARD SHATTERED",
    detail:"+175 points · Clear passage",duration:1.35
  };
  if(event.type==="world-objective-complete")return {
    kind:"success",title:"WORLD OBJECTIVE COMPLETE",
    detail:"Expedition bonus +"+event.points+" points",duration:2.1
  };
  if(event.type==="shutter-warning")return {
    kind:"tip",placement:event.side<0?"bottom":"top",title:"MOVING CRYSTAL AHEAD",detail:"Steer away from the wall, or shatter it with Turbo.",duration:1.6
  };
  if(event.type==="shutter-shatter")return {
    kind:"success",title:"CRYSTAL SHUTTER BROKEN",detail:"+150 points · Clear passage",duration:1.7
  };
  if(event.type==="shutter-dodged")return {
    kind:"success",title:"CRYSTAL DODGED",detail:"+100 points · Turbo charge earned",duration:1.2
  };
  if(event.type==="objective-complete")return {
    kind:"success",title:event.mission==="barkroot"?"BARKROOT MISSION COMPLETE":"RUBY MISSION COMPLETE",
    detail:"Expedition bonus +"+event.points+" points",duration:2.1
  };
  if(event.type==="hard-rock")return {
    kind:"tip",title:"CRYSTAL TOO HARD",detail:"Charge Burrow Turbo to break it.",duration:2.2
  };
  if(event.type==="break-wall")return event.material==="crystal"
    ?{kind:"success",title:"CRYSTAL SHATTERED",detail:"+250 points · Turbo charge earned",duration:1.6}
    :{kind:"success",title:"EARTH CLEARED",detail:"+125 points · Turbo charge earned",duration:1.5};
  if(event.type==="bonus-time")return {
    kind:"success",title:"TIME DISCOVERED",detail:"+3 seconds · +"+event.points+" points",duration:1.65
  };
  if(event.type==="bonus-canister")return {
    kind:"success",title:"TURBO CANISTER",detail:"+65 Turbo charge · +"+event.points+" points",duration:1.65
  };
  if(event.type==="secret-found")return {
    kind:"relic",title:"ROYAL CHAMBER FOUND",detail:"Royal Bone Medallion recovered! +750",duration:3.0
  };
  return null;
}

// A complete run earns one star; two excavated walls and the secret relic
// earn the remaining two. Failed runs never earn a medal, even at high score.
export function excavationStars(run) {
  if(!run || run.result!=="complete")return 0;
  return 1+Number((run.wallsBroken||0)>=2)+Number((run.relics||0)>0);
}
