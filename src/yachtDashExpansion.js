import { CAPTAIN_LEVELS } from "./captainLevels.js";

const art = (chapter, file) => "/yacht-dash/" + chapter + "/" + file + ".webp";
const SCENE_SECONDS = 15;
export const YACHT_RUN_SECONDS = 75;
export const YACHT_EXTRA_TREAT_MS = 8500; // One additional treat about every 8.5s in expanded levels.
export const YACHT_CLEAN_PASS_POINTS = 25;
export const YACHT_CLEAN_PASS_TURBO = 8;

// Playtest mode: all chapters are immediately selectable, without progression locks.
export const YACHT_PLAYTEST_ALL_LEVELS = true;
export function yachtPlayableLimit(unlockedLevel) {
  return YACHT_PLAYTEST_ALL_LEVELS ? YACHT_CHAPTERS.length - 1 : yachtUnlockedLevel(unlockedLevel);
}


/**
 * Each chapter is a complete voyage. Five paintings cycle during that chapter;
 * completing one chapter unlocks the next one (not another scene of the same run).
 *
 * All 39 approved images now live in public/yacht-dash/ with a SHA-256
 * asset manifest. The original Sakura scenery remains untouched.
 */
export const YACHT_CHAPTERS = Object.freeze([
  {
    id: "sakura", name: "Sakura Strait", destination: "SAKURA COVE",
    description: "The original Japanese coastal voyage. Collect treats and navigate the torii strait.",
    climate: "sunlit", cadence: 650, pace: 0,
    victory: art("victories", "sakura"), unlockedBy: null, scenes: null, sceneTitles: null
  },
  {
    id: "typhoon", name: "Typhoon Passage", destination: "STORMBREAK PORT",
    description: "Ride out the squall. Wide reefs, fallen logs and a torii with a clear center passage. One supply chest restores hull and Turbo.",
    climate: "storm", cadence: 2250, pace: .13, unlockedBy: "sakura",
    victory: art("victories", "typhoon"),
    sceneTitles: ["Gathering Squall", "Temple Cliffs", "Thunder Gate",
      "Lanterns in the Storm", "Stormbreak Horizon"],
    scenes: [
      art("typhoon", "01-approaching-squall"), art("typhoon", "02-temple-cliffs"),
      art("typhoon", "03-torii-waterfalls"), art("typhoon", "04-lantern-storm"),
      art("typhoon", "05-storm-clears")
    ]
  },
  {
    id: "moonlight", name: "Moonlight Regatta", destination: "MOONLIGHT QUAY",
    description: "A lantern-lit race with larger floating barriers and rival yachts. One supply chest restores hull and Turbo.",
    climate: "moonlit", cadence: 2150, pace: .19, unlockedBy: "typhoon",
    victory: art("victories", "moonlight"),
    sceneTitles: ["Race at Moonrise", "Torii Under Stars", "Moonlit Shrine Bay",
      "Blossom Channel", "Regatta Finish"],
    scenes: [
      art("moonlight", "01-regatta-arrival"), art("moonlight", "02-torii-moonrise"),
      art("moonlight", "03-shrine-bay"), art("moonlight", "04-blossom-channel"),
      art("moonlight", "05-harbor-pagoda")
    ]
  },
  {
    id: "emperor", name: "The Emperor's Finale", destination: "IMPERIAL MARINA",
    description: "The imperial championship combines large barriers, arch passages and rival yachts. One supply chest restores hull and Turbo.",
    climate: "sunlit", cadence: 2050, pace: .28, unlockedBy: "moonlight",
    victory: art("victories", "emperor"),
    sceneTitles: ["Imperial Harbor", "Ceremonial Waterway", "Golden Palace Bay",
      "Twilight at the Marina", "The Emperor's Approach"],
    scenes: [
      art("emperor", "01-imperial-harbor"), art("emperor", "02-ceremonial-waterway"),
      art("emperor", "03-gilded-sunset-bay"), art("emperor", "04-twilight-palace-marina"),
      art("emperor", "05-palace-final-approach")
    ]
  }
]);

