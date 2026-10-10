import React from "react";

/** Painted alpha layers, kept entirely outside hit-testing and gameplay state. */
export default function CaptainLevelScenery({ level, underway, boost }) {
  const storm = level.climate === "storm";
  const moon = level.climate === "moonlit";
  return (
    <div className={`captain-level-effects climate-${level.climate}${underway ? " is-sailing" : ""}${boost ? " is-boosting" : ""}`} aria-hidden="true">
      <img className="captain-level-wave wave-a" src="/captain-levels/ocean-wave-frame.webp" alt="" draggable="false" />
      <img className="captain-level-wave wave-b" src="/captain-levels/ocean-wave-wide.webp" alt="" draggable="false" />
      <img className="captain-level-mist" src="/captain-levels/ocean-mist.webp" alt="" draggable="false" />
      {storm ? (
        <>
          <img className="captain-level-weather" src="/captain-levels/rain-spray.webp" alt="" draggable="false" />
          <img className="captain-level-lightning" src="/captain-levels/lightning.webp" alt="" draggable="false" />
        </>
      ) : (
        <img className="captain-level-petals" src="/captain-levels/sakura-petals.webp" alt="" draggable="false" />
      )}
      {!moon && !storm && <img className="captain-level-gold" src="/captain-levels/golden-reflections.webp" alt="" draggable="false" />}
      <img className="captain-level-wake" src="/captain-levels/wake-splash.webp" alt="" draggable="false" />
    </div>
  );
}
