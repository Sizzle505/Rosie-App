import React, { useState } from "react";
import "./RosieHaikuScene.css";

// The scene plates and the canonical Rosie pose are independent transparent
// layers. Add the corresponding WebP files to public/rosieverse/haiku/.
// Until the binary art has been installed, the approved RosieVerse scene
// remains the intact fallback. The app never shows broken image icons.
export const HAIKU_SCENES = Object.freeze([
  { id: "field", label: "Flower Field", short: "Field", src: "/rosieverse/haiku/field-sunrise.webp" },
  { id: "zen", label: "Zen Garden", short: "Zen Garden", src: "/rosieverse/haiku/zen-sunrise.webp" },
  { id: "temple", label: "Temple", short: "Temple", src: "/rosieverse/haiku/temple-sunrise.webp" }
]);
const ROSIE_MEDITATING = "/rosieverse/haiku/rosie-meditating-paws-up.webp";
const APPROVED_HERO = "/rosieverse/hero.webp";

export function readSelectedScene() {
  try {
    const saved = localStorage.getItem("rosieHaikuSelectedScene");
    return HAIKU_SCENES.some(({ id }) => id === saved) ? saved : "field";
  } catch {
    return "field";
  }
}

export default function RosieHaikuScene({ scene = "field", onSceneChange }) {
  const [missing, setMissing] = useState({});
  const [rosieAvailable, setRosieAvailable] = useState(true);
  const selected = HAIKU_SCENES.find((item) => item.id === scene) || HAIKU_SCENES[0];
  const hasSceneArt = !missing[scene];
  function switchScene(next) {
    onSceneChange?.(next);
    try { localStorage.setItem("rosieHaikuSelectedScene", next); }
    catch { /* Browsers with disabled storage still support scene selection. */ }
  }
  return (
    <section className="haiku-scene-stage" aria-label="Rosie's meditation garden">
      <div className={`haiku-scene-image haiku-scene-image--${scene}`}>
        <img
          className="haiku-scene-landscape"
          key={selected.src}
          src={hasSceneArt ? selected.src : APPROVED_HERO}
          onError={() => setMissing((current) => ({ ...current, [scene]: true }))}
          alt={hasSceneArt ? `Rosie's ${selected.label.toLowerCase()} at sunrise` : "Rosie overlooking a cherry-blossom landscape at sunrise"}
        />
        {hasSceneArt && rosieAvailable && (
          <img
            className="haiku-scene-rosie"
            src={ROSIE_MEDITATING}
            onError={() => setRosieAvailable(false)}
            alt="Rosie, a black-and-tan Shiba Inu in a pink-and-gold kimono, meditates with both paws raised"
          />
        )}
        <div className="haiku-scene-haze" aria-hidden="true" />
        <div className="haiku-scene-quote">
          <span className="haiku-scene-quote-kicker">THE WAY OF THE SHIBA</span>
          <strong>Wisdom comes to those who sit.</strong>
          <small>Preferably somewhere sunny.</small>
        </div>
      </div>
      <div className="haiku-scene-selector" role="group" aria-label="Choose meditation scenery">
        {HAIKU_SCENES.map((item) => (
          <button type="button" key={item.id} className={scene === item.id ? "is-selected" : ""} aria-pressed={scene === item.id} onClick={() => switchScene(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
