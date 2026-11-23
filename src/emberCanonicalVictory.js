// Victory scenes must use existing Tunnel environment art and the approved
// drillcraft. Never substitute concept-poster artwork for these sources.
export const EMBER_CANONICAL_VICTORY_BACKDROPS=Object.freeze([
  "/ember-drill/scenic-barkroot.webp",
  "/ember-drill/ruby-organic-passage.webp",
  "/ember-drill/expansion-batch-c/transitions/ruby-clockwork.webp",
  "/ember-drill/expansion-batch-c/transitions/clockwork-molten.webp",
  "/ember-drill/expansion-batch-c/transitions/molten-treasury.webp"
]);
export const EMBER_CANONICAL_DRILL="/ember-drill/drill-body.webp";
export function victoryBackdropForStage(stageIndex){
  return Number.isInteger(stageIndex)&&stageIndex>=0&&stageIndex<EMBER_CANONICAL_VICTORY_BACKDROPS.length
    ? EMBER_CANONICAL_VICTORY_BACKDROPS[stageIndex]
    : null;
}
