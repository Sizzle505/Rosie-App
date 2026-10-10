import React, { useEffect, useRef, useState } from "react";

/** Purely decorative; keeps the original painted picture in the DOM underneath. */
export default function CaptainCinematicEnvironment({ underway, boost, streak, timeLeft, ended, eventPulse, eventKind }) {
  const videoRef = useRef(null);
  const [smallPortrait, setSmallPortrait] = useState(() => window.matchMedia("(max-width: 720px) and (orientation: portrait)").matches);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 720px) and (orientation: portrait)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateNarrow = () => setSmallPortrait(narrow.matches);
    const updateMotion = () => setReduceMotion(reduced.matches);
    narrow.addEventListener("change", updateNarrow);
    reduced.addEventListener("change", updateMotion);
    return () => {
      narrow.removeEventListener("change", updateNarrow);
      reduced.removeEventListener("change", updateMotion);
    };
  }, []);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return undefined;
    const syncVisibility = () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => { /* static painting remains visible */ });
    };
    document.addEventListener("visibilitychange", syncVisibility);
    syncVisibility();
    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      video.pause();
    };
  }, [smallPortrait, reduceMotion]);

  if (reduceMotion) return null;
  const composition = smallPortrait ? "portrait" : "wide";
  // Chromium systems without licensed H.264 decoding use the VP9 alternative.
  // All iOS browsers retain native MP4 playback through WebKit.
  const isDesktopChromium = /(?:Chrome|Chromium|Edg|OPR)\//.test(navigator.userAgent)
    && !/(?:iPhone|iPad|iPod)/.test(navigator.userAgent);
  const motionFormat = isDesktopChromium ? "webm" : "mp4";
  const atmosphere = [
    "captain-cinematic",
    underway ? "is-sailing" : "is-idle",
    boost ? "is-full-steam" : "",
    streak >= 4 ? "has-streak" : "",
    underway && timeLeft <= 10 ? "is-final-approach" : "",
    ended ? "is-home" : ""
  ].filter(Boolean).join(" ");
  return (
    <div className={atmosphere} aria-hidden="true">
      <video
        key={composition}
        ref={videoRef}
        className="captain-cinematic-water"
        autoPlay muted loop playsInline
        preload="metadata"
        disablePictureInPicture
        src={`/captain-motion/captain-${composition}-water.${motionFormat}`}
        onCanPlay={(event) => { if (!document.hidden) event.currentTarget.play().catch(() => {}); }}
      />
      <img
        key={`mist-${composition}`}
        className="captain-cinematic-mist"
        src={`/captain-motion/captain-${composition}-mist.webp`}
        alt=""
        draggable="false"
        loading="eager"
      />
      <img
        key={`cloud-${composition}`}
        className="captain-cinematic-cloud"
        src={`/captain-motion/captain-${composition}-cloud.webp`}
        alt=""
        draggable="false"
        loading="eager"
      />
      <span className="captain-cinematic-sun-track" />
      <span className="captain-cinematic-wave-glints" />
      <span className="captain-cinematic-foam" />
      <span className="captain-cinematic-current"><i /><i /><i /><i /></span>
      <span className="captain-cinematic-water-stars"><i /><i /><i /><i /><i /><i /></span>
      <span className="captain-cinematic-light" />
      <span className="captain-cinematic-sail" />
      <span className="captain-cinematic-birds"><i /><i /><i /></span>
      <span className="captain-cinematic-petals">
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} className={index % 4 === 0 ? "is-maple" : "is-sakura"} />
        ))}
      </span>
      {eventPulse > 0 && eventKind !== "buoy" && (
        <span key={eventPulse} className="captain-cinematic-catch-glint"><i /><i /><i /></span>
      )}
    </div>
  );
}
