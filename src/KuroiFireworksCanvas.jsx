import React, { useEffect, useRef } from "react";

/* The climax eruption for the Kuroi arena finale: a multi-second layered
 * canvas show — successive volleys of shells, expanding bloom rings, and a
 * grand-finale barrage — far bigger than the lane finale's DOM burst.
 * Purely presentational: the arena machine owns the timing (ARENA.eruptionMs)
 * and the canvas just paints while `active`. */
const COLORS = ["#ffd166", "#ff5a4e", "#4fd8c9", "#fff3d6", "#ff9de2", "#ffb347"];

/* FULL display, restored at Mitchell's direction (2026-11-25): the
 * eruption runs at its original designed density — the version from
 * the arena's first build — not the reduced paint-load caps of
 * rounds 6 + 8 (12 live shells, thinned motes, trails on every third
 * mote, DPR cap 1.2). Those caps were a precaution against the
 * black-screen failure, whose actual root cause was found in round
 * 10: a missing React import in this very file, evaluated only at
 * the eruption mount — fixed, and the Captain game now also sits
 * behind an error boundary whose painter guards (the try/catch in
 * frame/resize below) stay in place. Density is presentational only:
 * the arena machine owns the eruption timing, so it never affects
 * the fight. */

function makeShell(w, h, rng, big = false) {
  const x = w * (0.12 + rng() * 0.76);
  const y = h * (0.10 + rng() * 0.45);
  const count = big ? 90 : 46 + Math.floor(rng() * 26);
  const color = COLORS[Math.floor(rng() * COLORS.length)];
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.35;
    const speed = (big ? 190 : 130) * (0.35 + rng() * 0.75);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 26,
      life: 0,
      ttl: 950 + rng() * 900,
      size: 1.6 + rng() * (big ? 3.2 : 2.4),
      color: rng() < 0.22 ? COLORS[Math.floor(rng() * COLORS.length)] : color
    });
  }
  return { particles, ring: { x, y, r: 6, vr: big ? 300 : 210, life: 0, ttl: 620, color } };
}

export default function KuroiFireworksCanvas({ active, durationMs = 6500 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    let raf = 0;
    let shells = [];
    let disposed = false;
    // Deterministic-ish local RNG so the show varies run to run without
    // touching the fight machine's seeded state.
    let seed = (Date.now() % 2147483647) || 977;
    const rng = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    const resize = () => {
      // Guarded like the painter: a sizing failure must stop the show
      // quietly, never escape an effect or observer callback.
      try {
        const rect = parent.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.max(2, Math.round(rect.width * dpr));
        canvas.height = Math.max(2, Math.round(rect.height * dpr));
      } catch {
        disposed = true;
      }
    };
    resize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(parent);

    const volleys = [250, 950, 1700, 2500, 3300];
    const finaleAt = durationMs - 2100;
    let volleyIndex = 0;
    let finalePace = 0;
    const start = performance.now();
    let last = start;

    const frame = (now) => {
      if (disposed) return;
      // The painter is purely presentational: if anything in here ever
      // throws in a real browser, the show stops quietly instead of the
      // error escaping the rAF callback — the arena machine owns the
      // eruption timing and ends the show on schedule regardless. (The
      // Phase-1 Molten soft-lock was this exact class of failure: an
      // uncaught throw inside a painter killing its host loop.)
      try {
        paintFrame(now);
      } catch {
        disposed = true;
      }
    };
    const paintFrame = (now) => {
      const t = now - start;
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      // Launch the scheduled volleys, then the finale barrage.
      while (volleyIndex < volleys.length && t >= volleys[volleyIndex]) {
        shells.push(makeShell(w, h, rng, volleyIndex === volleys.length - 1));
        if (volleyIndex % 2 === 0) shells.push(makeShell(w, h, rng));
        volleyIndex++;
      }
      if (t >= finaleAt && t < durationMs - 250) {
        finalePace -= dt;
        if (finalePace <= 0) {
          finalePace = 0.16;
          shells.push(makeShell(w, h, rng, rng() < 0.4));
        }
      }
      ctx.globalCompositeOperation = "lighter";
      for (const shell of shells) {
        const ring = shell.ring;
        ring.life += dt * 1000;
        ring.r += ring.vr * dt;
        const ringAlpha = Math.max(0, 1 - ring.life / ring.ttl);
        if (ringAlpha > 0) {
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
          ctx.strokeStyle = ring.color;
          ctx.globalAlpha = ringAlpha * 0.55;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
        for (const p of shell.particles) {
          p.life += dt * 1000;
          if (p.life > p.ttl) continue;
          p.vy += 150 * dt;
          p.vx *= (1 - 0.55 * dt);
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const alpha = Math.max(0, 1 - p.life / p.ttl);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
          ctx.fill();
          // A short spark trail behind each mote (the full display).
          ctx.globalAlpha = alpha * 0.35;
          ctx.beginPath();
          ctx.arc(p.x - p.vx * 0.03, p.y - p.vy * 0.03, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      shells = shells.filter((shell) =>
        shell.particles.some((p) => p.life <= p.ttl) || shell.ring.life <= shell.ring.ttl);
      if (t < durationMs + 400) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [active, durationMs]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="yacht-arena-fireworks"
    aria-hidden="true" />;
}