export function yachtSceneFor(chapterIndex, elapsed, originalSceneOrder = [0,1,2,3,4]) {
  const chapter = YACHT_CHAPTERS[Math.max(0, Math.min(YACHT_CHAPTERS.length - 1, chapterIndex))];
  const index = Math.min(4, Math.max(0, Math.floor(Math.max(0,elapsed) / SCENE_SECONDS)));
  const fallback = CAPTAIN_LEVELS[originalSceneOrder[index] ?? index];
  if (chapter.id === "sakura") {
    return { ...fallback, chapterId: "sakura" };
  }
  return {
    id: chapter.id + "-" + index, name: chapter.sceneTitles[index], chapterId: chapter.id,
    background: chapter.scenes[index], fallbackBackground: fallback.background,
    climate: chapter.climate
  };
}

export function yachtUnlockedLevel(stored) {
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(3, Math.floor(parsed))) : 0;
}

export function yachtNextUnlocked(current, completedChapter) {
  return Math.min(3, Math.max(yachtUnlockedLevel(current), completedChapter + 1));
}

/** Stage medal targets reward performance, but do not restrict playtesting access. */
/** Flavor of the three 25-second course phases; the original Sakura
 * phase text stays in CAPTAIN_PHASES. These are narrative, not difficulty gates. */
export const YACHT_CHAPTER_PHASES = Object.freeze({
  typhoon: {
    harbor: { name: "Gathering Squall", copy: "The wind rises. Watch for wreckage and deep reefs." },
    riviera: { name: "Storm Surge", copy: "The sea grows restless. Read the torii opening early." },
    sunset: { name: "Stormbreak Run", copy: "The squall begins to break. Bring Rosie into safe harbor." }
  },
  moonlight: {
    harbor: { name: "Lantern Start", copy: "The moon lights the starting channel. Gather the prizes." },
    riviera: { name: "Regatta Crossing", copy: "Rivals close in. Make each passing lane count." },
    sunset: { name: "Midnight Sprint", copy: "The finish lanterns are in sight. Hold the racing line." }
  },
  emperor: {
    harbor: { name: "Imperial Waters", copy: "The imperial course opens. Expect the unexpected." },
    riviera: { name: "The Emperor's Trial", copy: "Storm debris and rivals now share the royal channel." },
    sunset: { name: "Royal Finish", copy: "One final passage to the imperial podium." }
  }
});

export const YACHT_CHAPTER_GOALS = Object.freeze({
  sakura: { score: 650, expert: 1450, nearMisses: 0, rivals: 0,
    preview: "Collect golden cheese and reach Sakura Cove.",
    description: "Reach Sakura Cove. Golden Cheese and clean cargo streaks earn medals." },
  typhoon: { score: 700, expert: 1350, nearMisses: 2, rivals: 0,
    preview: "Avoid the reefs. The torii center is clear.",
    description: "Survive the storm. Expert captains earn two clean near misses." },
  moonlight: { score: 800, expert: 1500, nearMisses: 0, rivals: 2,
    preview: "Outrace rivals and collect regatta prizes.",
    description: "Outrace the regatta fleet. Two yacht passes earn the highest honor." },
  emperor: { score: 850, expert: 1450, nearMisses: 2, rivals: 2,
    preview: "Master every hazard and earn imperial honors.",
    description: "Earn the imperial medal: survive, pass rivals, and sail with precision." }
});

export function yachtMedalsFor(chapterId, stats) {
  const goal = YACHT_CHAPTER_GOALS[chapterId];
  if (!goal || !stats.completed) return 0;
  const score = Number(stats.score) || 0;
  const lives = Number(stats.lives) || 0;
  const nearMisses = Number(stats.nearMisses) || 0;
  const rivalsPassed = Number(stats.rivalsPassed) || 0;
  let stars = 1;
  if (score >= goal.score) stars++;
  if (score >= goal.expert && lives >= 2 &&
      nearMisses >= goal.nearMisses && rivalsPassed >= goal.rivals) stars++;
  return stars;
}

/** A single next goal makes the medal rules understandable during playtests. */
export function yachtNextMedalHint(chapterId, stats) {
  const goal = YACHT_CHAPTER_GOALS[chapterId];
  if (!goal) return "";
  if (!stats.completed) return "Complete this passage to earn the first medal.";
  const score = Number(stats.score) || 0;
  const lives = Number(stats.lives) || 0;
  const nearMisses = Number(stats.nearMisses) || 0;
  const rivalsPassed = Number(stats.rivalsPassed) || 0;
  if (score < goal.score) return `Next medal: reach ${goal.score.toLocaleString()} points.`;
  if (score < goal.expert) return `Gold: reach ${goal.expert.toLocaleString()} points.`;
  if (lives < 2) return "Gold: finish with two or more hull points intact.";
  if (nearMisses < goal.nearMisses)
    return `Gold: make ${goal.nearMisses} clean near misses.`;
  if (rivalsPassed < goal.rivals)
    return `Gold: pass ${goal.rivals} rival yachts without colliding.`;
  return "All three medals earned. An exemplary voyage.";
}

