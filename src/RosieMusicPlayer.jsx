import React,{useEffect,useRef,useState} from "react";
import {ROSIE_MUSIC,pageMusicTrack,sceneMusicTrack} from "./rosieMusicCatalog.js";
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
    engine.enabled=readEnabled();engine.volume=readVolume();engine.setDesired(pageMusicTrack(pageRef.current));
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
      const frame=document.querySelector("#cosmic-odyssey-arcade iframe");
      if(!frame||event.source!==frame.contentWindow)return;
      handleScene({scene:"cosmic",state:event.data.state,level:event.data.level});
    };
    const onAchievement=()=>engine.playFanfare();
    const onVisibility=()=>engine.setHidden(document.hidden);
    window.addEventListener("rosieverse:music:scene",onGameScene);
    window.addEventListener("message",onGameMessage);
    window.addEventListener("rosieverse:music:achievement",onAchievement);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{
      document.removeEventListener("pointerdown",unlock,true);
      document.removeEventListener("keydown",unlock,true);
      window.removeEventListener("rosieverse:music:scene",onGameScene);
      window.removeEventListener("message",onGameMessage);
      window.removeEventListener("rosieverse:music:achievement",onAchievement);
      document.removeEventListener("visibilitychange",onVisibility);
      engine.dispose();engineRef.current=null;
    };
  },[]);

  useEffect(()=>{
    sceneRef.current=null;
    const engine=engineRef.current;
    if(engine){engine.setDuck(false);engine.setDesired(pageMusicTrack(page));}
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
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/></svg>
      <span>{enabled?"Music":"Muted"}</span>
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
