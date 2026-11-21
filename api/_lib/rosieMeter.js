import { dictionary } from "cmu-pronouncing-dictionary";

const TARGET = [5, 7, 5];
const OVERRIDES = Object.freeze({
  rosie: [2], shiba: [2], shibas: [2], inu: [2], florida: [3],
  manchego: [3], miami: [3], everglades: [3], haiku: [2],
  fire: [1, 2], flower: [2], hour: [1, 2], every: [2, 3]
});

function heuristicSyllables(word) {
  if (!word) return 0;
  if (word.length <= 3) return 1;
  let count = (word.match(/[aeiouy]+/g) || []).length;
  if (word.endsWith("e") && !/[^aeiouy]le$/.test(word) && !/ee$/.test(word)) count--;
  if (/[^aeiouy]es$/.test(word) && !/(ses|zes|ches|shes)$/.test(word)) count--;
  if (/ed$/.test(word) && !/(ted|ded)$/.test(word)) count--;
  return Math.max(1, count);
}

export function pronunciationOptions(token) {
  const word = String(token).toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
  if (!word) return { word: "", counts: [], known: true };
  if (OVERRIDES[word]) return { word, counts: OVERRIDES[word], known: true };
  const keys = [word, ...Array.from({ length: 6 }, (_, i) => word + "(" + (i + 1) + ")")];
  const counts = [...new Set(keys.map(k => dictionary[k]).filter(Boolean).map(phones =>
    (phones.match(/[012]/g) || []).length
  ).filter(Boolean))].sort((a, b) => a - b);
  return counts.length
    ? { word, counts, known: true }
    : { word, counts: [heuristicSyllables(word)], known: false };
}

export function lineSyllableAssessment(line, target = 5) {
  const words = (String(line).match(/[a-z]+(?:['’][a-z]+)?/gi) || [])
    .map(pronunciationOptions).filter(x => x.word);
  let sums = new Set([0]);
  for (const item of words) {
    const next = new Set();
    for (const count of item.counts) {
      for (const subtotal of sums) next.add(subtotal + count);
    }
    sums = next;
  }
  const possibilities = [...sums].sort((a, b) => a - b);
  const chosen = possibilities.slice().sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0] ?? 0;
  const known = words.every(x => x.known);
  return {
    target, count: chosen, possible: possibilities,
    matches: possibilities.includes(target),
    confident: known,
    words: words.map(x => ({ word: x.word, counts: x.counts, known: x.known }))
  };
}

export function assessHaikuMeter(lines) {
  if (!Array.isArray(lines) || lines.length !== 3) {
    throw new TypeError("Expected exactly three haiku lines");
  }
  const rows = lines.map((line, i) => lineSyllableAssessment(line, TARGET[i]));
  return {
    counts: rows.map(r => r.count),
    verified: rows.every(r => r.matches && r.confident),
    matches: rows.every(r => r.matches),
    uncertainty: rows.some(r => !r.confident),
    score: rows.reduce((n, r) => n + Math.abs(r.count - r.target), 0),
    rows
  };
}
