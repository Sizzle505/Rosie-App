// Playtest-only hazards for the selectable five-world Expedition.
// The original classic course does not instantiate this module's obstacles.
// Geometry is distance-driven and mirrors the painter; nothing falls in from
// arbitrary screen coordinates or produces a hidden collision.
export const EXPEDITION_HAZARD_LAYOUT=Object.freeze([
  Object.freeze({id:"ruby-trap",stageIndex:1,kind:"crystal",x:7330,side:-1,maxReach:163}),
  Object.freeze({id:"clockwork-piston",stageIndex:2,kind:"piston",x:12180,side:1,maxReach:180}),
  Object.freeze({id:"clockwork-second-piston",stageIndex:2,kind:"piston",x:13870,side:-1,maxReach:170}),
  Object.freeze({id:"molten-geyser",stageIndex:3,kind:"geyser",x:17650,side:1,maxReach:175}),
  // A crack in the actual roof loosens basalt before it descends. Its solid
  // core is calculated by the same reach function as the illustrated frames.
  Object.freeze({id:"molten-falling-basalt",stageIndex:3,kind:"basalt",x:18200,side:-1,maxReach:150}),
  // Repositioned on the open floor so eruption and rockfall never overlap.
  Object.freeze({id:"molten-second-geyser",stageIndex:3,kind:"geyser",x:18600,side:1,maxReach:157}),
  Object.freeze({id:"royal-earth-burst",stageIndex:4,kind:"quake",x:23720,side:-1,maxReach:166}),
  Object.freeze({id:"royal-second-burst",stageIndex:4,kind:"quake",x:24230,side:1,maxReach:169})
]);
const clamp01=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp01(n);return t*t*(3-2*t)};
export function expeditionHazardReach(h,gap) {
  if(h.shattered)return 0;
  if(gap>=310)return 18;
  if(gap>120)return 18+(h.maxReach-18)*smooth((310-gap)/190);
  if(gap>=-115)return h.maxReach;
  if(gap>-265)return h.maxReach*(1-smooth((-115-gap)/150));
  return 0;
}
export function makeExpeditionHazards(stageIndex){
  return EXPEDITION_HAZARD_LAYOUT.filter(h=>h.stageIndex===stageIndex)
    .map(h=>({...h,reach:18,warned:false,hit:false,resolved:false,shattered:false}));
}
const WORLD_BONUS=Object.freeze({1:300,2:375,3:425,4:500});
export function updateExpeditionHazards(s,tipWorldX,tipY,boosted,onHit,center,radius){
  for(const h of s.worldHazards||[]){
    const gap=h.x-tipWorldX;
    const edge=center(h.x)+h.side*radius(h.x);
    h.reach=expeditionHazardReach(h,gap);
    const screenX=h.x-s.scroll;
    if(!h.warned&&gap<=470&&gap>-110){
      h.warned=true;
      s.events.push({type:"world-hazard-warning",id:h.id,kind:h.kind,side:h.side,x:screenX,y:edge});
    }
    // Only a 130px-wide solid core is hazardous, not the decorative glow.
    const tipInside=h.side*(tipY-edge)>=-h.reach-18;
    if(!h.resolved&&!h.hit&&Math.abs(gap)<65&&h.reach>90&&tipInside){
      h.hit=true;
      if(boosted){
        h.shattered=true;h.resolved=true;h.reach=0;
        s.score+=175;s.shards++;
        s.events.push({type:"world-hazard-shatter",id:h.id,kind:h.kind,x:screenX,y:tipY});
      }else{
        if(s.hitCooldown<=0)onHit(s);
        s.events.push({type:"world-hazard-contact",id:h.id,kind:h.kind,x:screenX,y:tipY});
      }
    }
    if(!h.resolved&&gap< -112){
      h.resolved=true;
      // Never pay for passing an unvisited obstacle, or damage twice.
      if(h.warned&&!h.hit){
        s.score+=125;s.charge=Math.min(100,s.charge+10);
        s.events.push({type:"world-hazard-dodged",id:h.id,kind:h.kind,x:screenX,y:edge});
      }
    }
    const completed=h.resolved&&h.hit&&h.shattered || h.resolved&&!h.hit&&h.warned;
    if(!s.worldObjective&&completed&&h.stageIndex===s.stageIndex){
      s.worldObjective=true;
      const points=WORLD_BONUS[s.stageIndex]||0;
      s.objectiveBonus+=points;s.score+=points;
      s.events.push({type:"world-objective-complete",id:h.id,stageIndex:s.stageIndex,points});
    }
  }
}
