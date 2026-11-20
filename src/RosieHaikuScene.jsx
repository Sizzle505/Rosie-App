import React, { useState } from "react";
import "./RosieHaikuScene.css";

// Each garden is a full-page background; this component only places the
// expression-matched transparent Rosie layer and the selector above it.
export const HAIKU_SCENES = Object.freeze([
  { id: "field", label: "Flower Field", short: "Field", src: "/rosieverse/haiku/field-sunrise.webp" },
  { id: "zen", label: "Zen Garden", short: "Zen Garden", src: "/rosieverse/haiku/zen-sunrise.webp" },
  { id: "temple", label: "Temple", short: "Temple", src: "/rosieverse/haiku/temple-sunrise.webp" }
]);
const ROSIE_MEDITATING = "/rosieverse/haiku/rosie-meditating-paws-up.webp";
const ROSIE_REACTIONS = Object.freeze({
  inspired: "/rosieverse/haiku/rosie-inspired.webp",
  triumphant: "/rosieverse/haiku/rosie-triumphant.webp",
  bestowing: "/rosieverse/haiku/rosie-bestowing-wisdom.webp"
});
const ROSIE_EXPRESSIONS = Object.freeze({
  zen: ROSIE_MEDITATING,
  savage: "/rosieverse/haiku/rosie-smug.webp",
  sweet: "/rosieverse/haiku/rosie-affectionate.webp",
  existential: "/rosieverse/haiku/rosie-existential.webp"
});
function poseForPoem(mode, mood, poem) {
  if (mode === "daily") return ROSIE_MEDITATING;
  if (mode === "journal") {
    return poem?.mood === "zen"
      ? "/rosieverse/haiku/rosie-contemplative.webp"
      : (ROSIE_EXPRESSIONS[poem?.mood] || "/rosieverse/haiku/rosie-contemplative.webp");
  }
  if (mood === "savage" && /vacuum|door|bath|squirrel/.test(poem?.id || ""))
    return "/rosieverse/haiku/rosie-indignant.webp";
  if (mood === "zen" && mode === "compose")
    return "/rosieverse/haiku/rosie-calligrapher.webp";
  return ROSIE_EXPRESSIONS[mood] || ROSIE_MEDITATING;
}
const HAIKU_MESSAGES = Object.freeze({
  zen: ["THE WAY OF THE SHIBA", "Wisdom comes to those who sit.", "Preferably somewhere sunny."],
  savage: ["A SHIBA'S DECREE", "I have spoken.", "You may now bring the treats."],
  sweet: ["A LITTLE LOVE", "The world can wait.", "Stay here a little longer."],
  existential: ["ROSIE PONDERS", "Where do the petals go?", "And is there cheese there?"]
});

export function readSelectedScene() {
  try {
    const saved = localStorage.getItem("rosieHaikuSelectedScene");
    return HAIKU_SCENES.some(({ id }) => id === saved) ? saved : "field";
  } catch {
    return "field";
  }
}

export function RosieHaikuWisdom({ mode = "daily", mood = "zen", poem }) {
  const currentMood = mode === "daily" ? "zen" : (mode === "journal" ? poem?.mood || "zen" : mood);
  const caption = HAIKU_MESSAGES[currentMood] || HAIKU_MESSAGES.zen;
  return (
    <section className="haiku-scene-quote" aria-label="Rosie's Zen wisdom">
      <span className="haiku-scene-quote-kicker">{caption[0]}</span>
      <strong>{caption[1]}</strong>
      <small>{caption[2]}</small>
    </section>
  );
}

export default function RosieHaikuScene({ scene = "field", onSceneChange, mode = "daily", mood = "zen", poem, reaction = null }) {
  const [rosieAvailable, setRosieAvailable] = useState(true);
  const currentMood = mode === "daily" ? "zen" : (mode === "journal" ? poem?.mood || "zen" : mood);
  const basePose = poseForPoem(mode, currentMood, poem);
  // The animated WebP exhibited a black rectangle in some browsers.
  // Use the proven alpha-transparent master and animate only its element.
  const characterSrc = (reaction && ROSIE_REACTIONS[reaction.type]) || basePose;

  function switchScene(next) {
    onSceneChange?.(next);
    try { localStorage.setItem("rosieHaikuSelectedScene", next); }
    catch { /* Browsers with disabled storage still support scene selection. */ }
  }
  return (
    <section className="haiku-scene-stage" aria-label="Rosie's meditation garden">
      <div className={`haiku-scene-image haiku-scene-image--${scene}`}>
        {rosieAvailable && (
          <img
            className={`haiku-scene-rosie${characterSrc === ROSIE_MEDITATING ? " haiku-scene-rosie--slow-breath" : " haiku-scene-rosie--expressive"}`}
            key={characterSrc}
            src={characterSrc}
            onError={(event) => {
              if (!event.currentTarget.src.endsWith("rosie-meditating-paws-up.webp")) {
                event.currentTarget.src = ROSIE_MEDITATING;
              } else setRosieAvailable(false);
            }}
            alt={characterSrc === ROSIE_MEDITATING
              ? "Rosie, the black-and-tan Shiba Inu, meditates in her sakura kimono with both paws raised"
              : "Rosie strikes a playful poetic pose in her pink-and-gold kimono"}
          />
        )}
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
