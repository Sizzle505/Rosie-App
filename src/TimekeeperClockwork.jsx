import React from "react";
import "./TimekeeperClockwork.css";

/**
 * A visible exterior gear train mounted around the clock bezel. It stays out
 * of the numerical face and uses the supplied atlas as actual mechanism.
 *
 * Each wheel uses one of the four original illustrated transparent sprites;
 * the mechanical bridges and bearing jewels are stationary.
 */
const ART = "/rosieverse/timekeeper/midnight-observatory/gear-atlas.webp";
const SPRITES = ["0% 0%", "50% 0%", "100% 0%", "0% 100%", "50% 100%", "100% 100%"];

const GEARS = Array.from({ length: 16 }, (_, index) => {
  // True annular gear train: wheels mesh along the clock circumference,
  // with their inner halves naturally hidden behind the dial and bezel.
  const angle = (-112.5 + index * 22.5) * Math.PI / 180;
  const radius = 33.15;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
    size: [14.0, 14.6, 13.9, 14.7, 14.2, 14.4, 14.8, 14.1][index % 8],
    sprite: [3, 1, 5, 0, 2, 4, 1, 3, 5, 0, 4, 2, 1, 3, 5, 0][index],
    opacity: index % 4 === 0 ? .93 : .88,
  };
}).map((gear, index) => ({
  ...gear,
  // A visible, mechanical pace while Rosie is working—not an imperceptibly
  // slow decorative spin. Adjacent wheels counter-rotate like a gear train.
  cycle: 17 * gear.size / 24,
  direction: index % 2 ? "reverse" : "normal",
}));

function TurningGear({ gear }) {
  return (
    <span className="rtk-gear-mount" style={{
      left: gear.x + "%", top: gear.y + "%", width: gear.size + "%",
      "--rtk-cycle": gear.cycle + "s",
      "--rtk-direction": gear.direction,
      "--rtk-opacity": gear.opacity,
    }}>
      <span
        className="rtk-rotating-wheel"
        style={{ backgroundImage: `url("${ART}")`, backgroundPosition: SPRITES[gear.sprite] }}
      />
      <span className="rtk-stationary-axle" />
    </span>
  );
}

export default function TimekeeperClockwork() {
  return (
    <div className="rtk-clockwork" aria-hidden="true">
      {GEARS.map((gear, index) => <TurningGear key={index} gear={gear} />)}
      <span className="rtk-clockwork-vignette" />
    </div>
  );
}
