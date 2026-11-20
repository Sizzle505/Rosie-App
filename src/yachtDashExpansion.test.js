import test from "node:test";
import assert from "node:assert/strict";
import { YACHT_CHAPTERS, yachtSceneFor, yachtWaveFor, yachtUnlockedLevel, yachtNextUnlocked, isYachtHazard } from "./yachtDashExpansion.js";

test("Four independent chapters each have five paintings and 75-second runs",()=>{
 assert.deepEqual(YACHT_CHAPTERS.map(c=>c.id),["sakura","typhoon","moonlight","emperor"]);
 for(let n=0;n<4;n++){
  const first=yachtSceneFor(n,0),last=yachtSceneFor(n,74);
  assert.notEqual(first.background,last.background);
  assert.equal(first.chapterId,YACHT_CHAPTERS[n].id);
  assert.equal(last.chapterId,YACHT_CHAPTERS[n].id);
  assert.ok(YACHT_CHAPTERS[n].victory.includes(n===0?"sakura":YACHT_CHAPTERS[n].id));
 }
 assert.equal(yachtSceneFor(1,15).background,YACHT_CHAPTERS[1].scenes[1]);
 assert.equal(yachtSceneFor(3,74).background,YACHT_CHAPTERS[3].scenes[4]);
});
test("Chapter unlocks only progress and are clamped",()=>{
 assert.equal(yachtUnlockedLevel("Infinity"),0);
 assert.equal(yachtUnlockedLevel("-1"),0);
 assert.equal(yachtUnlockedLevel("99"),3);
 assert.equal(yachtNextUnlocked(0,0),1);
 assert.equal(yachtNextUnlocked(2,1),2);
 assert.equal(yachtNextUnlocked(3,3),3);
});
test("Chapter hazards never occupy all lanes and drift within bounds",()=>{
 for(const chapter of ["typhoon","moonlight","emperor"]){
  for(let i=0;i<120;i++) for(let seed=0;seed<3;seed++){
   const wave=yachtWaveFor(chapter,i,()=>seed);
   const threat=wave.filter(x=>isYachtHazard(x.kind));
   assert.ok(threat.length<=2);
   for(const item of wave){
    assert.ok(item.lane>=0&&item.lane<3);
    if(item.driftTo!==undefined)assert.ok(item.driftTo>=0&&item.driftTo<3);
   }
   const occupied=new Set(threat.map(x=>x.driftTo??x.lane));
   assert.ok(occupied.size<3);
  }
 }
 assert.deepEqual(yachtWaveFor("sakura",5,()=>0),[]);
 assert.ok(yachtWaveFor("moonlight",3,()=>0).some(x=>x.kind==="rival"));
 assert.ok(yachtWaveFor("emperor",4,()=>0).some(x=>x.kind==="rival"));
 assert.equal(isYachtHazard("ball"),false);
});
