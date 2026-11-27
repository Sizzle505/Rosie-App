// Optional five-world playtest using the original cave physics and approved art.
// Stages 3-5 use the integrated batch-D boss arenas, attack art and earned-
// Turbo treasure mechanisms; Molten and Treasury include playable boss fights.
// 2026-11-25 (Mitchell's overnight directive): every world now runs a full
// 30-second route — Barkroot and Ruby were remade longer (was 15s), and the
// boss worlds tunnel for ~30s before the arena instead of ~8.5s. Boss HP
// (2/3/4) and the dedicated boss clocks (35/45/55s) are unchanged.
export const EXPEDITION_STAGE_SECONDS=30;
// Boss-world opening grace (seconds) for ALL damage sources: wall,
// formations, hazards, shutters and course rocks/spikes. The opening of a
// boss-stage route is a settle-in with no damage at all — the corridor
// centre dives ~270px vertically in the first seconds while the drill
// spawns frozen at the top of it, so an unsteered drill lost 2 hull
// to the wall alone (Royal 4.18s/5.67s/7.15s, seed 1467) even though the
// formation grace worked. The grace was 8s in round 5 and still cost the
// unsteered Royal drill one hull: measured, the wall hit lands at t=8.01,
// the first frame past the lapse, with the drill at y=253 far outside
// the corridor. The grace therefore runs 8.5s from spawn. It is a
// settle-in only: since 2026-11-25 the arena entry sits at 30s
// (BOSS_INTRO_TIME), so the remaining ~21.5s of tunnel is fully live.
// Hull is still lost for genuinely bad steering after the opening.
// Non-boss worlds keep the 3s settle-in.
export function openingGraceSeconds(stageIndex){
  return Number.isInteger(stageIndex)&&stageIndex>=2?8.5:3;
}
export const EXPEDITION_STAGES=Object.freeze([
  Object.freeze({id:"barkroot",name:"Barkroot Passage",duration:30,startX:0,theme:"barkroot",objective:"Break an earth wall",art:"new-assets/background/bg01.webp"}),
  Object.freeze({id:"ruby",name:"Ruby Temple",duration:30,startX:5450,theme:"ruby",objective:"Evade or shatter the crystal trap",art:"new-assets/background/bg07.webp"}),
  Object.freeze({id:"clockwork",name:"Clockwork Catacombs",duration:30,startX:10750,theme:"clockwork",objective:"Outmaneuver the clockwork piston",art:"new-assets/background/bg04.webp"}),
  Object.freeze({id:"molten",name:"Molten Depths",duration:30,startX:16100,theme:"molten",objective:"Escape the molten geyser",art:"new-assets/background/bg06.webp"}),
  Object.freeze({id:"treasury",name:"Royal Treasury",duration:30,startX:21500,theme:"treasury",objective:"Survive the royal earth burst",art:"new-assets/background/bg10.webp"})
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
