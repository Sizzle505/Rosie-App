import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HAIKU_SCENES } from "./RosieHaikuScene.jsx";
import { localDayKey } from "./haikuEngine.js";
import { createZenAudio } from "./rosieZenAudio.js";
import "./RosieZenMeditation.css";

const PROGRESS_KEY = "rosieHaikuZenSessionsV1";
const ROSIE = "/rosieverse/haiku/rosie-meditating-paws-up.webp";
const DURATIONS = [3,5,10,15,20];
const PROGRAMS = [
  { id:"breathe", title:"Breathe with Rosie", label:"FOLLOW THE RHYTHM", description:"A slow five-second inhale and seven-second exhale. Adjust to what feels comfortable." },
  { id:"quiet", title:"Quiet Sit", label:"JUST BE HERE", description:"An unguided space for sitting quietly, with gentle written reminders." },
  { id:"guided", title:"A Little Calm", label:"GENTLE GUIDANCE", description:"A mindful reset, with optional guidance read aloud by your device." },
  { id:"unwind", title:"Evening Unwind", label:"SOFTEN THE DAY", description:"Release the day, relax your shoulders, and settle into restful quiet." }
];
const SOUNDS = [
  {id:"off",label:"Silence"},{id:"wind",label:"Soft wind"},
  {id:"stream",label:"Stream"},{id:"rain",label:"Rain"}
];
const CUES = {
  quiet: [
    "Make yourself comfortable. You are welcome exactly as you are.",
    "Notice the place where you meet the ground.",
    "Thoughts may come and go. You do not need to follow them.",
    "There is no task to complete. This moment is enough.",
    "Rest in the space between one breath and the next."
  ],
  guided: [
    "Settle in. Let your shoulders drop a little.",
    "Notice the feeling of the air as you breathe naturally.",
    "When your thoughts wander, return gently to one small sensation.",
    "Feel the ground supporting you. Nothing needs fixing right now.",
    "Let the final breaths be easy. Carry this quiet with you."
  ],
  unwind: [
    "The busy part of the day can end here.",
    "Let your jaw soften and your shoulders settle.",
    "You do not need to finish every thought tonight.",
    "Notice the slow, familiar comfort of breathing.",
    "Rest. Tomorrow can arrive in its own time."
  ]
};
function readProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "{}");
    return {
      sessions:Number.isFinite(saved.sessions)?Math.max(0,saved.sessions):0,
      minutes:Number.isFinite(saved.minutes)?Math.max(0,saved.minutes):0,
      days:Array.isArray(saved.days)?saved.days.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)).slice(-365):[]
    };
  } catch { return { sessions:0,minutes:0,days:[] }; }
}
function dayStreak(days) {
  const unique = [...new Set(days)].sort().reverse();
  const today = localDayKey();
  const yesterday = localDayKey(new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()-1));
  if (unique[0] !== today && unique[0] !== yesterday) return 0;
  let count=0, previous=0;
  for (const day of unique) {
    const timestamp = Date.parse(day+"T12:00:00Z");
    if (count && previous-timestamp !== 86400000) break;
    previous=timestamp;count++;
  }
  return count;
}
function timeLabel(milliseconds) {
  const seconds = Math.ceil(Math.max(0,milliseconds)/1000);
  return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
}
function speechStop() {
  try { window.speechSynthesis?.cancel(); } catch {}
}
function speechSay(text) {
  try {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    speechStop();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate=.83;utterance.pitch=.96;utterance.volume=.76;
    window.speechSynthesis.speak(utterance);
  } catch {}
}

