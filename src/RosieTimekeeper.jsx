import React, { useCallback, useEffect, useRef, useState } from "react";
import "./RosieTimekeeper.css";
import TimekeeperClockwork from "./TimekeeperClockwork.jsx";

const ART = "/rosieverse/timekeeper/grand-clockwork-hall.jpg";
const STORAGE_KEY = "rosie-timekeeper-v2";
function cueComplete() {
  // Best effort in the foreground only; iOS does not guarantee background alarms.
  try {
    window.navigator?.vibrate?.([65, 45, 110]);
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext || document.hidden) return;
    const ctx = new AudioContext();
    for (const [offset, frequency] of [[0, 660], [.17, 880], [.34, 1046]]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(.095, ctx.currentTime + offset + .018);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + offset + .22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + .23);
    }
    window.setTimeout(() => ctx.close().catch(() => {}), 1100);
  } catch {}
}
const PRESETS = [
  { label: "1 min", ms: 60_000 },
  { label: "5 min", ms: 5 * 60_000 },
  { label: "10 min", ms: 10 * 60_000 },
  { label: "25 min", ms: 25 * 60_000 },
  { label: "60 min", ms: 60 * 60_000 }
];

function formatClock(ms, fractions = false) {
  const units = Math.max(0, Math.floor(ms / (fractions ? 10 : 1000)));
  const seconds = fractions ? Math.floor(units / 100) : units;
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  const head = hh ? pad(hh) + ":" + pad(mm) + ":" + pad(ss) : pad(mm) + ":" + pad(ss);
  return fractions ? head + "." + pad(units % 100) : head;
}

/**
 * Stopwatch uses performance.now rather than interval counting, so elapsed
 * time remains accurate when Safari throttles this Home Screen web app.
 * Countdown completion is an in-app cue, not a guaranteed iOS system alarm.
 */
