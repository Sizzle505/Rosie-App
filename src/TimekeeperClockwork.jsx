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

const GEARS = [
  // Twelve wheels surround the entire perimeter, tucked behind the bezel.
  // Upper pinions are centered on Rosie's twin lever housings.
  { x: 36, y: 14, size: 14, sprite: 3, opacity: .90 },
  { x: 21, y: 25, size: 15, sprite: 0, opacity: .89 },
  { x: 13, y: 45, size: 17, sprite: 1, opacity: .87 },
  { x: 16, y: 69, size: 15, sprite: 4, opacity: .88 },
  { x: 29, y: 82, size: 16, sprite: 2, opacity: .88 },
  { x: 42, y: 88, size: 13, sprite: 5, opacity: .85 },
  { x: 58, y: 88, size: 13, sprite: 3, opacity: .85 },
  { x: 71, y: 82, size: 16, sprite: 4, opacity: .88 },
  { x: 84, y: 69, size: 15, sprite: 2, opacity: .88 },
  { x: 87, y: 45, size: 17, sprite: 0, opacity: .87 },
  { x: 79, y: 25, size: 15, sprite: 1, opacity: .89 },
  { x: 64, y: 14, size: 14, sprite: 5, opacity: .90 },
].map((gear, index) => ({
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
