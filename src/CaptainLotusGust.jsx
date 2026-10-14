import React, { useEffect, useState } from "react";

// Fixed placement avoids per-frame JS and keeps blossoms in the distant sky and margins.
const BLOSSOMS = [
  { top: "7%", size: "24px", delay: "0s", duration: "9.6s", tilt: "-21deg" },
  { top: "16%", size: "19px", delay: ".6s", duration: "9.2s", tilt: "18deg" },
  { top: "27%", size: "28px", delay: "1.15s", duration: "9.8s", tilt: "-35deg" },
  { top: "11%", size: "21px", delay: "1.75s", duration: "9.0s", tilt: "25deg" },
  { top: "33%", size: "17px", delay: "2.1s", duration: "9.4s", tilt: "-12deg" }
];
export default function CaptainLotusGust({ underway }) {
  const [gust, setGust] = useState(0);
  useEffect(() => {
    if (!underway || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGust(0);
      return undefined;
    }
    // Never reset on scene changes; this component remains mounted for the voyage.
    const interval = window.setInterval(() => setGust((current) => current + 1), 35000);
    return () => {
      window.clearInterval(interval);
      setGust(0);
    };
  }, [underway]);
  return gust ? (
    <div key={gust} className="captain-lotus-gust" data-gust={gust} aria-hidden="true">
      {BLOSSOMS.map((blossom, index) =>
        <img key={index} alt="" src="/captain-levels/lotus-watercolor.svg" draggable="false"
          style={{
            "--lotus-y": blossom.top, "--lotus-size": blossom.size,
            "--lotus-delay": blossom.delay, "--lotus-time": blossom.duration,
            "--lotus-tilt": blossom.tilt
          }} />)}
    </div>
  ) : null;
}
