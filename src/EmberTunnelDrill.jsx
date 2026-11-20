import React, { useEffect, useRef, useState } from "react";
import { DRILL_WIDTH, DRILL_HEIGHT, RUN_DURATION, TURBO_DURATION, newRun, triggerTurbo, updateRun } from "./emberDrillEngine.js";
import { paintDrill } from "./emberDrillPainter.js";
import { primeMechanicalAtlases } from "./emberAugerFX.js";
import { excavationNotice, excavationStars } from "./emberBreakableFeedback.js";
import "./ember-tunnel-drill.css";
import AxisJoystick from "./AxisJoystick.jsx";

const PASSAGES = [
  { label: "Barkroot Passage", start: 0, end: RUN_DURATION / 2 },
  { label: "Ruby Temple Galleries", start: RUN_DURATION / 2, end: RUN_DURATION },
];
const DRILL_ART = {
  breakEarthIntact:"breakables/v2/01-earth-wall-intact.webp",
  breakEarthCracked:"breakables/v2/02-earth-wall-cracked.webp",
  breakCrystalIntact:"breakables/v2/03-crystal-wall-intact.webp",
  breakCrystalCracked:"breakables/v2/04-crystal-wall-cracked.webp",
  breakEntranceClosed:"breakables/v2/05-secret-entrance-closed.webp",
  breakEntranceOpen:"breakables/v2/06-secret-entrance-open.webp",
  breakRoyalMedallion:"breakables/v2/09-royal-bone-medallion.webp",
  breakShatterVfx:"breakables/v2/10-rock-crystal-shatter-vfx-5x2.webp",
  bg01:"new-assets/background/bg01.webp",
  bg02:"new-assets/background/bg02.webp",
  bg03:"new-assets/background/bg03.webp",
  bg04:"new-assets/background/bg04.webp",
  bg05:"new-assets/background/bg05.webp",
  bg06:"new-assets/background/bg06.webp",
  bg07:"new-assets/background/bg07.webp",
  bg08:"new-assets/background/bg08.webp",
  bg09:"new-assets/background/bg09.webp",
  bg10:"new-assets/background/bg10.webp",
  newRootShelf:"new-assets/obstacle/newRootShelf.webp",
  newSlopeRoof:"new-assets/obstacle/newSlopeRoof.webp",
  newCrystalRoof:"new-assets/obstacle/newCrystalRoof.webp",
  newRootCurtain:"new-assets/obstacle/newRootCurtain.webp",
  newCrystalMound:"new-assets/obstacle/newCrystalMound.webp",
  newRootMound:"new-assets/obstacle/newRootMound.webp",
  newCrystalTeeth:"new-assets/obstacle/newCrystalTeeth.webp",
  newCrystalRidge:"new-assets/obstacle/newCrystalRidge.webp",
  newSlopeFloor:"new-assets/obstacle/newSlopeFloor.webp",
  newCrystalDrape:"new-assets/obstacle/newCrystalDrape.webp",
  newBarkrootRoof:"new-assets/obstacle/newBarkrootRoof.webp",
  newThinRoots:"new-assets/obstacle/newThinRoots.webp",
  terrainRoofLeftRoot:"terrain-transitions/ember-roof-transition-left-root-heavy.webp",
  terrainRoofRightRoot:"terrain-transitions/ember-roof-transition-right-root-heavy.webp",
  terrainRoofLeftCrystal:"terrain-transitions/ember-roof-transition-left-crystal-drape.webp",
  terrainRoofRightCrystal:"terrain-transitions/ember-roof-transition-right-crystal-drape.webp",
  terrainRoofCore:"terrain-transitions/ember-roof-obstacle-core-barkroot.webp",
  terrainFloorLeftRoot:"terrain-transitions/ember-floor-transition-left-rootstone.webp",
  terrainFloorRightRoot:"terrain-transitions/ember-floor-transition-right-rootstone.webp",
  terrainFloorLeftRuby:"terrain-transitions/ember-floor-transition-left-ruby-ridge.webp",
  terrainFloorRightRuby:"terrain-transitions/ember-floor-transition-right-ruby-ridge.webp",
  terrainFloorCore:"terrain-transitions/ember-floor-obstacle-core-ruby.webp",
  terrainDebrisRoots:"terrain-transitions/ember-hazard-debris-roots.webp",
  terrainDebrisCrystals:"terrain-transitions/ember-hazard-debris-crystals.webp",
  terrainPassageGate:"terrain-transitions/ember-passage-arrival-lantern-gate.webp",
  edgeBarkrootTop:"edge/barkroot-top.webp",
  edgeBarkrootBottom:"edge/barkroot-bottom.webp",
  ogCanopyA:"edge/formation/hanging-canopy-a.webp",
  ogCanopyB:"edge/formation/hanging-canopy-b.webp",
  ogCanopyC:"edge/formation/hanging-canopy-c.webp",
  ogCrystalA:"edge/formation/rising-crystal-a.webp",
  ogCrystalB:"edge/formation/rising-crystal-b.webp",
  ogCrystalC:"edge/formation/rising-crystal-c.webp",
  ogRichRoofA:"edge/formation/rich-roof-a.webp",
  ogRichRoofB:"edge/formation/rich-roof-b.webp",
  ogRichFloorA:"edge/formation/rich-floor-a.webp",
  ogRichFloorB:"edge/formation/rich-floor-b.webp",
  ogSlopeRoofA:"edge/formation/slope-roof-a.webp",
  ogSlopeRoofB:"edge/formation/slope-roof-b.webp",
  ogSlopeFloorA:"edge/formation/slope-floor-a.webp",
  ogSlopeFloorB:"edge/formation/slope-floor-b.webp",
  ogRootsOne:"edge/formation/original-roots-1.webp",
  ogRootsTwo:"edge/formation/original-roots-2.webp",
  terrainEarth:"terrain-barkroot-earth.webp",
  terrainRoots:"terrain-deep-rootstone.webp",
  terrainRuby:"terrain-ruby-crystal-rock.webp",
  terrainTemple:"terrain-temple-basalt.webp",
  body:"drill-body.webp",
  turnUp:"wall-turn-up.webp",
  turnNeutral:"wall-turn-neutral.webp",
  turnDown:"wall-turn-down.webp",
  auger:"new-assets/drill-candidates/steampunk_golden_drill_sprite_sheet.webp",
  jetSheet:"new-assets/drill-candidates/golden_jet_flame_vfx_sprite_sheet.webp",
  impactSheet:"new-assets/drill-candidates/golden_drill_impact_effect_sprite_sheet.webp",
  wallAmberCeiling:"wall-amber-ceiling.webp",
  wallAmberFloor:"wall-amber-floor.webp",
  wallFantasyCeiling:"wall-fantasy-ceiling.webp",
  wallFantasyFloor:"wall-fantasy-floor.webp",
  wallLanternCeiling:"wall-lantern-ceiling.webp",
  wallDescentCeiling:"wall-descent-ceiling.webp",
  wallDescentFloor:"wall-descent-floor.webp",
  wallRubyCeiling:"wall-ruby-ceiling.webp",
  wallRubyFloor:"wall-ruby-floor.webp",
  wallCrystalFloor:"wall-crystal-floor.webp",
  wallSanctumCeiling:"wall-sanctum-ceiling.webp",
  wallSanctumFloor:"wall-sanctum-floor.webp",
  rubyLoop:"ruby-loop.webp",
  crystalOverlay:"feature-crystaloverlay.webp",
  turboAtlas:"turbo-head-frames.webp",
  barkroot:"barkroot-loop.webp",
  rubyOrganic:"ruby-organic-passage.webp",
  templeOrganic:"temple-organic-passage.webp",
  roof:"roof-roots.webp",
  floor:"floor-ruby.webp",
  hangingRoots:"barkroot-hanging-roots.webp",
  descentRoof:"descending-roof.webp",
  descentFloor:"descending-floor.webp",
  cacheBurst:"cache-burst.webp",
  hazardPulse:"hazard-pulse.webp",
  gate:"feature-gate.webp",
  lantern:"feature-lantern.webp",
  chest:"feature-chest.webp",
  coin:"feature-coin.webp",
  rockburst:"feature-rockburst.webp",
  boosttrail:"feature-boosttrail.webp",
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
    cheese:s.cheese, combo:s.combo, boost:s.boostTime, boosts:s.boosts, shards:s.shards,
    damageTaken:s.damageTaken, cleanBonus:s.cleanBonus, distance:Math.round(s.distance/10),
    wallsBroken:s.wallsBroken||0,secrets:s.secrets||0,relics:s.relics||0,
    passage:Math.min(PASSAGES.length-1, Math.floor(s.time / (RUN_DURATION / PASSAGES.length))), result:s.result };
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
  const [steerMode,setSteerMode]=useState(()=>{try{return localStorage.getItem("emberSteeringMode")==="joystick"?"joystick":"buttons"}catch{return "buttons"}});
  const toggleSteerMode=()=>{resetHold();setSteerMode(current=>{const next=current==="joystick"?"buttons":"joystick";try{localStorage.setItem("emberSteeringMode",next)}catch{}return next})};
  const canvas=useRef(null),stage=useRef(null),frame=useRef(newRun()),pressed=useRef({up:false,down:false}),
        artRef=useRef({}),onscreen=useRef(false),
        modeRef=useRef("idle"),sound=useRef(null),lastSound=useRef(0),lastUi=useRef(0),portrait=useRef(null),
        particles=useRef([]),seed=useRef(1467),noticeRef=useRef(null);
  const [mode,setMode]=useState("idle");
  const [notice,setNotice]=useState(null);
  const [relicFound,setRelicFound]=useState(()=>{
    try{return localStorage.getItem("rosieEmberRoyalBoneFound")==="1"}catch(_){return false}
  });
  const [arcadeBackdrop,setArcadeBackdrop]=useState(0);
  const arcadeBackdrops=[{id:"foundry",label:"MOLTEN FOUNDRY"},{id:"crystal",label:"CRYSTAL VAULT"},{id:"control",label:"EXCAVATION CONTROL"}];
  const [hud,setHud]=useState(()=>snapshot(frame.current));
  const [best,setBest]=useState(()=>{
    try {return Number(localStorage.getItem("rosieEmberDrillBest")||0)}catch(_){return 0}
  });
  const bestRef=useRef(best);
  const [bestStars,setBestStars]=useState(()=>{
    try{return Math.min(3,Math.max(0,Number(localStorage.getItem("rosieEmberExpeditionStars")||0)))}catch(_){return 0}
  });
  const bestStarsRef=useRef(bestStars);
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
    noticeRef.current=null;setNotice(null);
    pressed.current.up=false;pressed.current.down=false;
    modeRef.current="running";setMode("running");setHud(snapshot(next));
    playSound(audio(),"start");
    // React removes the launch card on this state change. Wait for that layout
    // to settle, then position the stage itself - once and exactly - 500px
    // from the viewport top. Native scrolling avoids a second smooth-scroll
    // pass landing noticeably below the requested position on iOS.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const top=stage.current?.getBoundingClientRect().top;
      if(typeof top!=="number")return;
      const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
      // Move 400px down from the prior position while retaining a deterministic
      // page location after the launch card disappears.
      // Keep another 130px of the page above the playfield visible on launch.
      const target=Math.max(0,Math.min(max,window.scrollY+top-20));
      window.scrollTo(0,target);
    }));
  }
  function turbo() {
    const s=frame.current;
    if(triggerTurbo(s)){
      s.tipBurstAt=s.time; // Event-driven eight-frame ignition; cosmetic only.
      setHud(snapshot(s));playSound(audio(),"turbo");
      if(navigator.vibrate)navigator.vibrate(25);
    }
  }
  function togglePause() {
    if (modeRef.current !== "running" && modeRef.current !== "paused") return;
    const next = modeRef.current === "running" ? "paused" : "running";
    modeRef.current = next;
    resetHold();
    setMode(next);
    if (next === "paused") playSound(audio(), "hit");
  }
  function resetHold(){pressed.current.up=false;pressed.current.down=false}
  useEffect(()=>{
    const img=new Image();img.src="/captain-rosie-illustrated.webp";portrait.current=img;
    const art={};
    for(const [key,file] of Object.entries(DRILL_ART)){
      const item=new Image();
      item.decoding="async";
      if(key==="auger")item.addEventListener("load",()=>primeMechanicalAtlases({auger:item}),{once:true});
      item.src="/ember-drill/"+file;art[key]=item;
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
           const cue=excavationNotice(event);
           if(cue){
             const activeNotice={...cue,until:s.time+cue.duration};
             noticeRef.current=activeNotice;setNotice(activeNotice);
           }
          if(event.type==="shatter"&&s.boostTime>0)s.tipBurstAt=s.time;
          if(event.type==="turbo"&&event.repaired){
            for(let i=0;i<14;i++){
              const angle=(i/14)*Math.PI*2;
              const v=38+Math.random()*86;
              particles.current.push({x:event.x,y:event.y,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v-38,
                life:.52+Math.random()*.20,max:.72,r:2+Math.random()*2.5,color:"#fff0a6"});
            }
          }
          if(event.type==="pickup"&&event.kind==="cache"){
            particles.current.push({type:"cache-burst",x:event.x,y:event.y,vx:0,vy:-8,life:.70,max:.70,r:0,color:"#f5d59c"});
          }
          if(event.type==="hard-rock"){
            // Safe ricochet when unpowered crystal resists the auger.
            for(let i=0;i<9;i++){
              const angle=i*Math.PI*2/9,v=45+Math.random()*60;
              particles.current.push({x:event.x,y:event.y,
                vx:Math.cos(angle)*v,vy:Math.sin(angle)*v,
                life:.26,max:.26,r:1.5+(i%3),color:i%2?"#f3b1f7":"#fff0b5"});
            }
            if(navigator.vibrate)navigator.vibrate(20);
            playSound(sound.current,"turbo");
          }
          if(["break-wall","secret-found","crack-wall"].includes(event.type)){
             particles.current.push({type:event.type==="crack-wall"?"crack-v2":"break-v2",
               kind:event.material,x:event.x,y:event.y,vx:0,vy:0,
               life:event.type==="crack-wall"?.30:.62,max:event.type==="crack-wall"?.30:.62,
               r:0,color:"#e5a86a"});
             if(event.type==="secret-found"){
               try{localStorage.setItem("rosieEmberRoyalBoneFound","1")}catch(_){}
               setRelicFound(true);
               if(navigator.vibrate)navigator.vibrate([18,18,35]);
             }
           }
           if(event.type==="hit"||event.type==="shatter"){
            particles.current.push({type:event.type==="hit"?"hit-burst":"break-v2",
              x:event.x,y:event.y,vx:0,vy:0,life:.54,max:.54,r:0,color:"#efbd75"});
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
          if(["pickup","hit","break-wall","secret-found"].includes(event.type)&&ts-lastSound.current>95){
            playSound(sound.current,event.type==="hit"?"hit":event.type==="break-wall"?"turbo":"pickup");lastSound.current=ts;
          }
        }
        if(noticeRef.current&&s.time>=noticeRef.current.until){
           noticeRef.current=null;setNotice(null);
         }
         if(ts-lastUi.current>115){
          lastUi.current=ts;setHud(snapshot(s));
        }
        if(s.ended){
          modeRef.current="ended";setMode("ended");setHud(snapshot(s));
           const stars=excavationStars(s);
           if(stars>bestStarsRef.current){
             bestStarsRef.current=stars;setBestStars(stars);
             try{localStorage.setItem("rosieEmberExpeditionStars",String(stars))}catch(_){}
           }
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
          // The stage uses different aspect ratios on desktop and phones. Correct the
          // vehicle's horizontal scale without changing gameplay or stretching the art.
          const rect=el.getBoundingClientRect();
          const correction=Math.max(.50,Math.min(1.70,
            (rect.height/DRILL_HEIGHT)/Math.max(.001,rect.width/DRILL_WIDTH)));
          paintDrill(context,s,portrait.current,particles.current,artRef.current,correction);
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
  const paused=mode==="paused";
  const title=mode==="ended" ? (hud.result==="complete"?"THE DIG IS DONE":"A VALIANT EXCAVATION") : "THE GREAT DIG";
  const subtitle=mode==="ended" ? (hud.result==="complete"?"Rosie has excavated an entirely respectable amount of park.":"Rosie maintains the rocks were poorly positioned.") :
    "Because some dogs dig holes. Rosie digs civilizations.";
  const hold=(type,on,e)=>{
    if(e?.type==="pointerdown"){e.preventDefault();e.currentTarget.setPointerCapture?.(e.pointerId)}
    if(modeRef.current!=="running")return;
    pressed.current[type]=on;
  };
  const passageProgress = Math.min(100, ((hud.time - PASSAGES[hud.passage].start) / (PASSAGES[hud.passage].end - PASSAGES[hud.passage].start)) * 100);
  return (
    <section className="ember-suite" data-arcade-backdrop={arcadeBackdrops[arcadeBackdrop].id} aria-label="Captain Rosie Ember Tunnel Drill game">
      <div className="ember-section-divider"><span>✦</span> ANOTHER CAPTAIN ROSIE ADVENTURE <span>✦</span></div>
      <header className="ember-header" aria-label="Captain Rosie - Ember Tunnel Drill">
        <img className="ember-header-full-art" src="/ember-drill/drill-header.webp"
             alt="Captain Rosie - Ember Tunnel Drill" draggable="false" />
      </header>
      <div className="ember-stats" aria-live="off">
        <div><small>SCORE</small><strong>{hud.score.toLocaleString()}</strong></div>
        <div><small>TIME</small><strong>{formatTime(hud.time)}</strong></div>
        <div><small>HULL</small><strong className="ember-hull">{Array.from({length:5},(_,n)=><i key={n} className={n<hud.hull?"intact":""}>●</i>)}</strong></div>
        <div><small>TREASURE</small><strong>{hud.gems+hud.bones+hud.cheese}</strong></div>
      </div>
      <div className="ember-expedition" aria-label={`Excavation route: passage ${hud.passage+1} of ${PASSAGES.length}`}>
        <span className="ember-route-label">EXCAVATION ROUTE</span>
        <div className="ember-route-track"><i style={{width:`${((hud.passage + passageProgress / 100) / PASSAGES.length) * 100}%`}} /></div>
        {PASSAGES.map((passage,index)=><span key={passage.label} className={index < hud.passage ? "complete" : index === hud.passage ? "current" : ""}>{index+1}. {passage.label}</span>)}
      </div>
      <div ref={stage} className={"ember-stage"+(active?" is-active":"")} >
        <div className="ember-course-plaque"><small>PASSAGE {hud.passage+1} OF {PASSAGES.length}</small><strong>{PASSAGES[hud.passage].label}</strong></div>
        <canvas ref={canvas} className="ember-canvas" width="690" height="820"
          role="img" aria-label="Rosie pilots her continuously moving drill through curving earth tunnels, collecting cheese, bones and gems while avoiding obstacles. Use the angle controls to steer." />
        {hud.boost>0&&<span className="ember-turbo-banner">BURROW TURBO!</span>}
         {active&&hud.time<4.5&&!notice&&<div className="ember-dig-hint">GUIDE THE AUGER INTO WEAK EARTH · TURBO BREAKS CRYSTAL</div>}
         {active&&notice&&<div className={"ember-dig-notice is-"+notice.kind} role="status" aria-live="polite">
           {notice.kind==="relic"&&<img src="/ember-drill/breakables/v2/09-royal-bone-medallion.webp" alt="" />}
           <span><strong>{notice.title}</strong><small>{notice.detail}</small></span>
         </div>}
        {active&&hud.combo>=4&&<div className="ember-streak">DIG FRENZY ×{Math.ceil(hud.combo/3)}</div>}
        {paused&&<div className="ember-pause-overlay"><span>THE DRILL IS IDLING</span><strong>EXCAVATION PAUSED</strong><p>Your route, treasure, and hull are safely held.</p><button type="button" onClick={togglePause}>RESUME DIG</button></div>}
        {mode!=="running"&&mode!=="paused"&&
          <div className={"ember-start-overlay"+(mode==="ended"?" is-ended":"")}>
            <span className="ember-start-eyebrow">{mode==="ended"?"CAPTAIN'S EXCAVATION REPORT":"CAPTAIN ROSIE AWAITS HER ORDERS"}</span>
            <h3>{title}</h3>
            <p>{subtitle}</p>
             {mode==="ended"&&<div className="ember-expedition-medals" aria-label={excavationStars(hud)+" of 3 expedition stars earned"}>
               <span aria-hidden="true">{[0,1,2].map(n=><i key={n} className={n<excavationStars(hud)?"earned":""}>★</i>)}</span>
               <small>FINISH · 2 WALLS · ROYAL RELIC</small>
             </div>}
            {mode==="ended"&&(hud.relics>0||relicFound ?
              <img className="ember-relic-reveal" src="/ember-drill/breakables/v2/09-royal-bone-medallion.webp" alt="Rosie's Royal Bone Medallion, found in a secret chamber" /> :
              hud.result==="complete"&&<img className="ember-relic-reveal" src="/ember-drill/golden-bone.webp" alt="Rosie's Golden Bone relic" />)}
            {mode==="ended"&&<div className="ember-results">
              <span><b>{hud.score.toLocaleString()}</b> POINTS</span>
              <span><b>{hud.distance.toLocaleString()}m</b> EXCAVATED</span>
              <span><b>{hud.gems}</b> GEMS</span>
              <span><b>{hud.boosts}</b> TURBOS</span>
              <span><b>{hud.shards+hud.wallsBroken}</b> ROCKS SHATTERED</span>
              <span><b>{hud.secrets}</b> SECRET CHAMBERS</span>
              <span><b>{hud.relics}</b> ROYAL RELICS</span>
              <span><b>{hud.damageTaken===0?"UNSCATHED":hud.hull+"/5"}</b> {hud.damageTaken===0?"EXCAVATOR":"HULL REMAINING"}</span>
              {hud.cleanBonus>0&&<span><b>+{hud.cleanBonus}</b> CLEAN DIG</span>}
              <span><b>{best.toLocaleString()}</b> BEST</span>
            </div>}
            <button type="button" onClick={start}>{mode==="ended"?"DIG AGAIN":"START DIGGING"}</button>
            <small>Hold ▲ / ▼ to steer. Break earth with the drill; Turbo breaks crystal. Space ignites Turbo.</small>
          </div>}
      </div>
      <div className="ember-controls">
        {steerMode==="joystick" ? <AxisJoystick axis="vertical" label="Drill pitch" disabled={!active}
          onDirection={sign=>{pressed.current.up=sign<0;pressed.current.down=sign>0;}}
          onRelease={resetHold} /> :
        <button className="ember-angle" type="button" disabled={!active}
          onPointerDown={e=>hold("up",true,e)} onPointerUp={e=>hold("up",false,e)}
          onPointerCancel={e=>hold("up",false,e)} onLostPointerCapture={e=>hold("up",false,e)}
          aria-label="Angle the drill upward"><span>▲</span></button>}
        <button className={"ember-boost"+(hud.boost>0?" is-boosting":hud.charge>=100?" is-ready":"")} type="button"
          disabled={!active||hud.charge<100||hud.boost>0} onClick={turbo}
          aria-label={hud.boost>0?"Burrow Turbo active":hud.charge>=100?"Activate Burrow Turbo":"Burrow Turbo charging"}>
          <span className="ember-boost-symbol">✦</span>
          <span><b>{hud.boost>0?"TURBO ACTIVE":hud.charge>=100?"TAP FOR TURBO":"BURROW TURBO"}</b>
            <i className="ember-charge"><i style={{width:(hud.boost>0?Math.min(100,hud.boost/TURBO_DURATION*100):hud.charge)+"%"}} /></i>
            <small>{hud.boost>0?hud.boost.toFixed(1)+"s INVULNERABLE":hud.charge>=100?"INVULNERABLE · RESTORES 1 HULL":"COLLECT TREASURE TO CHARGE"}</small></span>
        </button>
        {steerMode==="joystick" ? <button className="ember-stick-toggle" type="button" onClick={toggleSteerMode} aria-label="Use arrow controls" title="Arrow controls">▲▼</button> :
        <button className="ember-angle" type="button" disabled={!active}
          onPointerDown={e=>hold("down",true,e)} onPointerUp={e=>hold("down",false,e)}
          onPointerCancel={e=>hold("down",false,e)} onLostPointerCapture={e=>hold("down",false,e)}
          aria-label="Angle the drill downward"><span>▼</span></button>}
        {steerMode==="buttons"&&<button className="ember-stick-toggle" type="button" onClick={toggleSteerMode} aria-label="Use joystick" title="Joystick">◉</button>}
      </div>
      {active&&<div className="ember-run-actions">
        <button className="ember-icon-action" type="button" onClick={togglePause} aria-label="Pause run" title="Pause run">❚❚</button>
        <button className="ember-icon-action" type="button" onClick={start} aria-label="Replay run" title="Replay run">↻</button>
        <span>Hold ▲ / ▼ to steer · Space for Turbo</span>
      </div>}
      <div className="ember-caption"><span>BONES {hud.bones}</span><span>CHEESE {hud.cheese}</span><span>GEMS {hud.gems}</span><span>WALLS {hud.wallsBroken}</span><span>SECRETS {hud.secrets}</span>{relicFound&&<span className="ember-best">ROYAL RELIC FOUND</span>}
        <span className="ember-best">BEST {best.toLocaleString()}</span><span className="ember-best">EXPEDITION {"★".repeat(bestStars)}{"☆".repeat(3-bestStars)}</span></div>
    </section>
  );
}
