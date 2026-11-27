import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DRILL_WIDTH, DRILL_HEIGHT, RUN_DURATION, TURBO_DURATION, newRun, triggerTurbo, updateRun } from "./emberDrillEngine.js";
import { paintDrill } from "./emberDrillPainter.js";
import { primeMechanicalAtlases } from "./emberAugerFX.js";
import { excavationNotice, excavationStars, bossPhaseNotice, bossStatusSuffix } from "./emberBreakableFeedback.js";
import {EXPEDITION_STAGES,EXPEDITION_STAGE_SECONDS,getExpeditionStage,expeditionStarCount,safeStoredExpeditionStars} from "./emberExpeditionStages.js";
import {EMBER_EXPANSION_ATLASES,EMBER_CHARACTER_ATLASES,EMBER_EXPANSION_TRANSITIONS,EXPANSION_ROOT,
  BATCH_D_ROOT,EMBER_BATCH_D_ATLASES,EMBER_BATCH_D_ARENAS,EMBER_BATCH_D_RIBBONS,EMBER_BATCH_D_GATES,
  EMBER_BATCH_D_MECHANISMS,EMBER_BATCH_D_PICKUP_BY_STAGE,EMBER_BATCH_D_ROCK_BY_STAGE,EMBER_BATCH_D_SPIKE_BY_STAGE} from "./emberExpansionCatalog.js";
