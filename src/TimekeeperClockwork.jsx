import React from "react";
import "./TimekeeperClockwork.css";

// Independent wheel assemblies, positioned under the original photograph's
// bezel. Unlike a rotating image of an entire gear cluster, each wheel owns
// its axis, tooth profile, speed, and direction.
const GEARS = [
  { x: 13, y: 23, size: 40, teeth: 34, seconds: 104, reverse: false, alpha: 0.74 },
  { x: 86, y: 18, size: 43, teeth: 36, seconds: 112, reverse: true, alpha: 0.8 },
  { x: 6, y: 72, size: 34, teeth: 28, seconds: 85, reverse: true, alpha: 0.72 },
  { x: 91, y: 78, size: 42, teeth: 34, seconds: 104, reverse: false, alpha: 0.75 },
  { x: 49, y: 105, size: 40, teeth: 32, seconds: 96, reverse: true, alpha: 0.66 },
  { x: 55, y: 5, size: 23, teeth: 20, seconds: 58, reverse: false, alpha: 0.58 },
];

function toothedRing(teeth) {
  const pts = [];
  const step = Math.PI * 2 / teeth;
  for (let i = 0; i < teeth; i += 1) {
    const start = step * i - Math.PI / 2;
    for (const [fraction, radius] of [[0, 42], [.13, 48], [.52, 48], [.69, 42]]) {
      const a = start + step * fraction;
      pts.push([50 + radius * Math.cos(a), 50 + radius * Math.sin(a)]);
    }
  }
  const exterior = pts.map(([x,y],i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ") + " Z";
  return exterior + " M 85 50 A 35 35 0 1 0 15 50 A 35 35 0 1 0 85 50 Z";
}

function ClockGear({ gear, index }) {
  const id = `rtk-gear-${index}`;
  const metal = `${id}-metal`;
  const shine = `${id}-shine`;
  const ruby = `${id}-ruby`;
  return (
    <span className="rtk-gear-mount" style={{
      left: `${gear.x}%`, top: `${gear.y}%`, width: `${gear.size}%`,
      "--rtk-cycle": `${gear.seconds}s`,
      "--rtk-direction": gear.reverse ? "reverse" : "normal",
      "--rtk-opacity": gear.alpha,
    }}>
      <svg className="rtk-rotating-wheel" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={metal} x1="0%" y1="5%" x2="93%" y2="92%">
            <stop offset="0%" stopColor="#26190f" />
            <stop offset="12%" stopColor="#63401f" />
            <stop offset="25%" stopColor="#bb8342" />
            <stop offset="34%" stopColor="#f4c77e" />
            <stop offset="42%" stopColor="#8a5325" />
            <stop offset="60%" stopColor="#3a2818" />
            <stop offset="76%" stopColor="#b28040" />
            <stop offset="89%" stopColor="#e6ad68" />
            <stop offset="100%" stopColor="#442916" />
          </linearGradient>
          <linearGradient id={shine} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f9d9a0" />
            <stop offset="26%" stopColor="#5c391f" />
            <stop offset="58%" stopColor="#b97d42" />
            <stop offset="100%" stopColor="#291a13" />
          </linearGradient>
          <radialGradient id={ruby} cx="33%" cy="25%" r="72%">
            <stop offset="0%" stopColor="#eab9ac" />
            <stop offset="22%" stopColor="#b12e60" />
            <stop offset="63%" stopColor="#531b3c" />
            <stop offset="100%" stopColor="#190d17" />
          </radialGradient>
        </defs>
        {/* An oxidized inner track gives the impression of recessed machinery. */}
        <circle cx="50" cy="50" r="36.2" fill="#24180e" stroke="#b17b43" strokeOpacity=".52" strokeWidth=".8" />
        <path d={toothedRing(gear.teeth)} fill={`url(#${metal})`} fillRule="evenodd"
          stroke="#dfa96b" strokeWidth=".7" strokeLinejoin="round" />
        <circle cx="50" cy="50" r="40.1" fill="none" stroke="#332017" strokeWidth="2.3" />
        <circle cx="50" cy="50" r="38.6" fill="none" stroke="#fed39a" strokeOpacity=".56" strokeWidth=".65" />
        <circle cx="50" cy="50" r="34.7" fill="none" stroke="#c89350" strokeOpacity=".7" strokeWidth="1.15" />
        <circle cx="50" cy="50" r="32.8" fill="none" stroke="#382418" strokeWidth="1.6" />
        {Array.from({ length: 6 }, (_, n) => (
          <g key={n} transform={`rotate(${60*n} 50 50)`}>
            <path d="M 46.9 49 L 44.4 20.3 Q 50 15 55.6 20.3 L 53.1 49 Z"
              fill={`url(#${metal})`} stroke="#321e11" strokeWidth="1.1"/>
            <path d="M 48 43 L 47.1 22.1" stroke="#f1c17b" strokeWidth=".8" strokeOpacity=".67" />
            <circle cx="50" cy="30.5" r="1.25" fill="#503019" stroke="#edc18a" strokeWidth=".55" />
          </g>
        ))}
        <circle cx="50" cy="50" r="14.6" fill={`url(#${shine})`} stroke="#e2b77e" strokeWidth=".85" />
        <circle cx="50" cy="50" r="11.7" fill="none" stroke="#3c2518" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="9.3" fill={`url(#${metal})`} stroke="#f5cb83" strokeWidth=".75" />
        <circle cx="50" cy="50" r="6.3" fill={`url(#${ruby})`} stroke="#7b432e" strokeWidth="1.4" />
        <path d="M 47 47 Q 49 44 52 45" stroke="#fff0da" strokeOpacity=".58" fill="none" strokeWidth="1" />
        {Array.from({length: 8}, (_, n) => {
          const a = n * Math.PI / 4;
          return <circle key={n} cx={50 + Math.cos(a)*12.8} cy={50 + Math.sin(a)*12.8}
            r=".9" fill="#ffe0a5" stroke="#5e3b20" strokeWidth=".5" />;
        })}
      </svg>
      <span className="rtk-stationary-axle" />
    </span>
  );
}

function StationaryBridges() {
  return (
    <svg className="rtk-mechanical-bridges" viewBox="0 0 500 500" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="rtk-bridge-metal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3d2818" />
          <stop offset="32%" stopColor="#bd8950" />
          <stop offset="50%" stopColor="#f0bb71" />
          <stop offset="72%" stopColor="#5a3520" />
          <stop offset="100%" stopColor="#9e6c3b" />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round">
        <path d="M 53 179 Q 73 67 169 50" stroke="#100a0b" strokeWidth="10" opacity=".7" />
        <path d="M 53 179 Q 73 67 169 50" stroke="url(#rtk-bridge-metal)" strokeWidth="4.2" opacity=".55" />
        <path d="M 338 49 Q 449 69 464 180" stroke="#100a0b" strokeWidth="10" opacity=".7" />
        <path d="M 338 49 Q 449 69 464 180" stroke="url(#rtk-bridge-metal)" strokeWidth="4.2" opacity=".55" />
        <path d="M 63 331 Q 86 429 174 460" stroke="#100a0b" strokeWidth="9" opacity=".64" />
        <path d="M 63 331 Q 86 429 174 460" stroke="url(#rtk-bridge-metal)" strokeWidth="3.5" opacity=".48" />
        <path d="M 336 457 Q 435 427 456 335" stroke="#100a0b" strokeWidth="9" opacity=".64" />
        <path d="M 336 457 Q 435 427 456 335" stroke="url(#rtk-bridge-metal)" strokeWidth="3.5" opacity=".48" />
        <circle cx="53" cy="179" r="5" fill="#674326" stroke="#bd945a" strokeWidth="1.5"/>
        <circle cx="464" cy="180" r="5" fill="#674326" stroke="#bd945a" strokeWidth="1.5"/>
        <circle cx="63" cy="331" r="4" fill="#674326" stroke="#bd945a" strokeWidth="1"/>
        <circle cx="456" cy="335" r="4" fill="#674326" stroke="#bd945a" strokeWidth="1"/>
      </g>
    </svg>
  );
}

export default function TimekeeperClockwork() {
  return (
    <div className="rtk-clockwork" aria-hidden="true">
      {GEARS.map((gear, index) => <ClockGear key={index} gear={gear} index={index} />)}
      <StationaryBridges />
      <span className="rtk-clockwork-vignette" />
    </div>
  );
}
