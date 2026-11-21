// Shared outfit choices keep Rosie's garden portrait and meditation in sync.
export const ROSIE_HAIKU_OUTFIT_KEY = "rosieZenRosieOutfitV1";
export const ROSIE_HAIKU_OUTFITS = Object.freeze([
  {id:"classic",label:"Classic Sakura",image:"/rosieverse/haiku/rosie-meditating-paws-up.webp"},
  {id:"pink",label:"Sakura Kimono",image:"/rosieverse/haiku/new/characters/meditating-pink-sakura.webp"},
  {id:"saffron",label:"Saffron Robes",image:"/rosieverse/haiku/new/characters/meditating-saffron-cream.webp"},
  {id:"plum",label:"Plum Hakama",image:"/rosieverse/haiku/new/characters/meditating-plum-hakama.webp"},
  {id:"indigo",label:"Indigo Kimono",image:"/rosieverse/haiku/new/characters/meditating-indigo.webp"}
]);
export function readRosieHaikuOutfit() {
  try {
    const selected = window.localStorage.getItem(ROSIE_HAIKU_OUTFIT_KEY);
    return ROSIE_HAIKU_OUTFITS.some(o => o.id === selected) ? selected : "classic";
  } catch { return "classic"; }
}
export function nextRosieHaikuOutfit(id, step) {
  const index = ROSIE_HAIKU_OUTFITS.findIndex(o => o.id === id);
  return ROSIE_HAIKU_OUTFITS[((index < 0 ? 0 : index) + step + ROSIE_HAIKU_OUTFITS.length) % ROSIE_HAIKU_OUTFITS.length].id;
}
