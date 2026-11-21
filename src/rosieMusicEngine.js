import {ROSIE_MUSIC,musicUrl} from "./rosieMusicCatalog.js";

/* A two-deck, single-owner soundtrack. HTMLAudioElement is intentionally used
 * instead of decoding whole 3-minute songs into memory on iPhone/iPad.
 * Ambient tracks stream only after a real user gesture. Gameplay SFX stay on
 * their existing independent Web Audio channels. */
export class RosieMusicEngine {
  constructor({audioFactory=()=>new Audio(),frame=callback=>requestAnimationFrame(callback),
    cancelFrame=id=>cancelAnimationFrame(id),clock=()=>performance.now(),onStatus=()=>{}}={}){
    this.audioFactory=audioFactory;this.frame=frame;this.cancelFrame=cancelFrame;this.clock=clock;
    this.onStatus=onStatus;
    this.decks=[null,null];this.active=-1;this.activeId=null;this.desired="whimsical-journey";
    this.volume=.26;this.enabled=true;this.unlocked=false;this.hidden=false;this.ducked=false;
    this.fadeHandle=0;this.generation=0;this.fanfare=null;this.error=null;
    // Reuse one user-activated HTMLAudioElement on Safari; its second
    // alternating deck can stall after several rapid page transitions.
    this.singleDeck=typeof navigator!=="undefined" &&
      /AppleWebKit/i.test(navigator.userAgent) &&
      !/Chrome|Chromium|CriOS|Edg|FxiOS/i.test(navigator.userAgent);
  }
  _notify(){this.onStatus({id:this.activeId||this.desired,unlocked:this.unlocked,enabled:this.enabled,error:this.error});}
  _cancelFade(){++this.generation;if(this.fadeHandle)this.cancelFrame(this.fadeHandle);this.fadeHandle=0;}
  _gain(){return this.volume*(this.ducked ? 0.2 : 1)*(this.fanfare ? 0.3 : 1);}
  setDesired(id){
    if(!ROSIE_MUSIC[id]||id==="victory-fanfare")return;
    this.desired=id;
    if(this.enabled&&this.unlocked&&!this.hidden)this._playDesired();
    else this._notify();
  }
  unlock(){
    if(this.unlocked){
      // Safari can revoke an individual media element's playback permission
      // after a source change. A later user tap must be able to retry it.
      if(this.error&&this.enabled&&!this.hidden)this._playDesired();
      return;
    }
    this.unlocked=true;
    if(this.enabled&&!this.hidden){
      // Never prime a spare stream on Safari: it can interrupt the
      // current user-authorized media element.
      this._playDesired();
    }else this._notify();
  }
  _playDesired(){
    if(!this.enabled||!this.unlocked||this.hidden)return;
    const id=this.desired;
    if(!ROSIE_MUSIC[id])return;
    if(this.singleDeck){
      // Native iOS media playback permissions follow this persistent
      // player across routes. Avoid pause/load on every source switch.
      this._cancelFade();
      const song=this.decks[0]||(this.decks[0]=this.audioFactory());
      this.active=0;this.activeId=id;this.error=null;
      song.preload="auto";song.loop=ROSIE_MUSIC[id].loop;
      if(!song.src.endsWith(musicUrl(id)))song.src=musicUrl(id);
      song.volume=Math.max(0,Math.min(1,this._gain()));
      song.onended=()=>{if(this.activeId===id&&!song.loop){this.activeId=null;this._notify();}};
      song.onerror=()=>{if(this.activeId===id){this.error="Media error";this._notify();}};
      const playback=song.play();
      // A separate .then() without a rejection handler creates a second,
      // unhandled promise when WebKit aborts an obsolete byte-range stream.
      // Handle fulfillment and rejection on ONE promise chain.
      playback?.then?.(
        ()=>{if(this.activeId===id){this.error=null;this._notify();}},
        e=>{if(this.activeId===id){this.error=e?.name||"Playback blocked";this._notify();}}
      );
      this._notify();return;
    }
    if(this.activeId===id&&this.active>=0){
      const song=this.decks[this.active];
      this.error=null;
      const p=song.play();
      p?.catch?.(e=>{this.error=e?.name||"Playback blocked";this._notify();});
      this._applyGain();this._notify();return;
    }
    this._cancelFade();
    const oldIndex=this.active,old=oldIndex<0?null:this.decks[oldIndex];
    const nextIndex=oldIndex===0?1:0;
    const next=this.decks[nextIndex]||(this.decks[nextIndex]=this.audioFactory());
    next.pause();next.src=musicUrl(id);next.loop=ROSIE_MUSIC[id].loop;
    next.preload="auto";next.volume=0;
    // Force a fresh resource selection after rapid page changes on WebKit.
    // Without this, the deck may keep an aborted prior request and never GET
    // the newly selected MP3 even though its src property has changed.
    next.load?.();
    this.active=nextIndex;this.activeId=id;this.error=null;
    next.onended=()=>{if(this.active===nextIndex&&!next.loop){this.activeId=null;this._notify();}};
    // Call play synchronously while the originating click/touch is active.
    const play=next.play();
    play?.catch?.(e=>{
      if(this.active===nextIndex&&this.activeId===id){
        this.error=e?.name||"Playback blocked";this._notify();
      }
    });
    const start=this.clock(),token=this.generation,fromLevel=old&&!old.paused?old.volume:0;
    const fade=now=>{
      if(this.generation!==token)return;
      const t=Math.max(0,Math.min(1,(now-start)/850)),curve=t*t*(3-2*t);
      const target=this._gain();
      next.volume=Math.max(0,Math.min(1,target*curve));
      if(old&&old!==next)old.volume=Math.max(0,Math.min(1,fromLevel*(1-curve)));
      if(t<1)this.fadeHandle=this.frame(fade);
      else{this.fadeHandle=0;if(old&&old!==next)old.pause();}
    };
    this.fadeHandle=this.frame(fade);this._notify();
  }
  _applyGain(){
    const song=this.active>=0?this.decks[this.active]:null;
    if(song&&!this.fadeHandle)song.volume=Math.max(0,Math.min(1,this._gain()));
    if(this.fanfare)this.fanfare.volume=Math.max(0,Math.min(1,this.volume*1.15));
  }
  setVolume(volume){
    this.volume=Math.max(0,Math.min(.75,Number(volume)||0));
    this._applyGain();this._notify();
  }
  setEnabled(enabled){
    this.enabled=Boolean(enabled);
    if(!this.enabled){
      this._cancelFade();
      for(const song of this.decks)if(song)song.pause();
      if(this.fanfare){this.fanfare.pause();this.fanfare=null;}
      this._notify();return;
    }
    if(!this.unlocked)this.unlock();
    else this._playDesired();
  }
  setDuck(ducked){this.ducked=Boolean(ducked);this._applyGain();}
  setHidden(hidden){
    this.hidden=Boolean(hidden);
    if(this.hidden){
      for(const song of this.decks)if(song)song.pause();
      if(this.fanfare){this.fanfare.pause();this.fanfare=null;}
      this._cancelFade();
    }else if(this.enabled&&this.unlocked)this._playDesired();
  }
  playFanfare(){
    if(!this.enabled||!this.unlocked||this.hidden)return;
    if(this.fanfare){this.fanfare.pause();this.fanfare=null;}
    const cue=this.audioFactory();
    cue.src=musicUrl("victory-fanfare");cue.loop=false;cue.preload="auto";
    cue.volume=Math.max(0,Math.min(1,this.volume*1.15));
    this.fanfare=cue;this._applyGain();
    const restore=()=>{if(this.fanfare===cue){this.fanfare=null;this._applyGain();}};
    cue.onended=restore;cue.onerror=restore;
    const p=cue.play();p?.catch?.(restore);
  }
  dispose(){
    this._cancelFade();
    for(const song of this.decks)if(song){song.pause();song.removeAttribute?.("src");song.load?.();}
    if(this.fanfare)this.fanfare.pause();
    this.fanfare=null;this.active=-1;this.activeId=null;
  }
}
