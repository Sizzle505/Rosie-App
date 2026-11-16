import test from "node:test";
import assert from "node:assert/strict";
import { drawSecretSanta } from "../api/_lib/secretSantaDraw.js";

test("draws a one-to-one mapping with no self assignments", () => {
  for (let size = 3; size <= 40; size++) {
    const ids = Array.from({ length: size }, (_, i) => String(i));
    const mapping = drawSecretSanta(ids);
    assert.equal(Object.keys(mapping).length, size);
    assert.equal(new Set(Object.values(mapping)).size, size);
    for (const id of ids) assert.notEqual(mapping[id], id);
  }
});
test("respects directional exclusions", () => {
  const ids = ["a", "b", "c", "d", "e"];
  const forbidden = [{ giver: "a", recipient: "b" }, { giver: "a", recipient: "c" }, { giver: "d", recipient: "a" }];
  for (let i = 0; i < 100; i++) {
    const mapping = drawSecretSanta(ids, forbidden);
    assert.ok(mapping);
    for (const pair of forbidden) assert.notEqual(mapping[pair.giver], pair.recipient);
  }
});
test("returns null for impossible restrictions", () => {
  const ids = ["a", "b", "c"];
  assert.equal(drawSecretSanta(ids, [{ giver: "a", recipient: "b" }, { giver: "a", recipient: "c" }]), null);
});
test("rejects duplicate participants and size outside 3-40", () => {
  assert.equal(drawSecretSanta(["a", "a", "b"]), null);
  assert.equal(drawSecretSanta(["a", "b"]), null);
});
