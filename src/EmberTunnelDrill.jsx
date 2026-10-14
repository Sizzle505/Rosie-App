import React, { useEffect, useRef, useState } from "react";
import { DRILL_WIDTH, DRILL_HEIGHT, RUN_DURATION, newRun, triggerTurbo, updateRun } from "./emberDrillEngine.js";
import { paintDrill } from "./emberDrillPainter.js";
import "./ember-tunnel-drill.css";

const LABELS = ["Barkroot Passage", "Ruby Temple Galleries"];
const DRILL_ART = {
  body:"drill-body.webp",
  auger:"auger-spin.png",
  turbo:"turbo-animation.webp",
  barkroot:"barkroot-loop.webp",
  ruby:"ruby-loop.webp",
  roof:"roof-roots.webp",
  floor:"floor-ruby.webp",
  hangingRoots:"barkroot-hanging-roots.webp",
  descentRoof:"descending-roof.webp",
  descentFloor:"descending-floor.webp",
  cacheBurst:"cache-burst.webp",
  hazardPulse:"hazard-pulse.webp",
  goldenBone:"golden-bone.webp",
  header:"drill-header.webp",
  scenicBarkroot:"scenic-barkroot.webp",
  scenicLantern:"scenic-lantern.webp",
  scenicRoots:"scenic-roots.webp",
  scenicCrystal:"scenic-crystal.webp",
  scenicTemple:"scenic-temple.webp",
  bone:"collect-bone.webp",
  cheese:"collect-cheese.webp",
  gem:"collect-gem.webp",
  cache:"collect-cache.webp",
  rock:"hazard-rock.webp",
  spike:"hazard-spike.webp",
};

