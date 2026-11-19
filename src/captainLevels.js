/** Yacht Dash's five ordered passages. Existing paintings remain the canonical art. */
export const CAPTAIN_LEVELS = Object.freeze([
  { id: "sunrise", name: "Sakura Strait", background: "/captain-levels/sunrise-across-torii-sea.webp", climate: "sunlit",
    challenge: "Follow the cheese trail. Watch the fishing buoys.", cadence: 655, pace: 0 },
  { id: "twilight", name: "Lantern Lagoon", background: "/captain-levels/twilight-sakura-harbor.webp", climate: "petals",
    challenge: "Drifting markers change lanes. Read their arrows.", cadence: 615, pace: .12 },
  { id: "tempest", name: "Typhoon Passage", background: "/captain-levels/tempest-gate.webp", climate: "storm",
    challenge: "Find the clear lane between storm buoys.", cadence: 580, pace: .3 },
  { id: "moonlight", name: "Moonlight Regatta", background: "/captain-levels/moonlit-shrine-valley.webp", climate: "moonlit",
    challenge: "Outmaneuver the rival yachts to earn bonus points.", cadence: 565, pace: .2 },
  { id: "golden", name: "The Royal Dash", background: "/captain-levels/golden-misty-isles.webp", climate: "sunlit",
    challenge: "The grand finale. Collect the gold; dodge the fleet.", cadence: 540, pace: .35 }
]);

/** A wave never blocks all three lanes with hazards. Lane changes are telegraphed
 * well before the ship's collision zone, and never happen within it. */
export function captainTrafficWave(stageId, step, randomIndex) {
  const lane = randomIndex(3);
  const next = (lane + 1) % 3;
  const far = (lane + 2) % 3;
  const cargo = step % 7 === 0 ? "cheese" : step % 3 === 0 ? "treat" : "ball";
  const item = (kind, inLane, extra = {}) => ({ kind, lane: inLane, ...extra });
  switch (stageId) {
    case "sunrise":
      if (step % 8 === 5) return [item("buoy", lane), item("cheese", next)];
      if (step % 9 === 3) return [item("buoy", lane)];
      return [item(cargo, lane)];
    case "twilight":
      if (step % 7 === 4) return [item("buoy", lane, { driftTo: next })];
      if (step % 8 === 2) return [item("buoy", lane), item("treat", far)];
      if (step % 9 === 0) return [item("cheese", lane), item("ball", next)];
      return [item(cargo, lane)];
    case "tempest":
      if (step % 6 === 3) return [item("buoy", lane), item("buoy", next), item("cheese", far)];
      if (step % 5 === 1) return [item("buoy", lane)];
      return [item(cargo, lane)];
    case "moonlight":
      if (step % 6 === 3) return [item("rival", lane, { driftTo: next })];
      if (step % 7 === 1) return [item("buoy", lane), item("treat", far)];
      return [item(cargo, lane)];
    case "golden":
      if (step % 8 === 4) return [item("rival", lane, { driftTo: far })];
      if (step % 7 === 2) return [item("buoy", lane), item("buoy", next), item("cheese", far)];
      if (step % 5 === 0) return [item("cheese", lane), item("treat", next)];
      return [item(cargo, lane)];
    default:
      return [item(cargo, lane)];
  }
}
