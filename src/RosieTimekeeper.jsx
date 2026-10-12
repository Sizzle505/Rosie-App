import React, { useCallback, useEffect, useRef, useState } from "react";
import "./RosieTimekeeper.css";
import TimekeeperClockwork from "./TimekeeperClockwork.jsx";

const ART = "/rosieverse/timekeeper/grand-clockwork-hall.jpg";
const SQUIRREL = "/rosieverse/timekeeper/running-squirrel.webp";
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
  { label: "1m", ms: 60_000 },
  { label: "2m", ms: 2 * 60_000 },
  { label: "5m", ms: 5 * 60_000 },
  { label: "15m", ms: 15 * 60_000 }
];

function formatClock(ms, fractions = false) {
  const units = Math.max(0, Math.floor(ms / (fractions ? 1 : 1000)));
  const seconds = fractions ? Math.floor(units / 1000) : units;
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  const head = hh ? pad(hh) + ":" + pad(mm) + ":" + pad(ss) : pad(mm) + ":" + pad(ss);
  return fractions ? head + "." + String(units % 1000).padStart(3, "0") : head;
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
  const [timerEntry, setTimerEntry] = useState("presets");
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
        const controls = document.querySelector(".rtk-action-deck");
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
  }, [mode, laps.length, timerEntry]);

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
    const timer = window.setInterval(tick, 16);
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
  const leadingAngle = (mode === "countdown" ? -1 : 1) * dialProgress * Math.PI * 2;
  const markerX = 50 + 43 * Math.sin(leadingAngle);
  const markerY = 50 - 43 * Math.cos(leadingAngle);
  const showMarker = running || elapsed > 0;
  const fastestLap = laps.length > 1 ? Math.min(...laps.map((entry) => entry.split)) : null;
  const slowestLap = laps.length > 1 ? Math.max(...laps.map((entry) => entry.split)) : null;
  const shown = mode === "stopwatch" ? formatClock(elapsed, true) : formatClock(remaining);
  const [wholeTime, milliseconds] = mode === "stopwatch" ? shown.split(".") : [shown, null];
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
        <section className={"rtk-dial" + (running ? " is-running" : "") + (mode === "countdown" ? " is-countdown" : "")} aria-label="Working stopwatch and countdown">
          <TimekeeperClockwork />
          <div className="rtk-ornate-track" aria-hidden="true" />
          <svg className={"rtk-progress-ring" + (running ? " is-animating" : "") + (mode === "countdown" ? " is-reverse" : "")}
            viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="rtk-running-gold" x1="3%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbe0" />
                <stop offset="19%" stopColor="#ffe9a8" />
                <stop offset="43%" stopColor="#e8ad43" />
                <stop offset="66%" stopColor="#fff3bc" />
                <stop offset="83%" stopColor="#d24e65" />
                <stop offset="100%" stopColor="#fff0a5" />
              </linearGradient>
              <linearGradient id="rtk-charm-brass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff2c0" />
                <stop offset="43%" stopColor="#c98b34" />
                <stop offset="100%" stopColor="#81501f" />
              </linearGradient>
            </defs>
            <circle className="rtk-progress-track" cx="50" cy="50" r="43" />
            <circle className="rtk-progress-dotted" cx="50" cy="50" r="43" />
            <circle className="rtk-progress-bloom" cx="50" cy="50" r="43"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - dialProgress)} />
            <circle className="rtk-progress-ruby" cx="50" cy="50" r="43"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - dialProgress)} />
            <circle className="rtk-progress-live" cx="50" cy="50" r="43"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - dialProgress)} />
            {showMarker && (
              <g className="rtk-progress-charm" transform={`translate(${markerX} ${markerY})`}>
                <circle className="rtk-squirrel-aura" r="6.6" />
                <image className="rtk-squirrel-asset" href={SQUIRREL}
                  x="-7" y="-7" width="14" height="14" preserveAspectRatio="xMidYMid meet" />
              </g>
            )}
          </svg>
          <output className={"rtk-time"+(wholeTime.length > 5 ? " is-hours" : "")} aria-label={mode === "stopwatch" ? "Elapsed time" : "Time remaining"}>
            <span className="rtk-time-whole">{wholeTime}</span>
            {milliseconds !== null && <span className="rtk-time-fraction"><span aria-hidden="true">.</span>{milliseconds}</span>}
          </output>
          <div className={"rtk-caption"+(running ? " is-running" : "")}>{status}</div>
        </section>
        <div className="rtk-action-deck" aria-label="Timekeeper controls">
          <div className="rtk-controls">
            <button type="button" className="rtk-secondary-action rtk-lap-action"
              onClick={mode === "stopwatch" ? lap : repeatCountdown}
              disabled={mode === "stopwatch" && !running}
              aria-label={mode === "stopwatch" ? "Record lap" : "Restart countdown"}>
              <span className="rtk-action-word">{mode === "stopwatch" ? "Lap" : "Repeat"}</span>
            </button>
            <button type="button" className="rtk-primary-action" onClick={startOrPause}
              aria-label={running ? "Pause" : "Start"}>
              {running ? <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx=".8" /><rect x="14" y="4" width="5" height="16" rx=".8" /></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.3a1.3 1.3 0 0 1 2-.98l12 7.65a1.25 1.25 0 0 1 0 2.1L9 20.72a1.3 1.3 0 0 1-2-.99Z" /></svg>}
            </button>
            <button type="button" className="rtk-secondary-action rtk-reset-action"
              onClick={stopAndReset} aria-label="Reset stopwatch or countdown">
              <span className="rtk-action-word">Reset</span>
            </button>
          </div>
          <div className="rtk-mode-switch" role="group" aria-label="Timekeeper mode" data-active={mode}>
            <button type="button" className={mode === "stopwatch" ? "chosen" : ""} aria-pressed={mode === "stopwatch"} onClick={() => pickMode("stopwatch")}>Stopwatch</button>
            <button type="button" className={mode === "countdown" ? "chosen" : ""} aria-pressed={mode === "countdown"} onClick={() => { pickMode("countdown"); setTimerEntry("presets"); }}>Timer</button>
          </div>
        </div>
        <section ref={utilityRef} className={"rtk-utility" + (mode === "stopwatch" && !laps.length ? " is-empty" : "") + (mode === "countdown" ? " is-timer" : "")} aria-label="Timekeeper settings and splits">
          <div className="rtk-utility-inner">
          {mode === "stopwatch" ? (
            <>
              <div className="rtk-utility-heading"><span>Laps & Splits</span><span>{laps.length ? laps.length + " recorded" : "Milliseconds"}</span></div>
              {laps.length ? (
                <ol className="rtk-laps">
                  {laps.map((entry, index) => (
                    <li key={entry.total} className={entry.split === fastestLap ? "rtk-fastest-lap" : entry.split === slowestLap ? "rtk-slowest-lap" : ""}>
                      <span>Lap {laps.length - index}</span><strong>{formatClock(entry.split, true)}</strong><small>{formatClock(entry.total, true)}</small>
                    </li>
                  ))}
                </ol>
              ) : <p className="rtk-empty">{running ? "Tap Lap to record your first split." : elapsed > 0 ? "Resume the stopwatch or reset for a new run." : "Tap Start to begin timing."}</p>}

            </>
          ) : (
            <>
              <div className="rtk-utility-heading">
                <span>{timerEntry === "custom" ? "Custom Timer" : "Quick Timers"}</span>
                <button type="button" className="rtk-timer-view-toggle"
                  onClick={() => setTimerEntry(previous => previous === "presets" ? "custom" : "presets")}
                  aria-label={timerEntry === "presets" ? "Set a custom duration" : "Show quick timer presets"}>
                  {timerEntry === "presets" ? "Custom ›" : "‹ Presets"}
                </button>
              </div>
              {timerEntry === "presets" ? <div className="rtk-presets">
                {PRESETS.map((preset) => (
                  <button type="button" key={preset.ms} className={duration === preset.ms ? "chosen" : ""} onClick={() => pickPreset(preset.ms)} aria-pressed={duration === preset.ms}>{preset.label}</button>
                ))}
              </div> : <div className="rtk-custom-timer" aria-label="Custom countdown duration">
                <label>Hours<input inputMode="numeric" type="number" min="0" max="99" value={customHours}
                  onChange={e => setCustomHours(e.target.value)} aria-label="Hours" /></label>
                <span className="rtk-time-separator">:</span>
                <label>Min<input inputMode="numeric" type="number" min="0" max="59" value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)} aria-label="Minutes" /></label>
                <span className="rtk-time-separator">:</span>
                <label>Sec<input inputMode="numeric" type="number" min="0" max="59" value={customSeconds}
                  onChange={e => setCustomSeconds(e.target.value)} aria-label="Seconds" /></label>
                <button type="button" onClick={applyCustomDuration}>Set</button>
              </div>}
              {/* Only the active input set occupies the instrument face. */}
            </>
          )}
          </div>
        </section>
      </div>
    </main>
  );
}
