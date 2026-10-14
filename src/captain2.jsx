import React, { useEffect, useMemo, useRef, useState } from "react";
import "./captain2.css";

const RUN_SECONDS = 48;
const TARGET_CHEESE = 10;
const LANE_COUNT = 3;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function randomLane() {
  return Math.floor(Math.random() * LANE_COUNT);
}
function pickKind() {
  const roll = Math.random();
  if (roll < 0.35) return "paw";
  if (roll < 0.57) return "cheese";
  if (roll < 0.74) return "buoy";
  if (roll < 0.86) return "crate";
  if (roll < 0.94) return "shield";
  return "gull";
}
function PawMedallion({ small = false }) {
  return (
    <svg className={small ? "c2-icon c2-icon-small" : "c2-icon"} viewBox="0 0 72 72" aria-hidden="true">
      <defs><radialGradient id="c2PawGold" cx="34%" cy="28%"><stop offset="0" stopColor="#fff1ac" /><stop offset="0.48" stopColor="#e9ae39" /><stop offset="1" stopColor="#9d5b16" /></radialGradient></defs>
      <circle cx="36" cy="36" r="31" fill="url(#c2PawGold)" stroke="#fff0ad" strokeWidth="3" />
      <circle cx="36" cy="36" r="25" fill="none" stroke="#6d3812" strokeWidth="2" opacity=".65" />
      <g fill="#6f3714"><ellipse cx="36" cy="44" rx="12" ry="10" /><ellipse cx="23" cy="31" rx="6.5" ry="8" transform="rotate(-26 23 31)" /><ellipse cx="32" cy="24" rx="6" ry="8" transform="rotate(-8 32 24)" /><ellipse cx="42" cy="24" rx="6" ry="8" transform="rotate(8 42 24)" /><ellipse cx="51" cy="31" rx="6.5" ry="8" transform="rotate(26 51 31)" /></g>
    </svg>
  );
}
function CheeseIcon() {
  return <svg className="c2-icon" viewBox="0 0 72 72" aria-hidden="true"><path d="M11 49 18 24 47 14l14 17v24L11 49Z" fill="#f5b82e" stroke="#fff0a2" strokeWidth="3" /><path d="m18 24 29-10 14 17-31 8Z" fill="#ffd965" /><circle cx="34" cy="27" r="4" fill="#bc6f18" /><circle cx="46" cy="43" r="5" fill="#bc6f18" /><circle cx="25" cy="45" r="3.8" fill="#bc6f18" /></svg>;
}
function BuoyIcon() {
  return <svg className="c2-icon" viewBox="0 0 72 72" aria-hidden="true"><path d="M31 8h10l3 12-5 6 10 31H23l10-31-5-6 3-12Z" fill="#f8f0da" stroke="#74261f" strokeWidth="3" /><path d="M24 38h24l4 12H20l4-12Z" fill="#c83b2d" /><path d="M27 58h18" stroke="#54231d" strokeWidth="5" strokeLinecap="round" /></svg>;
}
function CrateIcon() {
  return <svg className="c2-icon" viewBox="0 0 72 72" aria-hidden="true"><rect x="13" y="15" width="46" height="42" rx="4" fill="#7b431f" stroke="#d9a85b" strokeWidth="3" /><path d="M16 20 56 53M56 20 16 53M13 34h46" stroke="#d9a85b" strokeWidth="4" /></svg>;
}
function ShieldIcon() {
  return <svg className="c2-icon" viewBox="0 0 72 72" aria-hidden="true"><path d="M36 8 57 16v17c0 14-8 25-21 31C23 58 15 47 15 33V16L36 8Z" fill="#1d6f91" stroke="#f4d982" strokeWidth="3" /><path d="M36 17v35M24 28h24" stroke="#d9f2f5" strokeWidth="3" opacity=".8" /></svg>;
}
function GullIcon() {
  return <svg className="c2-icon" viewBox="0 0 72 72" aria-hidden="true"><path d="M8 38c12-11 21-12 29-2 8-10 17-9 27 2-12-4-19-2-27 7-8-9-17-11-29-7Z" fill="#f8f4e9" stroke="#244153" strokeWidth="2.5" /><path d="M37 36c2 4 2 7 0 10" stroke="#d8ab45" strokeWidth="2" /></svg>;
}
function ItemIcon({ kind }) {
  if (kind === "paw") return <PawMedallion />;
  if (kind === "cheese") return <CheeseIcon />;
  if (kind === "buoy") return <BuoyIcon />;
  if (kind === "crate") return <CrateIcon />;
  if (kind === "shield") return <ShieldIcon />;
  return <GullIcon />;
}
function tone(context, notes, duration = 0.22) {
  if (!context) return;
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.06, now + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  master.connect(context.destination);
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.035);
    oscillator.connect(master);
    oscillator.start(now + index * 0.035);
    oscillator.stop(now + duration + index * 0.035);
  });
}