export default function RosieZenMeditation({scene="field"}) {
  const [kind,setKind] = useState("breathe");
  const [minutes,setMinutes] = useState(5);
  const [ambience,setAmbience] = useState("wind");
  const [volume,setVolume] = useState(.33);
  const [voice,setVoice] = useState(false);
  const [progress,setProgress] = useState(readProgress);
  const [opened,setOpened] = useState(false);
  const [status,setStatus] = useState("idle");
  const [remaining,setRemaining] = useState(300000);
  const [audioUnavailable,setAudioUnavailable] = useState(false);
  const endAt = useRef(0);
  const pausedMs = useRef(300000);
  const recorded = useRef(false);
  const audio = useRef(null);
  const wake = useRef(null);
  const lastSpokenCue = useRef(-1);
  const dialog = useRef(null);
  const previouslyFocused = useRef(null);
  const selected = PROGRAMS.find(p=>p.id===kind) || PROGRAMS[0];
  const sceneSrc = HAIKU_SCENES.find(p=>p.id===scene)?.src || HAIKU_SCENES[0].src;
  const totalMs = minutes*60000;
  const elapsed = Math.max(0,totalMs-remaining);
  const seconds = Math.floor(elapsed/1000);
  const breatheAt = seconds%12;
  const inhaling = breatheAt<5;
  const breathSeconds = inhaling?5-breatheAt:12-breatheAt;
  const cues = CUES[kind] || CUES.quiet;
  const cueIndex = Math.min(cues.length-1,Math.floor(elapsed/Math.max(1,totalMs)*cues.length));
  const cue = cues[cueIndex];
  const completePercent = Math.min(100,Math.max(0,elapsed/totalMs*100));
  const supportedSpeech = typeof window!=="undefined" && "speechSynthesis" in window;

  useEffect(() => {
    audio.current=createZenAudio();
    return () => {
      audio.current?.stop();
      speechStop();
      wake.current?.release?.().catch(()=>{});
    };
  },[]);
  useEffect(()=>{audio.current?.setVolume(volume)},[volume]);
  useEffect(() => {
    if (!opened) return undefined;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow="hidden";
    dialog.current?.focus();
    const esc = e => {
      if (e.key==="Escape") {
        e.preventDefault();
        audio.current?.stop();
        speechStop();
        wake.current?.release?.().catch(()=>{});
        setOpened(false);
        setStatus("idle");
      }
    };
    window.addEventListener("keydown",esc);
    return () => {
      document.body.style.overflow=oldOverflow;
      window.removeEventListener("keydown",esc);
      previouslyFocused.current?.focus?.();
    };
  },[opened]);
  function startSound() {
    setAudioUnavailable(false);
    audio.current?.start(ambience,volume)
      .then(ok=>{if (!ok && ambience!=="off")setAudioUnavailable(true)})
      .catch(()=>setAudioUnavailable(true));
    const request = navigator.wakeLock?.request?.("screen");
    request?.then(lock=>{wake.current=lock}).catch(()=>{});
  }
  function stopSound() {
    audio.current?.stop();
    speechStop();
    const held=wake.current;
    wake.current=null;
    held?.release?.().catch(()=>{});
  }
  function begin() {
    previouslyFocused.current=document.activeElement;
    recorded.current=false;
    lastSpokenCue.current=-1;
    pausedMs.current=minutes*60000;
    endAt.current=Date.now()+pausedMs.current;
    setRemaining(pausedMs.current);
    setStatus("running");setOpened(true);
    startSound();
  }
  function finish() {
    if(recorded.current)return;
    recorded.current=true;
    setRemaining(0);setStatus("complete");stopSound();
    setProgress(old=>{
      const days=[...new Set([...old.days,localDayKey()])].sort().slice(-365);
      const next={sessions:old.sessions+1,minutes:old.minutes+minutes,days};
      try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(next))}catch{}
      return next;
    });
  }
  useEffect(()=>{
    if (!opened || status!=="running") return undefined;
    const update=()=>{
      const left=Math.max(0,endAt.current-Date.now());
      setRemaining(left);
      if(left<=0)finish();
    };
    update();
    const timer=window.setInterval(update,350);
    return ()=>window.clearInterval(timer);
  },[opened,status,minutes]);
  useEffect(()=>{
    if (!opened || status!=="running" || !voice || (kind!=="guided" && kind!=="unwind"))return;
    if (lastSpokenCue.current===cueIndex)return;
    lastSpokenCue.current=cueIndex;
    speechSay(cue);
  },[opened,status,voice,kind,cueIndex,cue]);
  function pause() {
    pausedMs.current=Math.max(0,endAt.current-Date.now());
    setRemaining(pausedMs.current);setStatus("paused");stopSound();
  }
  function resume() {
    endAt.current=Date.now()+pausedMs.current;
    setStatus("running");startSound();
  }
  function close() {
    stopSound();setOpened(false);setStatus("idle");
  }
  return <>
    <div className="zen-panel">
      <div className="haiku-section-label">YOUR LITTLE SANCTUARY</div>
      <h2>Find your stillness.</h2>
      <p className="zen-panel-intro">Rosie has mastered doing absolutely nothing. She would be delighted to teach you.</p>
      <div className="zen-program-grid" role="group" aria-label="Meditation programs">
        {PROGRAMS.map(p=><button type="button" key={p.id} className={"zen-program"+(kind===p.id?" selected":"")}
          aria-pressed={kind===p.id} onClick={()=>setKind(p.id)}>
          <strong>{p.title}</strong><small>{p.label}</small>
        </button>)}
      </div>
      <p className="zen-selected-description">{selected.description}</p>
      <fieldset className="zen-options"><legend>Session length</legend>
        <div className="zen-choice-row">
          {DURATIONS.map(n=><button type="button" key={n} className={minutes===n?"selected":""}
            aria-pressed={minutes===n} onClick={()=>setMinutes(n)}>{n} min</button>)}
        </div>
      </fieldset>
      <fieldset className="zen-options"><legend>Garden sounds</legend>
        <div className="zen-choice-row zen-sound-row">
          {SOUNDS.map(s=><button type="button" key={s.id} className={ambience===s.id?"selected":""}
            aria-pressed={ambience===s.id} onClick={()=>setAmbience(s.id)}>{s.label}</button>)}
        </div>
      </fieldset>
      {ambience!=="off" && <label className="zen-volume">Volume
        <input type="range" min="0" max="1" step=".05" value={volume}
          onChange={e=>setVolume(Number(e.target.value))} aria-label="Garden sound volume"/>
      </label>}
      {(kind==="guided"||kind==="unwind")&&supportedSpeech&&
        <label className="zen-voice">
          <input type="checkbox" checked={voice} onChange={e=>setVoice(e.target.checked)}/>
          Read guidance aloud <small>(device voice)</small>
        </label>}
      <button type="button" className="haiku-primary zen-begin" onClick={begin}>Begin {minutes}-minute meditation</button>
      <div className="zen-progress-note">
        <span><strong>{progress.sessions}</strong> sessions</span>
        <span><strong>{progress.minutes}</strong> minutes</span>
        <span><strong>{dayStreak(progress.days)}</strong> day streak</span>
      </div>
      <p className="zen-privacy">Your quiet moments are saved privately in this browser.</p>
    </div>
    {opened && createPortal(
      <div className="zen-immersive">
        <div className="zen-immersive-scenery" aria-hidden="true"><img src={sceneSrc} alt=""/></div>
        <section className="zen-immersive-dialog" role="dialog" aria-modal="true"
          aria-labelledby="zen-session-title" tabIndex={-1} ref={dialog}>
          <header className="zen-immersive-header">
            <div><span>ROSIE'S HAIKU ZEN GARDEN</span><h2 id="zen-session-title">{selected.title}</h2></div>
            <button type="button" onClick={close} className="zen-close" aria-label="Close meditation">Close <span aria-hidden="true">×</span></button>
          </header>
          {status==="complete"?
            <div className="zen-complete">
              <img src="/rosieverse/haiku/rosie-affectionate.webp" alt="Rosie smiles warmly"/>
              <div className="zen-complete-copy">
                <span className="zen-eyebrow">A LITTLE MOMENT OF PEACE</span>
                <h3>Beautifully done.</h3>
                <p>You gave yourself {minutes} minutes of gentle attention. Rosie is quietly impressed.</p>
                <p className="zen-complete-stats">{progress.sessions} sessions · {progress.minutes} peaceful minutes</p>
                <button type="button" className="zen-action-primary" onClick={close}>Return to the garden</button>
              </div>
            </div>:
            <div className="zen-immersive-body">
              <div className={"zen-breath-portrait"+(status==="paused"?" paused":"")}>
                <div className="zen-breath-halo" aria-hidden="true"/>
                <img src={ROSIE} alt="Rosie meditates peacefully with her paws up"/>
                <p>{kind==="breathe"?"Breathe in peace. Breathe out the fuss.":"Nothing to do. Nowhere to be."}</p>
              </div>
              <div className="zen-guidance">
                <span className="zen-eyebrow">{status==="paused"?"A MOMENT'S PAUSE":selected.label}</span>
                <div className="zen-session-timer" role="timer" aria-label={"Time remaining "+timeLabel(remaining)}>{timeLabel(remaining)}</div>
                <div className="zen-timeline" aria-hidden="true"><span style={{width:completePercent+"%"}}/></div>
                {kind==="breathe"?
                  <div className={"zen-breath-cue"+(status==="paused"?" paused":"")}>
                    <span className="zen-breath-orb" aria-hidden="true"/>
                    <div><strong>{status==="paused"?"Rest whenever you like":(inhaling?"Breathe in, gently":"Breathe out, slowly")}</strong>
                      <small>Follow Rosie, or breathe at your own pace.</small></div>
                    {status==="running"&&<span className="zen-breath-count" aria-hidden="true">{breathSeconds}</span>}
                  </div>:
                  <div className="zen-guidance-copy" aria-live="off">
                    <p>{status==="paused"?"The garden will be here when you return.":cue}</p>
                  </div>}
                <div className="zen-session-controls">
                  <button type="button" className="zen-action-primary" onClick={status==="paused"?resume:pause}>
                    {status==="paused"?"Resume":"Pause"}
                  </button>
                  <button type="button" className="zen-action-secondary" onClick={close}>End session</button>
                </div>
                {audioUnavailable&&<p className="zen-audio-note" role="status">Sound isn't available here. The meditation will continue quietly.</p>}
                <p className="zen-session-note">A gentle suggestion, not a rule. Breathe comfortably.</p>
              </div>
            </div>}
        </section>
      </div>, document.body
    )}
  </>;
}