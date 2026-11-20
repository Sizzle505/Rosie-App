import { CAPTAIN_LEVELS } from "./captainLevels.js";

const art = (chapter, file) => "/yacht-dash/" + chapter + "/" + file + ".webp";
const SCENE_SECONDS = 15;
export const YACHT_RUN_SECONDS = 75;
// Playtest mode: all chapters are immediately selectable, without progression locks.
export const YACHT_PLAYTEST_ALL_LEVELS = true;
export function yachtPlayableLimit(unlockedLevel) {
  return YACHT_PLAYTEST_ALL_LEVELS ? YACHT_CHAPTERS.length - 1 : yachtUnlockedLevel(unlockedLevel);
}


/**
 * Each chapter is a complete voyage. Five paintings cycle during that chapter;
 * completing one chapter unlocks the next one (not another scene of the same run).
 *
 * New binary masters are staged in Dropbox in:
 * Rosie-App-Transfer/Yacht-Dash-Approved-Expansion-Assets-20261119.zip
 * and must be copied into public/yacht-dash/ before final release.
 */
export const YACHT_CHAPTERS = Object.freeze([
  {
    id: "sakura", name: "Sakura Strait", destination: "SAKURA COVE",
    description: "The original Japanese coastal voyage. Collect treats and navigate the torii strait.",
    climate: "sunlit", cadence: 650, pace: 0,
    victory: art("victories", "sakura"), unlockedBy: null, scenes: null
  },
  {
    id: "typhoon", name: "Typhoon Passage", destination: "STORMBREAK PORT",
    description: "Ride out the squall. Reef rocks, wreckage, and changing channels demand precision.",
    climate: "storm", cadence: 600, pace: .13, unlockedBy: "sakura",
    victory: art("victories", "typhoon"),
    scenes: [
      art("typhoon", "01-approaching-squall"), art("typhoon", "02-temple-cliffs"),
      art("typhoon", "03-torii-waterfalls"), art("typhoon", "04-lantern-storm"),
      art("typhoon", "05-storm-clears")
    ]
  },
  {
    id: "moonlight", name: "Moonlight Regatta", destination: "MOONLIGHT QUAY",
    description: "A lantern-lit night race. Outmaneuver the rival yacht and collect the regatta prizes.",
    climate: "moonlit", cadence: 570, pace: .19, unlockedBy: "typhoon",
    victory: art("victories", "moonlight"),
    scenes: [
      art("moonlight", "01-regatta-arrival"), art("moonlight", "02-torii-moonrise"),
      art("moonlight", "03-shrine-bay"), art("moonlight", "04-blossom-channel"),
      art("moonlight", "05-harbor-pagoda")
    ]
  },
  {
    id: "emperor", name: "The Emperor's Finale", destination: "IMPERIAL MARINA",
    description: "The imperial championship. Brave the combined hazards to earn the emperor's honor.",
    climate: "sunlit", cadence: 545, pace: .28, unlockedBy: "moonlight",
    victory: art("victories", "emperor"),
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
    return { ...fallback, name: chapter.name, chapterId: "sakura" };
  }
  return {
    id: chapter.id + "-" + index, name: chapter.name, chapterId: chapter.id,
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
export const YACHT_CHAPTER_GOALS = Object.freeze({
  sakura: { score: 650, expert: 1450, nearMisses: 0, rivals: 0,
    description: "Reach Sakura Cove. Golden Cheese and clean cargo streaks earn medals." },
  typhoon: { score: 850, expert: 1700, nearMisses: 2, rivals: 0,
    description: "Survive the storm. Expert captains earn two clean near misses." },
  moonlight: { score: 950, expert: 1900, nearMisses: 0, rivals: 2,
    description: "Outrace the regatta fleet. Two yacht passes earn the highest honor." },
  emperor: { score: 1200, expert: 2300, nearMisses: 2, rivals: 2,
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

const HAZARDS = Object.freeze({
  typhoon: ["storm-buoy", "driftwood", "reef-rocks", "whirlpool",
    "fishing-skiff", "cargo-crate", "storm-torii", "barrel-raft", "drift-net",
    "harbor-pylons", "fallen-stone-lantern"],
  moonlight: ["lantern-raft", "moonlight-race-buoy", "taiko-barge",
    "fan-raft", "regatta-beacon"],
  emperor: ["storm-buoy", "reef-rocks", "lantern-raft", "storm-torii",
    "drift-net", "moonlight-race-buoy", "regatta-beacon", "barrel-raft"]
});

const pickup = (kind, lane) => ({ kind, lane });
const hazard = (chapter, idx, lane, driftTo) => ({
  kind: "obstacle", lane,
  label: "Avoid " + HAZARDS[chapter][idx % HAZARDS[chapter].length].replaceAll("-", " "),
  asset: art("obstacles", HAZARDS[chapter][idx % HAZARDS[chapter].length]),
  ...(driftTo === undefined ? {} : { driftTo })
});

/** Never blocks all 3 lanes. Drifting hazards switch before the collision zone. */
export function yachtWaveFor(chapterId, sequence, randomIndex) {
  if (chapterId === "sakura") return [];
  const lane = randomIndex(3);
  const adjacent = (lane + 1) % 3;
  const safe = (lane + 2) % 3;
  const cargo = sequence % 7 === 0 ? "cheese" : sequence % 3 === 0 ? "treat" : "ball";
  const pool = chapterId === "emperor" ? "emperor" : chapterId;
  if (!HAZARDS[pool]) return [pickup(cargo,lane)];
  if (chapterId === "moonlight" && sequence % 7 === 3) {
    return [{
      kind:"rival", lane, driftTo: adjacent, label: "Rival yacht",
      asset:art("obstacles","rival-yacht-front")
    }, pickup("cheese",safe)];
  }
  if (chapterId === "emperor" && sequence % 8 === 4) {
    return [{
      kind:"rival", lane, driftTo: adjacent, label:"Imperial rival yacht",
      asset:art("obstacles","rival-yacht-turn")
    }, pickup("cheese",safe)];
  }
  if (sequence % (chapterId === "typhoon" ? 6 : 5) === 2) {
    return [hazard(pool,sequence,lane),hazard(pool,sequence+3,adjacent),pickup("cheese",safe)];
  }
  if (sequence % 3 === 1) {
    const driftTo=chapterId==="moonlight" ? adjacent : undefined;
    return [hazard(pool,sequence,lane,driftTo),pickup("treat",safe)];
  }
  return [pickup(cargo,lane)];
}