export default function RosieTimekeeper() {
  const [mode, setMode] = useState("stopwatch");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(25 * 60_000);
  const [laps, setLaps] = useState([]);
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("25");
  const [customSeconds, setCustomSeconds] = useState("00");
  const [restored, setRestored] = useState(false);
  const lastSavedAt = useRef(0);
  const [message, setMessage] = useState("");
  const [artFailed, setArtFailed] = useState(false);
  const anchor = useRef(0);
  const accumulated = useRef(0);
  const finished = useRef(false);
  const utilityRef = useRef(null);

  // The shared Resources navigation is fixed to the viewport. Preserve room
  // between the control deck and the cabinet while keeping the tray above it.
  useEffect(() => {
    let frame = 0;
    const fitTray = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const panel = utilityRef.current;
        const nav = document.querySelector(".resources-bottom-nav");
        const controls = document.querySelector(".rtk-action-deck .rtk-controls");
        if (!panel || !nav || !controls) return;
        panel.style.setProperty("--rtk-nav-lift", "0px");
        const panelRect = panel.getBoundingClientRect();
        const navTop = nav.getBoundingClientRect().top;
        const controlsBottom = controls.getBoundingClientRect().bottom;
        const overlap = Math.max(0, panelRect.bottom - navTop + 13);
        const freeSpace = Math.max(0, panelRect.top - controlsBottom - 7);
        panel.style.setProperty("--rtk-nav-lift", Math.ceil(Math.min(overlap, freeSpace)) + "px");
      });
    };
    fitTray();
    window.addEventListener("resize", fitTray);
    window.addEventListener("orientationchange", fitTray);
    const nav = document.querySelector(".resources-bottom-nav");
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fitTray) : null;
    if (observer && nav) observer.observe(nav);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", fitTray);
      window.removeEventListener("orientationchange", fitTray);
    };
  }, [mode, laps.length]);

  // Resume after reload using wall time only for time spent outside this page.
  // While open, performance.now() remains the high-precision source.
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && (saved.mode === "stopwatch" || saved.mode === "countdown")) {
        const restoredMode = saved.mode;
        const restoredDuration = Number.isFinite(saved.duration) && saved.duration > 0 ? saved.duration : 25 * 60_000;
        const extra = saved.running ? Math.max(0, Date.now() - (Number(saved.savedAt) || Date.now())) : 0;
        const newElapsed = Math.max(0, (Number(saved.elapsed) || 0) + extra);
        const expired = restoredMode === "countdown" && newElapsed >= restoredDuration;
        const actual = expired ? restoredDuration : newElapsed;
        accumulated.current = actual;
        anchor.current = performance.now();
        finished.current = expired;
        setMode(restoredMode);
        setDuration(restoredDuration);
        setElapsed(actual);
        setLaps(Array.isArray(saved.laps) ? saved.laps.slice(0, 99) : []);
        setRunning(Boolean(saved.running && !expired));
        if (expired) setMessage("The sands of time have run out.");
      }
    } catch {}
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    const now = Date.now();
    if (running && now - lastSavedAt.current < 1000) return;
    lastSavedAt.current = now;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode, duration, elapsed, running, laps, savedAt: now
      }));
    } catch {}
  }, [restored, mode, duration, elapsed, running, laps]);

  useEffect(() => {
    if (!running) return undefined;
    const tick = () => {
      const live = accumulated.current + performance.now() - anchor.current;
      if (mode === "countdown" && live >= duration) {
        accumulated.current = duration;
        setElapsed(duration);
        setRunning(false);
        if (!finished.current) {
          finished.current = true;
          setMessage("The sands of time have run out.");
          cueComplete();
        }
      } else {
        setElapsed(live);
      }
    };
    tick();
    const timer = window.setInterval(tick, 40);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [running, mode, duration]);

  const stopAndReset = useCallback(() => {
    setRunning(false);
    accumulated.current = 0;
    anchor.current = 0;
    finished.current = false;
    setElapsed(0);
    setLaps([]);
    setMessage("");
  }, []);

  function pickMode(next) {
    if (mode === next) return;
    stopAndReset();
    setMode(next);
  }

  function repeatCountdown() {
    stopAndReset();
    anchor.current = performance.now();
    setMode("countdown");
    setRunning(true);
  }

  function applyCustomDuration() {
    const hours = Number(customHours);
    const minutes = Number(customMinutes);
    const seconds = Number(customSeconds);
    if (![hours, minutes, seconds].every(Number.isFinite) ||
        hours < 0 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59 ||
        hours > 99 || !Number.isInteger(hours) || !Number.isInteger(minutes) || !Number.isInteger(seconds) ||
        hours + minutes + seconds === 0) {
      setMessage("Enter a valid duration.");
      return;
    }
    pickPreset((hours * 3600 + minutes * 60 + seconds) * 1000);
  }

  function pickPreset(ms) {
    stopAndReset();
    setMode("countdown");
    setDuration(ms);
  }

  function startOrPause() {
    if (running) {
      const ms = accumulated.current + performance.now() - anchor.current;
      accumulated.current = Math.min(mode === "countdown" ? duration : Infinity, ms);
      setElapsed(accumulated.current);
      setRunning(false);
      return;
    }
    if (mode === "countdown" && accumulated.current >= duration) {
      accumulated.current = 0;
      setElapsed(0);
    }
    anchor.current = performance.now();
    finished.current = false;
    setMessage("");
    setRunning(true);
  }

  function lap() {
    if (!running || mode !== "stopwatch") return;
    const total = accumulated.current + performance.now() - anchor.current;
    setElapsed(total);
    setLaps((previous) => [{ total, split: total - (previous[0]?.total ?? 0) }, ...previous].slice(0, 99));
  }

  const remaining = Math.max(0, duration - elapsed);
  const dialProgress = mode === "countdown"
    ? (duration > 0 ? Math.min(1, elapsed / duration) : 0)
    : ((elapsed % 60_000) / 60_000);
  const circumference = 2 * Math.PI * 43;
  const leadingAngle = dialProgress * Math.PI * 2;
  const markerX = 50 + 43 * Math.sin(leadingAngle);
  const markerY = 50 - 43 * Math.cos(leadingAngle);
  const showMarker = running || elapsed > 0;
  const fastestLap = laps.length > 1 ? Math.min(...laps.map((entry) => entry.split)) : null;
  const slowestLap = laps.length > 1 ? Math.max(...laps.map((entry) => entry.split)) : null;
  const shown = mode === "stopwatch" ? formatClock(elapsed, true) : formatClock(remaining);
  const [wholeTime, centiseconds] = mode === "stopwatch" ? shown.split(".") : [shown, null];
  const status = (mode === "countdown" && finished.current && elapsed >= duration)
    ? "COMPLETE"
    : message || (running ? "RUNNING" : elapsed > 0 ? "PAUSED" :
      mode === "stopwatch" ? (laps.length ? laps.length + " LAPS RECORDED" : "READY TO BEGIN") : "COUNTDOWN READY");

  return (
    <main className="rtk-page" aria-label="Rosie's Timekeeper">
      <div className="rtk-scene">
        <img
          className="rtk-background"
          src={ART}
          alt="Rosie operating the grand clockwork hall, with gold gears and an empty timer dial"
          draggable="false"
          onError={() => setArtFailed(true)}
          onLoad={() => setArtFailed(false)}
        />
        {artFailed && (
          <p className="rtk-image-warning" role="status">
            The Timekeeper artwork must be installed at {ART}.
          </p>
        )}
        <section className={"rtk-dial" + (running ? " is-running" : "")} aria-label="Working stopwatch and countdown">
          <TimekeeperClockwork />
          <svg className={"rtk-progress-ring" + (running ? " is-animating" : "")}
            viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="rtk-running-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff7ca" />
                <stop offset="28%" stopColor="#ffe27b" />
                <stop offset="52%" stopColor="#f1a73d" />
                <stop offset="72%" stopColor="#fff3b4" />
                <stop offset="100%" stopColor="#fc5b82" />
              </linearGradient>
            </defs>
            <circle className="rtk-progress-track" cx="50" cy="50" r="43" />
            <circle className="rtk-progress-dotted" cx="50" cy="50" r="43" />
            <circle className="rtk-progress-bloom" cx="50" cy="50" r="43"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - dialProgress)} />
            <circle className="rtk-progress-live" cx="50" cy="50" r="43"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - dialProgress)} />
            {showMarker && (
              <g className="rtk-progress-charm" transform={`translate(${markerX} ${markerY})`}>
                <path className="rtk-charm-sparkle" d="M0 -6.7L.7 -4.8L2.6 -4L.7 -3.3L0 -1.4L-.7 -3.3L-2.6 -4L-.7 -4.8Z" />
                <circle className="rtk-charm-edge" r="3.9" />
                <circle className="rtk-charm-core" r="3.1" />
                <ellipse cx="-1.55" cy="-1.12" rx=".53" ry=".72" fill="#fff2c9" />
                <ellipse cx="-.43" cy="-1.81" rx=".5" ry=".64" fill="#fff2c9" />
                <ellipse cx=".78" cy="-1.7" rx=".5" ry=".64" fill="#fff2c9" />
                <ellipse cx="1.73" cy="-.86" rx=".45" ry=".66" fill="#fff2c9" />
                <path d="M-1.8 .92Q-1.45 .15-.7 .34Q0 -.18 .65 .35Q1.7 .13 1.8 1.04Q1.77 2.14 .58 1.93Q0 1.63-.53 1.92Q-1.76 2.12-1.8 .92Z" fill="#ffe9b0" />
              </g>
            )}
          </svg>
          <output className={"rtk-time"+(wholeTime.length > 5 ? " is-hours" : "")} aria-label={mode === "stopwatch" ? "Elapsed time" : "Time remaining"}>
            <span className="rtk-time-whole">{wholeTime}</span>
            {centiseconds !== null && <span className="rtk-time-fraction"><span aria-hidden="true">.</span>{centiseconds}</span>}
          </output>
          <div className={"rtk-caption"+(running ? " is-running" : "")}>{status}</div>
        </section>
        <div className="rtk-action-deck" aria-label="Timekeeper controls">
          <div className="rtk-mode-switch" role="group" aria-label="Timekeeper mode" data-active={mode}>
            <button type="button" className={mode === "stopwatch" ? "chosen" : ""} aria-pressed={mode === "stopwatch"} onClick={() => pickMode("stopwatch")}>Stopwatch</button>
            <button type="button" className={mode === "countdown" ? "chosen" : ""} aria-pressed={mode === "countdown"} onClick={() => pickMode("countdown")}>Timer</button>
          </div>
          <div className="rtk-controls">
            <button type="button" className="rtk-secondary-action rtk-lap-action"
              onClick={mode === "stopwatch" ? lap : repeatCountdown}
              disabled={mode === "stopwatch" && !running}
              aria-label={mode === "stopwatch" ? "Record lap" : "Restart countdown"}>
              {mode === "stopwatch" ? "Lap" : "Repeat"}
            </button>
            <button type="button" className="rtk-primary-action" onClick={startOrPause}
              aria-label={running ? "Pause" : "Start"}>
              {running ? <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx=".8" /><rect x="14" y="4" width="5" height="16" rx=".8" /></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.3a1.3 1.3 0 0 1 2-.98l12 7.65a1.25 1.25 0 0 1 0 2.1L9 20.72a1.3 1.3 0 0 1-2-.99Z" /></svg>}
            </button>
            <button type="button" className="rtk-secondary-action rtk-reset-action"
              onClick={stopAndReset} aria-label="Reset stopwatch or countdown">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.3 12a7.7 7.7 0 1 0 2.5-5.7L4 9" /><path d="M4 3.8V9h5.2" /></svg>
            </button>
          </div>
        </div>
        <section ref={utilityRef} className={"rtk-utility" + (mode === "stopwatch" && !laps.length ? " is-empty" : "") + (mode === "countdown" ? " is-timer" : "")} aria-label="Timekeeper settings and splits">
          <div className="rtk-utility-inner">
          {mode === "stopwatch" ? (
            <>
              <div className="rtk-utility-heading"><span>Laps & Splits</span><span>{laps.length ? laps.length + " recorded" : "1/100-second precision"}</span></div>
              {laps.length ? (
                <ol className="rtk-laps">
                  {laps.map((entry, index) => (
                    <li key={entry.total} className={entry.split === fastestLap ? "rtk-fastest-lap" : entry.split === slowestLap ? "rtk-slowest-lap" : ""}>
                      <span>Lap {laps.length - index}</span><strong>{formatClock(entry.split, true)}</strong><small>{formatClock(entry.total, true)}</small>
                    </li>
                  ))}
                </ol>
              ) : <p className="rtk-empty">Start the stopwatch and tap Lap to mark a split.</p>}
              {laps.length > 0 && <div className="rtk-shortcut">
                <span>Quick countdown</span>
                <button type="button" onClick={() => pickPreset(5 * 60_000)}>5m</button>
                <button type="button" onClick={() => pickPreset(25 * 60_000)}>25m</button>
              </div>}
            </>
          ) : (
            <>
              <div className="rtk-utility-heading"><span>Quick Timers</span><span>Set a countdown</span></div>
              <div className="rtk-presets">
                {PRESETS.map((preset) => (
                  <button type="button" key={preset.ms} className={duration === preset.ms ? "chosen" : ""} onClick={() => pickPreset(preset.ms)} aria-pressed={duration === preset.ms}>{preset.label}</button>
                ))}
              </div>
              <div className="rtk-custom-timer" aria-label="Custom countdown duration">
                <label>Hours<input inputMode="numeric" type="number" min="0" max="99" value={customHours}
                  onChange={e => setCustomHours(e.target.value)} aria-label="Hours" /></label>
                <span className="rtk-time-separator">:</span>
                <label>Min<input inputMode="numeric" type="number" min="0" max="59" value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)} aria-label="Minutes" /></label>
                <span className="rtk-time-separator">:</span>
                <label>Sec<input inputMode="numeric" type="number" min="0" max="59" value={customSeconds}
                  onChange={e => setCustomSeconds(e.target.value)} aria-label="Seconds" /></label>
                <button type="button" onClick={applyCustomDuration}>Set</button>
              </div>
              <p className="rtk-timer-note">Sounds work while this page is open; background alarms aren't guaranteed.</p>
            </>
          )}
          </div>
        </section>
      </div>
    </main>
  );
}
