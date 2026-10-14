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
  { x: 4, y: 28, size: 29, sprite: 0, opacity: .94 },
  { x: 14, y: 11, size: 22, sprite: 3, opacity: .9 },
  { x: 43, y: 3, size: 19, sprite: 2, opacity: .88 },
  { x: 77, y: 12, size: 23, sprite: 5, opacity: .9 },
  { x: 96, y: 31, size: 29, sprite: 1, opacity: .94 },
  { x: 94, y: 69, size: 26, sprite: 4, opacity: .92 },
  { x: 72, y: 93, size: 24, sprite: 2, opacity: .89 },
  { x: 24, y: 93, size: 25, sprite: 5, opacity: .89 },
  { x: 5, y: 70, size: 27, sprite: 1, opacity: .93 },
].map((gear, index) => ({
  ...gear,
  cycle: 112 * gear.size / 45,
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

function MechanicalChassis() {
  return (
    <svg className="rtk-mechanical-chassis" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="rtk-bridge-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#55331d" />
          <stop offset="28%" stopColor="#c89453" />
          <stop offset="52%" stopColor="#fae0a4" />
          <stop offset="76%" stopColor="#82512c" />
          <stop offset="100%" stopColor="#4f3021" />
        </linearGradient>
      </defs>
      {GEARS.slice(0, -1).map((a, i) => {
        const b = GEARS[i + 1];
        return (
          <g key={i} opacity=".62">
            <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
              stroke="#0b0709" strokeWidth="4" strokeLinecap="round" />
            <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
              stroke="url(#rtk-bridge-gold)" strokeWidth="1.65" strokeLinecap="round" />
            <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
              stroke="#fff0bf" strokeOpacity=".38" strokeWidth=".25" strokeLinecap="round" />
          </g>
        );
      })}
      <path d="M 0 43 Q 10 9 31 4 M 73 6 Q 96 21 100 48 M 98 82 Q 88 100 72 100 M 7 78 Q 9 94 31 100"
        fill="none" stroke="#b68a52" strokeWidth=".65" strokeOpacity=".46" />
    </svg>
  );
}

export default function TimekeeperClockwork() {
  return (
    <div className="rtk-clockwork" aria-hidden="true">
      <MechanicalChassis />
      {GEARS.map((gear, index) => <TurningGear key={index} gear={gear} />)}
      <span className="rtk-clockwork-vignette" />
    </div>
  );
}
