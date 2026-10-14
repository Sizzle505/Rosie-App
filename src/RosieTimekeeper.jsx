import React, { useCallback, useEffect, useRef, useState } from "react";
import "./RosieTimekeeper.css";
import TimekeeperClockwork from "./TimekeeperClockwork.jsx";

const ART = "/rosieverse/timekeeper/midnight-observatory/hall-plate.webp";
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

function formatClock(ms, fractions = false, countingDown = false) {
  // Display hundredths for both modes. Countdown rounds up to avoid
  // showing zero before the timer actually completes.
  const hundredths = Math.max(0, countingDown ? Math.ceil(ms / 10) : Math.floor(ms / 10));
  const seconds = Math.floor(hundredths / 100);
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  const head = hh ? pad(hh) + ":" + pad(mm) + ":" + pad(ss) : pad(mm) + ":" + pad(ss);
  return fractions ? head + "." + pad(hundredths % 100) : head;
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
  const circumference = 2 * Math.PI * 43;
  // Every moving mechanism derives from this same phase: the blue energy
  // circle and squirrel tell time, while Rosie, gears, pendulums and sand run.
  // A stopwatch has no natural finish, so Rosie’s squirrel makes one calm
  // circuit per 25 minutes instead of racing around the rim every minute.
  // A countdown still maps precisely to its selected duration.
  const runnerPhase = mode === "countdown"
    ? dialProgress
    : ((elapsed % (25 * 60 * 1000)) / (25 * 60 * 1000));
  const dialProgress = runnerPhase;
  const runnerAngle = -Math.PI / 2 + (mode === "countdown" ? -1 : 1) * runnerPhase * Math.PI * 2;
  const runnerX = 50 + 49.5 * Math.cos(runnerAngle);
  const runnerY = 50 + 49.5 * Math.sin(runnerAngle);
  // All three illustrated poses now come from the same full-resolution
  // Dropbox master, so the working pose can return without looking soft.
  const rosieState = running ? "working" : elapsed > 0 ? "pull" : "ready";
  const fastestLap = laps.length > 1 ? Math.min(...laps.map((entry) => entry.split)) : null;
  const slowestLap = laps.length > 1 ? Math.max(...laps.map((entry) => entry.split)) : null;
  const shown = mode === "stopwatch" ? formatClock(elapsed, true) : formatClock(remaining, true, true);
  const [wholeTime, hundredths] = shown.split(".");
  const status = (mode === "countdown" && finished.current && elapsed >= duration)
    ? "COMPLETE"
    : message || (running ? "RUNNING" : elapsed > 0 ? "PAUSED" :
      mode === "stopwatch" ? (laps.length ? laps.length + " LAPS RECORDED" : "READY TO BEGIN") : "COUNTDOWN READY");

  return (
    <main className="rtk-page" aria-label="Rosie's Timekeeper">
      <div className="rtk-scene rtk-observatory">
        <div className="rtk-art-stage">
        <img
          className="rtk-background"
          src={ART}
          alt="Rosie's midnight observatory, with clockwork cabinets and a moonlit window"
          draggable="false"
          onError={() => setArtFailed(true)}
          onLoad={() => setArtFailed(false)}
        />
        {artFailed && (
          <p className="rtk-image-warning" role="status">
            The Timekeeper artwork must be installed at {ART}.
          </p>
        )}
        <div className={"rtk-observatory-props" + (running ? " is-running" : "")} aria-hidden="true">
          <span className={"rtk-rosie-levers is-" + rosieState} />
          <span className="rtk-twin-lever rtk-twin-lever-left" />
          <span className="rtk-twin-lever rtk-twin-lever-right" />
        </div>
        <div className={"rtk-exterior-gearwork" + (running ? " is-running" : "")} aria-hidden="true">
          <TimekeeperClockwork />
        </div>
        <section className={"rtk-dial" + (running ? " is-running" : "") + (mode === "countdown" ? " is-countdown" : "")} aria-label="Working stopwatch and countdown">
          <span className="rtk-face-base" aria-hidden="true" />
          <span className="rtk-bezel" aria-hidden="true" />
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
            <circle className="rtk-progress-twilight" cx="50" cy="50" r="43" />
            <g className="rtk-energy-sparks">
              <path d="M50 3l.46 1.55L52 5l-1.54.46L50 7l-.46-1.54L48 5l1.54-.45Z"/>
              <path d="M94 48l.38 1.15L95.5 49.5l-1.12.35L94 51l-.38-1.15-1.12-.35 1.12-.35Z"/>
              <path d="M6 48l.38 1.15L7.5 49.5l-1.12.35L6 51l-.38-1.15-1.12-.35 1.12-.35Z"/>
              <path d="M50 93l.38 1.15L51.5 94.5l-1.12.35L50 96l-.38-1.15-1.12-.35 1.12-.35Z"/>
            </g>
            <circle className="rtk-progress-bloom" cx="50" cy="50" r="43"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - dialProgress)} />
            <circle className="rtk-progress-ruby" cx="50" cy="50" r="43"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - dialProgress)} />
            <circle className="rtk-progress-live" cx="50" cy="50" r="43"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - dialProgress)} />
          </svg>
          <span className={"rtk-squirrel-runner " + (running ? "is-running" : "") + (mode === "countdown" ? " is-countdown" : "")}
            aria-hidden="true" style={{ "--rtk-squirrel-x": runnerX + "%", "--rtk-squirrel-y": runnerY + "%" }} />
          <output className={"rtk-time"+(wholeTime.length > 5 ? " is-hours" : "")} aria-label={mode === "stopwatch" ? "Elapsed time" : "Time remaining"}>
            <span className="rtk-time-whole">{wholeTime}</span>
            <span className="rtk-time-fraction"><span aria-hidden="true">.</span>{hundredths}</span>
          </output>
          <div className={"rtk-caption"+(running ? " is-running" : "")}>{status}</div>
        </section>
        <div className="rtk-action-deck" aria-label="Timekeeper controls">
          <div className="rtk-controls">
            <button type="button" className="rtk-secondary-action rtk-lap-action"
              onClick={mode === "stopwatch" ? lap : repeatCountdown}
              disabled={mode === "stopwatch" && !running}
              aria-label={mode === "stopwatch" ? "Record lap" : "Restart countdown"}>
              {mode === "stopwatch" ? <span className="rtk-action-word">Lap</span> : (
                <svg className="rtk-repeat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d="m17 2 4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" />
                  <path d="m7 22-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" />
                </svg>
              )}
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
        </div>
        <section ref={utilityRef} className={"rtk-utility" + (mode === "stopwatch" && !laps.length ? " is-empty" : "") + (mode === "countdown" ? " is-timer" : "")} aria-label="Timekeeper settings and splits">
          <div className="rtk-mode-switch" role="group" aria-label="Timekeeper mode" data-active={mode}>
            <button type="button" className={mode === "stopwatch" ? "chosen" : ""} aria-pressed={mode === "stopwatch"} onClick={() => pickMode("stopwatch")}>Stopwatch</button>
            <button type="button" className={mode === "countdown" ? "chosen" : ""} aria-pressed={mode === "countdown"} onClick={() => { pickMode("countdown"); setTimerEntry("presets"); }}>Timer</button>
          </div>
          <div className="rtk-utility-inner">
          {mode === "stopwatch" ? (
            <>
              <div className="rtk-utility-heading"><span>Laps & Splits</span><span>{laps.length ? laps.length + " recorded" : "Hundredths"}</span></div>
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
      </div>
    </main>
  );
}