import {getBossConfig, bossSecondsUntilVulnerable} from "./emberBossEncounter.js";
import {expeditionBossKind,bossDefeatReward} from "./emberExpeditionBossStage.js";
import "./ember-tunnel-drill.css";
import "./ember-console.css";
import AxisJoystick from "./AxisJoystick.jsx";
import CaptainPauseMenu from "./CaptainPauseMenu.jsx";
import {BOSS_VICTORY_REVEAL_DELAY_MS, WORLD_VICTORY_REVEAL_DELAY_MS, shouldHoldBossVictory, shouldHoldWorldVictory} from "./emberVictoryTiming.js";

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
// Batch-D loading: only the active kingdom's terrain, gates, pickups and
// relevant boss effects, with the existing art as fallback if a file is
// missing (the painters check artReady before drawing batch-D art).
// The previous kingdom's decoded textures are released on world change;
// the art bag is not reloaded on a retry of the same stage.
function loadBatchDArt(art,stageIndex){
  if(!Number.isInteger(stageIndex)||stageIndex<0||stageIndex>4)return;
  if(art["bd:stage"]===stageIndex)return;
  for(const key of Object.keys(art))if(key.startsWith("bd:"))delete art[key];
  art["bd:stage"]=stageIndex;
  const load=(key,relative)=>{
    if(!relative||art[key])return;
    const image=new Image();image.decoding="async";
    image.src=BATCH_D_ROOT+relative;art[key]=image;
  };
  const loadAtlas=(id)=>{
    if(!EMBER_BATCH_D_ATLASES[id])return;
    load("bd:"+id,EMBER_BATCH_D_ATLASES[id].file);
  };
  // Combat effects shared by all five worlds.
  for(const id of ["treasure-absorb","turbo-ready","turbo-exhaust","drill-impact"])loadAtlas(id);
  // Kingdom terrain, gates and pickup.
  const ribbons=EMBER_BATCH_D_RIBBONS[stageIndex];
  load("bd:ribbon-top",ribbons.ceiling);
  load("bd:ribbon-bottom",ribbons.floor);
  // 2026-11-25 remake: Barkroot's eight finished terrain-variant strips
  // rotate along the longer 30s route (loaded only for stage 0).
  if(stageIndex===0){
    for(const n of [2,3,4,5]){
      load("bd:ribbon-top-v"+n,"terrain-variants/barkroot-ceiling-0"+n+".webp");
      load("bd:ribbon-bottom-v"+n,"terrain-variants/barkroot-floor-0"+n+".webp");
    }
  }
  // 2026-11-25 remake hazards: the previously unused batch-D obstacle
  // sprites, wired to the new steam/mine/lava world hazards.
  if(stageIndex===2){
    load("bd:hazard-steam","gameplay/obstacles/steam-vent.webp");
    load("bd:hazard-mine","gameplay/obstacles/hanging-mine.webp");
  }
  if(stageIndex===3)load("bd:hazard-lava","gameplay/obstacles/lava-vent.webp");
  // Round 10: the Ruby crystal trap gets the batch-D ruby crystal spikes
  // sprite (real artwork, already the Ruby route-rock art) instead of the
  // procedural purple polygon \u2014 see emberExpeditionHazardPainter.
  if(stageIndex===1)load("bd:hazard-crystal","gameplay/obstacles/ruby-crystal-spikes.webp");
  const gates=EMBER_BATCH_D_GATES[stageIndex];
  if(gates.entrance.kind==="atlas")loadAtlas(gates.entrance.atlasId);
  else load("bd:gate-entrance",gates.entrance.file);
  load("bd:gate-exit",gates.exit.file);
  load("bd:pickup",EMBER_BATCH_D_PICKUP_BY_STAGE[stageIndex]);
  load("bd:rock",EMBER_BATCH_D_ROCK_BY_STAGE[stageIndex]);
  load("bd:spike",EMBER_BATCH_D_SPIKE_BY_STAGE[stageIndex]);
  // Boss arenas, attacks, mechanism and defeat effect for the guardian.
  const kind=expeditionBossKind(stageIndex);
  if(kind){
    load("bd:arena",EMBER_BATCH_D_ARENAS[kind].file);
    for(const attack of getBossConfig(kind).attacks)loadAtlas(attack.id);
    const defeatId=kind==="mole-king"?"defeat-moleking":"defeat-"+kind;
    loadAtlas(defeatId);
    const mechanism=EMBER_BATCH_D_MECHANISMS[kind];
    loadAtlas(mechanism.release);
    load("bd:mechanism-closed",mechanism.closed);
    load("bd:mechanism-depleted",mechanism.depleted);
  }
}
// Duration in seconds of a one-shot batch-D combat effect, from its atlas
// metadata. Used to size the fx particle that carries the effect.
const batchDEffectSeconds=(id)=>{
  const a=EMBER_BATCH_D_ATLASES[id];
  if(!a)return 0.5;
  const ms=Array.isArray(a.frameDurationsMs)
    ?a.frameDurationsMs.reduce((sum,n)=>sum+n,0)
    :a.frames*(a.frameDurationMs||0);
  return Math.max(0.05,ms/1000);
};
const batchDEffectReady=(art,id)=>{
  const img=art["bd:"+id];
  return Boolean(img?.complete&&img.naturalWidth>0);
};
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
  scenicBarkrootDeep:"scenic-barkroot-deep.webp",
  scenicRubyGallery:"scenic-ruby-gallery.webp",
  scenicLantern:"scenic-lantern.webp",
  scenicRoots:"scenic-roots.webp",
  scenicCrystal:"scenic-crystal.webp",
  scenicTemple:"scenic-temple.webp",
  scenicClockwork:"scenic-clockwork.webp",
  scenicClockworkDeep:"scenic-clockwork-deep.webp",
  scenicMolten:"scenic-molten.webp",
  scenicMoltenDeep:"scenic-molten-deep.webp",
  scenicTreasury:"scenic-treasury.webp",
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
      phase:s.boss.phase,attack:s.boss.attack,defeated:s.boss.defeated,
      hitThisRecovery:!!s.boss.hitThisRecovery,
      timeLeft:s.bossTimeLeft??null}:null,
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
const TUNNEL_OPENING_VIDEO="/ember-drill/rosie-tunnel-opening.mp4";
const TUNNEL_OPENING_SEEN="rosieTunnelOpeningSeen20261123V2";
export default function EmberTunnelDrill({ soundOn=true, requestGameFullscreen, exitGameFullscreen }) {
  const gamepadRoot=useRef(null),gamepadHandler=useRef(null),gamepadPitch=useRef(0);
  const [victoryTarget,setVictoryTarget]=useState(null);
  useEffect(()=>{setVictoryTarget(gamepadRoot.current?.closest(".captain-fullscreen-frame")||document.body);},[]);
  const [steerMode,setSteerMode]=useState(()=>{try{return localStorage.getItem("emberSteeringMode")==="joystick"?"joystick":"buttons"}catch{return "buttons"}});
  const toggleSteerMode=()=>{resetHold();setSteerMode(current=>{const next=current==="joystick"?"buttons":"joystick";try{localStorage.setItem("emberSteeringMode",next)}catch{}return next})};
  const canvas=useRef(null),stage=useRef(null),frame=useRef(newRun()),pressed=useRef({up:false,down:false}),
        artRef=useRef({}),onscreen=useRef(false),
        modeRef=useRef("idle"),sound=useRef(null),lastSound=useRef(0),lastUi=useRef(0),portrait=useRef(null),
        particles=useRef([]),seed=useRef(1467),noticeRef=useRef(null),bossVictoryTimer=useRef(null);
  const turboTapAt=useRef(0);
  const [mode,setMode]=useState("idle");
  const introVideoRef=useRef(null);
  const introExitTimer=useRef(null);
  const [introOpen,setIntroOpen]=useState(()=>{
    try{return localStorage.getItem(TUNNEL_OPENING_SEEN)!=="1"}catch{return true}
  });
  // ready: held final title before playback; playing: one complete run;
  // finished: held final title until another tap; leaving: fade into Barkroot.
  const [introPhase,setIntroPhase]=useState("ready");
  const [introFrameReady,setIntroFrameReady]=useState(false);
  const [introError,setIntroError]=useState(false);
  function closeOpening(){
    window.clearTimeout(introExitTimer.current);
    introExitTimer.current=null;
    const video=introVideoRef.current;
    if(video){video.pause();video.currentTime=0;}
    setIntroOpen(false);setIntroPhase("ready");setIntroFrameReady(false);
    window.dispatchEvent(new CustomEvent("rosieverse:music:cinematic",{detail:{active:false}}));
    try{localStorage.setItem(TUNNEL_OPENING_SEEN,"1")}catch{}
  }
  function openOpening(){
    if(modeRef.current!=="idle"&&modeRef.current!=="ended")return;
    // Launching the film takes the game fullscreen, like starting a run
    // (Mitchell, 2026-11-26).
    requestGameFullscreen?.();
    setIntroError(false);setIntroFrameReady(false);
    setIntroPhase("ready");setIntroOpen(true);
  }
  function holdOpeningTitle(){
    const video=introVideoRef.current;
    if(!video||!Number.isFinite(video.duration)||video.duration<=0)return;
    // The final approved title is held over the last full second of the film.
    // Seeking to this point displays the exact still, without an inaccurate poster.
    video.currentTime=Math.max(0,video.duration-1.2);
  }
  function playOpening(){
    const video=introVideoRef.current;
    if(!video||introPhase!=="ready"||introError)return;
    requestGameFullscreen?.();
    setIntroPhase("playing");
    setIntroFrameReady(true);
    video.pause();
    video.currentTime=0;
    const promise=video.play();
    promise?.catch?.(()=>{
      setIntroPhase("ready");
      holdOpeningTitle();
      window.dispatchEvent(new CustomEvent("rosieverse:music:cinematic",{detail:{active:false}}));
    });
  }
  function finishOpening(){
    if(introPhase==="leaving"||introExitTimer.current)return;
    const video=introVideoRef.current;
    video?.pause();
    // Start the FIRST world immediately behind the fading title, not the menu.
    setIntroPhase("leaving");
    start(0,{preserveOpening:true});
    introExitTimer.current=window.setTimeout(()=>{
      introExitTimer.current=null;
      closeOpening();
    },650);
  }
  useEffect(()=>()=>window.clearTimeout(introExitTimer.current),[]);
  useEffect(()=>{
    if(!introOpen)return;
    const onKey=(event)=>{
      if(event.key==="Escape"&&introPhase!=="leaving"){
        event.preventDefault();finishOpening();
      }
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[introOpen,introPhase]);

  const [notice,setNotice]=useState(null);
  const [victoryMore,setVictoryMore]=useState(false);
  const [selectedWorld,setSelectedWorld]=useState(0);
  useEffect(()=>{
    if(mode==="idle")return;
    if(mode==="victory-hold")return;
    const state=mode==="running"?(frame.current.boss&&!frame.current.bossDefeated?"boss":"playing"):mode==="paused"?"paused":"ended";
    window.dispatchEvent(new CustomEvent("rosieverse:music:scene",{
      detail:{scene:"tunnel",state,world:frame.current.stageIndex}
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
  // Per-world bests: the old single expedition best showed another world's
  // score on this world's report. Stored alongside the legacy key, which
  // Classic runs still use.
  const [bestByWorld,setBestByWorld]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("rosieEmberDrillBestByWorld")||"{}")||{}}catch{return {}}
  });
  const bestByWorldRef=useRef(bestByWorld);
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
  function start(requestedStage=undefined,options={}) {
    if(introOpen&&!options.preserveOpening)closeOpening();
    // Mitchell's rule (2026-11-25): every game goes fullscreen when played.
    requestGameFullscreen?.();
    window.clearTimeout(bossVictoryTimer.current);
    bossVictoryTimer.current=null;
    const targetStage=Number.isInteger(requestedStage)?requestedStage:
      requestedStage===null?null:(modeRef.current==="ended"?frame.current.stageIndex:null);
    const next=newRun(seed.current++,targetStage);
    if(Number.isInteger(targetStage))setSelectedWorld(targetStage);
    loadExpeditionArt(artRef.current,targetStage);
    loadBatchDArt(artRef.current,targetStage);
    frame.current=next;particles.current=[];
    noticeRef.current=null;setNotice(null);setVictoryMore(false);
    pressed.current.up=false;pressed.current.down=false;
    modeRef.current="running";setMode("running");setHud(snapshot(next));
    playSound(audio(),"start");
    // No window scroll on launch (Mitchell, 2026-11-26): games auto-start
    // fullscreen, and the old scrollTo shoved the Captain page upward
    // behind the fullscreen frame on iPhone, stranding the player.
  }
  function turbo() {
    const s=frame.current;
    const bossHealthBefore=s.boss?.health;
    const hullBefore=s.hull;
    if(triggerTurbo(s)){
      s.tipBurstAt=s.time; // Event-driven eight-frame ignition; cosmetic only.
      setHud(snapshot(s));playSound(audio(),"turbo");
      if(navigator.vibrate)navigator.vibrate(25);
      // A click-time strike lands inside triggerTurbo, before the next
      // updateRun — its boss-hit event would be wiped by updateRun's event
      // reset, so the hit feedback is given here directly.
      if(s.boss&&bossHealthBefore!=null&&s.boss.health<bossHealthBefore){
        const kind=s.boss.defeated?"boss-victory":"boss-hit";
        const cue=excavationNotice(s.boss.defeated
          ?{type:"boss-victory",boss:s.boss.kind,points:bossDefeatReward(s.boss.kind)}
          :{type:"boss-hit",boss:s.boss.kind,health:s.boss.health,healed:s.hull>hullBefore},s.charge);
        if(cue){const active={...cue,until:s.time+cue.duration,eventType:kind,phase:s.boss?.phase};noticeRef.current=active;setNotice(active);}
        playBossAudio(audio(),kind);
        if(navigator.vibrate)navigator.vibrate(kind==="boss-victory"?[40,30,40,30,70]:[24,16,24]);
      }
    } else if(s.running){
      // A refused Turbo press must ALWAYS say why, in a boss fight AND
      // in Classic: the old code only announced boss refusals, and the
      // TURBO button was disabled below 100 charge, so a mouse click on
      // it during BOSS VULNERABLE with charge <100 fired no event at
      // all — no hit, no TOO EARLY, charge kept (the round-4 dead
      // click). Space bypassed the disabled button, so keyboard players
      // got the refusal while mouse players got silence. The button is
      // now enabled whenever the game is running, so every click reaches
      // here and gets an answer.
      let cueType;
      if(s.boss&&!s.boss.defeated){
        cueType="boss-strike-early";
        if(s.boostTime>0)cueType="boss-turbo-active";
        else if(s.boss.phase==="recovery"&&s.boss.hitThisRecovery)cueType="boss-struck";
        else if(s.charge<100)cueType="boss-turbo-charging";
      }else{
        cueType=s.boostTime>0?"turbo-active":"turbo-charging";
      }
      const cue=excavationNotice({type:cueType},s.charge);
      if(cue){
        // TOO EARLY must not outlive the phase that caused it: cap its
        // duration at the time until the next vulnerable window opens,
        // so the banner flips to BOSS VULNERABLE the moment recovery
        // starts instead of contradicting the status line.
        const duration=cueType==="boss-strike-early"
          ?Math.min(cue.duration,bossSecondsUntilVulnerable(s.boss))
          :cue.duration;
        const active={...cue,until:s.time+Math.max(0.5,duration),eventType:cueType,phase:s.boss?.phase};
        noticeRef.current=active;setNotice(active);
      }
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
  function returnToLevelMenu(keepFullscreen = false) {
    window.clearTimeout(bossVictoryTimer.current);
    bossVictoryTimer.current=null;
    resetHold();
    const worldIndex=frame.current.stageIndex;
    if(Number.isInteger(worldIndex))setSelectedWorld(worldIndex);
    modeRef.current="idle";
    setMode("idle");
    noticeRef.current=null;
    setNotice(null);
    window.dispatchEvent(new CustomEvent("rosieverse:music:scene",{
      detail:{scene:"tunnel",state:"menu",world:worldIndex}
    }));
    if (keepFullscreen !== true) exitGameFullscreen?.();
  }
  function resetHold(){pressed.current.up=false;pressed.current.down=false;gamepadPitch.current=0}
  useEffect(()=>()=>window.clearTimeout(bossVictoryTimer.current),[]);
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
      const key=e.key.toLowerCase();
      if(!["arrowup","arrowdown","w","s"," "].includes(key))return;
      // Space/arrows must never scroll the page while the Tunnel game is
      // the game on screen: the key target is inside the stage, or the
      // page has Tunnel as the focused game and focus is on the page
      // itself. Interactive elements keep their own keys, so a focused
      // button still activates on Space. This covers running AND paused
      // (Space resumes from pause); the old handler returned before
      // preventDefault whenever the mode was not "running", so a Space
      // press at the edge of a run scrolled the page to Cosmic Odyssey
      // instead of igniting Turbo.
      const target=e.target;
      const interactive=target&&target.closest&&target.closest("button,input,select,textarea,a,[contenteditable]");
      const editable=target&&target.closest&&target.closest("input,textarea,select,[contenteditable]");
      if(editable)return;
      const inStage=stage.current&&target&&stage.current.contains(target);
      const focusedTunnel=document.querySelector(".captain-arcade-page-background")?.dataset.focusedGame==="tunnel";
      const bodyTarget=!target||target===document.body||target===document.documentElement;
      // Round 10 (Mitchell): Turbo must work WHILE steering. The old
      // handler returned early whenever the event target was ANY
      // interactive element \u2014 so after a tap/click on a steer, Turbo or
      // pause button (which leaves focus on that button), holding an
      // arrow key and pressing Space did nothing at all: direction and
      // Turbo could never combine. Direction keys are now captured
      // whenever Tunnel is the game in scope, regardless of which
      // button holds focus; only Space defers to a focused button
      // OUTSIDE the stage (that button's own activation \u2014 e.g. the
      // TURBO button itself \u2014 is then the Turbo press anyway).
      // Fullscreen is unambiguous: when THIS frame is the expanded one,
      // Tunnel is the game in scope whatever the page backdrop's
      // focused-game heuristic says (it can lag on "yacht" when several
      // frames measure distance 0). Without this, auto-fullscreen +
      // keyboard did nothing until the canvas was clicked.
      const frameExpanded=Boolean(gamepadRoot.current?.closest(".captain-fullscreen-frame.is-expanded"));
      if(!(inStage||frameExpanded||(focusedTunnel&&(bodyTarget||interactive))))return;
      if(key==="arrowup"||key==="arrowdown"||key==="w"||key==="s"){
        e.preventDefault();
        if(modeRef.current!=="running")return;
        if(key==="arrowup"||key==="w")pressed.current.up=e.type==="keydown";
        if(key==="arrowdown"||key==="s")pressed.current.down=e.type==="keydown";
        return;
      }
      // Space is also ours when one of the game's OWN control buttons
      // holds focus (steer/boost/pause inside this suite): the player
      // steers with one hand and fires Turbo with Space without the
      // press being swallowed as that button's click. Buttons elsewhere
      // on the page keep their own Space activation.
      const inGameControls=gamepadRoot.current&&target&&gamepadRoot.current.contains(target);
      if(interactive&&!inStage&&!inGameControls)return;
      e.preventDefault();
      if(modeRef.current==="paused"&&key===" "&&e.type==="keydown"&&!e.repeat){togglePause();return;}
      if(modeRef.current!=="running")return;
      if(key===" "&&e.type==="keydown"&&!e.repeat)turbo();
    };
    const onBlur=()=>resetHold();
    document.addEventListener("keydown",onKeys);
    document.addEventListener("keyup",onKeys);
    window.addEventListener("blur",onBlur);
    let raf=0,last=0,lastIdleDraw=0,alive=true;
    const render=(ts)=>{
      if(!alive)return;
      // Defense in depth (tidy round): a throw anywhere in a frame must
      // never silently kill the loop — the Molten reload soft-lock was a
      // painter TypeError skipping the only rAF reschedule. The finally
      // below is the loop's single reschedule point; the error itself
      // still propagates so it stays visible in the console.
      try{
      const delta=last?Math.min((ts-last)/1000,.20):0;last=ts;
      if(!onscreen.current||document.hidden)return;
      // Pause screens do not need full-speed redraw. On low-frame-rate iPads
      // the simulation uses 45ms substeps to preserve collision/warning order,
      // but may advance up to 200ms of real time per actual rendered frame.
      if(modeRef.current!=="running"&&ts-lastIdleDraw<65)return;
      lastIdleDraw=ts;
      const s=frame.current;
      if(modeRef.current==="running"&&!document.hidden){
        const events=[];
        const hadBoss=Boolean(s.boss);
        const steps=Math.max(1,Math.ceil(delta/.045));
        for(let i=0;i<steps&&s.running;i++){
          updateRun(s,delta/steps,pressed.current.up||gamepadPitch.current<0,pressed.current.down||gamepadPitch.current>0);
          events.push(...s.events);
        }
        if(!hadBoss&&s.boss&&!s.ended){
          window.dispatchEvent(new CustomEvent("rosieverse:music:scene",{
            detail:{scene:"tunnel",state:"boss",world:s.stageIndex}
          }));
        }
        for(const event of events){
           const cue=excavationNotice(event,s.charge);
           if(cue){
             // The spawn and first-warning cues arrive in the same batch;
             // letting the warning replace the spawn notice hides the hull
             // patch line before a single frame paints. Hold the spawn
             // notice for its duration; later warnings show normally.
             const spawnShowing=noticeRef.current?.eventType==="boss-spawn"
               &&s.time<noticeRef.current.until;
             if(!(event.type==="boss-warning"&&spawnShowing)){
               const activeNotice={...cue,until:s.time+cue.duration,eventType:event.type,phase:s.boss?.phase};
               noticeRef.current=activeNotice;setNotice(activeNotice);
             }
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
          if(event.type==="pickup"||event.type==="boss-reward"){
            // One visual per trigger: the treasure-absorb atlas when loaded,
            // the small particle burst as fallback.
            const absorbId="treasure-absorb";
            if(batchDEffectReady(artRef.current,absorbId)){
              const life=batchDEffectSeconds(absorbId);
              particles.current.push({type:"fx-"+absorbId,x:event.x,y:event.y,vx:0,vy:0,
                life,max:life,r:0,color:"#ffd182"});
            }else{
              const color=event.kind==="gem"?"#fb537a":event.kind==="cheese"?"#ffe68c":"#ffd182";
              for(let i=0;i<11;i++){
                const angle=(i/11)*Math.PI*2;
                const v=60+Math.random()*130;
                particles.current.push({x:event.x,y:event.y,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v,
                  life:.42+Math.random()*.24,max:.66,r:2+Math.random()*3,color});
              }
            }
          }
          if(event.type==="shatter"){
            const color="#ffd182";
            for(let i=0;i<11;i++){
              const angle=(i/11)*Math.PI*2;
              const v=60+Math.random()*130;
              particles.current.push({x:event.x,y:event.y,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v,
                life:.42+Math.random()*.24,max:.66,r:2+Math.random()*3,color});
            }
          }
          if(event.type==="boss-hit"||event.type==="boss-victory"){
            // One visual per trigger: the drill-impact / defeat atlas when
            // loaded, the gold particle burst as fallback.
            const fxId=event.type==="boss-victory"
              ?(s.boss?.kind==="mole-king"?"defeat-moleking":"defeat-"+(s.boss?.kind||"copperjack"))
              :"drill-impact";
            if(batchDEffectReady(artRef.current,fxId)){
              const life=batchDEffectSeconds(fxId);
              particles.current.push({type:"fx-"+fxId,x:482,y:s.bossY||s.y,vx:0,vy:0,
                life,max:life,r:0,color:"#fff1b0"});
            }else{
              const count=event.type==="boss-victory"?38:15;
              for(let i=0;i<count;i++){
                const angle=i/count*Math.PI*2,v=80+Math.random()*210;
                particles.current.push({x:482,y:s.bossY||s.y,
                  vx:Math.cos(angle)*v,vy:Math.sin(angle)*v-60,
                  life:event.type==="boss-victory"?1.6+Math.random()*.9:.6+Math.random()*.35,
                  max:event.type==="boss-victory"?2.5:.95,r:2+Math.random()*3.5,
                  color:i%3===0?"#fff1b0":i%3===1?"#f3b35a":"#f0d794"});
              }
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
          // Boss fields (health/phase/charge) change only on boss events,
          // so refresh the HUD snapshot on each one: the 115ms throttle
          // below would otherwise leave the status line a whole tick
          // behind the canvas bars after a hit (bars 0/3, status 1/3).
          if(event.type.startsWith("boss-"))setHud(snapshot(s));
        }
        // Boss telegraph, single source of truth: the banner is derived
        // from the LIVE boss phase every frame, like the status line.
        // Event notices (spawn, hit, victory, refusals) are transients
        // that override it while fresh; the phase banner re-asserts
        // itself the moment they lapse, so the banner can never
        // contradict the live phase. A transient is also capped to the
        // phase it was stamped in (its `phase`, set where it was
        // created): a 2.4s spawn notice used to block the phase banner
        // through the whole first warning + active and into recovery,
        // and a 1.5s refusal could outlive a 1.3s recovery into the
        // next warning — the DOM pair lagging the live phase by a full
        // phase, exactly the round-6 banner/status disagreement.
        const bossPhase=bossPhaseNotice(s.boss,s.charge);
        const currentNotice=noticeRef.current;
        const transientTypes=["boss-spawn","boss-hit","boss-victory","boss-strike-early","boss-turbo-charging","boss-struck","boss-turbo-active","turbo-charging","turbo-active"];
        const transientFresh=currentNotice&&transientTypes.includes(currentNotice.eventType)&&s.time<currentNotice.until
          &&(currentNotice.phase===undefined||currentNotice.phase===s.boss?.phase);
        if(bossPhase){
          if(!transientFresh){
            if(!currentNotice||currentNotice.eventType!=="boss-phase"||currentNotice.title!==bossPhase.title||currentNotice.detail!==bossPhase.detail){
              const active={...bossPhase,until:s.time+0.5,eventType:"boss-phase"};
              noticeRef.current=active;setNotice(active);
            }else if(s.time+0.15>=currentNotice.until){
              // Same phase banner: extend it with a NEW object so React
              // commits the extension (the old in-place mutation never
              // rendered). Throttled to the last 0.15s of its life, so
              // this re-renders ~2x/s instead of 60x/s.
              const extended={...currentNotice,until:s.time+0.5};
              noticeRef.current=extended;setNotice(extended);
            }
          }
        }else if(currentNotice&&currentNotice.eventType==="boss-phase"){
          noticeRef.current=null;setNotice(null);setVictoryMore(false);
        }
        if(noticeRef.current&&s.time>=noticeRef.current.until){
           noticeRef.current=null;setNotice(null);setVictoryMore(false);
         }
         if(ts-lastUi.current>115){
          lastUi.current=ts;setHud(snapshot(s));
        }
        if(s.ended){
          // Keep the canvas visible briefly after a world completion —
          // boss defeat sparks for 2.5s, the finished tunnel and exit
          // gate for 1.4s — before the victory presentation mounts.
          const defeatedBoss=shouldHoldBossVictory(s);
          const worldVictory=!defeatedBoss&&shouldHoldWorldVictory(s);
          if(defeatedBoss||worldVictory){
            modeRef.current="victory-hold";
            setMode("victory-hold");
            window.clearTimeout(bossVictoryTimer.current);
            bossVictoryTimer.current=window.setTimeout(()=>{
              if(modeRef.current==="victory-hold"){
                modeRef.current="ended";
                setMode("ended");
              }
              bossVictoryTimer.current=null;
            },defeatedBoss?BOSS_VICTORY_REVEAL_DELAY_MS:WORLD_VICTORY_REVEAL_DELAY_MS);
          }else{
            modeRef.current="ended";
            setMode("ended");
          }
          setHud(snapshot(s));
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
          if(stage&&s.score>(bestByWorldRef.current[stage.id]||0)){
            const updated={...bestByWorldRef.current,[stage.id]:s.score};
            bestByWorldRef.current=updated;setBestByWorld(updated);
            try{localStorage.setItem("rosieEmberDrillBestByWorld",JSON.stringify(updated))}catch(_){}
          }
          resetHold();
        }
      }
      particles.current=particles.current.filter(p=>p.life>0);
      for(const p of particles.current) {
        p.x+=p.vx*delta;p.y+=p.vy*delta;
        // Atlas-effect particles are stationary overlays; gravity applies
        // only to the loose particle bursts.
        if(!p.type?.startsWith("fx-"))p.vy+=110*delta;
        p.life-=delta;
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
      }finally{
        if(alive)raf=requestAnimationFrame(render);
      }
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
      window.clearTimeout(bossVictoryTimer.current);
      document.removeEventListener("keydown",onKeys);document.removeEventListener("keyup",onKeys);
      window.removeEventListener("blur",onBlur);sound.current?.close?.();
    };
  },[soundOn]);
  const active=mode==="running";
  const paused=mode==="paused";
  const world=getExpeditionStage(hud.stageIndex);
  // The report and caption show the best for THIS world, or the live score
  // once it passes it — never another world's score.
  const displayBest=world
    ?Math.max(bestByWorld[world.id]||0,hud.score)
    :Math.max(best,hud.score);
  // Expedition total: the stored per-world stars summed (max 15). The report
  // footer used to show this run's stars only, so a failed run read "0 of 3"
  // despite stars earned in other worlds.
  const expeditionTotalStars=EXPEDITION_STAGES.reduce((sum,w)=>sum+(stageStars[w.id]||0),0);
  const route=world?EXPEDITION_STAGES.map(w=>({label:w.name,mission:w.objective})):PASSAGES;
  const isVictory=mode==="ended"&&Boolean(world)&&hud.result==="complete";
  const title=mode==="ended" ?
    (hud.result==="complete"?(world?world.name.toUpperCase()+" COMPLETE":"THE DIG IS DONE"):
     hud.result==="boss-timeout"?"THE BOSS ESCAPED":
     hud.result==="hull"?"THE DRILL IS DOWN":"A VALIANT EXCAVATION") : "THE GREAT DIG";
  const subtitle=mode==="ended" ?
    (hud.result==="complete"?
      (hud.bossDefeated?"Rosie has conquered the depths and defeated the guardian.":"Rosie has excavated an entirely respectable amount of treasure.") :
     hud.result==="boss-timeout"?"The guardian still holds the chamber. Return and time your Turbo strikes.":
     hud.result==="hull"?"The hull is gone — the drill took too many hits. Patch her up and dig again.":
     "Rosie maintains the rocks were poorly positioned.") :
    "Because some dogs dig holes. Rosie digs civilizations.";
  const hold=(type,on,e)=>{
    if(e?.type==="pointerdown"){e.preventDefault();e.currentTarget.setPointerCapture?.(e.pointerId)}
    if(modeRef.current!=="running")return;
    pressed.current[type]=on;
  };
  const passageProgress=world?(hud.result==="complete"?100:Math.min(100,hud.time/hud.duration*100)):
    Math.min(100, ((hud.time-PASSAGES[hud.passage].start)/(PASSAGES[hud.passage].end-PASSAGES[hud.passage].start))*100);
  gamepadHandler.current=({pressed,x,y,previous})=>{
    const step=x&&x!==previous?.x?x:y&&y!==previous?.y?y:0;
    if(introOpen){
      gamepadPitch.current=0;
      if(pressed.b){finishOpening();return;}
      if(pressed.a||pressed.start){if(introPhase==="ready"&&!introError)playOpening();else if(introPhase==="finished"||introError)finishOpening();}
      return;
    }
    const current=modeRef.current;
    if(current==="running"){
      if(pressed.start||pressed.x){togglePause();return;}
      gamepadPitch.current=y;
      if(pressed.a||pressed.rt)turbo();
      return;
    }
    gamepadPitch.current=0;
    if(current==="paused"){
      if(pressed.start||pressed.a)togglePause();
      else if(pressed.x)start(frame.current.stageIndex);
      else if(pressed.b)returnToLevelMenu();
      return;
    }
    if(current==="victory-hold")return;
    if(step)setSelectedWorld(i=>Math.max(0,Math.min(EXPEDITION_STAGES.length-1,i+step)));
    if(pressed.y){openOpening();return;}
    if(pressed.x&&current==="ended"){start(frame.current.stageIndex);return;}
    if(pressed.a||pressed.start){
      if(current==="ended"&&world&&hud.result==="complete"&&hud.stageIndex<EXPEDITION_STAGES.length-1)start(hud.stageIndex+1);
      else start(selectedWorld);
    }
  };
  useEffect(()=>window.RosieGamepad?.subscribe(gamepadRoot.current,frame=>gamepadHandler.current?.(frame),()=>{gamepadPitch.current=0;}),[]);
  // In idle mode the header counts down the selected world's run, not the
  // Classic 75s, so the header and the world's launch button agree.
  const headerTime=mode==="idle"?0:hud.time;
  const headerDuration=mode==="idle"
    ?(EXPEDITION_STAGES[selectedWorld].duration||EXPEDITION_STAGE_SECONDS)
    :hud.duration;
  const victoryPresentation=(<>
        {mode==="ended"&&world&&hud.result==="complete"&&
          <img className="ember-victory-backdrop" src={`/ember-drill/victory/victory-${world.id}.webp`}
            alt={`${world.name} complete — Rosie celebrates in ${world.name}`} draggable="false" />}
        {mode!=="running"&&mode!=="paused"&&mode!=="victory-hold"&&
          <div className={"ember-start-overlay"+(mode==="ended"?" is-ended":"")+(mode==="ended"&&world&&hud.result==="complete"?" is-victory":"")}>
            {!isVictory&&<span className="ember-start-eyebrow">{mode==="ended"?"CAPTAIN'S EXCAVATION REPORT":"CAPTAIN ROSIE AWAITS HER ORDERS"}</span>}
            <h3>{title}</h3>
            {!isVictory&&<p>{subtitle}</p>}
            {isVictory&&<div className="ember-victory-summary">
              <span className="ember-victory-stars" aria-label={expeditionStarCount(hud)+" of 3 stars"}>
                {[0,1,2].map(n=><i key={n} className={n<expeditionStarCount(hud)?"earned":""}>★</i>)}
              </span>
              <span className="ember-victory-line">{hud.score.toLocaleString()} POINTS · {hud.distance.toLocaleString()}m · {hud.gems} GEMS</span>
            </div>}
            {isVictory&&<div className="ember-victory-actions">
              <button type="button" onClick={()=>start(hud.stageIndex)}>REPLAY</button>
              {hud.stageIndex<EXPEDITION_STAGES.length-1
                ?<button type="button" className="ember-expedition-next" onClick={()=>start(hud.stageIndex+1)}>NEXT WORLD ▸</button>
                :<button type="button" onClick={()=>start(null)}>CLASSIC DIG</button>}
              <button type="button" className="ember-victory-more" onClick={()=>setVictoryMore(v=>!v)}>{victoryMore?"HIDE DETAILS":"DETAILS & WORLDS"}</button>
            </div>}
{mode==="ended"&&(!isVictory||victoryMore)&&<div className="ember-results">
              <span><b>{hud.score.toLocaleString()}</b> POINTS</span>
              <span><b>{hud.distance.toLocaleString()}m</b> EXCAVATED</span>
              <span><b>{hud.gems}</b> GEMS</span>
              <span><b>{hud.boosts}</b> TURBOS</span>
              <span><b>{hud.shards+hud.wallsBroken}</b> ROCKS SHATTERED</span>
              <span><b>{hud.secrets}</b> SECRET CHAMBERS</span>
              <span><b>{hud.relics}</b> ROYAL RELICS</span>
              <span><b>{Number(hud.objectives.barkroot)+Number(hud.objectives.ruby)}/2</b> MISSIONS</span>
              <span><b>{hud.hazardsDodged}</b> CRYSTAL DODGES</span>
               {world&&<span className="ember-result-wide"><b>{hud.worldObjective?"COMPLETE":"MISSED"}</b> WORLD MISSION</span>}
              {hud.boss&&<span className="ember-result-wide"><b>{hud.bossDefeated?"DEFEATED":"UNDEFEATED"}</b> {hud.boss.kind==="mole-king"?"MOLE KING":hud.boss.kind==="copperjack"?"COPPERJACK":"CINDERCLAW"}</span>}
              <span><b>{hud.damageTaken===0?"UNSCATHED":hud.hull+"/5"}</b> {hud.damageTaken===0?"EXCAVATOR":"HULL REMAINING"}</span>
              {hud.cleanBonus>0&&<span><b>+{hud.cleanBonus}</b> CLEAN DIG</span>}
              <span><b>{displayBest.toLocaleString()}</b> BEST</span>
            </div>}
             {mode==="ended"&&(!isVictory||victoryMore)&&<div className="ember-expedition-medals" aria-label={(world?expeditionStarCount(hud):excavationStars(hud))+" of 3 stars this run; "+expeditionTotalStars+" of 15 expedition stars earned"}>
               <span aria-hidden="true">{[0,1,2].map(n=><i key={n} className={n<(world?expeditionStarCount(hud):excavationStars(hud))?"earned":""}>★</i>)}</span>
               <small>{world?(hud.stageIndex>=2?"DEFEAT BOSS · ≤1 DAMAGE · WORLD OBJECTIVE":"FINISH · ≤1 DAMAGE · WORLD OBJECTIVE"):"FINISH · 2 WALLS · ROYAL RELIC"}</small>
               <small>EXPEDITION TOTAL: {expeditionTotalStars} OF 15 STARS</small>
             </div>}
             {mode==="ended"&&world&&!isVictory&&<button type="button" onClick={()=>start(hud.stageIndex)}>REPLAY THIS WORLD</button>}
            {mode!=="ended"&&<button type="button" className="ember-watch-opening" onClick={openOpening}>WATCH OPENING FILM</button>}
             {mode==="ended"&&world&&hud.result==="complete"&&!isVictory&&hud.stageIndex<EXPEDITION_STAGES.length-1&&
               <button className="ember-expedition-next" type="button"
                 onClick={()=>start(hud.stageIndex+1)}>
                 CONTINUE TO {EXPEDITION_STAGES[hud.stageIndex+1].name.toUpperCase()}
               </button>}
            {mode==="ended"&&!hud.boss&&(!isVictory||victoryMore)&&(hud.relics>0||relicFound ?
              <img className="ember-relic-reveal" src="/ember-drill/breakables/v2/09-royal-bone-medallion.webp" alt="Rosie's Royal Bone Medallion, found in a secret chamber" /> :
              hud.result==="complete"&&<img className="ember-relic-reveal" src="/ember-drill/golden-bone.webp" alt="Rosie's Golden Bone relic" />)}
                        {(!isVictory||victoryMore)&&<div className="ember-expedition-pick" aria-label="Choose a world to play">
               <span className="ember-expedition-pick-heading">FIVE WORLD EXPEDITION · ALL LEVELS AVAILABLE</span>
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
               <small>Worlds feature distinct hazards; Clockwork, Molten and Treasury feature boss fights.</small>
             </div>}
             {!isVictory&&<button type="button" onClick={()=>start(null)}>{mode!=="ended"?"START CLASSIC DIG":world?"CLASSIC DIG · 75s":"DIG AGAIN"}</button>}
            {!isVictory&&<small>Hold ▲ / ▼ to steer. Break earth with the drill; Turbo breaks crystal. Space ignites Turbo.</small>}
          </div>}
  </>);
  return (
    <section ref={gamepadRoot} className={"ember-suite ember-console-upgrade"+(introOpen?" ember-cinematic-active":"")} data-arcade-backdrop={arcadeBackdrops[arcadeBackdrop].id} aria-label="Captain Rosie Ember Tunnel Drill game">
      <header className="ember-header" aria-label="Captain Rosie - Ember Tunnel Drill">
        <img className="ember-header-full-art" src="/ember-drill/drill-header.webp"
             alt="Captain Rosie - Ember Tunnel Drill" draggable="false" />
      </header>
      <div className="ember-stats" aria-live="off">
        <div><img className="ember-instrument-icon" src="/ember-drill/console-v2/score.webp" alt=""/><small>SCORE</small><strong>{hud.score.toLocaleString()}</strong></div>
        {hud.boss&&hud.boss.timeLeft!=null&&!hud.bossDefeated
          ?<div><img className="ember-instrument-icon" src="/ember-drill/console-v2/time.webp" alt=""/><small>BOSS TIME</small><strong>{Math.max(0,Math.ceil(hud.boss.timeLeft))+"s"}</strong></div>
          :<div><img className="ember-instrument-icon" src="/ember-drill/console-v2/time.webp" alt=""/><small>TIME</small><strong>{formatTime(headerTime,headerDuration)}</strong></div>}
        <div><img className="ember-instrument-icon" src="/ember-drill/console-v2/hull.webp" alt=""/><small>HULL</small><strong className="ember-hull" aria-label={`${hud.hull} of 5 hull remaining`}>{hud.hull}<small className="ember-hull-total">/5</small><span className="ember-hull-segments" aria-hidden="true">{Array.from({length:5},(_,n)=><i key={n} className={n<hud.hull?"intact":""}/>)}</span></strong></div>
        <div><img className="ember-instrument-icon" src="/ember-drill/console-v2/treasure.webp" alt=""/><small>TREASURE</small><strong>{hud.gems+hud.bones+hud.cheese}</strong></div>
      </div>
      <div className={"ember-expedition"+(world?" is-world-route":"")} aria-label={`Excavation route: passage ${hud.passage+1} of ${route.length}`}>
        <div className="ember-console-route-art" aria-hidden="true" style={{backgroundImage:`url(${world ? (hud.stageIndex>=2 ? EXPANSION_ROOT+Object.values(EMBER_EXPANSION_TRANSITIONS)[hud.stageIndex-2] : "/ember-drill/"+world.art) : "/ember-drill/temple-organic-passage.webp"})`}} />
        <span className="ember-route-label">{world?"WORLD PROGRESS":"EXCAVATION ROUTE"}</span>
        <div className="ember-route-track"><i style={{width:`${world?passageProgress:((hud.passage + passageProgress / 100) / route.length) * 100}%`}} /></div>
        {world?<span className="current">{hud.passage+1}. {world.name}</span>:
          route.map((passage,index)=><span key={passage.label} className={index < hud.passage ? "complete" : index === hud.passage ? "current" : ""}>{index+1}. {passage.label}</span>)}
        <div className="ember-passage-mission" aria-live="off"><span>PASSAGE OBJECTIVE</span>
          <strong>{route[hud.passage].mission}</strong>
          <em>{world?(hud.worldObjective?"COMPLETE":"IN PROGRESS"):(hud.passage===0?hud.objectives.barkroot:hud.objectives.ruby)?"COMPLETE":"IN PROGRESS"}</em>
        </div>
        <button className="ember-stick-toggle" type="button" onClick={toggleSteerMode}
          aria-label={steerMode==="joystick"?"Use arrow controls":"Use joystick"}
          title={steerMode==="joystick"?"Arrow controls":"Joystick"}>{steerMode==="joystick"?"ARROWS":"JOYSTICK"}</button>
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
        {hud.boss&&(active||mode==="victory-hold")&&<span className="ember-boss-accessible" role="status" aria-live="off">
          {hud.boss.kind==="mole-king"?"Mole King":hud.boss.kind==="copperjack"?"Copperjack":"Cinderclaw"}: {hud.boss.health} of {hud.boss.maxHealth} health,
          {bossStatusSuffix(hud.boss,hud.charge,notice)}
        </span>}
         {active&&hud.time<4.5&&!notice&&<div className="ember-dig-hint">TURBO BREAKS CRYSTAL</div>}
         {active&&notice&&<div className={"ember-dig-notice is-"+notice.kind+(notice.quiet?" is-quiet":"")+(notice.placement==="bottom"?" near-bottom":"")} role="status" aria-live="polite">
           {notice.kind==="relic"&&<img src="/ember-drill/breakables/v2/09-royal-bone-medallion.webp" alt="" />}
           <span><strong>{notice.title}</strong>{notice.detail&&<small>{notice.detail}</small>}</span>
         </div>}
        {active&&hud.combo>=4&&<div className="ember-streak">DIG FRENZY ×{Math.ceil(hud.combo/3)}</div>}
        {paused&&<div className="ember-pause-overlay">
          <CaptainPauseMenu theme="tunnel" game="TUNNEL DRILL" title="EXCAVATION PAUSED"
            onPlay={togglePause} onRetry={() => start(frame.current.stageIndex)}
            onLevels={() => returnToLevelMenu(true)} />
        </div>}
        {isVictory&&victoryTarget?createPortal(<div className="ember-victory-fullscreen">{victoryPresentation}</div>,victoryTarget):victoryPresentation}

        {introOpen&&<div className={"ember-opening-cover is-"+introPhase} role="dialog" aria-modal="true" aria-label="Tunnel Drill opening film">
          <div className="ember-opening-media">
            <video ref={introVideoRef} className="ember-opening-film"
              src={TUNNEL_OPENING_VIDEO} preload="auto" playsInline
              controls={false} autoPlay={false} loop={false} muted={!soundOn}
              onLoadedMetadata={()=>{if(introPhase==="ready")holdOpeningTitle();}}
              onSeeked={()=>{if(introPhase==="ready"||introPhase==="finished")setIntroFrameReady(true);}}
              onPlay={()=>window.dispatchEvent(new CustomEvent("rosieverse:music:cinematic",{detail:{active:true}}))}
              onEnded={()=>{
                setIntroPhase("finished");
                holdOpeningTitle();
              }}
              onError={()=>setIntroError(true)}
              aria-label="Rosie discovers the Lost Dog City and its five underground kingdoms" />
            {!introFrameReady&&introPhase==="ready"&&<div className="ember-opening-loading" aria-hidden="true">
              <small>CAPTAIN ROSIE</small><strong>TUNNEL DRILL</strong><span>THE LOST DOG CITY</span>
            </div>}
            {introPhase==="finished"&&<button type="button" className="ember-opening-continue"
              onClick={finishOpening} aria-label="Enter Barkroot Passage">
              <span>TOUCH ANYWHERE TO BEGIN</span>
            </button>}
            {introError&&<p className="ember-opening-error" role="status">The film is unavailable. Skip to enter Barkroot Passage.</p>}
            {introPhase==="ready"&&!introError&&<button type="button" className="ember-opening-play"
              onClick={playOpening} aria-label="Play the opening film from the beginning" title="Play opening"><img src="/ember-drill/console-v1/opening-play.webp" alt=""/></button>}
            {introPhase!=="leaving"&&introPhase!=="finished"&&<button type="button"
              className="ember-opening-skip" onClick={finishOpening} aria-label="Skip opening and begin the first level">
              SKIP
            </button>}
          </div>
        </div>}
      </div>
      <div className="gamepad-hint">LEFT STICK / D-PAD STEER · A TURBO · START PAUSE · X RETRY WHILE PAUSED</div>
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
          aria-label="Angle the drill upward"><img src="/ember-drill/console-v1/steer-up.webp" alt=""/></button>}
        <button className={"ember-boost"+(hud.boost>0?" is-boosting":hud.charge>=100?" is-ready":"")} type="button"
          disabled={!active}
          onPointerDown={e=>{/* Round 10: fire Turbo on pointerdown, not click \u2014 while the
            other finger holds a steer button (pointer-captured), a click can be
            delayed or swallowed on touch; pointerdown is per-pointer and immediate.
            The trailing click is suppressed in onClick. */
            e.preventDefault();turboTapAt.current=Date.now();turbo();}}
          onClick={()=>{if(Date.now()-turboTapAt.current<700)return;turbo();}}
          aria-label={hud.boost>0?"Burrow Turbo active":hud.charge>=100?"Activate Burrow Turbo":"Burrow Turbo charging"}>
          <img className="ember-turbo-art" src="/ember-drill/console-v1/turbo.webp" alt=""/>
          <span><b>{hud.boost>0?"TURBO ACTIVE":hud.charge>=100?"TAP FOR TURBO":"BURROW TURBO"}</b>
            <i className="ember-charge"><i style={{width:(hud.boost>0?Math.min(100,hud.boost/TURBO_DURATION*100):hud.charge)+"%"}} /></i>
            <small>{hud.boost>0?hud.boost.toFixed(1)+"s INVULNERABLE":hud.charge>=100?"INVULNERABLE · RESTORES 1 HULL":"COLLECT TREASURE TO CHARGE"}</small></span>
        </button>
        {steerMode!=="joystick" && <button className="ember-angle" type="button" disabled={!active}
          onPointerDown={e=>hold("down",true,e)} onPointerUp={e=>hold("down",false,e)}
          onPointerCancel={e=>hold("down",false,e)} onLostPointerCapture={e=>hold("down",false,e)}
          aria-label="Angle the drill downward"><img className="ember-down-art" src="/ember-drill/console-v1/steer-up.webp" alt=""/></button>}
      </div>
      {<div className="ember-run-actions">
        <button className="ember-icon-action" type="button" disabled={!active&&!paused} onClick={togglePause} aria-label={paused?"Resume run":"Pause run"} title={paused?"Resume run":"Pause run"}><img src="/ember-drill/console-v1/pause.webp" alt=""/><span>{paused?"RESUME":"PAUSE"}</span></button>
        <button className="ember-icon-action" type="button" disabled={!active&&!paused&&mode!=="ended"} onClick={()=>start(frame.current.stageIndex)} aria-label="Replay run" title="Replay run"><img src="/ember-drill/console-v1/retry.webp" alt=""/><span>RETRY</span></button>
        <span>Hold ▲ / ▼ to steer · Space for Turbo</span>
      </div>}
      <div className="ember-caption"><span>BONES {hud.bones}</span><span>CHEESE {hud.cheese}</span><span>GEMS {hud.gems}</span><span>WALLS {hud.wallsBroken}</span><span>SECRETS {hud.secrets}</span>{relicFound&&<span className="ember-best">ROYAL RELIC FOUND</span>}
        <span className="ember-best">BEST {displayBest.toLocaleString()}</span><span className="ember-best">EXPEDITION {expeditionTotalStars}/15</span></div>
    </section>
  );
}
