// Optional, intentionally placed excavation discoveries. The surrounding course remains playable
// if the player ignores every wall; these are bonuses, not mandatory damage gates.
export const BREAKABLE_LAYOUT = Object.freeze([
  {x:1120, side:-1, material:"earth", id:"barkroot-earth"},
  {x:6150, side: 1, material:"earth", id:"ruby-earth"},
  {x:10300,side:-1, material:"crystal",id:"ruby-crystal"},
  {x:15100,side: 1, material:"crystal",id:"temple-crystal"},
  {x:19800,side:-1, material:"entrance",id:"royal-hidden-chamber"},
]);

const toughness = material => material==="crystal" ? 6 : material==="entrance" ? 4 : 3;
export function makeBreakables(center,radius) {
  return BREAKABLE_LAYOUT.map(item=>{
    const maxIntegrity=toughness(item.material);
    return {...item,y:center(item.x)+item.side*(radius(item.x)-75),
      maxIntegrity,integrity:maxIntegrity,cracked:false,broken:false,hardWarning:false};
  });
}
export function drillBreakables(s,dt,tip,boosted) {
  if(!s.breakables)return;
  for(const b of s.breakables){
    if(b.broken || Math.abs(b.x-tip.x)>90 || Math.abs(b.y-tip.y)>79)continue;
    // Crystals require charged Turbo; ordinary earth and entrances can be excavated normally.
    if(b.material==="crystal"&&!boosted){
      if(!b.hardWarning){
        b.hardWarning=true;
        s.events.push({type:"hard-rock",material:b.material,x:b.x-s.scroll,y:b.y});
      }
      continue;
    }
    b.integrity=Math.max(0,b.integrity-(boosted?29:13)*dt);
    if(!b.cracked && b.integrity<=b.maxIntegrity*.55){
      b.cracked=true;
      s.events.push({type:"crack-wall",material:b.material,x:b.x-s.scroll,y:b.y});
    }
    if(b.integrity>0)continue;
    b.broken=true;
    const found=b.material==="entrance";
    s.score+=found?750:b.material==="crystal"?250:125;
    s.charge=Math.min(100,s.charge+(found?30:10));
    s.wallsBroken=(s.wallsBroken||0)+1;
    s.events.push({type:found?"secret-found":"break-wall",material:b.material,x:b.x-s.scroll,y:b.y});
    if(found){
      s.secrets=(s.secrets||0)+1;
      s.relics=(s.relics||0)+1;
      // A chest of collectibles appears just beyond the revealed doorway.
      s.objects.push({id:90000+s.secrets,kind:"cache",x:b.x+205,y:b.y-b.side*36,radius:27,taken:false});
    }
  }
}
