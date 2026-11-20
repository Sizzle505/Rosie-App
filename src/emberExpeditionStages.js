// Optional five-world playtest using the original cave physics and approved art.
// Stage 3-5 are route prototypes, NOT final boss arenas or approved new artwork.
export const EXPEDITION_STAGE_SECONDS=15;
export const EXPEDITION_STAGES=Object.freeze([
  Object.freeze({id:"barkroot",name:"Barkroot Passage",startX:0,theme:"barkroot",objective:"Break an earth wall",art:"new-assets/background/bg01.webp"}),
  Object.freeze({id:"ruby",name:"Ruby Temple",startX:5450,theme:"ruby",objective:"Navigate crystal formations",art:"new-assets/background/bg07.webp"}),
  Object.freeze({id:"clockwork",name:"Clockwork Catacombs",startX:10750,theme:"clockwork",objective:"Survive the mechanical route",art:"new-assets/background/bg04.webp"}),
  Object.freeze({id:"molten",name:"Molten Depths",startX:16100,theme:"molten",objective:"Collect gems through the deeper tunnels",art:"new-assets/background/bg06.webp"}),
  Object.freeze({id:"treasury",name:"Royal Treasury",startX:21500,theme:"treasury",objective:"Bring Rosie safely to the vault",art:"new-assets/background/bg10.webp"})
]);
export function getExpeditionStage(index){
  return Number.isInteger(index)&&index>=0&&index<EXPEDITION_STAGES.length?EXPEDITION_STAGES[index]:null;
}
export function expeditionStarCount(run){
  if(!getExpeditionStage(run?.stageIndex)||run.result!=="complete")return 0;
  return 1+Number(run.damageTaken<=1)+Number((run.gems||0)+(run.bones||0)+(run.cheese||0)>=5);
}
export function safeStoredExpeditionStars(serialized){
  try{
    const raw=JSON.parse(serialized||"{}");
    if(!raw||typeof raw!=="object"||Array.isArray(raw))return {};
    return Object.fromEntries(EXPEDITION_STAGES.map(stage=>[
      stage.id,Math.max(0,Math.min(3,Number.isFinite(+raw[stage.id])?Math.floor(+raw[stage.id]):0))
    ]));
  }catch{return {}}
}
