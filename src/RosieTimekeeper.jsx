import React, { useCallback, useEffect, useRef, useState } from "react";
import "./RosieTimekeeper.css";
import TimekeeperClockwork from "./TimekeeperClockwork.jsx";

const ART = "/rosieverse/timekeeper/grand-clockwork-hall.jpg";
const PRESETS = [
  { label: "5 min", ms: 5 * 60_000 },
  { label: "10 min", ms: 10 * 60_000 },
  { label: "25 min", ms: 25 * 60_000 },
  { label: "45 min", ms: 45 * 60_000 }
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
  const [message, setMessage] = useState("");
  const [artFailed, setArtFailed] = useState(false);
  const anchor = useRef(0);
  const accumulated = useRef(0);
  const finished = useRef(false);

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
  const shown = mode === "stopwatch" ? formatClock(elapsed, true) : formatClock(remaining);

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
        <section className="rtk-dial" aria-label="Working stopwatch and countdown">
          <TimekeeperClockwork />
          <div className="rtk-mode-switch" role="group" aria-label="Timekeeper mode">
            <button type="button" className={mode === "stopwatch" ? "chosen" : ""} aria-pressed={mode === "stopwatch"} onClick={() => pickMode("stopwatch")}>Stopwatch</button>
            <button type="button" className={mode === "countdown" ? "chosen" : ""} aria-pressed={mode === "countdown"} onClick={() => pickMode("countdown")}>Timer</button>
          </div>
          <output className="rtk-time" aria-label={mode === "stopwatch" ? "Elapsed time" : "Time remaining"}>{shown}</output>
          <div className="rtk-caption">{message || (running ? "IN MOTION" : mode === "stopwatch" ? (laps.length ? laps.length + " LAPS RECORDED" : "READY TO BEGIN") : "COUNTDOWN READY")}</div>
          <div className="rtk-controls">
            <button type="button" onClick={mode === "stopwatch" ? lap : stopAndReset} disabled={mode === "stopwatch" && !running} aria-label={mode === "stopwatch" ? "Record lap" : "Reset countdown"}>{mode === "stopwatch" ? "Lap" : "Reset"}</button>
            <button type="button" className="rtk-primary-action" onClick={startOrPause} aria-label={running ? "Pause" : "Start"}>{running ? "❚❚" : "▶"}</button>
            <button type="button" onClick={stopAndReset} aria-label="Reset stopwatch or countdown">↺</button>
          </div>
        </section>
        <section className="rtk-utility" aria-label="Timekeeper settings and splits">
          {mode === "stopwatch" ? (
            <>
              <div className="rtk-utility-heading"><span>Laps & Splits</span><span>{laps.length ? laps.length + " recorded" : "1/100-second precision"}</span></div>
              {laps.length ? (
                <ol className="rtk-laps">
                  {laps.slice(0, 4).map((entry, index) => (
                    <li key={entry.total}><span>Lap {laps.length - index}</span><strong>{formatClock(entry.split, true)}</strong><small>{formatClock(entry.total, true)}</small></li>
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
              <div className="rtk-utility-heading"><span>Quick Timers</span><span>Choose a duration</span></div>
              <div className="rtk-presets">
                {PRESETS.map((preset) => (
                  <button type="button" key={preset.ms} className={duration === preset.ms ? "chosen" : ""} onClick={() => pickPreset(preset.ms)} aria-pressed={duration === preset.ms}>{preset.label}</button>
                ))}
              </div>
              <p className="rtk-empty">Rosie keeps time while this page is open. iPhone system alarms and background notifications are not available.</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
