import React,{useEffect,useRef,useState} from "react";
import {ROSIE_MUSIC,pageMusicTrack,sceneMusicTrack,musicContextGain} from "./rosieMusicCatalog.js";
import {RosieMusicEngine} from "./rosieMusicEngine.js";
import "./rosie-music.css";

const FLAG="rosieverse.music.enabled.v1";
const GAIN="rosieverse.music.volume.v1";
function readEnabled(){try{return localStorage.getItem(FLAG)!=="false"}catch{return true}}
function readVolume(){
  try{const value=Number(localStorage.getItem(GAIN));return Number.isFinite(value)&&value>=0&&value<=.75&&localStorage.getItem(GAIN)!==null?value:.26}
  catch{return .26}
}
export default function RosieMusicPlayer({page}){
  const [enabled,setEnabled]=useState(readEnabled);
  const [volume,setVolume]=useState(readVolume);
  const [open,setOpen]=useState(false);
  const [status,setStatus]=useState({id:pageMusicTrack(page),unlocked:false,enabled:true,error:null});
  const engineRef=useRef(null),sceneRef=useRef(null),pageRef=useRef(page);
  pageRef.current=page;

  useEffect(()=>{
    const engine=new RosieMusicEngine({onStatus:setStatus});
    engineRef.current=engine;
    engine.enabled=readEnabled();engine.volume=readVolume();
    engine.setContextGain(musicContextGain(pageRef.current));
    engine.setDesired(pageMusicTrack(pageRef.current));
    const unlock=()=>{
      if(engine.enabled)engine.unlock();
    };
    // iOS explicitly requires play() to occur within a user gesture.
    document.addEventListener("pointerdown",unlock,true);
    document.addEventListener("keydown",unlock,true);
    const handleScene=({scene,state,level})=>{
      if(pageRef.current!=="captain"||!["yacht","tunnel","cosmic"].includes(scene))return;
      if(state==="playing"||state==="start"||state==="menu"){
        sceneRef.current=scene;engine.setDuck(false);
        engine.setContextGain(state==="playing"?1:0.72);
        const song=sceneMusicTrack(scene,state,{level});
        if(song)engine.setDesired(song);
      }else if(sceneRef.current===scene){
        if(state==="paused"){engine.setDuck(true);}
        else if(state==="win"||state==="level-clear"||state==="victory"){
          engine.setDuck(true);engine.playFanfare();
        }else if(state==="ended"||state==="lose"){
          engine.setDuck(true);
        }
      }
    };
    const onGameScene=event=>handleScene(event.detail||{});
    const onGameMessage=event=>{
      if(event.origin!==window.location.origin||event.data?.type!=="rosieverse:music:scene")return;
      // The hidden Cosmic iframe initializes a menu when Captain opens.
      // Never let that offscreen event replace Yacht's opening soundtrack.
      if(event.data.state==="start"||event.data.state==="menu")return;
      const frame=document.querySelector("#cosmic-odyssey-arcade iframe");
      if(!frame||event.source!==frame.contentWindow)return;
      handleScene({scene:"cosmic",state:event.data.state,level:event.data.level});
    };
    const onMeditation=event=>{
      if(pageRef.current==="haiku")engine.setDuck(Boolean(event.detail?.active));
    };
    const onCinematic=event=>{
      if(pageRef.current==="captain")engine.setDuck(Boolean(event.detail?.active));
    };
    const onAchievement=()=>engine.playFanfare();
    const onVisibility=()=>engine.setHidden(document.hidden);
    window.addEventListener("rosieverse:music:scene",onGameScene);
    window.addEventListener("message",onGameMessage);
    window.addEventListener("rosieverse:music:achievement",onAchievement);
    window.addEventListener("rosieverse:music:meditation",onMeditation);
    window.addEventListener("rosieverse:music:cinematic",onCinematic);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{
      document.removeEventListener("pointerdown",unlock,true);
      document.removeEventListener("keydown",unlock,true);
      window.removeEventListener("rosieverse:music:scene",onGameScene);
      window.removeEventListener("message",onGameMessage);
      window.removeEventListener("rosieverse:music:achievement",onAchievement);
      window.removeEventListener("rosieverse:music:meditation",onMeditation);
      window.removeEventListener("rosieverse:music:cinematic",onCinematic);
      document.removeEventListener("visibilitychange",onVisibility);
      engine.dispose();engineRef.current=null;
    };
  },[]);

  useEffect(()=>{
    sceneRef.current=null;
    const engine=engineRef.current;
    if(engine){
      engine.setDuck(false);
      engine.setContextGain(musicContextGain(page));
      engine.setDesired(pageMusicTrack(page));
    }
    else setStatus(s=>({...s,id:pageMusicTrack(page)}));
  },[page]);

  const toggleEnabled=()=>{
    const next=!enabled;
    setEnabled(next);
    try{localStorage.setItem(FLAG,String(next))}catch{}
    engineRef.current?.setEnabled(next);
  };
  const setSoundLevel=value=>{
    const next=Math.max(0,Math.min(.75,Number(value)/100));
    setVolume(next);
    try{localStorage.setItem(GAIN,String(next))}catch{}
    engineRef.current?.setVolume(next);
  };
  const title=ROSIE_MUSIC[status.id]?.title||"RosieVerse";
  return <div className={"rosie-music-dock"+(open?" is-open":"")} aria-label="RosieVerse music controls"
    data-track={status.id} data-unlocked={status.unlocked?"yes":"no"} data-enabled={enabled?"yes":"no"}>
    <button className="rosie-music-launch" type="button"
      aria-label="Open RosieVerse soundtrack settings"
      aria-controls="rosie-music-panel" aria-expanded={open}
      onClick={()=>setOpen(value=>!value)}>
      <img src="/rosieverse/ui/rosie-music-medallion.webp" width="58" height="58" alt="" aria-hidden="true" draggable="false" />

    </button>
    {open&&<div id="rosie-music-panel" className="rosie-music-panel" role="group" aria-label="Soundtrack settings">
      <strong>RosieVerse Soundtrack</strong>
      <small className="rosie-music-track" aria-live="polite">{title}</small>
      <button type="button" className="rosie-music-toggle"
        onClick={toggleEnabled} aria-pressed={!enabled}>{enabled?"Mute soundtrack":"Enable soundtrack"}</button>
      <label htmlFor="rosie-music-volume">Music volume <output>{Math.round(volume*100)}%</output></label>
      <input id="rosie-music-volume" type="range" min="0" max="75" step="1"
        value={Math.round(volume*100)} onChange={event=>setSoundLevel(event.target.value)}
        aria-label="Soundtrack volume" />
      <small className="rosie-music-note">
        {!enabled?"Music is muted. Game sound effects remain separate.":
          status.error?"Audio needs another tap to resume.":
          !status.unlocked?"Music starts after your first interaction.":"Original music follows the page or game."}
      </small>
    </div>}
  </div>;
}
