// Rosie's hand-edited 5 / 7 / 5 collection. These verses also power the
// no-network experience: never imply a generic canned poem came from AI.
export const ROSIE_HAIKUS = Object.freeze([
  { id: "pond", mood: "zen", season: "spring", lines: ["Pink petals drift down", "The pond remembers the sky", "Rosie watches still"] },
  { id: "river", mood: "zen", season: "summer", lines: ["Petals drift at dawn", "The river carries moonlight", "Rosie guards the shore"] },
  { id: "gate", mood: "zen", season: "autumn", lines: ["Cool shadows settle", "Beyond the old garden gate", "Two bright ears are still"] },
  { id: "rain", mood: "zen", season: "winter", lines: ["Soft rain on the path", "Somewhere a quiet leaf falls", "Rosie lets it pass"] },
  { id: "door", mood: "savage", season: "winter", lines: ["The door stands closed still", "I have asked you twice to move", "Such poor service here"] },
  { id: "sofa", mood: "savage", season: "autumn", lines: ["Your socks smell of rain", "Yet you claim the sofa seat", "Know your place, human"] },
  { id: "tribute", mood: "savage", season: "summer", lines: ["The bowl is empty", "You call yourself the leader", "Bring me tribute now"] },
  { id: "vacuum", mood: "savage", season: "spring", tags: ["vacuum", "clean", "hoover"], lines: ["Small dog, mighty wrath", "The loud machine has no shame", "I shall not forgive"] },
  { id: "hand", mood: "sweet", season: "spring", lines: ["One paw on your hand", "The whole wide world can wait here", "Stay a little more"] },
  { id: "home", mood: "sweet", season: "autumn", tags: ["home", "family", "friend"], lines: ["Warm light fills the room", "Your footsteps tell me you're home", "All is well again"] },
  { id: "laughter", mood: "sweet", season: "summer", lines: ["Your laugh fills the air", "I know this sound better than", "Any song of spring"] },
  { id: "starlight", mood: "sweet", season: "winter", lines: ["I sleep near your feet", "The stars gather at our door", "Nothing else is owed"] },
  { id: "red-dot", mood: "existential", season: "autumn", lines: ["Why chase the red dot", "If the light can never stay", "Still, I chase again"] },
  { id: "moon", mood: "existential", season: "winter", lines: ["The moon has no leash", "Yet it follows where I go", "Who is walking whom"] },
  { id: "hunger", mood: "existential", season: "spring", lines: ["Empty bowls at dusk", "Is desire just hunger dressed", "In a velvet coat"] },
  { id: "footprints", mood: "existential", season: "summer", lines: ["Each paw print will fade", "Yet the grass remembers me", "I was briefly here"] },
  { id: "cheese", mood: "savage", season: "autumn", tags: ["cheese", "food", "snack", "crumb"], lines: ["A cube of soft cheese", "Your hands are full of fine gold", "All the crumbs are mine"] },
  { id: "squirrel", mood: "savage", season: "spring", tags: ["squirrel", "bird", "chase"], lines: ["A tail in the trees", "I abandon all good sense", "I will bark for hours"] },
  { id: "bath", mood: "savage", season: "winter", tags: ["bath", "water", "wash", "soap"], lines: ["The water is warm", "But betrayal tastes of soap", "I will not forget"] },
  { id: "treat", mood: "savage", season: "summer", tags: ["treat", "cookie", "reward"], lines: ["One treat becomes two", "Mathematics favors dogs", "Never check my work"] },
  { id: "work", mood: "sweet", season: "summer", tags: ["work", "job", "office", "stress"], lines: ["Your inbox grows wild", "The sun moves across the floor", "Come and sit with me"] },
  { id: "birthday", mood: "savage", season: "autumn", tags: ["birthday", "cake", "party"], lines: ["Candles guard the cake", "The sun gives its gold again", "All the cake is mine"] },
  { id: "cat", mood: "savage", season: "spring", tags: ["cat", "kitty", "feline"], lines: ["Soft paws, sharper claws", "The cat believes she owns me", "I shall let her think"] },
  { id: "sleep", mood: "zen", season: "winter", tags: ["sleep", "nap", "rest", "dream"], lines: ["One more nap at noon", "Let the busy world go by", "I dream of warm bread"] }
]);
export const ROSIE_HAIKU_MOODS = Object.freeze([
  { id: "zen", label: "Zen Master" },
  { id: "savage", label: "Shiba Sass" },
  { id: "sweet", label: "Affectionate" },
  { id: "existential", label: "Existential" }
]);
export function localDayKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
function hashSeed(value) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function poemForDay(date = new Date()) {
  const day = localDayKey(date);
  const index = hashSeed(day) % ROSIE_HAIKUS.length;
  return { ...ROSIE_HAIKUS[index], title: "Haiku of the Day", day, source: "collection" };
}
export function poemForTopic(topic, mood = "zen", variation = 0) {
  const subject = String(topic || "").trim().slice(0, 100);
  const lowercase = subject.toLocaleLowerCase("en-US");
  const tagged = ROSIE_HAIKUS.filter((p) => p.tags?.some((tag) => new RegExp(`\\b${tag}\\b`, "i").test(lowercase)));
  // A relevant verse wins over the chosen tone; other prompts select
  // curated, mood-specific verses. The topic remains visible as a dedication.
  const pool = tagged.length ? tagged : ROSIE_HAIKUS.filter((p) => p.mood === mood);
  const index = hashSeed(`${lowercase}:${mood}`) + Math.max(0, variation);
  const selected = pool[index % pool.length];
  return {
    ...selected,
    title: subject ? `For ${subject}` : "A Thought From Rosie",
    topic: subject,
    source: "collection",
    version: variation
  };
}
export function formatHaiku(poem) {
  return `${poem.lines.join("\n")}\n\n- Rosie’s Haiku Garden`;
}
