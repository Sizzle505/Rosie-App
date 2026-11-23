// Five-world victory presentation uses existing, production game assets only.
// The URLs below are deliberately explicit so missing or renamed art is visible in review.
export const EMBER_VICTORY_WORLDS = Object.freeze([
  Object.freeze({
    id: "barkroot", name: "Barkroot Passage", accent: "#e7c080",
    backdrop: "/ember-drill/scenic-barkroot.webp", backdropPosition: "50% 50%"
  }),
  Object.freeze({
    id: "ruby", name: "Ruby Temple", accent: "#f1a0a8",
    backdrop: "/ember-drill/scenic-temple.webp", backdropPosition: "64% 50%"
  }),
  Object.freeze({
    id: "clockwork", name: "Clockwork Catacombs", accent: "#e5c894",
    backdrop: "/ember-drill/expansion-batch-c/transitions/ruby-clockwork.webp",
    backdropPosition: "84% 50%", bossName: "Copperjack"
  }),
  Object.freeze({
    id: "molten", name: "Molten Depths", accent: "#ffbb79",
    backdrop: "/ember-drill/expansion-batch-c/transitions/clockwork-molten.webp",
    backdropPosition: "84% 50%", bossName: "Cinderclaw"
  }),
  Object.freeze({
    id: "treasury", name: "Royal Treasury", accent: "#e4c3ff",
    backdrop: "/ember-drill/expansion-batch-c/transitions/molten-treasury.webp",
    backdropPosition: "84% 50%", bossName: "Mole King"
  })
]);
export const EMBER_VICTORY_DRILL = "/ember-drill/drill-body.webp";
export const EMBER_VICTORY_MARKERS =
  "/ember-drill/expansion-batch-c/atlases/world-markers-atlas.webp";

export function victoryMarkerPosition(stageIndex) {
  if (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex > 4) {
    throw new RangeError("Unknown Tunnel expedition world");
  }
  return {
    backgroundPosition: (stageIndex % 3) * 50 + "% " +
      Math.floor(stageIndex / 3) * 100 + "%",
    backgroundSize: "300% 200%"
  };
}

export function victoryReport(hud) {
  return {
    score: Math.max(0, Number(hud?.score) || 0),
    distance: Math.max(0, Number(hud?.distance) || 0),
    gems: Math.max(0, Number(hud?.gems) || 0),
    boosts: Math.max(0, Number(hud?.boosts) || 0),
    secrets: Math.max(0, Number(hud?.secrets) || 0),
    rocks: Math.max(0, Number(hud?.shards) || 0) +
      Math.max(0, Number(hud?.wallsBroken) || 0),
    damage: Math.max(0, Number(hud?.damageTaken) || 0),
    objectiveComplete: hud?.worldObjective === true,
    bossDefeated: hud?.bossDefeated === true
  };
}

// Demonstration data, never part of a player's score or saved progress.
// Available only on the isolated PR review route.
export function sampleVictoryHud(stageIndex, stars) {
  const index = Math.min(4, Math.max(0, Number(stageIndex) || 0));
  const earned = Math.min(3, Math.max(1, Number(stars) || 3));
  return {
    result: "complete", stageIndex: index,
    score: 16500 + index * 4950,
    distance: 810 + index * 165,
    gems: 12 + index * 4,
    boosts: 2 + index,
    secrets: index % 2,
    shards: 6 + index * 3,
    wallsBroken: 2 + index,
    damageTaken: earned >= 2 ? 0 : 2,
    worldObjective: earned === 3,
    bossDefeated: index >= 2
  };
}
