import React, { useEffect, useState } from "react";
import { useCaptainSceneryTransition } from "./CaptainSceneryTransition.jsx";

/**
 * Full-viewport maritime atmosphere behind the existing Captain game cabinet.
 * Decorative only: it never intercepts pointer events or participates in gameplay.
 */
const PETALS = Array.from({ length: 9 }, (_, index) => ({
  "--petal-top": `${12 + ((index * 19) % 81)}%`,
  "--petal-size": `${10 + ((index * 7) % 11)}px`,
  "--petal-delay": `${-3 - index * 3.4}s`,
  "--petal-duration": `${24 + ((index * 5) % 12)}s`
}));

export default function CaptainOuterAtmosphere() {
  const [requestedLevel, setRequestedLevel] = useState(null);
  useEffect(() => {
    const receive = (event) => setRequestedLevel(event.detail);
    window.addEventListener("captain:scenery", receive);
    return () => window.removeEventListener("captain:scenery", receive);
  }, []);
  const scene = useCaptainSceneryTransition(requestedLevel);
  return (
    <div className="captain-outer-scene" aria-hidden="true">
      {scene.previous && <div className="captain-outer-paint captain-outer-painted-outgoing" style={{ backgroundImage: `url("${scene.previous.background}")` }} />}
      <div className={`captain-outer-paint captain-outer-painted-incoming${scene.entered ? " is-entered" : ""}`} style={scene.current ? { backgroundImage: `url("${scene.current.background}")` } : undefined} />
      <div className="captain-outer-veil" />
      <div className="captain-outer-glow" />
      <div className="captain-outer-petals">
        {PETALS.map((style, index) => <i key={index} style={style} />)}
      </div>
    </div>
  );
}
