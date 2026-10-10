/** Five scenery-only visual levels; the game loop owns steering and collisions. */
export const CAPTAIN_LEVELS = Object.freeze([
  { id: "sunrise", name: "Torii Sunrise", background: "/captain-levels/sunrise-across-torii-sea.webp", climate: "sunlit" },
  { id: "twilight", name: "Lantern Harbor", background: "/captain-levels/twilight-sakura-harbor.webp", climate: "petals" },
  { id: "moonlight", name: "Moonlit Passage", background: "/captain-levels/moonlit-shrine-valley.webp", climate: "moonlit" },
  { id: "golden", name: "Golden Isles", background: "/captain-levels/golden-misty-isles.webp", climate: "sunlit" },
  { id: "tempest", name: "Tempest Gate", background: "/captain-levels/tempest-gate.webp", climate: "storm" }
]);
export function shuffleCaptainLevelOrder(random = Math.random) {
  const order = CAPTAIN_LEVELS.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
