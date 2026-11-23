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
    this.volume=.26;this.contextGain=1;this.enabled=true;this.unlocked=false;this.hidden=false;this.ducked=false;
    this.fadeHandle=0;this.generation=0;this.fanfare=null;this.error=null;
    // Reuse one user-activated HTMLAudioElement on Safari; its second
    // alternating deck can stall after several rapid page transitions.
    this.singleDeck=typeof navigator!=="undefined" &&
      /AppleWebKit/i.test(navigator.userAgent) &&
      !/Chrome|Chromium|CriOS|Edg|FxiOS/i.test(navigator.userAgent);
  }
  _notify(){this.onStatus({id:this.activeId||this.desired,unlocked:this.unlocked,enabled:this.enabled,error:this.error});}
  _failedToLoad(id){
    if(this.activeId!==id)return;
    // Newly added chapter recordings fall back to the verified existing
    // yacht track until their MP3s have been published to /rosie-music/.
    const fallback=ROSIE_MUSIC[id]?.fallback;
    if(fallback&&fallback!==id&&ROSIE_MUSIC[fallback]){
      this.error=null;
      this.setDesired(fallback);
    }else{
      this.error="Media error";
      this._notify();
    }
  }
  _cancelFade(){++this.generation;if(this.fadeHandle)this.cancelFrame(this.fadeHandle);this.fadeHandle=0;}
  _gain(){return this.volume*this.contextGain*(this.ducked ? 0.2 : 1)*(this.fanfare ? 0.3 : 1);}
  setContextGain(value){
    this.contextGain=Math.min(1,Math.max(0.15,Number(value)||0.7));
    this._applyGain();
  }
  _finishTrack(song,id,index){
    if(this.active!==index||this.activeId!==id)return;
    const loopStart=ROSIE_MUSIC[id]?.loopStartSeconds;
    if(loopStart>0&&this.enabled&&this.unlocked&&!this.hidden){
      // First playback starts with the actual WAV opening at t=0.
      // After the full song, the ending has been crossfaded into t=5;
      // seeking back to t=5 keeps subsequent loops musically joined.
      try{
        song.currentTime=loopStart;
        const play=song.play();
        play?.catch?.(e=>{if(this.activeId===id){this.error=e?.name||"Loop blocked";this._notify();}});
        return;
      }catch(e){this.error=e?.name||"Loop blocked";}
    }
    this._notify();
  }
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
      // Reuse Safari's single gesture-unlocked player. Each new destination
      // starts at the natural WAV beginning, not at the 5-second loop point.
      this._cancelFade();
      const changed=this.activeId!==id;
      const song=this.decks[0]||(this.decks[0]=this.audioFactory());
      this.active=0;this.activeId=id;this.error=null;
      song.preload="auto";song.loop=false;
      if(changed||!song.src.endsWith(musicUrl(id)))song.src=musicUrl(id);
      song.volume=changed?0:Math.max(0,Math.min(1,this._gain()));
      song.onended=()=>this._finishTrack(song,id,0);
      song.onerror=()=>this._failedToLoad(id);
      const playback=song.play();
      // A single onFulfilled/onRejected avoids WebKit's AbortError
      // escaping as an unhandled promise during rapid route changes.
      playback?.then?.(
        ()=>{if(this.activeId===id){this.error=null;this._notify();}},
        e=>{if(this.activeId===id){this.error=e?.name||"Playback blocked";this._notify();}}
      );
      if(changed){
        const start=this.clock(),token=this.generation;
        const rise=now=>{
          if(token!==this.generation||this.activeId!==id)return;
          const t=Math.max(0,Math.min(1,(now-start)/1150)),curve=t*t*(3-2*t);
          song.volume=Math.min(1,Math.max(0,this._gain()*curve));
          if(t<1)this.fadeHandle=this.frame(rise);
          else this.fadeHandle=0;
        };
        this.fadeHandle=this.frame(rise);
      }
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
    next.pause();next.src=musicUrl(id);next.loop=false;
    next.preload="auto";next.volume=0;
    // Force a fresh resource selection after rapid page changes on WebKit.
    // Without this, the deck may keep an aborted prior request and never GET
    // the newly selected MP3 even though its src property has changed.
    next.load?.();
    this.active=nextIndex;this.activeId=id;this.error=null;
    next.onended=()=>this._finishTrack(next,id,nextIndex);
    next.onerror=()=>this._failedToLoad(id);
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
      const t=Math.max(0,Math.min(1,(now-start)/1350)),curve=t*t*(3-2*t);
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
