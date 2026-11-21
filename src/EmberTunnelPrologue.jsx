import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './ember-tunnel-prologue.css';

// The illustrations in this package belong under public/ember-drill/prologue/.
const ROOT = '/ember-drill/prologue/';
const PAGES = Object.freeze([
  {image:'01-dog-park.webp',heading:'BESIDE THE DOG PARK',text:'It began with a perfectly ordinary afternoon...',ms:3300,focus:62,from:18},
  {image:'02-the-discovery.webp',heading:'A CURIOUS DISCOVERY',text:'But Rosie was never very good at leaving a mystery alone.',ms:2500,focus:62,from:40},
  {image:'03-hidden-cavern.webp',heading:'THE WORLD BENEATH',text:'Some holes lead to extraordinary places.',ms:4000,focus:55,from:18},
  {image:'04-the-driller.webp',heading:'WAITING IN THE DARK',text:'And some discoveries seem to be waiting just for you.',ms:3200,focus:68,from:24},
  {image:'05-captain-boards.webp',heading:'CAPTAIN AT THE CONTROLS',text:'One brave paw. One enormous red lever.',ms:3000,focus:58,from:35},
  {image:'06-drill-awakens.webp',heading:'FULL POWER',text:'CLICK! WHIRRRRR! BRRRRRRR!',ms:3100,focus:75,from:30},
  {image:'07-foes-ahead.webp',heading:'WONDERS AND DANGERS AHEAD',text:'Barkroot. Ruby Temple. Clockwork. Molten Depths. The Royal Treasury.',ms:4100,focus:100,from:0},
  {image:'08-adventure-begins.webp',heading:'THE ADVENTURE BEGINS',text:'An extraordinary journey starts here.',ms:2800,focus:86,from:14},
]);

export default function EmberTunnelPrologue({visible, onComplete, soundOn = true}) {
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(PAGES[0].ms);
  const previousPage = useRef(-1);
  const audioRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  const current = PAGES[page];
  const done = useCallback(() => {
    setPaused(false);
    setPage(0);
    onCompleteRef.current?.();
  }, []);
  const advance = useCallback(() => {
    if (page >= PAGES.length - 1) done();
    else setPage(page + 1);
  }, [page, done]);
  useEffect(() => {
    if (!visible) return;
    setPage(0); setPaused(false); previousPage.current = -1;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const onKey = e => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === 'Escape') { e.preventDefault(); done(); }
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); advance(); }
      if (e.key === ' ') { e.preventDefault(); setPaused(v=>!v); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, done, advance]);
  useEffect(() => {
    if (!visible || paused) return;
    if (previousPage.current !== page) {
      previousPage.current = page;
      remaining.current = current.ms;
    }
    const ms = remaining.current;
    const start = performance.now();
    const timer = window.setTimeout(() => {
      if (page === PAGES.length - 1) done();
      else setPage(p => p + 1);
    }, ms);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, ms - (performance.now() - start));
    };
  }, [visible, page, paused, done]);
  useEffect(() => { if (!visible) return;
    const img = new Image(); img.src = ROOT + PAGES[Math.min(page+1,PAGES.length-1)].image;
  }, [visible, page]);
  useEffect(() => {
    if (!visible || !soundOn || ![1,2,4,5,7].includes(page)) return;
    // Web Audio is optional. Browsers may require a user gesture to unlock it.
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      const ac = audioRef.current || (audioRef.current = new Audio());
      if (ac.state === 'suspended') return;
      const now=ac.currentTime, osc=ac.createOscillator(), gain=ac.createGain();
      const hz = {1:145,2:590,4:490,5:115,7:710}[page];
      osc.type=page===5?'sawtooth':'triangle';osc.frequency.setValueAtTime(hz,now);
      osc.frequency.exponentialRampToValueAtTime(page===5?240:hz*1.4,now+0.2);
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(0.025,now+0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+0.3);
      osc.connect(gain);gain.connect(ac.destination);osc.start(now);osc.stop(now+0.32);
    } catch (_) {}
  },[page,visible,soundOn]);
  useEffect(() => () => { audioRef.current?.close?.(); }, []);
  const segments = useMemo(()=>PAGES.map((item,i)=>i),[]);
  if (!visible) return null;
  return <div className="ember-prologue" role="dialog" aria-modal="true" aria-label="Captain Rosie: The Great Dig - Comic Opening">
    <div className="ember-prologue-progress" aria-hidden="true">{segments.map(i=><span key={i} className={i<page?'done':i===page?'current':''}>
      <i key={page === i ? `active-${i}` : i} style={i===page?{animationDuration:`${current.ms/1000}s`,animationPlayState:paused?'paused':'running'}:{}} />
    </span>)}</div>
    <div className="ember-prologue-scene" onClick={advance} title="Tap to advance">
      <img key={page} src={ROOT+current.image} alt="" draggable="false"
        style={{'--focus':`${current.focus}%`, '--from':`${current.from}%`, '--duration':`${current.ms/1000}s`,animationPlayState:paused?'paused':'running'}} />
      <div className="ember-prologue-vignette" />
      <div className="ember-prologue-frame" aria-hidden="true" />
    </div>
    <div className="ember-prologue-top">
      <span>CAPTAIN ROSIE · THE GREAT DIG</span>
      <nav aria-label="Comic controls">
        <button type="button" onClick={()=>setPaused(p=>!p)}>{paused?'Resume':'Pause'}</button>
        <button type="button" onClick={done}>Skip ›</button>
      </nav>
    </div>
    <div className="ember-prologue-caption" aria-live="polite" key={page}>
      <small>PAGE {String(page+1).padStart(2,'0')} / 08</small>
      <h2>{current.heading}</h2>
      <p>{current.text}</p>
    </div>
    <button className="ember-prologue-next" type="button" onClick={advance}>TAP TO ADVANCE ›</button>
  </div>;
}