const formatTime = t => Math.max(0, Math.ceil(RUN_DURATION - t)) + "s";
function snapshot(s) {
  return { score:s.score, time:s.time, hull:s.hull, charge:s.charge, gems:s.gems, bones:s.bones,
    cheese:s.cheese, combo:s.combo, boost:s.boostTime, passage:s.time<33?0:1, result:s.result };
}
function playSound(context,kind) {
  if (!context) return;
  try {
    if (context.state==="suspended") context.resume();
    const start=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
    osc.type=kind==="hit"?"sawtooth":"sine";
    osc.frequency.setValueAtTime(kind==="hit"?210:kind==="turbo"?460:660,start);
    osc.frequency.exponentialRampToValueAtTime(kind==="hit"?95:kind==="turbo"?880:985,start+.15);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(.047,start+.018);
    gain.gain.exponentialRampToValueAtTime(.0001,start+.19);
    osc.connect(gain);gain.connect(context.destination);
    osc.start(start);osc.stop(start+.20);
  }catch(_){}
}
export default function EmberTunnelDrill({ soundOn=true }) {
  const canvas=useRef(null),frame=useRef(newRun()),pressed=useRef({up:false,down:false}),
        artRef=useRef({}),onscreen=useRef(false),
        modeRef=useRef("idle"),sound=useRef(null),lastSound=useRef(0),lastUi=useRef(0),portrait=useRef(null),
        particles=useRef([]),seed=useRef(1467);
  const [mode,setMode]=useState("idle");
  const [hud,setHud]=useState(()=>snapshot(frame.current));
  const [best,setBest]=useState(()=>{
    try {return Number(localStorage.getItem("rosieEmberDrillBest")||0)}catch(_){return 0}
  });
  const bestRef=useRef(best);
  useEffect(()=>{bestRef.current=best},[best]);

  function audio() {
    if (!soundOn)return null;
    try {
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(!AudioContext)return null;
      if(!sound.current)sound.current=new AudioContext();
      return sound.current;
    }catch(_){return null}
  }
  function start() {
    const next=newRun(seed.current++);
    frame.current=next;particles.current=[];
    pressed.current.up=false;pressed.current.down=false;
    modeRef.current="running";setMode("running");setHud(snapshot(next));
    playSound(audio(),"turbo");
  }
  function turbo() {
    const s=frame.current;
    if(triggerTurbo(s)){
      setHud(snapshot(s));playSound(audio(),"turbo");
      if(navigator.vibrate)navigator.vibrate(25);
    }
  }
  function resetHold(){pressed.current.up=false;pressed.current.down=false}
  useEffect(()=>{
    const img=new Image();img.src="/captain-rosie-illustrated.webp";portrait.current=img;
    const art={};
    for(const [key,file] of Object.entries(DRILL_ART)){
      const item=new Image();
      item.decoding="async";item.src="/ember-drill/"+file;art[key]=item;
    }
    artRef.current=art;
    const observer=new IntersectionObserver(entries=>{
      onscreen.current=Boolean(entries[0]?.isIntersecting);
    },{rootMargin:"150px"});
    if(canvas.current)observer.observe(canvas.current);
    const onKeys=e=>{
      if(modeRef.current!=="running")return;
      const key=e.key.toLowerCase();
      if(["arrowup","arrowdown","w","s"," "].includes(key))e.preventDefault();
      if(key==="arrowup"||key==="w")pressed.current.up=e.type==="keydown";
      if(key==="arrowdown"||key==="s")pressed.current.down=e.type==="keydown";
      if(key===" "&&e.type==="keydown"&&!e.repeat)turbo();
    };
    const onBlur=()=>resetHold();
    document.addEventListener("keydown",onKeys);
    document.addEventListener("keyup",onKeys);
    window.addEventListener("blur",onBlur);
    let raf=0,last=0,alive=true;
    const render=(ts)=>{
      if(!alive)return;
      const delta=last?Math.min((ts-last)/1000,.045):0;last=ts;
      if(!onscreen.current||document.hidden){raf=requestAnimationFrame(render);return;}
      const s=frame.current;
      if(modeRef.current==="running"&&!document.hidden){
        updateRun(s,delta,pressed.current.up,pressed.current.down);
        for(const event of s.events){
          if(event.type==="pickup"&&event.kind==="cache"){
            particles.current.push({type:"cache-burst",x:event.x,y:event.y,vx:0,vy:-8,life:.70,max:.70,r:0,color:"#f5d59c"});
          }
          if(event.type==="pickup"||event.type==="shatter"){
            const color=event.kind==="gem"?"#fb537a":event.kind==="cheese"?"#ffe68c":"#ffd182";
            for(let i=0;i<11;i++){
              const angle=(i/11)*Math.PI*2;
              const v=60+Math.random()*130;
              particles.current.push({x:event.x,y:event.y,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v,
                life:.42+Math.random()*.24,max:.66,r:2+Math.random()*3,color});
            }
          }
          if(event.type==="hit"){
            if(navigator.vibrate)navigator.vibrate([34,20,34]);
          }
          if((event.type==="pickup"||event.type==="hit")&&ts-lastSound.current>95){
            playSound(sound.current,event.type==="hit"?"hit":"pickup");lastSound.current=ts;
          }
        }
        if(ts-lastUi.current>115){
          lastUi.current=ts;setHud(snapshot(s));
        }
        if(s.ended){
          modeRef.current="ended";setMode("ended");setHud(snapshot(s));
          if(s.score>bestRef.current) {
            bestRef.current=s.score;setBest(s.score);
            try{localStorage.setItem("rosieEmberDrillBest",String(s.score))}catch(_){}
          }
          resetHold();
        }
      }
      particles.current=particles.current.filter(p=>p.life>0);
      for(const p of particles.current) {
        p.x+=p.vx*delta;p.y+=p.vy*delta;p.vy+=110*delta;p.life-=delta;
      }
      const el=canvas.current;
      if(el){
        const context=el.getContext("2d");
        if(context){
          context.setTransform(el.width/DRILL_WIDTH,0,0,el.height/DRILL_HEIGHT,0,0);
          paintDrill(context,s,portrait.current,particles.current,artRef.current);
        }
      }
      raf=requestAnimationFrame(render);
    };
    const resize=()=>{
      const el=canvas.current;if(!el)return;
      const rect=el.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
      el.width=Math.max(1,Math.round(rect.width*dpr));
      el.height=Math.max(1,Math.round(rect.height*dpr));
    };
    const obs=new ResizeObserver(resize);
    if(canvas.current)obs.observe(canvas.current);
    resize();raf=requestAnimationFrame(render);
    return ()=>{alive=false;cancelAnimationFrame(raf);obs.disconnect();observer.disconnect();
      document.removeEventListener("keydown",onKeys);document.removeEventListener("keyup",onKeys);
      window.removeEventListener("blur",onBlur);sound.current?.close?.();
    };
  },[soundOn]);
  const active=mode==="running";
  const title=mode==="ended" ? (hud.result==="complete"?"THE DIG IS DONE":"A VALIANT EXCAVATION") : "THE GREAT DIG";
  const subtitle=mode==="ended" ? (hud.result==="complete"?"Rosie has excavated an entirely respectable amount of park.":"Rosie maintains the rocks were poorly positioned.") :
    "Because some dogs dig holes. Rosie digs civilizations.";
  const hold=(type,on,e)=>{
    if(e?.type==="pointerdown"){e.preventDefault();e.currentTarget.setPointerCapture?.(e.pointerId)}
    if(modeRef.current!=="running")return;
    pressed.current[type]=on;
  };
  return (
    <section className="ember-suite" aria-label="Captain Rosie Ember Tunnel Drill game">
      <div className="ember-section-divider"><span>✦</span> ANOTHER CAPTAIN ROSIE ADVENTURE <span>✦</span></div>
      <header className="ember-header">
        <div className="ember-header-portrait"><img src="/captain-rosie-illustrated.webp" alt="Captain Rosie" /></div>
        <div className="ember-header-copy"><span>THE HOUSE OF ROSIE · BARKBRIDGE EXPEDITIONS</span>
          <h2>CAPTAIN ROSIE</h2><p>Ember Tunnel Drill</p></div>
        <div className="ember-header-seal">✦</div>
      </header>
      <div className="ember-stats" aria-live="off">
        <div><small>SCORE</small><strong>{hud.score.toLocaleString()}</strong></div>
        <div><small>TIME</small><strong>{formatTime(hud.time)}</strong></div>
        <div><small>HULL</small><strong className="ember-hull">{[0,1,2].map(n=><i key={n} className={n<hud.hull?"intact":""}>●</i>)}</strong></div>
        <div><small>TREASURE</small><strong>{hud.gems+hud.bones+hud.cheese}</strong></div>
      </div>
      <div className={"ember-stage"+(active?" is-active":"")} >
        <div className="ember-course-plaque"><small>PASSAGE {hud.passage+1} OF 2</small><strong>{LABELS[hud.passage]}</strong></div>
        <canvas ref={canvas} className="ember-canvas" width="690" height="820"
          role="img" aria-label="Rosie pilots her continuously moving drill through curving earth tunnels, collecting cheese, bones and gems while avoiding obstacles" />
        {hud.boost>0&&<span className="ember-turbo-banner">BURROW TURBO!</span>}
        {active&&hud.combo>=4&&<div className="ember-streak">DIG FRENZY ×{Math.ceil(hud.combo/3)}</div>}
        {mode!=="running"&&
          <div className="ember-start-overlay">
            <span className="ember-start-eyebrow">{mode==="ended"?"CAPTAIN'S EXCAVATION REPORT":"CAPTAIN ROSIE AWAITS HER ORDERS"}</span>
            <h3>{title}</h3>
            <p>{subtitle}</p>
            {mode==="ended"&&hud.result==="complete"&&<img className="ember-relic-reveal" src="/ember-drill/golden-bone.webp" alt="Rosie's Golden Bone relic" />}
            {mode==="ended"&&<div className="ember-results"><span><b>{hud.score.toLocaleString()}</b> POINTS</span><span><b>{hud.gems}</b> GEMS</span><span><b>{best.toLocaleString()}</b> BEST</span></div>}
            <button type="button" onClick={start}>{mode==="ended"?"DIG AGAIN":"START DIGGING"}</button>
            <small>Hold ▲ or ▼ to steer. Release to level out.</small>
          </div>}
      </div>
      <div className="ember-controls">
        <button className="ember-angle" type="button" disabled={!active}
          onPointerDown={e=>hold("up",true,e)} onPointerUp={e=>hold("up",false,e)}
          onPointerCancel={e=>hold("up",false,e)} onLostPointerCapture={e=>hold("up",false,e)}
          aria-label="Angle the drill upward"><span>▲</span><small>ANGLE UP</small></button>
        <button className={"ember-boost"+(hud.charge>=100?" is-ready":"")} type="button"
          disabled={!active||hud.charge<100||hud.boost>0} onClick={turbo}
          aria-label="Activate Burrow Turbo when charged">
          <span className="ember-boost-symbol">✦</span>
          <span><b>{hud.boost>0?"TURBO ACTIVE":hud.charge>=100?"TAP FOR TURBO":"BURROW TURBO"}</b>
            <i className="ember-charge"><i style={{width:hud.charge+"%"}} /></i>
            <small>COLLECT TREASURE TO CHARGE</small></span>
        </button>
        <button className="ember-angle" type="button" disabled={!active}
          onPointerDown={e=>hold("down",true,e)} onPointerUp={e=>hold("down",false,e)}
          onPointerCancel={e=>hold("down",false,e)} onLostPointerCapture={e=>hold("down",false,e)}
          aria-label="Angle the drill downward"><span>▼</span><small>ANGLE DOWN</small></button>
      </div>
      <div className="ember-caption"><span>BONES {hud.bones}</span><span>CHEESE {hud.cheese}</span><span>GEMS {hud.gems}</span>
        <span className="ember-best">BEST {best.toLocaleString()}</span></div>
    </section>
  );
}
