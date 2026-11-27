// Boss result presentation is intentionally separate from the simulation.
// The terminal state freezes movement, but the painted boss and sparks remain
// visible before a successful boss-fight result overlay is allowed to mount.
export const BOSS_VICTORY_REVEAL_DELAY_MS = 2500;
export function shouldHoldBossVictory(snapshot) {
  return Boolean(snapshot && snapshot.result === "complete" &&
    snapshot.bossDefeated === true);
}
// 2026-11-25 remake: non-boss world completions get the same courtesy —
// the drill crosses the exit gate and the finished tunnel stays on screen
// briefly before the victory painting fades in over it. Classic has no
// victory painting, so it keeps its instant report.
export const WORLD_VICTORY_REVEAL_DELAY_MS = 1400;
export function shouldHoldWorldVictory(snapshot) {
  return Boolean(snapshot && snapshot.result === "complete" &&
    snapshot.stageIndex !== null && snapshot.stageIndex !== undefined &&
    snapshot.bossDefeated !== true);
}
