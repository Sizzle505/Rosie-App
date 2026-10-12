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
  const fastestLap = laps.length > 1 ? Math.min(...laps.map((entry) => entry.split)) : null;
  const slowestLap = laps.length > 1 ? Math.max(...laps.map((entry) => entry.split)) : null;
  const shown = mode === "stopwatch" ? formatClock(elapsed, true) : formatClock(remaining);
  const [wholeTime, centiseconds] = mode === "stopwatch" ? shown.split(".") : [shown, null];
  const status = message || (running ? "RUNNING" : elapsed > 0 ? "PAUSED" :
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
          <svg className="rtk-progress-ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <circle className="rtk-progress-track" cx="50" cy="50" r="44" />
            <circle className="rtk-progress-live" cx="50" cy="50" r="44"
              strokeDasharray="276.46" strokeDashoffset={276.46 * (1 - dialProgress)} />
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
        <section className={"rtk-utility" + (mode === "stopwatch" && !laps.length ? " is-empty" : "")} aria-label="Timekeeper settings and splits">
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
              <div className="rtk-shortcut">
                <span>Quick countdown</span>
                <button type="button" onClick={() => pickPreset(5 * 60_000)}>5m</button>
                <button type="button" onClick={() => pickPreset(25 * 60_000)}>25m</button>
              </div>
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
              <p className="rtk-timer-note">Completion sounds play when this page is active. iPhone background alarms are not guaranteed.</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