export default function Captain2Game({ soundOn = true }) {
  const [running, setRunning] = useState(false);
  const [ended, setEnded] = useState(false);
  const [won, setWon] = useState(false);
  const [lane, setLane] = useState(1);
  const [lean, setLean] = useState(0);
  const [score, setScore] = useState(0);
  const [cheese, setCheese] = useState(0);
  const [lives, setLives] = useState(3);
  const [shield, setShield] = useState(false);
  const [scout, setScout] = useState(false);
  const [boost, setBoost] = useState(false);
  const [boostEnergy, setBoostEnergy] = useState(35);
  const [elapsed, setElapsed] = useState(0);
  const [objects, setObjects] = useState([]);
  const [message, setMessage] = useState("The Torii Passage is calm. Captain Rosie is ready to cast off.");
  const [burst, setBurst] = useState(0);
  const [burstKind, setBurstKind] = useState("paw");
  const idRef = useRef(0);
  const spawnRef = useRef(0);
  const audioRef = useRef(null);
  const touchRef = useRef(null);
  const best = useMemo(() => Number(localStorage.getItem("captain2Best") || 0), []);
  const progress = clamp((elapsed / RUN_SECONDS) * 100, 0, 100);

  function getAudio() {
    if (!soundOn) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioRef.current) audioRef.current = new AudioContext();
    audioRef.current.resume?.();
    return audioRef.current;
  }
  function steer(direction) {
    if (!running) return;
    setLane((current) => clamp(current + direction, 0, LANE_COUNT - 1));
    setLean(direction);
    window.setTimeout(() => setLean(0), 260);
    window.navigator.vibrate?.(8);
  }
  function startRun() {
    setRunning(true); setEnded(false); setWon(false); setLane(1); setScore(0); setCheese(0); setLives(3); setShield(false); setScout(false); setBoost(false); setBoostEnergy(35); setElapsed(0); setObjects([]);
    spawnRef.current = 0;
    setMessage("Lines cast off. Collect 10 Golden Cheeses before Rosie reaches the Torii Passage.");
    tone(getAudio(), [392, 523, 659], 0.3);
  }
  function finishRun(success) {
    setRunning(false); setEnded(true); setWon(success); setObjects([]);
    setMessage(success ? "Torii Passage reached. Captain Rosie has completed a magnificent run." : "Rosie is returning to harbor with her dignity entirely intact.");
    setScore((current) => { if (current > best) localStorage.setItem("captain2Best", String(current)); return current; });
    tone(getAudio(), success ? [523, 659, 784, 1047] : [294, 247, 196], 0.55);
  }
  function activateBoost() {
    if (!running || boost || boostEnergy < 100) return;
    setBoost(true); setBoostEnergy(0); setMessage("WAVE BOOST. Rosie's wake is running gold."); setBurstKind("boost"); setBurst((value) => value + 1);
    tone(getAudio(), [440, 660, 880], 0.36);
    window.navigator.vibrate?.([18, 20, 28]);
    window.setTimeout(() => setBoost(false), 5200);
  }

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      const dt = 0.08;
      setElapsed((current) => {
        const next = current + dt;
        if (next >= RUN_SECONDS) { window.setTimeout(() => finishRun(cheese >= TARGET_CHEESE), 0); return RUN_SECONDS; }
        return next;
      });
      spawnRef.current -= dt;
      if (spawnRef.current <= 0) {
        const kind = pickKind();
        setObjects((current) => [...current.slice(-11), { id: ++idRef.current, kind, lane: randomLane(), x: 108 }]);
        spawnRef.current = boost ? 0.48 + Math.random() * 0.24 : 0.62 + Math.random() * 0.42;
      }
      setObjects((current) => {
        const speed = boost ? 3.75 : 2.35;
        const next = [];
        let hit = null;
        for (const item of current) {
          const moved = { ...item, x: item.x - speed };
          if (moved.lane === lane && moved.x <= 40 && moved.x >= 27 && !hit) { hit = moved; continue; }
          if (moved.x > -14) next.push(moved);
        }
        if (hit) {
          const kind = hit.kind;
          setBurstKind(kind); setBurst((value) => value + 1);
          if (kind === "paw") {
            setScore((value) => value + (boost ? 80 : 40)); setBoostEnergy((value) => clamp(value + 22, 0, 100)); setMessage("Gold paw aboard. The Captain's gauge is charging."); tone(getAudio(), [659, 988], 0.16);
          } else if (kind === "cheese") {
            setCheese((value) => { const nextCheese = value + 1; setMessage(nextCheese >= TARGET_CHEESE ? "All ten Golden Cheeses secured. Make for the Torii Passage!" : `Golden Cheese ${nextCheese}/${TARGET_CHEESE}. Rosie approves of this cargo.`); return nextCheese; });
            setScore((value) => value + (boost ? 160 : 80)); setBoostEnergy((value) => clamp(value + 14, 0, 100)); tone(getAudio(), [523, 784, 1047], 0.22);
          } else if (kind === "shield") {
            setShield(true); setScore((value) => value + 60); setMessage("Lantern Shield raised. One hazard may now regret its choices."); tone(getAudio(), [392, 587, 784], 0.24);
          } else if (kind === "gull") {
            setScout(true); setScore((value) => value + 50); setMessage("Seagull Scout reports a clear line ahead."); window.setTimeout(() => setScout(false), 5200); tone(getAudio(), [740, 988], 0.16);
          } else if (shield) {
            setShield(false); setMessage("Shield spent. Rosie gives the obstacle a deeply unimpressed look."); tone(getAudio(), [330, 440], 0.18);
          } else {
            setLives((value) => { const nextLives = value - 1; if (nextLives <= 0) window.setTimeout(() => finishRun(false), 0); return Math.max(0, nextLives); });
            setMessage(kind === "buoy" ? "Buoy strike. A small but undignified maritime incident." : "Crate clipped. Rosie insists the crate was badly positioned."); tone(getAudio(), [180, 145], 0.28); window.navigator.vibrate?.([45, 24, 45]);
          }
        }
        return next;
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [running, boost, lane, shield, cheese]);

  useEffect(() => () => audioRef.current?.close?.(), []);

  function handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (touch) touchRef.current = { x: touch.clientX, y: touch.clientY };
  }
  function handleTouchEnd(event) {
    const start = touchRef.current;
    const touch = event.changedTouches?.[0];
    touchRef.current = null;
    if (!start || !touch || !running) return;
    const dy = touch.clientY - start.y;
    if (Math.abs(dy) > 28) steer(dy > 0 ? 1 : -1);
  }

  return (
    <main className={`captain2-page${running ? " is-running" : ""}${boost ? " is-boosting" : ""}`}>
      <section className="c2-hero" aria-label="Captain Rosie in the Japanese archipelago">
        <div className="c2-hero-shade" />
        <div className="c2-hero-copy"><span className="c2-eyebrow">THE HOUSE OF ROSIE · EASTERN PASSAGE</span><h1>CAPTAIN <em>2</em></h1><p>A tiny illustrated adventure across the Torii Sea.</p></div>
        <div className="c2-hero-seal" aria-hidden="true"><PawMedallion small /></div>
      </section>
      <section className="c2-mission-ribbon" aria-label="Voyage objective">
        <div><small>VOYAGE</small><strong>TORII PASSAGE</strong></div>
        <div className="c2-route-meter"><i style={{ width: `${progress}%` }} /><b style={{ left: `${progress}%` }}>◆</b></div>
        <div className="c2-route-end" aria-hidden="true">鳥居</div>
      </section>
      <section className="c2-game-shell">
        <div className="c2-hud">
          <div className="c2-hud-chip"><PawMedallion small /><span>SCORE</span><strong>{score.toLocaleString()}</strong></div>
          <div className="c2-hud-chip"><span className="c2-mini-cheese"><CheeseIcon /></span><span>CHEESE</span><strong>{cheese}/{TARGET_CHEESE}</strong></div>
          <div className="c2-hud-chip c2-hearts"><span>HULL</span><strong>{Array.from({ length: 3 }, (_, index) => <i key={index} className={index < lives ? "live" : ""}>♥</i>)}</strong></div>
        </div>
        <div className="c2-world" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} role="application" aria-label="Captain 2 voyage game">
          <div className="c2-sky-glow" /><div className="c2-distant-world" /><div className="c2-horizon-world" /><div className="c2-mist mist-a" /><div className="c2-mist mist-b" />
          <div className="c2-water-flow"><i /><i /><i /></div><div className="c2-water-sparkles"><i /><i /><i /><i /><i /><i /></div><div className="c2-foreground-wake wake-a" /><div className="c2-foreground-wake wake-b" />
          <div className="c2-torii-destination" style={{ opacity: progress > 73 ? 1 : 0.25, transform: `translateX(${Math.max(0, 88 - progress)}%)` }}><i /><b /><span /></div>
          <div className="c2-lane lane-0" /><div className="c2-lane lane-1" /><div className="c2-lane lane-2" />
          {objects.map((item) => <div key={item.id} className={`c2-pickup c2-${item.kind}${scout && (item.kind === "buoy" || item.kind === "crate") ? " is-scouted" : ""}`} style={{ left: `${item.x}%`, top: `${[29, 49, 69][item.lane]}%` }}><ItemIcon kind={item.kind} />{scout && (item.kind === "buoy" || item.kind === "crate") && <small>!</small>}</div>)}
          <div className={`c2-boat lane-${lane} lean-${lean}${shield ? " has-shield" : ""}`}>{shield && <span className="c2-shield-bubble" />}<img src="/captain2-boat.webp" alt="Captain Rosie piloting her mahogany runabout" draggable="false" /><span className="c2-boat-shadow" /></div>
          <div className="c2-petals" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--i": index, "--top": `${(index * 37) % 92}%` }} />)}</div>
          {burst > 0 && <div key={burst} className={`c2-burst c2-burst-${burstKind}`}><span>✦</span><i>✦</i><b>✦</b></div>}
          {boost && <div className="c2-boost-callout">FULL STEAM</div>}
          {!running && <div className="c2-start-card"><span className="c2-start-kicker">CAPTAIN'S LOG · VOYAGE 02</span><h2>{ended ? (won ? "PASSAGE CLEARED" : "BACK TO HARBOR") : "SAIL THE TORII SEA"}</h2><p>{ended ? message : "Steer through three sea lanes, collect ten Golden Cheeses, charge Wave Boost with paw medallions, and avoid floating hazards."}</p>{ended && <div className="c2-results"><span><b>{score}</b> points</span><span><b>{cheese}/{TARGET_CHEESE}</b> cheese</span><span><b>{best > score ? best : score}</b> best</span></div>}<button type="button" onClick={startRun}>{ended ? "SAIL AGAIN" : "CAST OFF"}<span>→</span></button><small>Swipe up/down in the water or use the helm controls.</small></div>}
        </div>
        <div className="c2-message" aria-live="polite"><span>CAPTAIN'S LOG</span><strong>{message}</strong></div>
        <div className="c2-controls">
          <button type="button" className="c2-helm" onClick={() => steer(-1)} disabled={!running || lane === 0} aria-label="Steer toward the upper lane"><span>▲</span><small>PORT</small></button>
          <button type="button" className={`c2-boost${boostEnergy >= 100 ? " is-ready" : ""}`} onClick={activateBoost} disabled={!running || boost || boostEnergy < 100}><span className="c2-wave-mark">≋</span><strong>{boost ? "FULL STEAM" : boostEnergy >= 100 ? "WAVE BOOST" : "CHARGING"}</strong><i><b style={{ width: `${boost ? 100 : boostEnergy}%` }} /></i></button>
          <button type="button" className="c2-helm" onClick={() => steer(1)} disabled={!running || lane === 2} aria-label="Steer toward the lower lane"><span>▼</span><small>STARBOARD</small></button>
        </div>
        <div className="c2-cargo-strip"><span><PawMedallion small /> charges boost</span><span><span className="c2-cargo-icon"><CheeseIcon /></span> mission cargo</span><span><span className="c2-cargo-icon"><ShieldIcon /></span> one-hit shield</span></div>
      </section>
    </main>
  );
}
