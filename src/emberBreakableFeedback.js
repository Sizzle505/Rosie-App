// Small deterministic UI helpers for the Ember dig milestone.
// The messages do not affect physics, and no generated character portraits are used.
export function excavationNotice(event) {
  if(!event)return null;
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
