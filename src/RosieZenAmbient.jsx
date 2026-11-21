import React from "react";
import "./RosieZenAmbient.css";

// Decorative layers are independent of the Rosie character art. All sources
// below are existing, verified transparent garden assets, except the small
// original sakura-butterfly SVG.
const ROOT = "/rosieverse/haiku/living-garden/";
const BUTTERFLY = "/rosieverse/haiku/effects/sakura-butterfly.svg";
const PETALS = [1, 2, 3, 4, 5, 6, 7, 8];
const BUTTERFLIES = [
  { x: "8%", y: "34%", size: "36px", delay: "-4s", duration: "19s" },
  { x: "87%", y: "61%", size: "29px", delay: "-9s", duration: "23s" },
  { x: "76%", y: "22%", size: "24px", delay: "-15s", duration: "26s" },
];

export default function RosieZenAmbient({ scene = "lotus", mode = "meditation", status = "running" }) {
  const meditation = mode === "meditation";
  const nighttime = ["twilight", "moonlit"].includes(scene);
  const showWater = ["lotus", "sakura", "mist", "twilight", "moonlit", "temple"].includes(scene);
  const showButterflies = !nighttime && ["lotus", "sakura", "mist", "tea", "field", "zen", "temple"].includes(scene);
  const showLanterns = meditation && ["twilight", "moonlit", "tea"].includes(scene);
  const showPetals = meditation && scene !== "raked";
  const showPollen = meditation && scene !== "raked";
  const showSand = meditation && scene === "raked";
  return (
    <div className={"rosie-ambient rosie-ambient--" + mode}
      data-scene={scene} data-ambient-status={status} aria-hidden="true">
      {showWater && <span className="rosie-ambient-water" />}
      {showSand && <span className="rosie-ambient-sand" />}
      {showPollen && <span className="rosie-ambient-pollen" />}
      {showLanterns && [0, 1].map(index => (
        <img key={"lantern-" + index}
          className={"rosie-ambient-lantern rosie-ambient-lantern--" + index}
          src={ROOT + "temple-lantern.webp"} alt="" draggable="false" />
      ))}
      {showPetals && PETALS.map((n, index) => (
        <img key={"petal-" + n}
          className="rosie-ambient-petal"
          src={ROOT + "petal-" + String(n).padStart(2, "0") + ".webp"}
          alt="" draggable="false"
          style={{
            "--ambient-x": (6 + (index * 29) % 87) + "%",
            "--ambient-delay": (-index * 2.7) + "s",
            "--ambient-time": (18 + (index % 4) * 4) + "s",
            "--ambient-sway": (index % 2 ? -65 : 65) + "px",
            "--ambient-size": (12 + (index % 3) * 5) + "px",
          }} />
      ))}
      {showButterflies && BUTTERFLIES.slice(0, meditation ? 3 : 2).map((item, index) => (
        <span key={"butterfly-" + index}
          className={"rosie-ambient-butterfly rosie-ambient-butterfly--" + index}
          style={{
            "--butterfly-x": item.x,
            "--butterfly-y": item.y,
            "--butterfly-size": item.size,
            "--butterfly-delay": item.delay,
            "--butterfly-time": item.duration
          }}>
          <img src={BUTTERFLY} alt="" draggable="false" />
        </span>
      ))}
    </div>
  );
}
