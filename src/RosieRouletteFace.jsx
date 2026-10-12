import React from "react";
import { sectorPath } from "./rouletteGeometry.js";
import styles from "./RosieRandomizers.module.css";

// The images are repeatable material tiles, NOT pre-rendered labelled wedges.
// SVG paths are built from the live option count and rotate with the existing wheel.
export default function RosieRouletteFace({ count }) {
  return (
    <svg className={styles.wheelFace} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <pattern id="rosie-roulette-crimson" patternUnits="userSpaceOnUse" width="292" height="292">
          <image href="/randomizers/roulette/slice-texture-crimson.webp" width="292" height="292" />
        </pattern>
        <pattern id="rosie-roulette-onyx" patternUnits="userSpaceOnUse" width="292" height="292">
          <image href="/randomizers/roulette/slice-texture-onyx.webp" width="292" height="292" />
        </pattern>
        <radialGradient id="rosie-roulette-light" cx=".28" cy=".2" r=".84">
          <stop stopColor="#fff0c9" stopOpacity=".19" />
          <stop offset=".39" stopColor="#fff0c9" stopOpacity="0" />
          <stop offset=".74" stopColor="#000" stopOpacity=".08" />
          <stop offset="1" stopColor="#000" stopOpacity=".57" />
        </radialGradient>
        <linearGradient id="rosie-roulette-divider" x1="0" x2="1">
          <stop stopColor="#79420f"/><stop offset=".42" stopColor="#ffe99e"/><stop offset="1" stopColor="#8a4c16"/>
        </linearGradient>
      </defs>
      {Array.from({ length: count }, (_, index) => (
        <path
          key={index}
          d={sectorPath(index, count)}
          fill={index % 2 === 0 ? "url(#rosie-roulette-crimson)" : "url(#rosie-roulette-onyx)"}
          stroke="#cf9e50"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
      ))}
      <circle cx="200" cy="200" r="198" fill="url(#rosie-roulette-light)" pointerEvents="none"/>
      <circle cx="200" cy="200" r="195" fill="none" stroke="#fbe1a1" strokeWidth="3.5"/>
      <circle cx="200" cy="200" r="184" fill="none" stroke="#a16a2c" strokeOpacity=".72" strokeWidth="1.5"/>
      <circle cx="200" cy="200" r="176" fill="none" stroke="#f7d88d" strokeOpacity=".78" strokeWidth="1.8"/>
      {Array.from({ length: count }, (_, index) => (
        <g key={index} transform={`rotate(${index * (360 / count)} 200 200) translate(200 35)`}>
          <path d="M0 -7 C-3 -1 -5 0 -7 4 C-2 3 -1 6 0 10 C1 6 2 3 7 4 C5 0 3 -1 0 -7Z" fill="#e8bf72" stroke="#693916" strokeWidth="1"/>
          <circle cy="-11" r="2" fill="#fff2c7"/>
        </g>
      ))}
    </svg>
  );
}
