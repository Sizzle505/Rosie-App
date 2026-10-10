import React, { useEffect, useRef, useState } from "react";

export const CAPTAIN_CROSSFADE_MS = 2100;

/**
 * Only the current and outgoing paintings exist. Start the opacity transition
 * after the next image has decoded, then release the outgoing DOM after 2.1s.
 * Paint and atmosphere use the same compositor, without per-frame React work.
 */
export function useCaptainSceneryTransition(level, broadcast = false) {
  const activeRef = useRef(level || null);
  const [scene, setScene] = useState(() => ({ current: level || null, previous: null, entered: true }));
  useEffect(() => {
    if (!level) return undefined;
    const emit = () => {
      if (broadcast) window.dispatchEvent(new CustomEvent("captain:scenery", { detail: level }));
    };
    if (activeRef.current?.id === level.id) {
      emit(); // Initial page visit also synchronizes the outer full-screen painting.
      return undefined;
    }
    let cancelled = false;
    let frame1 = 0, frame2 = 0, cleanupTimer = 0;
    const image = new Image();
    image.decoding = "async";
    const begin = () => {
      if (cancelled) return;
      const outgoing = activeRef.current;
      activeRef.current = level;
      setScene({ current: level, previous: outgoing, entered: !outgoing });
      emit();
      if (!outgoing) return;
      // Two paint frames guarantee that CSS sees the 0 -> 1 opacity change.
      frame1 = requestAnimationFrame(() => {
        frame2 = requestAnimationFrame(() => {
          if (!cancelled) setScene((state) => state.current?.id === level.id ? { ...state, entered: true } : state);
        });
      });
      cleanupTimer = window.setTimeout(() => {
        if (!cancelled) setScene((state) => state.current?.id === level.id ? { ...state, previous: null } : state);
      }, CAPTAIN_CROSSFADE_MS + 100);
    };
    image.onload = begin;
    image.onerror = begin; // Keep the voyage functional even if one art request fails.
    image.src = level.background;
    if (image.complete) begin();
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
      window.clearTimeout(cleanupTimer);
    };
  }, [level?.id, broadcast]);
  return scene;
}

export function CaptainScenicPainting({ scene }) {
  const { current, previous, entered } = scene;
  if (!current) return null;
  return (
    <picture className="captain-scene captain-level-painting" aria-hidden="true">
      {previous && (
        <img key={previous.id} className="captain-backdrop-outgoing"
          src={previous.background} alt="" draggable="false" decoding="async" />
      )}
      <img key={current.id} className={"captain-backdrop-incoming" + (entered ? " is-entered" : "")}
        src={current.background} alt="" draggable="false" decoding="async" fetchPriority="high" />
    </picture>
  );
}
