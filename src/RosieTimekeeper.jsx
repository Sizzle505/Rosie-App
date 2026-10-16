import React, { useCallback, useEffect, useRef, useState } from "react";
import "./RosieTimekeeper.css";
import TimekeeperClockwork from "./TimekeeperClockwork.jsx";

const ART = "/rosieverse/timekeeper/midnight-observatory/hall-plate.webp";
const STORAGE_KEY = "rosie-timekeeper-v3";
const APPROVED_DEFAULT_KEY = "rosie-timekeeper-approved-defaults-20261016";
// Apply the pictured combination ONCE even to people with older saved
// default selections. Afterwards manual customization remains persistent.
function applyApprovedDefaultsOnce() {
  try {
    if (window.localStorage.getItem(APPROVED_DEFAULT_KEY) === "1") return;
    const defaults = {
      "rosie-timekeeper-dial": "sunburst",
      "rosie-timekeeper-bezel": "gold",
      "rosie-timekeeper-hands": "dauphine",
      "rosie-timekeeper-color": "garnet",
      "rosie-timekeeper-hand-origin-v1": "1",
      "rosie-timekeeper-luxury-default-v2": "1",
    };
    for (const [key,value] of Object.entries(defaults)) {
      window.localStorage.setItem(key,value);
    }
    window.localStorage.setItem(APPROVED_DEFAULT_KEY,"1");
  } catch {}
}
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
  { id: "sunburst", label: "Sunburst", symbol: "✺" },
  { id: "deco", label: "Art Deco", symbol: "◆" },
  { id: "moonlight", label: "Moonlight", symbol: "☽" },
  { id: "pearl-baroque", label: "Pearl", symbol: "❈" },
  { id: "emerald-filigree", label: "Emerald", symbol: "✧" },
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
const BEZEL_STYLES = [
  {id:"gold",label:"Imperial Original",file:"bezel.webp"},
  {id:"artdeco",label:"Sapphire Art Deco",file:"bezel-options/artdeco.webp"},
  {id:"baroque",label:"Ruby Baroque",file:"bezel-options/baroque.webp"},
  {id:"celestial",label:"Celestial Observatory",file:"bezel-options/celestial.webp"},
  {id:"pearl",label:"Ivory Pearl",file:"bezel-options/pearl.webp"}
];
const TIMER_SETS_KEY = "rosie-timekeeper-sets-v1";
const MAX_TIMER_MS = 99 * 3600000 + 59 * 60000 + 59000;
const formatStep = ms => {
 const sec=Math.floor(ms/1000);
 return (sec>=3600?Math.floor(sec/3600)+"h ":"")+(sec%3600>=60?Math.floor(sec%3600/60)+"m ":"")+(sec%60?sec%60+"s":sec<60?"0s":"");
};
const HAND_STYLES = [
  { id:"dauphine",label:"Gold" },
  { id:"filigree",label:"Filigree" },
  { id:"blued",label:"Blued Steel" },
  { id:"observatory",label:"Gilded Observatory" }
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
  const [mode, setMode] = useState(() => {
    applyApprovedDefaultsOnce();
    return "stopwatch";
  });
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(60_000);
  const [laps, setLaps] = useState([]);
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("1");
  const [customSeconds, setCustomSeconds] = useState("00");
  const [timerEntry, setTimerEntry] = useState("custom");
  const [bezelStyle,setBezelStyle] = useState(()=>{try {const id=localStorage.getItem("rosie-timekeeper-bezel");return BEZEL_STYLES.some(x=>x.id===id)?id:"gold";}catch{return "gold";}});
  const [savedSets,setSavedSets] = useState(()=>{try {
    const records=JSON.parse(localStorage.getItem(TIMER_SETS_KEY)||"[]");
    return Array.isArray(records)?records.filter(x=>typeof x.name==="string"&&Array.isArray(x.steps)&&x.steps.length&&x.steps.every(ms=>Number.isInteger(ms)&&ms>=1000&&ms<=MAX_TIMER_MS)).slice(0,12):[];
  }catch{return [];}});
  const [setName,setSetName]=useState("");
  const [draftSteps,setDraftSteps]=useState([]);
  const [sequence,setSequence]=useState(null);
  const [dialFrame, setDialFrame] = useState(() => {
    try {
      const saved = window.localStorage.getItem("rosie-timekeeper-dial");
      if(window.localStorage.getItem("rosie-timekeeper-luxury-default-v2")!=="1")return "sunburst";
      return DIAL_FRAMES.some(item => item.id === saved) ? saved : "sunburst";
    } catch { return "sunburst"; }
  });
  const [dialColor, setDialColor] = useState(() => {
    try {
      const saved = window.localStorage.getItem("rosie-timekeeper-color");
      if(window.localStorage.getItem("rosie-timekeeper-luxury-default-v2")!=="1")return "garnet";
      return DIAL_COLORS.some(item => item.id === saved) ? saved : "garnet";
    } catch { return "garnet"; }
  });
  const [dialPickerOpen, setDialPickerOpen] = useState(false);
  const [worldZone,setWorldZone] = useState(() => {try {const saved=localStorage.getItem("rosie-timekeeper-zone");return WORLD_CITIES.some(c=>c.zone===saved)?saved:"America/New_York";}catch{return "America/New_York";}});
  const [handStyle,setHandStyle] = useState(() => {try {const saved=localStorage.getItem("rosie-timekeeper-hands");if(localStorage.getItem("rosie-timekeeper-hand-origin-v1")!=="1")return "dauphine";return HAND_STYLES.some(c=>c.id===saved)?saved:"dauphine";}catch{return "dauphine";}});
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
      window.localStorage.setItem("rosie-timekeeper-luxury-default-v2","1");
    } catch {}
  }, [dialFrame,dialColor]);

  useEffect(() => {
    try {localStorage.setItem("rosie-timekeeper-zone",worldZone);localStorage.setItem("rosie-timekeeper-hands",handStyle);localStorage.setItem("rosie-timekeeper-bezel",bezelStyle);localStorage.setItem("rosie-timekeeper-hand-origin-v1","1");}catch{}
  },[worldZone,handStyle,bezelStyle]);
  useEffect(()=>{try{localStorage.setItem(TIMER_SETS_KEY,JSON.stringify(savedSets));}catch{}},[savedSets]);
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
        const active=saved.sequence;
        if(active && typeof active.id==="string" && typeof active.name==="string" &&
           Array.isArray(active.steps) && active.steps.length>0 && active.steps.length<=12 &&
           active.steps.every(ms=>Number.isInteger(ms)&&ms>=1000&&ms<=MAX_TIMER_MS) &&
           Number.isInteger(active.index) && active.index>=0 && active.index<active.steps.length){
          setSequence({...active,steps:[...active.steps]});
        }
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
        mode, duration, elapsed, running, laps, sequence, savedAt: now
      }));
    } catch {}
  }, [restored, mode, duration, elapsed, running, laps, sequence]);

  useEffect(() => {
    if (!running) return undefined;
    const tick = () => {
      const live = accumulated.current + performance.now() - anchor.current;
      if (mode === "countdown" && live >= duration) {
        if(sequence && sequence.index+1<sequence.steps.length){
          const index=sequence.index+1, next=sequence.steps[index];
          accumulated.current=0;anchor.current=performance.now();
          finished.current=false;setElapsed(0);setDuration(next);
          setRunnerEpoch(n=>n+1);
          setSequence(prev=>prev ? {...prev,index} : null);
          setMessage("STEP "+(index+1)+" OF "+sequence.steps.length);
          return;
        }
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
  }, [running, mode, duration, sequence]);

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
    setSequence(null);
    setMode(next);
  }

  function repeatCountdown() {
    primeTimekeeperAudio();
    stopAndReset();
    setRunnerEpoch(n=>n+1);
    if(sequence){setDuration(sequence.steps[sequence.index]);}
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

  function syncTimerWheels(ms) {
    const total=Math.floor(ms/1000);
    setCustomHours(String(Math.floor(total/3600)));
    setCustomMinutes(String(Math.floor((total%3600)/60)));
    setCustomSeconds(String(total%60).padStart(2,"0"));
  }
  function pickPreset(ms) {
    stopAndReset();
    setMode("countdown");
    setDuration(ms);
    syncTimerWheels(ms);
    setSequence(null);
    setMessage("");
  }
  function chooseTimerUnit(unit,value) {
    const parts=[Number(customHours),Number(customMinutes),Number(customSeconds)];
    parts[unit]=Number(value);
    const [hours,minutes,seconds]=parts;
    const ms=(hours*3600+minutes*60+seconds)*1000;
    if(unit===0)setCustomHours(String(value));
    if(unit===1)setCustomMinutes(String(value));
    if(unit===2)setCustomSeconds(String(value).padStart(2,"0"));
    if(!running){
      accumulated.current=0;finished.current=false;setElapsed(0);
      setDuration(Math.max(1000,ms));setSequence(null);setMessage("");
    }
  }
  function adjustDuration(delta){
    const next=Math.max(1000,Math.min(MAX_TIMER_MS,Math.round((duration+delta)/1000)*1000));
    if(next===duration)return;
    const live=running ? accumulated.current+performance.now()-anchor.current : accumulated.current;
    const adjustedElapsed=Math.min(Math.max(0,live),next);
    accumulated.current=adjustedElapsed;anchor.current=performance.now();
    setDuration(next);setElapsed(adjustedElapsed);finished.current=false;
    setSequence(null);setMessage("");
  }
  function addDraftStep(){
    setDraftSteps(steps=>steps.length>=12?steps:[...steps,duration]);
    setTimerEntry("sets");setMessage("");
  }
  function saveDraftSet(){
    const name=setName.trim().slice(0,35),steps=draftSteps.length?draftSteps:[duration];
    if(!name){setMessage("Name this timer set before saving.");return;}
    const id=String(Date.now()),record={id,name,steps};
    setSavedSets(previous=>[record,...previous].slice(0,12));
    setDraftSteps([]);setSetName("");setMessage("Saved "+name);
    loadTimerSet(record);
  }
  function loadTimerSet(record){
    stopAndReset();setDuration(record.steps[0]);setMode("countdown");
    setSequence({id:record.id,name:record.name,steps:[...record.steps],index:0});
    setTimerEntry("sets");setRunnerEpoch(n=>n+1);
  }
  function stepTimerSet(delta){
    if(!sequence)return;
    const index=Math.max(0,Math.min(sequence.steps.length-1,sequence.index+delta));
    stopAndReset();setSequence({...sequence,index});setDuration(sequence.steps[index]);
    setRunnerEpoch(n=>n+1);
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
  const selectedBezel=BEZEL_STYLES.find(item=>item.id===bezelStyle)||BEZEL_STYLES[0];
  const chosenWorldCity=WORLD_CITIES.find(c=>c.zone===worldZone)||WORLD_CITIES[0];
  const world=worldTimeParts(worldNow,chosenWorldCity.zone);
  const padWorld=n=>String(n).padStart(2,"0");
  const worldDigital=((world.hh%12)||12)+":"+padWorld(world.mm)+(world.hh>=12?"pm":"am");
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
  // Match the SVG progress circle's radius, not the outside bezel.
  const runnerX = 50 + 43 * Math.cos(runnerAngle);
  const runnerY = 50 + 43 * Math.sin(runnerAngle);
  const squirrelFlipped = mode === "countdown" ? runnerY <= 50 : runnerY > 50;
  // All three illustrated poses now come from the same full-resolution
  // Dropbox master, so the working pose can return without looking soft.
  const rosieState = running ? (Math.floor(elapsed / 8500) % 2 ? "pull" : "working") : elapsed > 0 ? "pull" : "ready";
  const fastestLap = laps.length > 1 ? Math.min(...laps.map((entry) => entry.split)) : null;
  const slowestLap = laps.length > 1 ? Math.max(...laps.map((entry) => entry.split)) : null;
  const shown = mode === "stopwatch" ? formatClock(elapsed, true) : formatClock(remaining, true, true);
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
            "--rtk-numeral-color": selectedColor.light ? "#342b30" : "#fff1d5",
            "--rtk-bezel-image": `url("/rosieverse/timekeeper/midnight-observatory/${selectedBezel.file}")` }}
          aria-label="Working stopwatch and countdown">
          <span className="rtk-face-base" aria-hidden="true" />
          <span className={"rtk-face-overlay is-"+selectedFrame.id} style={{ backgroundImage: `url("${DIAL_ASSET_ROOT}${selectedFrame.id}.webp")` }} aria-hidden="true" />
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
          {mode !== "world" && <svg className="rtk-squirrel-overlay" viewBox="0 0 100 100"
              aria-hidden="true" focusable="false">
            <image key={runnerEpoch} className="rtk-squirrel-tip"
              href="/rosieverse/timekeeper/midnight-observatory/squirrel-original-still.webp"
              x="0" y="0" width="13.65" height="18.07" preserveAspectRatio="xMidYMid meet"
              transform={`translate(${runnerX} ${runnerY}) scale(${squirrelFlipped ? -1 : 1} 1) translate(-6.825 -9.035)`}
            />
          </svg>}
          {mode==="world" ? <div className="rtk-world-readout" aria-label={chosenWorldCity.city+", "+worldDigital}>
             <time className="rtk-world-digital">{worldDigital}</time>
             <strong className="rtk-world-city-name">{chosenWorldCity.city}</strong>
          </div> : <>
            <output className={"rtk-time"+(wholeTime.length > 5 ? " is-hours" : "")} aria-label={mode==="stopwatch"?"Elapsed time":"Time remaining"}>
              <span className="rtk-time-whole">{wholeTime}</span>
              <span className="rtk-time-fraction"><span aria-hidden="true">.</span>{hundredths}</span>
            </output>
            <div className={"rtk-caption"+(running ? " is-running" : "")}>{status}</div>
          </>}
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
              {mode === "stopwatch" ? <span className="rtk-lap-accessible">Lap</span> : (
                <svg className="rtk-repeat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d="m17 2 4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" />
                  <path d="m7 22-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" />
                </svg>
              )}
            </button>
            <button type="button" className={"rtk-primary-action" + (running ? " is-playing" : "")} onClick={startOrPause}
              title={running ? "Pause" : "Play"} aria-label={running ? "Pause" : "Play"}>
              {running ? <span className="rtk-pause-accessible">Pause</span> : null}
            </button>
            <button type="button" className="rtk-secondary-action rtk-reset-action"
              onClick={stopAndReset} title="Reset" aria-label="Reset stopwatch or countdown">
              <span className="rtk-action-word">Reset</span>
            </button>
          </div>
          {/* Exactly registered over the imported console's original enamel
              apertures. Only the inner face changes: never draw a second rim. */}
          <svg className="rtk-console-inlays" viewBox="0 0 2048 680"
            preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
            <defs>
              <radialGradient id="rtk-native-lap" cx="35%" cy="27%" r="78%">
                <stop offset="0%" stopColor="#263849"/>
                <stop offset="38%" stopColor="#121c29"/>
                <stop offset="80%" stopColor="#090f1a"/>
                <stop offset="100%" stopColor="#03060a"/>
              </radialGradient>
              <clipPath id="rtk-native-ruby-clip">
                <circle cx="1024" cy="345" r="169"/>
              </clipPath>
            </defs>
            {mode === "stopwatch" && <g>
              <circle cx="451" cy="349" r="115" fill="url(#rtk-native-lap)" />
              <text x="451" y="373" textAnchor="middle" fill="#f8dda2"
                stroke="#4e2c14" strokeWidth="1.4" paintOrder="stroke"
                fontFamily="Georgia,serif" fontWeight="bold" fontSize="76"
                letterSpacing="1">LAP</text>
            </g>}
            {running && <image
              href="/rosieverse/timekeeper/midnight-observatory/panel-controls/pause-medallion.webp"
              x="678" y="-1" width="692" height="692"
              preserveAspectRatio="xMidYMid meet" clipPath="url(#rtk-native-ruby-clip)" />}
          </svg>
        </div>
        <div className="rtk-top-controls" aria-label="Clock mode and appearance">
          <button type="button" className="rtk-face-trigger" onClick={() => setDialPickerOpen(open => !open)}
            aria-label="Choose clock face and color" aria-expanded={dialPickerOpen} title="Clock faces and colors">✦</button>
          <div className="rtk-mode-switch" role="group" aria-label="Timekeeper mode" data-active={mode}>
            <button type="button" className={mode === "stopwatch" ? "chosen" : ""} aria-pressed={mode === "stopwatch"} onClick={() => pickMode("stopwatch")}>Stopwatch</button>
            <button type="button" className={"rtk-globe-mode"+(mode === "world" ? " chosen" : "")} aria-label="World Clock" title="World Clock" aria-pressed={mode === "world"} onClick={() => pickMode("world")}>
              <img src={LUXURY_ASSETS+"world-clock-ui/globe.webp"} alt="" draggable="false" />
            </button>
            <button type="button" className={mode === "countdown" ? "chosen" : ""} aria-pressed={mode === "countdown"} onClick={() => { pickMode("countdown"); setTimerEntry("custom"); }}>Timer</button>
          </div>
        </div>
        <section ref={utilityRef} className={"rtk-utility" + (mode === "stopwatch" && !laps.length ? " is-empty" : "") + (mode === "countdown" ? " is-timer" : "")} aria-label="Timekeeper settings and splits">
          <div className="rtk-utility-inner">
          {mode === "world" ? (
            <div className="rtk-world-settings">
              <label htmlFor="rtk-world-city">World Clock</label>
              <select id="rtk-world-city" aria-label="Select world clock city" value={worldZone}
                onChange={e=>setWorldZone(e.target.value)}>
                {WORLD_CITIES.map(item=><option value={item.zone} key={item.zone}>{item.city} · {worldTimeParts(worldNow,item.zone).abbr}</option>)}
              </select>
              <div className="rtk-world-city-plaque">
                <strong>{world.day}, {world.month} {world.date}</strong>
              </div>
              <div className="rtk-world-daynight" aria-label={worldIsDay?"Daytime in selected city":"Nighttime in selected city"}>
                <span className={worldIsDay?"is-current":""}><img src={LUXURY_ASSETS+"world-clock-ui/sun.webp"} alt="Sun"/>Day</span>
                <span className={!worldIsDay?"is-current":""}><img src={LUXURY_ASSETS+"world-clock-ui/moon.webp"} alt="Moon"/>Night</span>
              </div>
            </div>
          ) : mode === "stopwatch" ? (
            <>
              <div className="rtk-utility-heading"><span>Laps & Splits</span><span>{laps.length ? laps.length + " recorded" : "Hundredths"}</span></div>
              {laps.length ? (<div className="rtk-lap-table">
                <div className="rtk-lap-table-head"><span>Lap</span><span>Split</span><span>Total</span></div>
                <ol className="rtk-laps">
                  {laps.map((entry,index)=><li key={entry.total}
                    className={entry.split===fastestLap?"rtk-fastest-lap":entry.split===slowestLap?"rtk-slowest-lap":""}>
                    <span>{laps.length-index}</span>
                    <strong>{formatClock(entry.split,true)}</strong>
                    <small>{formatClock(entry.total,true)}</small>
                  </li>)}
                </ol>
              </div>
              ) : <p className="rtk-empty">{running ? "Tap the left Lap control to record a split." : elapsed > 0 ? "Resume for more laps or reset." : "Press Play to begin timing."}</p>}

            </>
          ) : (
            <div className="rtk-timer-workspace">
              {timerEntry!=="sets" && <div className="rtk-presets rtk-quick-inline" aria-label="Quick timer durations">
                {PRESETS.map(preset=><button key={preset.ms} type="button"
                  className={duration===preset.ms?"chosen":""}
                  onClick={()=>{pickPreset(preset.ms);setTimerEntry("custom")}}
                  aria-pressed={duration===preset.ms}>{preset.label}</button>)}
              </div>}
              {sequence && <div className="rtk-sequence-running" role="status">
                <span>{sequence.name}: step {sequence.index+1} of {sequence.steps.length}</span>
                <button type="button" aria-label="Previous set step" disabled={sequence.index===0} onClick={()=>stepTimerSet(-1)}>‹</button>
                <button type="button" aria-label="Next set step" disabled={sequence.index>=sequence.steps.length-1} onClick={()=>stepTimerSet(1)}>›</button>
              </div>}
              {timerEntry!=="sets" && <div className="rtk-custom-composer">
                <div className="rtk-custom-timer" aria-label="Custom countdown duration">
                  {["Hours","Minutes","Seconds"].map((label,i)=><React.Fragment key={label}>
                    {i>0 && <span className="rtk-time-separator" aria-hidden="true">:</span>}
                    <label>{label}<select className="rtk-time-wheel" value={i===0?Number(customHours):i===1?Number(customMinutes):Number(customSeconds)}
                      onChange={e=>chooseTimerUnit(i,e.target.value)} aria-label={label}
                      onKeyDown={e=>{if(!["ArrowUp","ArrowDown"].includes(e.key))return;
                        const v=i===0?Number(customHours):i===1?Number(customMinutes):Number(customSeconds);
                        const max=i===0?100:60;
                        if((e.key==="ArrowUp"&&v===0)||(e.key==="ArrowDown"&&v===max-1)){
                          e.preventDefault();chooseTimerUnit(i,(v+(e.key==="ArrowUp"?max-1:1))%max);
                        }
                      }}>
                      {Array.from({length:i===0?100:60},(_,n)=><option key={n} value={n}>{String(n).padStart(2,"0")}</option>)}
                    </select></label>
                  </React.Fragment>)}
                </div>
                <div className="rtk-duration-actions">
                  <button type="button" className="rtk-set-timer" onClick={applyCustomDuration}>Set Duration</button>
                  <button type="button" className="rtk-sets-toggle" onClick={()=>setTimerEntry("sets")}>Sets</button>
                </div>
              </div>}
              {timerEntry==="sets" && <div className="rtk-sets-editor">
                <button type="button" className="rtk-back-custom" onClick={()=>setTimerEntry("custom")}>‹ Timer</button>
                <div className="rtk-draft-line">
                  <input aria-label="Timer set name" maxLength="35" placeholder="Name your timer set"
                    value={setName} onChange={e=>setSetName(e.target.value)}/>
                  <button type="button" onClick={addDraftStep} disabled={draftSteps.length>=12}
                    aria-label="Add current duration as a step">+ Step</button>
                  <button type="button" onClick={saveDraftSet} aria-label="Save timer set">Save</button>
                </div>
                {draftSteps.length>0&&<div className="rtk-draft-steps" aria-label="Draft timer steps">
                  {draftSteps.map((ms,i)=><button key={i} type="button"
                    title="Remove step" aria-label={"Remove step "+(i+1)}
                    onClick={()=>setDraftSteps(a=>a.filter((_,n)=>n!==i))}>{i+1}. {formatStep(ms)} ×</button>)}
                </div>}
                <div className="rtk-saved-sets">
                  {savedSets.map(rec=><div key={rec.id} className="rtk-saved-set">
                    <button type="button" onClick={()=>loadTimerSet(rec)}
                      aria-label={"Load timer set "+rec.name}>{rec.name} <small>{rec.steps.length} steps</small></button>
                    <button type="button" className="rtk-delete-set" title={"Delete "+rec.name}
                      aria-label={"Delete timer set "+rec.name} onClick={()=>{setSavedSets(list=>list.filter(x=>x.id!==rec.id));if(sequence?.id===rec.id)setSequence(null)}}>×</button>
                  </div>)}
                  {!savedSets.length && !draftSteps.length && <p className="rtk-sets-hint">Add a duration as a step, name the set, then save it here.</p>}
                </div>
              </div>}
              <div className="rtk-time-adjust" role="group" aria-label="Adjust countdown duration">
                {[[ -60000,"−1m"],[-30000,"−30s"],[30000,"+30s"],[60000,"+1m"]].map(([ms,label])=>
                  <button type="button" key={label} aria-label={"Adjust timer "+label}
                    onClick={()=>adjustDuration(ms)}>{label}</button>)}
              </div>
              {message&&mode==="countdown"&&<p className="rtk-timer-message" role="status">{message}</p>}
            </div>
          )}
          </div>
        </section>
        {dialPickerOpen && <div className="rtk-customization-overlay" role="presentation">
          <button type="button" className="rtk-customization-scrim" aria-label="Dismiss clock customization" onClick={()=>setDialPickerOpen(false)} />
          <div className="rtk-customization-dialog" role="dialog" aria-modal="true" aria-label="Clock customization">
            <div className="rtk-dial-picker" role="group" aria-label="Clock face and color">
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
            <div className="rtk-bezel-choices" role="group" aria-label="Clock bezel finish">
              <span>Bezel</span>{BEZEL_STYLES.map(item=><button type="button" key={item.id}
                className={bezelStyle===item.id?"chosen":""} aria-label={item.label+" bezel"} aria-pressed={bezelStyle===item.id}
                onClick={()=>setBezelStyle(item.id)}>{item.label}</button>)}
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
            </div>
          </div>
        </div>}
        </div>
      </div>
    </main>
  );
}
