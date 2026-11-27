import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { YACHT_CHAPTERS, YACHT_CHAPTER_GOALS, YACHT_CHAPTER_PHASES,
  yachtRunSeconds, yachtUnlockedLevel, yachtNextUnlocked } from "../src/yachtDashExpansion.js";
import { sceneMusicTrack } from "../src/rosieMusicCatalog.js";

const root = path.resolve("src", "..");
const expansionSource = fs.readFileSync(path.join(root, "src", "yachtDashExpansion.js"), "utf-8");

test("finale chapter is a fifth, boss-mode entry after the emperor chapter", () => {
  assert.equal(YACHT_CHAPTERS.length, 5);
  const finale = YACHT_CHAPTERS[4];
  assert.equal(finale.id, "kuroi-finale");
  assert.equal(finale.mode, "boss");
  assert.equal(finale.name, "Kuroi's Last Charge");
  assert.equal(finale.destination, "FIREWORKS QUAY");
  assert.equal(finale.unlockedBy, "emperor");
  assert.equal(finale.scenes.length, 5);
  assert.equal(finale.sceneTitles.length, 5);
  assert.ok(YACHT_CHAPTER_PHASES["kuroi-finale"]);
  assert.equal(YACHT_CHAPTER_GOALS["kuroi-finale"].score, 600);
  assert.equal(YACHT_CHAPTER_GOALS["kuroi-finale"].expert, 1200);
});

test("finale victory art is the corrected arena illustration, not the emperor's", () => {
  const finale = YACHT_CHAPTERS[4];
  assert.equal(finale.victory, "/yacht-dash/kuroi-arena/victory-kuroi-finale.webp");
  assert.notEqual(finale.victory, YACHT_CHAPTERS[3].victory);
  const file = path.join(root, "public", finale.victory.slice(1));
  const contents = fs.readFileSync(file);
  assert.equal(contents.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(contents.subarray(8, 12).toString("ascii"), "WEBP");
  assert.ok(contents.length > 10_000, "victory art unexpectedly small");
});

test("finale unlock clamps widen to the fifth chapter", () => {
  assert.equal(yachtUnlockedLevel(4), 4);
  assert.equal(yachtUnlockedLevel(99), 4);
  assert.equal(yachtNextUnlocked(3, 3), 4);
  assert.equal(yachtNextUnlocked(0, 0), 1);
});

test("finale run is 90 seconds of elapsed boss time", () => {
  assert.equal(yachtRunSeconds(4), 90);
  assert.equal(yachtRunSeconds(3), 75);
  assert.equal(yachtRunSeconds(0), 60);
});

test("finale reuses the emperor soundtrack (no fifth track needed)", () => {
  assert.equal(sceneMusicTrack("yacht", "playing", { chapter: 4 }), "yacht-emperor");
});

test("the lane finale machine is gone; the arena module owns the boss rules", () => {
  assert.ok(!expansionSource.includes("export const KUROI_BOSS"),
    "lane finale constants still exported");
  assert.ok(!expansionSource.includes("export function kuroiBossStep"),
    "lane finale machine still exported");
  assert.ok(!expansionSource.includes("export function kuroiBossInitial"),
    "lane finale initial state still exported");
  assert.ok(expansionSource.includes("yachtArenaBoss.js"),
    "pointer to the arena module missing");
  const arenaSource = fs.readFileSync(path.join(root, "src", "yachtArenaBoss.js"), "utf-8");
  assert.ok(arenaSource.includes("export function arenaStep"), "arena machine missing");
  assert.ok(arenaSource.includes("export function arenaInitial"), "arena initial state missing");
});

test("fireworks barge asset is present, valid WebP and in the manifest", () => {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(root, "public", "yacht-dash", "asset-manifest.json"), "utf-8"));
  const entry = manifest.assets.find((asset) => asset.id === "fireworks-barge");
  assert.ok(entry, "fireworks barge missing from the asset manifest");
  const file = path.join(root, "public", entry.file.slice(1));
  const contents = fs.readFileSync(file);
  assert.equal(contents.length, entry.size);
  assert.equal(contents.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(contents.subarray(8, 12).toString("ascii"), "WEBP");
  assert.ok(contents.length > 100_000, "barge sprite unexpectedly small");
});
