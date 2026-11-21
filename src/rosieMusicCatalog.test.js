import test from "node:test";
import assert from "node:assert/strict";
import {ROSIE_MUSIC,pageMusicTrack,sceneMusicTrack,musicUrl} from "./rosieMusicCatalog.js";
import {RosieMusicEngine} from "./rosieMusicEngine.js";

test("all thirteen original Suno tracks have distinct browser paths",()=>{
  assert.equal(Object.keys(ROSIE_MUSIC).length,13);
  assert.equal(new Set(Object.values(ROSIE_MUSIC).map(s=>s.original)).size,13);
  for(const [id,track] of Object.entries(ROSIE_MUSIC)){
    assert.equal(musicUrl(id),"/rosie-music/"+id+".mp3");
    assert.ok(track.title);assert.ok(track.original.endsWith(".wav"));
  }
  assert.equal(ROSIE_MUSIC["victory-fanfare"].loop,false);
});
test("each real RosieVerse page resolves to available music",()=>{
  for(const page of ["home","fortune","cheese","captain","captain2","vault","randomizers","haiku","reminders","calculations","timekeeper","resources","qr-atelier","recipes","reviews"])
    assert.ok(ROSIE_MUSIC[pageMusicTrack(page)],page);
  assert.equal(pageMusicTrack("haiku"),"haiku-garden");
  assert.equal(pageMusicTrack("timekeeper"),"clockwork-nostalgia");
});
test("game tracks switch without overlapping owners",()=>{
  assert.equal(sceneMusicTrack("yacht","playing"),"yacht-voyage");
  assert.equal(sceneMusicTrack("tunnel","playing"),"ember-tunnel");
  assert.equal(sceneMusicTrack("cosmic","start"),"galactic-march");
  assert.equal(sceneMusicTrack("cosmic","playing",{level:1}),"cosmic-arpeggio");
  assert.equal(sceneMusicTrack("cosmic","playing",{level:5}),"cosmic-interlude");
  assert.equal(sceneMusicTrack("cosmic","playing",{level:9}),"pulse-arena");
});
test("player is user-gesture gated; mute and volume do not affect game SFX",()=>{
  let now=0,queued=[];
  const played=[];
  class FakeAudio {
    constructor(){this.paused=true;this.loop=false;this.volume=0;this.src="";this.preload="";}
    play(){this.paused=false;played.push(this.src);return Promise.resolve();}
    pause(){this.paused=true;}
    removeAttribute(){}
    load(){}
  }
  const engine=new RosieMusicEngine({audioFactory:()=>new FakeAudio(),
    clock:()=>now,frame:fn=>{queued.push(fn);return queued.length;},
    cancelFrame:()=>{}});
  engine.setDesired("oracle-secret");
  assert.equal(played.length,0,"Must not start before interaction");
  engine.unlock();
  assert.deepEqual(played,["/rosie-music/oracle-secret.mp3"]);
  const flush=()=>{const jobs=queued;queued=[];now+=1000;for(const j of jobs)j(now);};
  flush();
  engine.setDesired("cheese-heist");
  flush();
  assert.equal(engine.activeId,"cheese-heist");
  assert.equal(engine.decks.filter(x=>x&&!x.paused).length,1,"Only one active long-form track");
  engine.setVolume(.5);assert.equal(engine.decks[engine.active].volume,.5);
  engine.setDuck(true);assert.ok(engine.decks[engine.active].volume<.2);
  engine.setDuck(false);engine.playFanfare();
  assert.ok(played.includes("/rosie-music/victory-fanfare.mp3"));
  engine.setEnabled(false);
  assert.equal(engine.decks.filter(x=>x&&!x.paused).length,0);
  engine.dispose();
});

test("Safari keeps one gesture-authorized audio element through rapid page changes",async()=>{
  let now=0,created=0;
  const songs=[];
  class FakeAudio {
    constructor(){created++;this.paused=true;this.volume=0;this.src="";this.loop=false;}
    play(){this.paused=false;songs.push(this.src);return Promise.resolve();}
    pause(){this.paused=true;}
    removeAttribute(){}
    load(){}
  }
  const engine=new RosieMusicEngine({
    audioFactory:()=>new FakeAudio(),clock:()=>now,
    frame:()=>1,cancelFrame:()=>{}
  });
  engine.singleDeck=true;
  engine.setDesired("whimsical-journey");
  assert.equal(created,0,"No sound or network before user gesture");
  engine.unlock();
  for(const id of ["oracle-secret","haiku-garden","clockwork-nostalgia","cheese-heist"]){
    now+=50;
    engine.setDesired(id);
    assert.equal(engine.activeId,id);
    assert.equal(engine.decks.filter(Boolean).length,1,"Safari must reuse the authorized element");
    assert.equal(engine.decks[0].src,musicUrl(id));
    assert.equal(engine.decks[0].paused,false);
  }
  await Promise.resolve();
  assert.equal(engine.error,null);
  assert.equal(songs.length,5);
  engine.setEnabled(false);
  assert.equal(engine.decks[0].paused,true);
  engine.setEnabled(true);
  assert.equal(engine.decks[0].paused,false);
  assert.equal(created,1);
  engine.dispose();
});
