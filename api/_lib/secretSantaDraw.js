import { randomInt } from "node:crypto";

function shuffle(values, pick) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = pick(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * A complete one-to-one Secret Santa assignment, or null if the exclusions make
 * a matching impossible. Uses a randomized bipartite augmenting-path algorithm:
 * unlike repeated shuffling, this terminates even for impossible constraints.
 * No names, assignments, or secret tokens need to enter browser code.
 */
export function drawSecretSanta(ids, exclusions = [], pick = randomInt) {
  if (!Array.isArray(ids) || ids.length < 3 || ids.length > 40 ||
      new Set(ids).size !== ids.length) return null;
  const forbidden = new Set(exclusions.map(({ giver, recipient }) => giver + ":" + recipient));
  const choices = new Map(ids.map(giver => [
    giver,
    shuffle(ids.filter(recipient => recipient !== giver &&
      !forbidden.has(giver + ":" + recipient)), pick)
  ]));
  if ([...choices.values()].some(options => options.length === 0)) return null;

  const recipientToGiver = new Map();
  function augment(giver, seen) {
    for (const recipient of choices.get(giver)) {
      if (seen.has(recipient)) continue;
      seen.add(recipient);
      const previous = recipientToGiver.get(recipient);
      if (!previous || augment(previous, seen)) {
        recipientToGiver.set(recipient, giver);
        return true;
      }
    }
    return false;
  }
  for (const giver of shuffle(ids, pick)) {
    if (!augment(giver, new Set())) return null;
  }
  const result = {};
  for (const [recipient, giver] of recipientToGiver) result[giver] = recipient;
  return Object.keys(result).length === ids.length ? result : null;
}