/** Store only known chapter keys and bounded numeric stats from local storage. */
export function parseYachtRecords(serialized) {
  let input;
  try { input = JSON.parse(serialized || "{}"); } catch { return {}; }
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const records = {};
  for (const { id } of YACHT_CHAPTERS) {
    const record = input[id];
    if (!record || typeof record !== "object") continue;
    const best = Number(record.best);
    const medals = Number(record.medals);
    records[id] = {
      best: Number.isFinite(best) ? Math.max(0, Math.min(9999999, Math.floor(best))) : 0,
      medals: Number.isFinite(medals) ? Math.max(0, Math.min(3, Math.floor(medals))) : 0
    };
  }
  return records;
}

export function updateYachtRecords(records, chapterId, score, medals) {
  if (!YACHT_CHAPTERS.some((stage) => stage.id === chapterId)) return records;
  const previous = records[chapterId] || { best: 0, medals: 0 };
  const best = Math.max(previous.best, Math.max(0, Number(score) || 0));
  const nextMedals = Math.max(previous.medals, Math.max(0, Number(medals) || 0));
  if (best === previous.best && nextMedals === previous.medals) return records;
  return { ...records, [chapterId]: { best, medals: nextMedals } };
}

export function isYachtHazard(kind) {
  return kind === "buoy" || kind === "obstacle" || kind === "rival";
}

/*
 * Larger, sparser hazards: a wide obstruction is one visual entity, with its
 * collision footprint explicitly mapped to two lanes. The gate's two pillars
 * occupy lanes 0 and 2; the center lane remains open under the beam.
 */
const SMALL_HAZARDS = Object.freeze({
  typhoon: ["storm-buoy", "fishing-skiff", "drift-net", "fallen-stone-lantern"],
  moonlight: ["moonlight-race-buoy", "regatta-beacon", "fan-raft"],
  emperor: ["storm-buoy", "regatta-beacon", "fallen-stone-lantern"]
});
const WIDE_HAZARDS = Object.freeze({
  typhoon: ["reef-rocks", "driftwood"],
  moonlight: ["lantern-raft", "taiko-barge"],
  emperor: ["reef-rocks", "driftwood", "barrel-raft"]
});
const collection = (kind, lane) => ({ kind, lane });
const obstacle = (asset, lane, options = {}) => ({
  kind: "obstacle", lane, asset: art("obstacles", asset),
  label: "Avoid " + asset.replaceAll("-", " "),
  ...options
});
const spanObstacle = (asset, side) => obstacle(asset, side, {
  footprint: "wide", blockedLanes: [side, side + 1]
});
const toriiGate = () => obstacle("storm-torii", 1, {
  footprint: "arch", blockedLanes: [0, 2],
  label: "Broken torii gate - steer through the middle"
});

/** Large art overlaps the ship earlier than a small 46px collectible.
 * Start collision when its leading edge reaches the yacht, not when the art
 * has already covered the player's ship. All hazards clear at the same point. */
/**
 * Portrait course perspective. New-stage objects first appear at the far
 * waterline, then steadily grow as they approach Rosie's yacht. Sakura's
 * original movement/appearance remains unchanged.
 */
export function yachtApproachAt(y) {
  const t = Math.max(0, Math.min(1, (Number(y) + 12) / 120));
  return {
    top: 47 + 55 * t,
    scale: 0.30 + 0.70 * t,
    opacity: Math.min(1, 0.62 + t)
  };
}

/** Treats remain legible upstream without growing beyond their existing near-yacht size. */
export function yachtPickupApproachAt(y) {
  const approach = yachtApproachAt(y);
  return { ...approach,
    scale: 0.56 + (approach.scale - 0.30) / 0.70 * 0.44,
    opacity: Math.min(1, 0.82 + (approach.opacity - 0.62) / 0.38 * 0.18)
  };
}

