import test from "node:test";
import assert from "node:assert/strict";
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
