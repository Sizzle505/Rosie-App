// Small deterministic UI helpers for the Ember dig milestone.
// The messages do not affect physics, and no generated character portraits are used.
export function excavationNotice(event) {
  if(!event)return null;
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
