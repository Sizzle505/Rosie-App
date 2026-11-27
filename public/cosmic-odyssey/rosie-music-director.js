/* Captain Rosie: Cosmic Odyssey standalone player. MP3 recordings live at
 * /rosie-music/. When embedded, music is controlled by the parent app instead.
 * Game sound effects continue to use their own separate audio channel. */
(() => {
  'use strict';
  class RosieMusicDirector {
    constructor({baseUrl='music',volume=0.32}={}) {
      this.baseUrl=baseUrl.replace(/\/$/,'');
      this.context=null;
      this.master=null;
      this.volume=volume;
      this.muted=false;
      try{this.muted=localStorage.getItem('rosie.cosmic.music.muted')==='true'}catch{}
      this.active=null;
      this.request=0;
      this.buffers=new Map();
      this.cues={
        menu:{file:'galactic-march',loop:true},
        playing:{file:'cosmic-arpeggio',loop:true},
        alternate:{file:'cosmic-interlude',loop:true},
        win:{file:'cosmic-victory',loop:false},
        'level-clear':{file:'victory-fanfare',loop:false}
      };
    }
    async unlock(){
      if(!this.context){
        const AudioContextClass=window.AudioContext||window.webkitAudioContext;
        if(!AudioContextClass)throw new Error('Web Audio is unavailable');
        this.context=new AudioContextClass();
        this.master=this.context.createGain();
        this.master.gain.value=this.muted?0:this.volume;
        this.master.connect(this.context.destination);
      }
      await this.context.resume();
    }
    async getBuffer(file){
      if(this.buffers.has(file))return this.buffers.get(file);
      const promise=(async()=>{
        // MP3 is the verified distribution format; don't request absent OGGs.
        const formats=['mp3'];
        let lastError;
        for(const ext of formats){
          try{
            const response=await fetch(`${this.baseUrl}/${file}.${ext}`);
            if(!response.ok)throw new Error(`HTTP ${response.status}`);
            return await this.context.decodeAudioData(await response.arrayBuffer());
          }catch(error){lastError=error}
        }
        throw lastError||new Error(`Unable to load ${file}`);
      })();
      this.buffers.set(file,promise);
      try{return await promise}
      catch(error){this.buffers.delete(file);throw error}
    }
    fadeOut(item,seconds=0.65){
      if(!item||!this.context)return;
      const time=this.context.currentTime;
      item.gain.gain.cancelScheduledValues(time);
      item.gain.gain.setValueAtTime(item.gain.gain.value,time);
      item.gain.gain.linearRampToValueAtTime(0,time+seconds);
      try{item.source.stop(time+seconds+0.05)}catch{}
    }
    async play(state,{crossfade=0.65}={}){
      if(state==='paused'){this.duck();return}
      if(state==='lose'){this.stop(0.8);return}
      const cue=this.cues[state];
      if(!cue){this.stop();return}
      const request=++this.request;
      await this.unlock();
      if(request!==this.request)return;
      if(this.active?.state===state){this.unduck();return}
      const buffer=await this.getBuffer(cue.file);
      if(request!==this.request)return;
      const source=this.context.createBufferSource();
      const gain=this.context.createGain();
      source.buffer=buffer;
      source.loop=cue.loop;
      // Web Audio has sample-accurate loop regions: the first play includes
      // the entire natural opening, while repeats start at the stitched
      // phrase boundary rather than replaying the five-second introduction.
      if(cue.loop){source.loopStart=5;source.loopEnd=buffer.duration;}
      source.connect(gain);
      gain.connect(this.master);
      const time=this.context.currentTime;
      gain.gain.setValueAtTime(0,time);
      gain.gain.linearRampToValueAtTime(1,time+crossfade);
      source.start(time);
      this.fadeOut(this.active,crossfade);
      this.active={source,gain,state};
      source.onended=()=>{
        if(this.active?.source===source)this.active=null;
        try{source.disconnect();gain.disconnect()}catch{}
      };
    }
    duck(){
      if(!this.context||!this.active)return;
      const time=this.context.currentTime;
      this.active.gain.gain.cancelScheduledValues(time);
      this.active.gain.gain.setTargetAtTime(0.15,time,0.18);
    }
    unduck(){
      if(!this.context||!this.active)return;
      const time=this.context.currentTime;
      this.active.gain.gain.cancelScheduledValues(time);
      this.active.gain.gain.setTargetAtTime(1,time,0.18);
    }
    stop(seconds=0.6){
      ++this.request;
      if(this.active)this.fadeOut(this.active,seconds);
      this.active=null;
    }
    setMuted(value){
      this.muted=!!value;
      try{localStorage.setItem('rosie.cosmic.music.muted',String(this.muted))}catch{}
      if(this.context&&this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,0.05);
      return this.muted;
    }
    setVolume(value){
      this.volume=Math.max(0,Math.min(1,Number(value)||0));
      if(this.context&&this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,0.05);
    }
    dispose(){this.stop(0.01);this.context?.close();this.context=null;this.buffers.clear()}
  }
  window.RosieMusicDirector=RosieMusicDirector;
})();