/**
 * Keep new rewards out of the same release corridor as another fresh reward,
 * an approaching obstacle, or either a rival's current/future drift lane.
 * Later hazards are already separated in depth and need not block a delivery.
 */
export function yachtBonusTreatLane(items, preferred) {
  const occupied = new Set();
  for (const item of items || []) {
    if (!Number.isFinite(item?.y) || item.y < -12 || item.y > 32) continue;
    if (isYachtHazard(item.kind)) {
      for (const lane of yachtOccupiedLanes(item)) occupied.add(lane);
      if (item.driftTo !== undefined && !item.drifted) occupied.add(item.driftTo);
    } else if (["ball", "treat", "cheese", "supply"].includes(item.kind)) {
      occupied.add(item.lane);
    }
  }
  const start = Math.max(0, Math.floor(preferred || 0)) % 3;
  for (let offset = 0; offset < 3; offset++) {
    const lane = (start + offset) % 3;
    if (!occupied.has(lane)) return lane;
  }
  return -1;
}

/**
 * A gentle pickup-led opening teaches the helm before Sakura's first buoy.
 * Further cargo varies by roll, but buoys never arrive back-to-back and
 * Golden Cheese periodically returns to keep Turbo attainable.
 */
export function yachtSakuraDelivery(sequence, randomIndex) {
  const step = Math.max(0, Math.floor(sequence));
  if (step < 3) return {
    kind: ["ball", "treat", "cheese"][step], lane: 1
  };
  const lane = randomIndex(3);
  if (step % 10 === 7) return { kind: "buoy", lane };
  if (step % 9 === 0) return { kind: "cheese", lane };
  if (step % 3 === 0) return { kind: "treat", lane };
  const roll = randomIndex(100);
  return { kind: roll < 58 ? "ball" : roll < 91 ? "treat" : "cheese", lane };
}

/**
 * Prevent fast random obstacles from catching a slower treat as it nears the
 * hull. There is still slight variety, but objects share a coherent flow.
 */
export function yachtObjectSpeed(chapterId, kind, randomIndex) {
  const isDanger = isYachtHazard(kind);
  const base = isDanger ? 1.98 : chapterId === "sakura" ? 2.04 : 2.08;
  return base + Math.max(0, Math.min(4, randomIndex(5))) * .035;
}

/**
 * Chapter-aware beats: generous opening water, increasingly brisk finish,
 * and extra warning time before imposing hazards. Every chapter stays well
 * below a visually crowded conveyor of sprites.
 */
export function yachtSpawnInterval(chapterId, phaseKey, sequence) {
  const step = Math.max(0, Math.floor(Number(sequence) || 0));
  const swing = [0, 55, -45, 35, -30][step % 5];
  if (chapterId === "sakura") {
    const base = phaseKey === "harbor" ? 1160 :
      phaseKey === "riviera" ? 1050 : 950;
    return base + swing;
  }
  const stage = YACHT_CHAPTERS.find(chapter => chapter.id === chapterId);
  const base = stage?.cadence ?? 2200;
  const factor = phaseKey === "harbor" ? 1.07 :
    phaseKey === "sunset" ? .94 : 1;
  const encounter = yachtWaveFor(chapterId, step, () => 1)[0];
  const margin = encounter?.footprint === "arch" ? 440 :
    encounter?.footprint === "wide" ? 280 :
    encounter?.kind === "rival" ? 190 :
    isYachtHazard(encounter?.kind) ? 100 : -95;
  return Math.round(base * factor + margin + swing);
}

/** Selective art scaling for props whose transparent masters read too small. */
export function yachtAssetScale(asset) {
  if (typeof asset !== "string") return 1;
  if (asset.endsWith("/fishing-skiff.webp")) return 1.48;
  if (asset.endsWith("/moonlight-race-buoy.webp") ||
      asset.endsWith("/regatta-beacon.webp")) return 1.38;
  return 1;
}

/** Make course gestures intentional: a long horizontal flick crosses two lanes,
 * while vertical scrolling never changes the helm. */
export function yachtSwipeSteps(deltaX, deltaY, courseWidth) {
  const x = Number(deltaX), y = Number(deltaY), width = Number(courseWidth);
  if (![x, y, width].every(Number.isFinite) || width <= 0) return 0;
  if (Math.abs(y) > 24 && Math.abs(y) >= Math.abs(x)) return 0;
  if (Math.abs(x) < 28) return 0;
  return Math.sign(x) * (Math.abs(x) >= Math.max(96, width * .34) ? 2 : 1);
}

