import React from "react";
import "./TimekeeperClockwork.css";

/**
 * Moving gears cut from our approved RosieVerse artwork, not procedurally
 * illustrated SVGs. A 2x2 transparent sprite atlas keeps the original brass
 * shading, engraved teeth, ruby hubs and metallic dimensionality intact.
 * The clock and all interactive controls remain exactly where they were.
 */
const ART = "/rosieverse/timekeeper/gear-atlas.png";
const GEARS = [
  { x: 17, y: 19, size: 50, sprite: 0, seconds: 100, reverse: false, opacity: 0.89 },
  { x: 84, y: 23, size: 47, sprite: 1, seconds: 82, reverse: true, opacity: 0.84 },
  { x: 9, y: 73, size: 42, sprite: 2, seconds: 92, reverse: true, opacity: 0.86 },
  { x: 83, y: 82, size: 54, sprite: 3, seconds: 106, reverse: false, opacity: 0.89 },
  { x: 45, y: 108, size: 40, sprite: 0, seconds: 100, reverse: true, opacity: 0.73 },
  { x: 51, y: -5, size: 26, sprite: 2, seconds: 57, reverse: true, opacity: 0.63 },
];

const SPRITES = [
  "0% 0%",
  "100% 0%",
  "0% 100%",
  "100% 100%"
];

function TurningGear({ gear, index }) {
  return (
    <span
      className="rtk-gear-mount"
      style={{
        left: gear.x + "%",
        top: gear.y + "%",
        width: gear.size + "%",
        "--rtk-cycle": gear.seconds + "s",
        "--rtk-direction": gear.reverse ? "reverse" : "normal",
        "--rtk-opacity": gear.opacity,
      }}
    >
      <span
        className="rtk-rotating-wheel"
        style={{ backgroundPosition: SPRITES[gear.sprite], backgroundImage: `url("${ART}")` }}
      />
      <span className="rtk-stationary-axle" />
    </span>
  );
}

export default function TimekeeperClockwork() {
  return (
    <div className="rtk-clockwork" aria-hidden="true">
      {GEARS.map((gear, index) => <TurningGear key={index} gear={gear} index={index} />)}
      <span className="rtk-clockwork-vignette" />
    </div>
  );
}
