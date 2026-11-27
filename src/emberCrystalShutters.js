// Deterministic crystal shutters anchored to the existing tunnel roof/floor.
// Their extension depends only on distance from the real auger tip: no clocks,
// random physics or frame-rate-dependent collisions.
import {openingGraceSeconds} from "./emberExpeditionStages.js";
export const CRYSTAL_SHUTTER_LAYOUT=Object.freeze([
  {id:"barkroot-shutter",x:5300,side:-1,maxReach:148},
  {id:"ruby-shutter",x:13360,side:1,maxReach:160},
  {id:"temple-shutter",x:18300,side:-1,maxReach:169},
]);
const clamp01=v=>Math.max(0,Math.min(1,v));
const ease=v=>{const t=clamp01(v);return t*t*(3-2*t)};
export function shutterReach(h,gap){
  if(h.shattered)return 0;
  // An embedded crystal shelf slowly extends before Rosie's nose arrives.
  if(gap>=300)return 24;
  if(gap>95)return 24+(h.maxReach-24)*ease((300-gap)/205);
  if(gap>=-100)return h.maxReach;
  if(gap>-265)return h.maxReach*(1-ease((-100-gap)/165));
  return 0;
}
export function makeCrystalShutters(){
  return CRYSTAL_SHUTTER_LAYOUT.map(h=>({...h,reach:24,warned:false,hit:false,shattered:false,resolved:false}));
}
export function updateCrystalShutters(s,tipWorldX,tipY,boosted,onHit,center,radius){
  for(const h of s.crystalShutters||[]){
    const gap=h.x-tipWorldX;
    h.reach=shutterReach(h,gap);
    const edge=center(h.x)+h.side*radius(h.x);
    const screenX=h.x-s.scroll;
    if(!h.warned&&gap<=530&&gap>-130){
      h.warned=true;
      s.events.push({type:"shutter-warning",id:h.id,side:h.side,x:screenX,y:edge});
    }
    // Near-tip, inward-pointing core. Never use the rectangular sprite bounds
    // to create a hidden hitbox, and never apply repeated damage from one shelf.
    const inSolid=h.side*(tipY-edge)>=-h.reach-16;
    if(!h.hit&&!h.resolved&&Math.abs(gap)<68&&h.reach>60&&inSolid){
      h.hit=true;
      if(boosted){
        h.shattered=true;h.resolved=true;h.reach=0;
        s.shards++;s.score+=150;
        s.events.push({type:"shutter-shatter",id:h.id,x:screenX,y:tipY});
      }else{
        // Shutters share the opening grace: no damage in the settle-in.
        if(s.hitCooldown<=0&&s.time>=openingGraceSeconds(s.stageIndex))onHit(s);
        s.events.push({type:"shutter-contact",id:h.id,x:screenX,y:tipY});
      }
    }
    if(!h.resolved&&gap< -112){
      h.resolved=true;
      // An unvisited shelf behind the starting point is not a free dodge.
      if(!h.hit&&h.warned){
        s.hazardsDodged=(s.hazardsDodged||0)+1;
        s.score+=100;s.charge=Math.min(100,s.charge+8);
        s.events.push({type:"shutter-dodged",id:h.id,x:screenX,y:edge});
      }
    }
  }
}