/** Read the leading approaching hazard rather than flashing warnings for
 * distant obstacles. A rival's signaled drift is its upcoming occupied lane. */
export function yachtThreatForecast(items) {
  if (!Array.isArray(items)) return null;
  const imminent = items.filter(item => isYachtHazard(item?.kind) &&
    Number.isFinite(item.y) && item.y >= 18 && item.y <= 91)
    .sort((a, b) => b.y - a.y)[0];
  if (!imminent) return null;
  const occupied = imminent.driftTo !== undefined && !imminent.drifted
    ? [imminent.driftTo] : yachtOccupiedLanes(imminent);
  const blocked = [0, 1, 2].filter(lane => occupied.includes(lane));
  return {
    kind: imminent.kind,
    blocked,
    urgent: imminent.y >= 54,
    open: [0, 1, 2].filter(lane => !blocked.includes(lane))
  };
}

/** Use the authoritative lane ref for instantaneous touch/keyboard response. */
export function yachtClampLane(current, direction) {
  const base = Number.isFinite(Number(current)) ? Number(current) : 1;
  const delta = Number.isFinite(Number(direction)) ? Number(direction) : 0;
  return Math.max(0, Math.min(2, Math.round(base + delta)));
}

/** In-game impact grace freezes along with gameplay when the player pauses. */
export const YACHT_IMPACT_GRACE_MS = 1450;
export function yachtCanTakeHit(graceRemainingMs, alreadyHitThisTick = false) {
  return !alreadyHitThisTick && (Number(graceRemainingMs) || 0) <= 0;
}

export function yachtCatchStart(item) {
  return item.footprint === "arch" ? 60 :
    item.footprint === "wide" ? 65 : 77;
}

export function yachtOccupiedLanes(item) {
  return item.blockedLanes ?? [item.lane];
}

export function yachtTouchesHazard(item, lane) {
  return isYachtHazard(item.kind) && yachtOccupiedLanes(item).includes(lane);
}

export function yachtNearMiss(item, lane) {
  return isYachtHazard(item.kind) &&
    !yachtTouchesHazard(item, lane) &&
    yachtOccupiedLanes(item).some((blocked) => Math.abs(blocked - lane) === 1);
}

/* Exactly one emergency cargo chest may appear per new chapter, after the
 * first major obstacles. It repairs one hull, recharges Turbo and awards points.
 * The original Sakura game and its pickup frequencies are left intact. */
export function yachtWaveFor(chapterId, sequence, randomIndex) {
  if (chapterId === "sakura") return [];
  if (!SMALL_HAZARDS[chapterId]) return [collection("ball", randomIndex(3))];

  const lane = randomIndex(3);
  const side = lane === 2 ? 1 : lane;
  const safeLane = side === 0 ? 2 : 0;
  const cargo = sequence % 7 === 0 ? "cheese" : sequence % 3 === 0 ? "treat" : "ball";

  if (sequence === 12) {
    return [{
      kind: "supply", lane, label: "Emergency supplies - restore one hull and recharge Turbo",
      asset: art("obstacles", "cargo-crate"),
      points: 150, turbo: 60
    }];
  }

  if ((chapterId === "typhoon" || chapterId === "emperor") &&
      (sequence === 6 || sequence === 22)) return [toriiGate()];

  // The rival yacht is a single, readable encounter, not one of several
  // small hazards appearing in the same frame.
  if ((chapterId === "moonlight" && sequence % 9 === 4) ||
      (chapterId === "emperor" && sequence % 10 === 4)) {
    return [{
      kind: "rival", lane, driftTo: (lane + 1) % 3,
      label: "Rival yacht",
      asset: art("obstacles", sequence % 2 ? "rival-yacht-turn" : "rival-yacht-front")
    }];
  }

  if (sequence % 5 === 2) {
    const choices = WIDE_HAZARDS[chapterId];
    return [spanObstacle(choices[Math.floor(sequence / 5) % choices.length], side)];
  }

  if (sequence % 7 === 1) {
    const choices = SMALL_HAZARDS[chapterId];
    return [obstacle(choices[Math.floor(sequence / 7) % choices.length], lane)];
  }

  // One reward per wave, with breathing room between large obstacles.
  return [collection(cargo, sequence % 4 === 0 ? safeLane : lane)];
}
