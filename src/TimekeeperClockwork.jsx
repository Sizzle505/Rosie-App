import React from "react";
import "./TimekeeperClockwork.css";

/**
 * Independent SVG wheels. The static gold frame and Rosie illustration remain
 * in the approved grand-clockwork-hall.jpg; this component occupies only
 * the existing blank black dial, behind the actual stopwatch controls.
 */
const GEARS = [
  { x: 18, y: 17, size: 38, teeth: 28, seconds: 72, reverse: false },
  { x: 80, y: 18, size: 38, teeth: 28, seconds: 72, reverse: true },
  { x: 9, y: 52, size: 30, teeth: 22, seconds: 57, reverse: true },
  { x: 91, y: 52, size: 30, teeth: 22, seconds: 57, reverse: false },
  { x: 23, y: 87, size: 35, teeth: 26, seconds: 67, reverse: false },
  { x: 77, y: 87, size: 35, teeth: 26, seconds: 67, reverse: true },
  { x: 50, y: 100, size: 25, teeth: 18, seconds: 47, reverse: true },
];

function gearOutline(teeth) {
  const points = [];
  const step = Math.PI * 2 / teeth;
  for (let i = 0; i < teeth; i += 1) {
    const base = i * step - Math.PI / 2;
    for (const [fraction, radius] of [[0.00, 40], [0.17, 47], [0.56, 47], [0.75, 40]]) {
      const angle = base + fraction * step;
      points.push([50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius]);
    }
  }
  const outside = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ") + " Z";
  // evenodd subtracts the hole, leaving a real see-through center and spokes.
  const inside = "M 81 50 A 31 31 0 1 0 19 50 A 31 31 0 1 0 81 50 Z";
  return outside + " " + inside;
}

function ClockGear({ data, index }) {
  const metalId = `rtk-metal-${index}`;
  const insetId = `rtk-inset-${index}`;
  return (
    <span className="rtk-gear-mount" style={{
      left: data.x + "%", top: data.y + "%", width: data.size + "%",
      "--rtk-cycle": data.seconds + "s",
      "--rtk-direction": data.reverse ? "reverse" : "normal",
    }}>
      <svg className="rtk-rotating-wheel" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={metalId} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#56351d" />
            <stop offset="16%" stopColor="#e1a35a" />
            <stop offset="33%" stopColor="#ffe3a1" />
            <stop offset="47%" stopColor="#a7642a" />
            <stop offset="71%" stopColor="#d49b55" />
            <stop offset="100%" stopColor="#50301f" />
          </linearGradient>
          <radialGradient id={insetId} cx="30%" cy="23%" r="80%">
            <stop offset="0%" stopColor="#71354b" />
            <stop offset="35%" stopColor="#3d1428" />
            <stop offset="85%" stopColor="#160e17" />
          </radialGradient>
        </defs>
        <path d={gearOutline(data.teeth)} fill={`url(#${metalId})`} fillRule="evenodd"
          stroke="#ffdb8b" strokeWidth="0.55" strokeLinejoin="round" />
        <circle cx="50" cy="50" r="36.5" fill="none" stroke="#351c12" strokeWidth="2" />
        <circle cx="50" cy="50" r="34.5" fill="none" stroke="#f7c77b" strokeOpacity=".72" strokeWidth=".8" />
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d="M 46.8 18 L 53.2 18 L 54.2 46 L 45.8 46 Z"
            transform={`rotate(${i * 60} 50 50)`} fill={`url(#${metalId})`}
            stroke="#412719" strokeWidth=".75" />
        ))}
        <circle cx="50" cy="50" r="10.5" fill={`url(#${metalId})`} stroke="#ffe0a0" strokeWidth=".9" />
        <circle cx="50" cy="50" r="6.4" fill={`url(#${insetId})`} stroke="#edb76d" strokeWidth="1.2" />
      </svg>
      <span className="rtk-stationary-axle" />
    </span>
  );
}

export default function TimekeeperClockwork() {
  return (
    <div className="rtk-clockwork" aria-hidden="true">
      <svg className="rtk-engraved-dial" viewBox="0 0 500 500" focusable="false">
        <circle cx="250" cy="250" r="242" fill="none" stroke="#c39752" strokeOpacity=".48" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="229" fill="none" stroke="#deaf66" strokeOpacity=".3" strokeWidth="1" />
        {Array.from({ length: 48 }, (_, index) => {
          const angle = index * Math.PI / 24 - Math.PI / 2;
          const major = index % 4 === 0;
          const inner = major ? 225 : 233;
          return (
            <line key={index}
              x1={250 + inner * Math.cos(angle)} y1={250 + inner * Math.sin(angle)}
              x2={250 + 239 * Math.cos(angle)} y2={250 + 239 * Math.sin(angle)}
              stroke={major ? "#edbd77" : "#d9a467"}
              strokeOpacity={major ? ".57" : ".24"} strokeWidth={major ? "1.6" : ".75"} />
          );
        })}
      </svg>
      {GEARS.map((gear, index) => <ClockGear key={index} data={gear} index={index} />)}
      <span className="rtk-clockwork-vignette" />
    </div>
  );
}
