import React, { useEffect, useRef, useState } from "react";
import { DRILL_WIDTH, DRILL_HEIGHT, RUN_DURATION, TURBO_DURATION, newRun, triggerTurbo, updateRun } from "./emberDrillEngine.js";
import { paintDrill } from "./emberDrillPainter.js";
import { primeMechanicalAtlases } from "./emberAugerFX.js";
import { excavationNotice, excavationStars } from "./emberBreakableFeedback.js";
import {EXPEDITION_STAGES,getExpeditionStage,expeditionStarCount,safeStoredExpeditionStars} from "./emberExpeditionStages.js";
import {EMBER_EXPANSION_ATLASES,EMBER_CHARACTER_ATLASES,EMBER_EXPANSION_TRANSITIONS,EXPANSION_ROOT} from "./emberExpansionCatalog.js";
import "./ember-tunnel-drill.css";
import AxisJoystick from "./AxisJoystick.jsx";
import EmberTunnelPrologue from "./EmberTunnelPrologue.jsx";

// Art loads only for the selected challenge, keeping the original Classic
// course fast and unchanged. All source images are available for QA in PR #192.
const EXPEDITION_ART_BY_STAGE={
  0:["world-markers"],1:["world-markers"],
  2:["gear-crusher","copperjack","world-markers","bonus-pickups"],
  3:["lava-geyser","falling-basalt","cinderclaw","world-markers","bonus-pickups"],
  4:["royal-earth-burst","mole-king","world-markers","bonus-pickups"]
};
function loadExpeditionArt(art,stageIndex){
  if(!Number.isInteger(stageIndex)||stageIndex<0)return;
  const all={...EMBER_EXPANSION_ATLASES,...EMBER_CHARACTER_ATLASES};
  for(const id of EXPEDITION_ART_BY_STAGE[stageIndex]||[]){
    const key="exp:"+id;
    if(art[key]||!all[id])continue;
    const image=new Image();
    image.decoding="async";
    image.src=EXPANSION_ROOT+all[id].file;
    art[key]=image;
  }
  // Load only the panorama for the selected advanced world. The Classic
  // course and earlier approved backgrounds never request these files.
  const transition={2:"ruby-clockwork",3:"clockwork-molten",4:"molten-treasury"}[stageIndex];
  const key="exp-transition:"+transition;
  if(transition&&!art[key]){
    const image=new Image();image.decoding="async";
    image.src=EXPANSION_ROOT+EMBER_EXPANSION_TRANSITIONS[transition];
    art[key]=image;
  }
}
const PASSAGES = [
  { label: "Barkroot Passage", start: 0, end: RUN_DURATION / 2, mission:"BREAK AN EARTH WALL" },
  { label: "Ruby Temple Galleries", start: RUN_DURATION / 2, end: RUN_DURATION, mission:"BEAT THE CRYSTAL SHUTTER" },
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

const formatTime = (t,duration=RUN_DURATION) => Math.max(0, Math.ceil(duration - t)) + "s";
function snapshot(s) {
  return { score:s.score, time:s.time, hull:s.hull, charge:s.charge, gems:s.gems, bones:s.bones,
    cheese:s.cheese, combo:s.combo, boost:s.boostTime, boosts:s.boosts, shards:s.shards,
    damageTaken:s.damageTaken, cleanBonus:s.cleanBonus, distance:Math.round(s.distance/10),
    wallsBroken:s.wallsBroken||0,secrets:s.secrets||0,relics:s.relics||0,
    hazardsDodged:s.hazardsDodged||0,objectiveBonus:s.objectiveBonus||0,
    stageIndex:s.stageIndex??null,duration:s.duration||RUN_DURATION,
    worldObjective:s.worldObjective===true,worldHazardCount:s.worldHazards?.length||0,
    worldWarnings:(s.worldHazards||[]).filter(h=>h.warned).length,
    boss:s.boss?{kind:s.boss.kind,health:s.boss.health,maxHealth:s.boss.maxHealth,
      phase:s.boss.phase,attack:s.boss.attack,defeated:s.boss.defeated}:null,
    bossDefeated:s.bossDefeated===true,
    objectives:{barkroot:!!s.objectives?.barkroot,ruby:!!s.objectives?.ruby},
    passage:s.stageIndex===null?Math.min(PASSAGES.length-1, Math.floor(s.time / (RUN_DURATION / PASSAGES.length))):s.stageIndex, result:s.result };
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
function playBossAudio(context,kind){
  if(!context)return;
  try{
    if(context.state==="suspended")context.resume();
    const notes=kind==="boss-victory"?[523,659,784,1047]:
      kind==="boss-hit"?[210,335]:kind==="boss-vulnerable"?[550,770]:[330,218];
    const now=context.currentTime;
    for(let i=0;i<notes.length;i++){
      const osc=context.createOscillator(),amp=context.createGain();
      const t=now+i*(kind==="boss-victory"?.095:.085);
      osc.type=kind==="boss-hit"?"sawtooth":kind==="boss-warning"?"triangle":"sine";
      osc.frequency.setValueAtTime(notes[i],t);
      amp.gain.setValueAtTime(.0001,t);
      amp.gain.exponentialRampToValueAtTime(.032,t+.014);
      amp.gain.exponentialRampToValueAtTime(.0001,t+.125);
      osc.connect(amp);amp.connect(context.destination);
      osc.start(t);osc.stop(t+.14);
    }
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
  const prologueSeenRef=useRef((()=>{try{return localStorage.getItem("rosieEmberPrologueSeenV1")==="1"}catch{return false}})());
  const pendingPrologueStart=useRef(null);
  const [showPrologue,setShowPrologue]=useState(false);
  const [notice,setNotice]=useState(null);
  const [selectedWorld,setSelectedWorld]=useState(0);
  useEffect(()=>{
    if(mode==="idle")return;
    const state=mode==="running"?"playing":mode==="paused"?"paused":"ended";
    window.dispatchEvent(new CustomEvent("rosieverse:music:scene",{
      detail:{scene:"tunnel",state,world:selectedWorld}
    }));
  },[mode,selectedWorld]);
  const [stageStars,setStageStars]=useState(()=>{
    try{return safeStoredExpeditionStars(localStorage.getItem("rosieEmberFiveWorldStarsV1"))}catch{return {}}
  });
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
  function completePrologue() {
    const pending=pendingPrologueStart.current;
    pendingPrologueStart.current=null;
    prologueSeenRef.current=true;
    try{localStorage.setItem("rosieEmberPrologueSeenV1","1")}catch(_){}
    setShowPrologue(false);
    if(pending?.launch)start(pending.requestedStage,true);
  }
  function replayPrologue() {
    pendingPrologueStart.current={launch:false};
    setShowPrologue(true);
  }
  function start(requestedStage=undefined,skipPrologue=false) {
    if(!skipPrologue&&!prologueSeenRef.current){
      pendingPrologueStart.current={launch:true,requestedStage};
      setShowPrologue(true);
      return;
    }
    const targetStage=Number.isInteger(requestedStage)?requestedStage:
      requestedStage===null?null:(modeRef.current==="ended"?frame.current.stageIndex:null);
    const next=newRun(seed.current++,targetStage);
    if(Number.isInteger(targetStage))setSelectedWorld(targetStage);
    loadExpeditionArt(artRef.current,targetStage);
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
    let raf=0,last=0,lastIdleDraw=0,alive=true;
    const render=(ts)=>{
      if(!alive)return;
      const delta=last?Math.min((ts-last)/1000,.20):0;last=ts;
      if(!onscreen.current||document.hidden){raf=requestAnimationFrame(render);return;}
      // Pause screens do not need full-speed redraw. On low-frame-rate iPads
      // the simulation uses 45ms substeps to preserve collision/warning order,
      // but may advance up to 200ms of real time per actual rendered frame.
      if(modeRef.current!=="running"&&ts-lastIdleDraw<65){
        raf=requestAnimationFrame(render);return;
      }
      lastIdleDraw=ts;
      const s=frame.current;
      if(modeRef.current==="running"&&!document.hidden){
        const events=[];
        const steps=Math.max(1,Math.ceil(delta/.045));
        for(let i=0;i<steps&&s.running;i++){
          updateRun(s,delta/steps,pressed.current.up,pressed.current.down);
          events.push(...s.events);
        }
        for(const event of events){
           const cue=excavationNotice(event);
           if(cue){
             const activeNotice={...cue,until:s.time+cue.duration};
             noticeRef.current=activeNotice;setNotice(activeNotice);
           }
          if((event.type==="shatter"||event.type==="shutter-shatter")&&s.boostTime>0)s.tipBurstAt=s.time;
          if(event.type==="world-hazard-shatter"){
             particles.current.push({type:"break-v2",x:event.x,y:event.y,vx:0,vy:0,
               life:.56,max:.56,r:0,color:"#e9b46d"});
           }
           if(event.type==="shutter-shatter"){
            particles.current.push({type:"break-v2",x:event.x,y:event.y,vx:0,vy:0,
              life:.56,max:.56,r:0,color:"#ebb6f9"});
          }
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
          if(event.type==="boss-hit"||event.type==="boss-victory"){
            const count=event.type==="boss-victory"?38:15;
            for(let i=0;i<count;i++){
              const angle=i/count*Math.PI*2,v=80+Math.random()*210;
              particles.current.push({x:482,y:s.bossY||s.y,
                vx:Math.cos(angle)*v,vy:Math.sin(angle)*v-60,
                life:.6+Math.random()*.35,max:.95,r:2+Math.random()*3.5,
                color:i%3===0?"#fff1b0":i%3===1?"#f3b35a":"#f0d794"});
            }
            if(navigator.vibrate)navigator.vibrate(event.type==="boss-victory"?[40,30,40,30,70]:[24,16,24]);
          }
          if(["boss-warning","boss-vulnerable","boss-hit","boss-victory"].includes(event.type)
            &&ts-lastSound.current>95){
            playBossAudio(sound.current,event.type);lastSound.current=ts;
          }
          if(event.type==="hit"){
            if(navigator.vibrate)navigator.vibrate([34,20,34]);
          }
          if(["pickup","hit","break-wall","secret-found","shutter-shatter","objective-complete","world-hazard-shatter","world-objective-complete"].includes(event.type)&&ts-lastSound.current>95){
            playSound(sound.current,event.type==="hit"?"hit":
              (event.type==="break-wall"||event.type==="shutter-shatter"||event.type==="world-hazard-shatter")?"turbo":"pickup");lastSound.current=ts;
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
          if(s.result==="complete")window.dispatchEvent(
            new CustomEvent("rosieverse:music:scene",{detail:{scene:"tunnel",state:"victory",world:s.stageIndex}})
          );
           const stage=getExpeditionStage(s.stageIndex);
           if(stage){
             const earned=expeditionStarCount(s);
             if(earned>0)setStageStars(previous=>{
               const updated={...previous,[stage.id]:Math.max(previous[stage.id]||0,earned)};
               try{localStorage.setItem("rosieEmberFiveWorldStarsV1",JSON.stringify(updated))}catch{}
               return updated;
             });
           }
           const stars=s.stageIndex===null?excavationStars(s):0;
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
      const rect=el.getBoundingClientRect();
      // A 2.6MP retina canvas at tablet dimensions can starve RAF on WebKit.
      // Cap backing pixels without resizing the visible playfield or hitboxes.
      const area=Math.max(1,rect.width*rect.height);
      const dpr=Math.min(window.devicePixelRatio||1,2,Math.sqrt(1250000/area));
      const width=Math.max(1,Math.round(rect.width*dpr));
      const height=Math.max(1,Math.round(rect.height*dpr));
      if(el.width!==width)el.width=width;
      if(el.height!==height)el.height=height;
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
  const world=getExpeditionStage(hud.stageIndex);
  const route=world?EXPEDITION_STAGES.map(w=>({label:w.name,mission:w.objective})):PASSAGES;
  const title=mode==="ended" ?
    (hud.result==="complete"?(world?world.name.toUpperCase()+" COMPLETE":"THE DIG IS DONE"):
     hud.result==="boss-timeout"?"THE BOSS ESCAPED":"A VALIANT EXCAVATION") : "THE GREAT DIG";
  const subtitle=mode==="ended" ?
    (hud.result==="complete"?
      (hud.bossDefeated?"Rosie has conquered the depths and defeated the guardian.":"Rosie has excavated an entirely respectable amount of park.") :
     hud.result==="boss-timeout"?"The guardian still holds the chamber. Return and time your Turbo strikes.":"Rosie maintains the rocks were poorly positioned.") :
    "Because some dogs dig holes. Rosie digs civilizations.";
  const hold=(type,on,e)=>{
    if(e?.type==="pointerdown"){e.preventDefault();e.currentTarget.setPointerCapture?.(e.pointerId)}
    if(modeRef.current!=="running")return;
    pressed.current[type]=on;
  };
  const passageProgress=world?(hud.result==="complete"?100:Math.min(100,hud.time/hud.duration*100)):
    Math.min(100, ((hud.time-PASSAGES[hud.passage].start)/(PASSAGES[hud.passage].end-PASSAGES[hud.passage].start))*100);
  return (
    <section className="ember-suite" data-arcade-backdrop={arcadeBackdrops[arcadeBackdrop].id} aria-label="Captain Rosie Ember Tunnel Drill game">
      {showPrologue&&<EmberTunnelPrologue visible onComplete={completePrologue} soundOn={soundOn} />}
      <div className="ember-section-divider"><span>✦</span> ANOTHER CAPTAIN ROSIE ADVENTURE <span>✦</span></div>
      <header className="ember-header" aria-label="Captain Rosie - Ember Tunnel Drill">
        <img className="ember-header-full-art" src="/ember-drill/drill-header.webp"
             alt="Captain Rosie - Ember Tunnel Drill" draggable="false" />
      </header>
      <div className="ember-stats" aria-live="off">
        <div><small>SCORE</small><strong>{hud.score.toLocaleString()}</strong></div>
        <div><small>TIME</small><strong>{formatTime(hud.time,hud.duration)}</strong></div>
        <div><small>HULL</small><strong className="ember-hull">{Array.from({length:5},(_,n)=><i key={n} className={n<hud.hull?"intact":""}>●</i>)}</strong></div>
        <div><small>TREASURE</small><strong>{hud.gems+hud.bones+hud.cheese}</strong></div>
      </div>
      <div className={"ember-expedition"+(world?" is-world-route":"")} aria-label={`Excavation route: passage ${hud.passage+1} of ${route.length}`}>
        <span className="ember-route-label">{world?"WORLD PROGRESS":"EXCAVATION ROUTE"}</span>
        <div className="ember-route-track"><i style={{width:`${world?passageProgress:((hud.passage + passageProgress / 100) / route.length) * 100}%`}} /></div>
        {world?<span className="current">{hud.passage+1}. {world.name}</span>:
          route.map((passage,index)=><span key={passage.label} className={index < hud.passage ? "complete" : index === hud.passage ? "current" : ""}>{index+1}. {passage.label}</span>)}
        <div className="ember-passage-mission" aria-live="off"><span>PASSAGE OBJECTIVE</span>
          <strong>{route[hud.passage].mission}</strong>
          <em>{world?(hud.worldObjective?"COMPLETE":"IN PROGRESS"):(hud.passage===0?hud.objectives.barkroot:hud.objectives.ruby)?"COMPLETE":"IN PROGRESS"}</em>
        </div>
      </div>
      <div ref={stage} className={"ember-stage"+(active?" is-active":"")} data-world-warnings={hud.worldWarnings} data-boss-phase={hud.boss?.phase||"none"} data-stage-duration={hud.duration}
          data-hazard-art-loaded={world&&hud.stageIndex>=2
            ?(artRef.current["exp:"+({2:"gear-crusher",3:"lava-geyser",4:"royal-earth-burst"}[hud.stageIndex])]?.naturalWidth>0?"true":"false")
            :"n/a"}
          data-boss-art-loaded={hud.boss
            ?(artRef.current["exp:"+hud.boss.kind]?.naturalWidth>0?"true":"false")
            :"n/a"} >
        <div className="ember-course-plaque">
          {world&&<span className="ember-stage-marker" aria-hidden="true"
            style={{backgroundImage:`url(${EXPANSION_ROOT}atlases/world-markers-atlas.webp)`,
              backgroundPosition:`${(hud.stageIndex%3)*50}% ${Math.floor(hud.stageIndex/3)*100}%`}} />}
          <small>PASSAGE {hud.passage+1} OF {route.length}</small>
          <strong>{route[hud.passage].label}</strong>
        </div>
        <canvas ref={canvas} className="ember-canvas" width="690" height="820"
          role="img" aria-label="Rosie pilots her continuously moving drill through curving earth tunnels, collecting cheese, bones and gems while avoiding obstacles. Use the angle controls to steer." />
        {hud.boost>0&&<span className="ember-turbo-banner">BURROW TURBO!</span>}
        {hud.boss&&active&&<span className="ember-boss-accessible" role="status" aria-live="off">
          {hud.boss.kind==="mole-king"?"Mole King":hud.boss.kind==="copperjack"?"Copperjack":"Cinderclaw"}: {hud.boss.health} of {hud.boss.maxHealth} health,
          {hud.boss.phase==="recovery"?" vulnerable to Turbo":hud.boss.phase==="warning"?" attack incoming":hud.boss.phase==="active"?" attacking":" defeated"}
        </span>}
         {active&&hud.time<4.5&&!notice&&<div className="ember-dig-hint">GUIDE THE AUGER INTO WEAK EARTH · TURBO BREAKS CRYSTAL</div>}
         {active&&notice&&<div className={"ember-dig-notice is-"+notice.kind+(notice.placement==="bottom"?" near-bottom":"")} role="status" aria-live="polite">
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
             {mode==="ended"&&world&&hud.result==="complete"&&hud.stageIndex<EXPEDITION_STAGES.length-1&&
               <button className="ember-expedition-next" type="button"
                 onClick={()=>start(hud.stageIndex+1)}>
                 CONTINUE TO {EXPEDITION_STAGES[hud.stageIndex+1].name.toUpperCase()}
               </button>}
             {mode==="ended"&&<div className="ember-expedition-medals" aria-label={(world?expeditionStarCount(hud):excavationStars(hud))+" of 3 expedition stars earned"}>
               <span aria-hidden="true">{[0,1,2].map(n=><i key={n} className={n<(world?expeditionStarCount(hud):excavationStars(hud))?"earned":""}>★</i>)}</span>
               <small>{world?(hud.stageIndex>=2?"DEFEAT BOSS · ≤1 DAMAGE · WORLD OBJECTIVE":"FINISH · ≤1 DAMAGE · WORLD OBJECTIVE"):"FINISH · 2 WALLS · ROYAL RELIC"}</small>
             </div>}
            {mode==="ended"&&!hud.boss&&(hud.relics>0||relicFound ?
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
              <span><b>{Number(hud.objectives.barkroot)+Number(hud.objectives.ruby)}/2</b> MISSIONS</span>
              <span><b>{hud.hazardsDodged}</b> CRYSTAL DODGES</span>
               {world&&<span><b>{hud.worldObjective?"COMPLETE":"MISSED"}</b> WORLD MISSION</span>}
              {hud.boss&&<span><b>{hud.bossDefeated?"DEFEATED":"UNDEFEATED"}</b> {hud.boss.kind==="mole-king"?"MOLE KING":hud.boss.kind==="copperjack"?"COPPERJACK":"CINDERCLAW"}</span>}
              <span><b>{hud.damageTaken===0?"UNSCATHED":hud.hull+"/5"}</b> {hud.damageTaken===0?"EXCAVATOR":"HULL REMAINING"}</span>
              {hud.cleanBonus>0&&<span><b>+{hud.cleanBonus}</b> CLEAN DIG</span>}
              <span><b>{best.toLocaleString()}</b> BEST</span>
            </div>}
            <div className="ember-expedition-pick" aria-label="Choose a world to playtest">
               <span className="ember-expedition-pick-heading">FIVE WORLD EXPEDITION · ALL LEVELS AVAILABLE FOR PLAYTESTING</span>
               <button className="ember-intro-replay" type="button" onClick={replayPrologue}>WATCH THE OPENING COMIC</button>
               <div className="ember-world-select">
                 {EXPEDITION_STAGES.map((w,i)=><button type="button" key={w.id}
                   className={"ember-world-choice"+(selectedWorld===i?" selected":"")}
                   onClick={()=>setSelectedWorld(i)}
                   aria-pressed={selectedWorld===i}
                   style={{backgroundImage:`linear-gradient(180deg,rgba(16,16,25,.25),rgba(16,13,23,.92)),url(${i>=2?EXPANSION_ROOT+Object.values(EMBER_EXPANSION_TRANSITIONS)[i-2]:"/ember-drill/"+w.art})`}}>
                   <strong>{i+1}. {w.name}</strong>
                   <small aria-label={(stageStars[w.id]||0)+" out of 3 stars"}>
                     {"★".repeat(stageStars[w.id]||0)}{"☆".repeat(3-(stageStars[w.id]||0))}
                   </small>
                 </button>)}
               </div>
               <button className="ember-expedition-launch" type="button" onClick={()=>start(selectedWorld)}>
                 PLAY {EXPEDITION_STAGES[selectedWorld].name.toUpperCase()} · {EXPEDITION_STAGES[selectedWorld].duration||15}s
               </button>
               <small>Worlds feature distinct hazards; Clockwork, Molten and Treasury feature boss fights; final character art remains in review.</small>
             </div>
             <button type="button" onClick={()=>start(null)}>{mode!=="ended"?"START DIGGING":world?"CLASSIC 75-SECOND DIG":"DIG AGAIN"}</button>
             {mode==="ended"&&world&&<button type="button" onClick={()=>start(hud.stageIndex)}>REPLAY THIS WORLD</button>}
            <small>Hold ▲ / ▼ to steer. Break earth with the drill; Turbo breaks crystal. Space ignites Turbo.</small>
          </div>}
      </div>
      <div className="ember-controls"
        onContextMenu={(event) => event.preventDefault()}
        onSelectStart={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}>
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
        <button className="ember-icon-action" type="button" onClick={()=>start(frame.current.stageIndex)} aria-label="Replay run" title="Replay run">↻</button>
        <span>Hold ▲ / ▼ to steer · Space for Turbo</span>
      </div>}
      <div className="ember-caption"><span>BONES {hud.bones}</span><span>CHEESE {hud.cheese}</span><span>GEMS {hud.gems}</span><span>WALLS {hud.wallsBroken}</span><span>SECRETS {hud.secrets}</span>{relicFound&&<span className="ember-best">ROYAL RELIC FOUND</span>}
        <span className="ember-best">BEST {best.toLocaleString()}</span><span className="ember-best">EXPEDITION {"★".repeat(bestStars)}{"☆".repeat(3-bestStars)}</span></div>
    </section>
  );
}
