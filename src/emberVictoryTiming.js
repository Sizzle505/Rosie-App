// Boss result presentation is intentionally separate from the simulation.
// The terminal state freezes movement, but the painted boss and sparks remain
// visible before a successful boss-fight result overlay is allowed to mount.
export const BOSS_VICTORY_REVEAL_DELAY_MS = 2500;
export function shouldHoldBossVictory(snapshot) {
  return Boolean(snapshot && snapshot.result === "complete" &&
    snapshot.bossDefeated === true);
}
