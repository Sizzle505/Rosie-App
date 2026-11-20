import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROSIE_HAIKUS, ROSIE_HAIKU_MOODS, poemForDay,
  poemForTopic, localDayKey, formatHaiku
} from "../src/haikuEngine.js";

test("the collection has distinct well-formed verses", () => {
  assert.ok(ROSIE_HAIKUS.length >= 24);
  assert.equal(new Set(ROSIE_HAIKUS.map((poem) => poem.id)).size, ROSIE_HAIKUS.length);
  const validMoods = new Set(ROSIE_HAIKU_MOODS.map((mood) => mood.id));
  for (const poem of ROSIE_HAIKUS) {
    assert.ok(validMoods.has(poem.mood), poem.id);
    assert.equal(poem.lines.length, 3, poem.id);
    for (const line of poem.lines) {
      assert.equal(line, line.trim(), poem.id);
      assert.ok(line.length > 4 && line.length < 80, poem.id);
    }
  }
});

test("the daily poem changes without repetition through an entire collection cycle", () => {
  const first = new Date(2026, 10, 20);
  const ids = Array.from({ length: ROSIE_HAIKUS.length }, (_, offset) =>
    poemForDay(new Date(first.getFullYear(), first.getMonth(), first.getDate() + offset)).id
  );
  assert.equal(new Set(ids).size, ROSIE_HAIKUS.length);
  assert.deepEqual(poemForDay(first), poemForDay(first));
  assert.equal(localDayKey(first), "2026-11-20");
});

test("topic matching chooses the intended special verses without changing the chosen voice", () => {
  assert.equal(poemForTopic("The VACUUM cleaner", "savage").id, "vacuum");
  assert.equal(poemForTopic("a birthday cake", "savage").id, "birthday");
  assert.equal(poemForTopic("I need a nap", "zen").id, "sleep");
  assert.equal(poemForTopic("vacuum", "zen").mood, "zen");
  assert.equal(poemForTopic("an unusual subject", "sweet").mood, "sweet");
});

test("unknown subjects remain visible as dedications, with safe length and variant rotation", () => {
  const topic = "Arbitrary subject";
  const first = poemForTopic(topic, "existential", 0);
  const second = poemForTopic(topic, "existential", 1);
  assert.equal(first.title, "For Arbitrary subject");
  assert.notEqual(first.id, second.id);
  assert.equal(poemForTopic("x".repeat(500), "zen").topic.length, 100);
  assert.ok(formatHaiku(first).includes(first.lines.join("\n")));
});

test("all integrated Haiku Garden art files ship with valid image headers", () => {
  const artDir = resolve(dirname(fileURLToPath(import.meta.url)), "../public/rosieverse/haiku");
  for (const asset of [
    "field-sunrise.webp", "zen-sunrise.webp", "temple-sunrise.webp",
    "rosie-meditating-paws-up.webp", "haiku-scroll-isolated.png",
    "scroll-grand.webp", "scroll-mobile.webp", "lantern.webp",
    "sakura-canopy.webp", "garden-atmosphere.webp", "garden-ui-sheet.webp",
    "calligraphy-desk.webp", "inkstone-set.webp", "brushstroke-sprites.webp",
    "enlightenment-transition.webp",
    "rosie-contemplative.webp", "rosie-calligrapher.webp",
    "rosie-smug.webp", "rosie-affectionate.webp", "rosie-existential.webp",
    "rosie-indignant.webp", "rosie-inspired.webp", "rosie-triumphant.webp",
    "rosie-bestowing-wisdom.webp", "rosie-meditating-animation.webp",
    "rosie-meditation-frames.webp", "rosie-meditation-breathing.webp"
  ]) {
    const path = resolve(artDir, asset);
    assert.ok(statSync(path).size > 100_000, asset + " must be genuine full-resolution art");
    const head = readFileSync(path).subarray(0, 12);
    if (asset.endsWith(".webp")) {
      assert.equal(head.subarray(0, 4).toString("ascii"), "RIFF", asset);
      assert.equal(head.subarray(8, 12).toString("ascii"), "WEBP", asset);
    } else {
      assert.equal(head.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", asset);
    }
  }
});

test("all 39 recovered original Haiku image assets are committed with real WebP bytes", () => {
  const artDir = resolve(dirname(fileURLToPath(import.meta.url)), "../public/rosieverse/haiku");
  const manifest = JSON.parse(readFileSync(resolve(artDir, "archive-source-manifest.json"), "utf8"));
  assert.equal(manifest.total_assets, 39);
  assert.equal(manifest.assets.length, 39);
  const unique = new Set(manifest.assets.map((asset) => asset.path));
  assert.equal(unique.size, 39);
  let bytes = 0;
  for (const item of manifest.assets) {
    assert.match(item.path, /^(ornaments|living-garden)\/[a-z0-9-]+\.webp$/);
    const imagePath = resolve(artDir, item.path);
    assert.ok(statSync(imagePath).size > 1000, "missing or empty " + item.path);
    assert.equal(statSync(imagePath).size, item.bytes, item.path + " byte size changed");
    const head = readFileSync(imagePath).subarray(0, 12);
    assert.equal(head.subarray(0, 4).toString("ascii"), "RIFF", item.path);
    assert.equal(head.subarray(8, 12).toString("ascii"), "WEBP", item.path);
    bytes += item.bytes;
  }
  assert.equal(manifest.bytes, bytes);
  for (const name of [
    "ornaments/imperial-paw-crest.webp",
    "ornaments/tab-daily.webp","ornaments/tab-compose.webp",
    "ornaments/tab-meditate.webp","ornaments/tab-journal.webp",
    "living-garden/field-sunbeams.webp","living-garden/golden-pollen.webp",
    "living-garden/zen-sand-sheen.webp","living-garden/temple-lantern.webp",
    "living-garden/petal-01.webp","living-garden/petal-12.webp"
  ]) assert.ok(unique.has(name), name);
});
