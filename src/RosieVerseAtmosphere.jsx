import React from "react";
import styles from "./RosieVerseAtmosphere.module.css";

const BASE = "/rosieverse/scenery";
const PETALS = Array.from({ length: 12 }, (_, index) => ({
  index,
  src: `${BASE}/petals/petal-${String(1 + ((index * 5) % 16)).padStart(2, "0")}.webp`,
  style: {
    "--left": `${((index * 37) % 106) - 3}%`,
    "--duration": `${13 + ((index * 7) % 10)}s`,
    "--delay": `${-index * 1.84}s`,
    "--size": `${12 + ((index * 11) % 17)}px`,
    "--wind": `${30 + ((index * 13) % 80)}px`,
  },
}));

/**
 * Decorative-only atmosphere for the RosieVerse landing page.
 * Import from RosieHome.jsx and render as its first direct child.
 * Existing route buttons, hero portrait and logo remain untouched.
 */
export default function RosieVerseAtmosphere() {
  return (
    <>
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.scenery} />
        <div className={styles.colorMatte} />
        <div className={styles.stage} />
        <div className={styles.ambientLight} />
        <div className={styles.canopyLeft} />
        <div className={styles.canopyRight} />
      </div>
      <div className={styles.petalField} aria-hidden="true">
        <div className={styles.windLayer}>
          {PETALS.map(({ index, src, style }) => (
            <img
              key={index}
              className={styles.petal}
              src={src}
              style={style}
              alt=""
              draggable="false"
              decoding="async"
            />
          ))}
        </div>
      </div>
    </>
  );
}
