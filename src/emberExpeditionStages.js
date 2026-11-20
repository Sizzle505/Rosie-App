// Optional five-world playtest using the original cave physics and approved art.
// Stages 3-5 use reviewed procedural placeholders; Molten and Treasury now\n// include playable boss encounters, not yet the final sprite art.
export const EXPEDITION_STAGE_SECONDS=15;
export const EXPEDITION_STAGES=Object.freeze([
  Object.freeze({id:"barkroot",name:"Barkroot Passage",startX:0,theme:"barkroot",objective:"Break an earth wall",art:"new-assets/background/bg01.webp"}),
  Object.freeze({id:"ruby",name:"Ruby Temple",startX:5450,theme:"ruby",objective:"Evade or shatter the crystal trap",art:"new-assets/background/bg07.webp"}),
  Object.freeze({id:"clockwork",name:"Clockwork Catacombs",startX:10750,theme:"clockwork",objective:"Outmaneuver the clockwork piston",art:"new-assets/background/bg04.webp"}),
  Object.freeze({id:"molten",name:"Molten Depths",duration:40,startX:16100,theme:"molten",objective:"Escape the molten geyser",art:"new-assets/background/bg06.webp"}),
  Object.freeze({id:"treasury",name:"Royal Treasury",duration:40,startX:21500,theme:"treasury",objective:"Survive the royal earth burst",art:"new-assets/background/bg10.webp"})
]);
export function getExpeditionStage(index){
  return Number.isInteger(index)&&index>=0&&index<EXPEDITION_STAGES.length?EXPEDITION_STAGES[index]:null;
}
export function expeditionStarCount(run){
  if(!getExpeditionStage(run?.stageIndex)||run.result!=="complete")return 0;
  return 1+Number(run.damageTaken<=1)+Number(run.worldObjective===true);
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
