import React, { useCallback, useEffect, useRef, useState } from "react";
import "./RosieTimekeeper.css";
import TimekeeperClockwork from "./TimekeeperClockwork.jsx";

const ART = "/rosieverse/timekeeper/midnight-observatory/hall-plate.webp";
const STORAGE_KEY = "rosie-timekeeper-v3";
let timekeeperAudio=null;
function primeTimekeeperAudio(){
 try {const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  if(!timekeeperAudio||timekeeperAudio.state==="closed")timekeeperAudio=new Audio();
  if(timekeeperAudio.state==="suspended")void timekeeperAudio.resume().catch(()=>{});
 }catch{}
}
function cueComplete(){
 try {navigator.vibrate?.([50,45,100]);if(document.hidden||!timekeeperAudio||timekeeperAudio.state!=="running")return;
  const ctx=timekeeperAudio,t0=ctx.currentTime+.025;
  for(const off of [0,.205]){
   const t=t0+off,o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();
   o.type="sawtooth";o.frequency.setValueAtTime(205,t);o.frequency.exponentialRampToValueAtTime(115,t+.16);
   f.type="lowpass";f.frequency.setValueAtTime(850,t);f.frequency.exponentialRampToValueAtTime(370,t+.17);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.085,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+.17);
   o.connect(f).connect(g).connect(ctx.destination);o.start(t);o.stop(t+.18);
  }
  for(const [off,hz] of [[.42,784],[.59,987.77],[.78,1318.5]]){
   for(const [harmonic,volume] of [[1,.057],[2.01,.015]]){
    const t=t0+off,o=ctx.createOscillator(),g=ctx.createGain();
    o.type="sine";o.frequency.value=hz*harmonic;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.60);
    o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+.62);
   }
  }
 }catch{}
}
const DIAL_FRAMES = [
  { id: "batons", label: "Baton", symbol: "◆" },
  { id: "roman", label: "Roman", symbol: "Ⅻ" },
  { id: "chronograph", label: "Chronograph", symbol: "◉" },
  { id: "celestial", label: "Celestial", symbol: "☾" }
];
const LUXURY_ASSETS = "/rosieverse/timekeeper/midnight-observatory/luxury/";
const DIAL_COLORS = [
  { id:"sapphire", label:"Royal Sapphire", center:"#1959bd", edge:"#07183b", light:false },
  { id:"emerald", label:"Imperial Emerald", center:"#1b8757", edge:"#042f20", light:false },
  { id:"onyx", label:"Midnight Onyx", center:"#26242a", edge:"#030305", light:false },
  { id:"garnet", label:"Royal Garnet", center:"#9d2146", edge:"#290516", light:false },
  { id:"amethyst", label:"Imperial Amethyst", center:"#7740a1", edge:"#1d0b36", light:false },
  { id:"pearl", label:"Champagne Pearl", center:"#efe0c1", edge:"#b39576", light:true },
  { id:"teal", label:"Peacock Teal", center:"#137c84", edge:"#072e42", light:false },
  { id:"lapis", label:"Celestial Lapis", center:"#1a4aa7", edge:"#070f38", light:false }
];
const HAND_STYLES = [
  { id:"dauphine",label:"Gold" },
  { id:"filigree",label:"Filigree" },
  { id:"blued",label:"Blued Steel" }
];
const WORLD_CITIES = [
  {city:"New York", zone:"America/New_York"},
  {city:"Los Angeles", zone:"America/Los_Angeles"},
  {city:"Chicago", zone:"America/Chicago"},
  {city:"London", zone:"Europe/London"},
  {city:"Paris", zone:"Europe/Paris"},
  {city:"Dubai", zone:"Asia/Dubai"},
  {city:"Mumbai", zone:"Asia/Kolkata"},
  {city:"Singapore", zone:"Asia/Singapore"},
  {city:"Hong Kong", zone:"Asia/Hong_Kong"},
  {city:"Tokyo", zone:"Asia/Tokyo"},
  {city:"Sydney", zone:"Australia/Sydney"},
  {city:"Honolulu", zone:"Pacific/Honolulu"}
];
function worldTimeParts(now,zone) {
 const fields=new Intl.DateTimeFormat("en-US",{timeZone:zone,hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23",weekday:"short",month:"short",day:"numeric",timeZoneName:"short"}).formatToParts(new Date(now));
 const val=type=>fields.find(f=>f.type===type)?.value||"";
 return {hh:Number(val("hour")),mm:Number(val("minute")),ss:Number(val("second")),day:val("weekday"),month:val("month"),date:val("day"),abbr:val("timeZoneName")};
}
const DIAL_ASSET_ROOT = "/rosieverse/timekeeper/midnight-observatory/face-overlays/";
const PRESETS = [
  { label:"30s", ms:30_000 },
  { label:"1m", ms:60_000 },
  { label:"5m", ms:300_000 },
  { label:"10m", ms:600_000 }
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
  const [duration, setDuration] = useState(60_000);
  const [laps, setLaps] = useState([]);
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("1");
  const [customSeconds, setCustomSeconds] = useState("00");
  const [timerEntry, setTimerEntry] = useState("presets");
  const [dialFrame, setDialFrame] = useState(() => {
    try {
      const saved = window.localStorage.getItem("rosie-timekeeper-dial");
      return DIAL_FRAMES.some(item => item.id === saved) ? saved : "batons";
    } catch { return "batons"; }
  });
  const [dialColor, setDialColor] = useState(() => {
    try {
      const saved = window.localStorage.getItem("rosie-timekeeper-color");
      return DIAL_COLORS.some(item => item.id === saved) ? saved : "sapphire";
    } catch { return "sapphire"; }
  });
  const [dialPickerOpen, setDialPickerOpen] = useState(false);
  const [worldZone,setWorldZone] = useState(() => {try {const saved=localStorage.getItem("rosie-timekeeper-zone");return WORLD_CITIES.some(c=>c.zone===saved)?saved:"America/New_York";}catch{return "America/New_York";}});
  const [handStyle,setHandStyle] = useState(() => {try {const saved=localStorage.getItem("rosie-timekeeper-hands");return HAND_STYLES.some(c=>c.id===saved)?saved:"dauphine";}catch{return "dauphine";}});
  const [worldNow,setWorldNow] = useState(()=>Date.now());
  const [runnerEpoch,setRunnerEpoch] = useState(0);

  const [restored, setRestored] = useState(false);
  const lastSavedAt = useRef(0);
  const [message, setMessage] = useState("");
  const [artFailed, setArtFailed] = useState(false);
  const anchor = useRef(0);
  const accumulated = useRef(0);
  const finished = useRef(false);
  const utilityRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem("rosie-timekeeper-dial",dialFrame);
      window.localStorage.setItem("rosie-timekeeper-color",dialColor);
    } catch {}
  }, [dialFrame,dialColor]);

  useEffect(() => {
    try {localStorage.setItem("rosie-timekeeper-zone",worldZone);localStorage.setItem("rosie-timekeeper-hands",handStyle);}catch{}
  },[worldZone,handStyle]);
  useEffect(() => {
    if(mode!=="world")return undefined;
    setWorldNow(Date.now());
    const timer=setInterval(()=>setWorldNow(Date.now()),1000);
    return ()=>clearInterval(timer);
  },[mode]);

  // Resume after reload using wall time only for time spent outside this page.
  // While open, performance.now() remains the high-precision source.
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && (saved.mode === "stopwatch" || saved.mode === "countdown")) {
        const restoredMode = saved.mode;
        const restoredDuration = Number.isFinite(saved.duration) && saved.duration > 0 ? saved.duration : 60_000;
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
    primeTimekeeperAudio();
    stopAndReset();
    setRunnerEpoch(n=>n+1);
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
    primeTimekeeperAudio();
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

  const selectedColor = DIAL_COLORS.find(item => item.id === dialColor) || DIAL_COLORS[0];
  const selectedFrame = DIAL_FRAMES.find(item => item.id === dialFrame) || DIAL_FRAMES[0];
  const chosenWorldCity=WORLD_CITIES.find(c=>c.zone===worldZone)||WORLD_CITIES[0];
  const world=worldTimeParts(worldNow,chosenWorldCity.zone);
  const padWorld=n=>String(n).padStart(2,"0");
  const worldIsDay=world.hh>=6&&world.hh<18;
  const worldHours=(world.hh%12+world.mm/60+world.ss/3600)*30;
  const worldMinutes=(world.mm+world.ss/60)*6;
  const worldSeconds=world.ss*6;
  const remaining = Math.max(0, duration - elapsed);
  const circumference = 2 * Math.PI * 43;
  // Stopwatch advances clockwise every minute. A countdown runs one
  // counterclockwise revolution, ending precisely when its duration ends.
  const runnerPhase = mode === "countdown"
    ? (duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 0)
    : ((elapsed % 60_000) / 60_000);
  const dialProgress = runnerPhase;
  const runnerAngle = -Math.PI / 2 + (mode === "countdown" ? -1 : 1) * runnerPhase * Math.PI * 2;
  const runnerX = 50 + 49.5 * Math.cos(runnerAngle);
  const runnerY = 50 + 49.5 * Math.sin(runnerAngle);
  // All three illustrated poses now come from the same full-resolution
  // Dropbox master, so the working pose can return without looking soft.
  const rosieState = running ? (Math.floor(elapsed / 8500) % 2 ? "pull" : "working") : elapsed > 0 ? "pull" : "ready";
  const fastestLap = laps.length > 1 ? Math.min(...laps.map((entry) => entry.split)) : null;
  const slowestLap = laps.length > 1 ? Math.max(...laps.map((entry) => entry.split)) : null;
  const shown = mode === "world" ? padWorld(world.hh)+":"+padWorld(world.mm)+":"+padWorld(world.ss) : mode === "stopwatch" ? formatClock(elapsed, true) : formatClock(remaining, true, true);
  const [wholeTime, hundredths] = shown.split(".");
  const status = mode === "world" ? chosenWorldCity.city.toUpperCase()+" · "+world.abbr : (mode === "countdown" && finished.current && elapsed >= duration)
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
        </div>
        <div className={"rtk-exterior-gearwork" + (running ? " is-running" : "")} aria-hidden="true">
          <TimekeeperClockwork />
        </div>
        <section className={"rtk-dial" + (running ? " is-running" : "") + (mode === "countdown" ? " is-countdown" : "") + (mode==="world" ? " is-world" : "")}
          style={{ "--rtk-face-center": selectedColor.center, "--rtk-face-edge": selectedColor.edge,
            "--rtk-face-texture": `url("${LUXURY_ASSETS}dial-textures/${selectedColor.id}.webp")`,
            "--rtk-numeral-color": selectedColor.light ? "#342b30" : "#fff1d5" }}
          aria-label="Working stopwatch and countdown">
          <span className="rtk-face-base" aria-hidden="true" />
          <span className="rtk-face-overlay" style={{ backgroundImage: `url("${DIAL_ASSET_ROOT}${selectedFrame.id}.webp")` }} aria-hidden="true" />
          <span className="rtk-bezel" aria-hidden="true" />
          {mode==="world" && <span className="rtk-world-hands" aria-hidden="true">
            {[
              ["hour",worldHours],
              ["minute",worldMinutes],
              ["second",worldSeconds]
            ].map(([part,angle])=><span key={part} className={"rtk-world-hand is-"+part}
              style={{backgroundImage:`url("${LUXURY_ASSETS}world-clock-hands/${handStyle}-${part}.webp")`,transform:`rotate(${angle}deg)`}} />)}
            <span className="rtk-world-pivot" style={{backgroundImage:`url("${LUXURY_ASSETS}world-clock-hands/${handStyle}-pivot.webp")`}} />
          </span>}
          <div className="rtk-ornate-track" aria-hidden="true" />
          <svg className={"rtk-progress-ring" + (mode === "world" ? " is-world" : "") + (running ? " is-animating" : "") + (mode === "countdown" ? " is-reverse" : "")}
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
          {mode!=="world" && <span key={runnerEpoch}
            className={"rtk-squirrel-runner " + (running ? "is-running" : "") + (mode === "countdown" ? " is-countdown" : "") + (runnerY > 50 ? " is-flipped" : "")}
            aria-hidden="true" style={{ "--rtk-squirrel-x": runnerX + "%", "--rtk-squirrel-y": runnerY + "%" }} />}
          <output className={"rtk-time"+(wholeTime.length > 5 ? " is-hours" : "")+(mode==="world" ? " is-world-time" : "")} aria-label={mode==="world" ? "Local time in "+chosenWorldCity.city : mode === "stopwatch" ? "Elapsed time" : "Time remaining"}>
            <span className="rtk-time-whole">{wholeTime}</span>
            {mode!=="world" && <span className="rtk-time-fraction"><span aria-hidden="true">.</span>{hundredths}</span>}
          </output>
          <div className={"rtk-caption"+(running ? " is-running" : "")}>{status}</div>
          {mode==="countdown" && finished.current && elapsed >= duration &&
            <img className="rtk-completion-flourish" src={LUXURY_ASSETS+"world-clock-ui/completion-sparkle.webp"}
              alt="" aria-hidden="true" draggable="false" />}
        </section>
        <div className={"rtk-action-deck"+(mode==="world" ? " is-world" : "")} aria-label="Timekeeper controls">
          <div className="rtk-controls">
            <button type="button" className="rtk-secondary-action rtk-lap-action"
              onClick={mode === "stopwatch" ? lap : repeatCountdown}
              disabled={mode === "stopwatch" && !running}
              title={mode === "stopwatch" ? "Lap" : "Repeat countdown"} aria-label={mode === "stopwatch" ? "Record lap" : "Repeat countdown"}>
              {mode === "stopwatch" ? <span className="rtk-action-word">Lap</span> : (
                <svg className="rtk-repeat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d="m17 2 4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" />
                  <path d="m7 22-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" />
                </svg>
              )}
            </button>
            <button type="button" className={"rtk-primary-action" + (running ? " is-playing" : "")} onClick={startOrPause}
              title={running ? "Pause" : "Play"} aria-label={running ? "Pause" : "Play"}>
              {running ? <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx=".8" /><rect x="14" y="4" width="5" height="16" rx=".8" /></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.3a1.3 1.3 0 0 1 2-.98l12 7.65a1.25 1.25 0 0 1 0 2.1L9 20.72a1.3 1.3 0 0 1-2-.99Z" /></svg>}
            </button>
            <button type="button" className="rtk-secondary-action rtk-reset-action"
              onClick={stopAndReset} title="Reset" aria-label="Reset stopwatch or countdown">
              <span className="rtk-action-word">Reset</span>
            </button>
          </div>
        </div>
        <section ref={utilityRef} className={"rtk-utility" + (mode === "stopwatch" && !laps.length ? " is-empty" : "") + (mode === "countdown" ? " is-timer" : "")} aria-label="Timekeeper settings and splits">
          <button type="button" className="rtk-face-trigger" onClick={() => setDialPickerOpen(open => !open)}
            aria-label="Choose clock face and color" aria-expanded={dialPickerOpen} title="Clock faces and colors">✦</button>
          <div className="rtk-mode-switch" role="group" aria-label="Timekeeper mode" data-active={mode}>
            <button type="button" className={mode === "stopwatch" ? "chosen" : ""} aria-pressed={mode === "stopwatch"} onClick={() => pickMode("stopwatch")}>Stopwatch</button>
            <button type="button" className={"rtk-globe-mode"+(mode === "world" ? " chosen" : "")} aria-label="World Clock" title="World Clock" aria-pressed={mode === "world"} onClick={() => pickMode("world")}>
              <img src={LUXURY_ASSETS+"world-clock-ui/globe.webp"} alt="" draggable="false" />
            </button>
            <button type="button" className={mode === "countdown" ? "chosen" : ""} aria-pressed={mode === "countdown"} onClick={() => { pickMode("countdown"); setTimerEntry("presets"); }}>Timer</button>
          </div>
          {dialPickerOpen && <div className="rtk-dial-picker" role="group" aria-label="Clock face and color">
            <div className="rtk-dial-picker-head">
              <span>Clock faces</span>
              <button type="button" aria-label="Close clock face chooser" onClick={() => setDialPickerOpen(false)}>×</button>
            </div>
            <div className="rtk-frame-choices">
              {DIAL_FRAMES.map(item => <button type="button" key={item.id}
                className={dialFrame === item.id ? "chosen" : ""}
                aria-label={item.label + " clock face"} aria-pressed={dialFrame === item.id}
                title={item.label} onClick={() => setDialFrame(item.id)}>
                <span aria-hidden="true">{item.symbol}</span><small>{item.label}</small>
              </button>)}
            </div>
            <div className="rtk-hand-choices" role="group" aria-label="Clock hand style">
              <span>Hands</span>{HAND_STYLES.map(item=><button type="button" key={item.id}
                aria-label={item.label+" clock hands"} aria-pressed={handStyle===item.id}
                className={handStyle===item.id?"chosen":""} onClick={()=>setHandStyle(item.id)}>{item.label}</button>)}
            </div>
            <div className="rtk-color-choices">
              <span>Enamel</span>
              {DIAL_COLORS.map(item => <button type="button" key={item.id}
                className={dialColor === item.id ? "chosen" : ""} title={item.label}
                aria-label={item.label + " clock color"} aria-pressed={dialColor === item.id}
                onClick={() => setDialColor(item.id)}
                style={{ "--swatch": item.center }} />)}
            </div>
          </div>}
          <div className="rtk-utility-inner">
          {mode === "world" ? (
            <div className="rtk-world-settings">
              <label htmlFor="rtk-world-city">World Clock</label>
              <select id="rtk-world-city" aria-label="Select world clock city" value={worldZone}
                onChange={e=>setWorldZone(e.target.value)}>
                {WORLD_CITIES.map(item=><option value={item.zone} key={item.zone}>{item.city}</option>)}
              </select>
              <div className="rtk-world-city-plaque">
                <strong>{chosenWorldCity.city}</strong>
                <span>{world.day}, {world.month} {world.date} · {world.abbr}</span>
                <img src={LUXURY_ASSETS+"world-clock-ui/"+(worldIsDay?"sun":"moon")+".webp"} alt={worldIsDay?"Daytime":"Nighttime"} />
              </div>
            </div>
          ) : mode === "stopwatch" ? (
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
                  {timerEntry === "presets" ? "Custom ›" : "‹ Quick Timers"}
                </button>
              </div>
              {timerEntry === "presets" ? <>
                <div className="rtk-presets" aria-label="Quick timer durations">
                  {PRESETS.map(preset => <button type="button" key={preset.ms}
                    className={duration===preset.ms?"chosen":""} onClick={()=>pickPreset(preset.ms)}
                    aria-pressed={duration===preset.ms}>{preset.label}</button>)}
                </div>
                <p className="rtk-selection-note">Select a duration, then press the ruby play button.</p>
              </> : <div className="rtk-custom-composer">
                <div className="rtk-custom-timer" aria-label="Custom countdown duration">
                  <label>Hours<input inputMode="numeric" type="number" min="0" max="99" value={customHours} onChange={e=>setCustomHours(e.target.value)} aria-label="Hours"/></label>
                  <span className="rtk-time-separator" aria-hidden="true">:</span>
                  <label>Minutes<input inputMode="numeric" type="number" min="0" max="59" value={customMinutes} onChange={e=>setCustomMinutes(e.target.value)} aria-label="Minutes"/></label>
                  <span className="rtk-time-separator" aria-hidden="true">:</span>
                  <label>Seconds<input inputMode="numeric" type="number" min="0" max="59" value={customSeconds} onChange={e=>setCustomSeconds(e.target.value)} aria-label="Seconds"/></label>
                </div>
                <button type="button" className="rtk-set-timer" onClick={applyCustomDuration}>Set Custom Timer</button>
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
