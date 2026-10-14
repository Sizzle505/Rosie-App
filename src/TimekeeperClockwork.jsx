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
  // Twin mirrored external trains: the small upper pinions meet the lever
  // stations; larger wheels gradually follow the clock's shoulders and rim.
  { x: 28, y: 18, size: 17, sprite: 3, opacity: .98 },
  { x: 15, y: 29, size: 20, sprite: 0, opacity: .96 },
  { x: 11, y: 47, size: 22, sprite: 1, opacity: .94 },
  { x: 18, y: 67, size: 19, sprite: 4, opacity: .94 },
  { x: 72, y: 18, size: 17, sprite: 5, opacity: .98 },
  { x: 85, y: 29, size: 20, sprite: 2, opacity: .96 },
  { x: 89, y: 47, size: 22, sprite: 0, opacity: .94 },
  { x: 82, y: 67, size: 19, sprite: 4, opacity: .94 },
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
