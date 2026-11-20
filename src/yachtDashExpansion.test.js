import test from "node:test";
import assert from "node:assert/strict";
import { YACHT_CHAPTERS, YACHT_CHAPTER_GOALS, YACHT_PLAYTEST_ALL_LEVELS, yachtPlayableLimit, yachtSceneFor, yachtWaveFor, yachtUnlockedLevel, yachtNextUnlocked, yachtMedalsFor, parseYachtRecords, updateYachtRecords, isYachtHazard } from "./yachtDashExpansion.js";

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

test("All four Yacht Dash chapters are selectable during playtesting",()=>{
 assert.equal(YACHT_PLAYTEST_ALL_LEVELS,true);
 assert.equal(yachtPlayableLimit(0),3);
 assert.equal(yachtPlayableLimit(2),3);
 assert.equal(yachtPlayableLimit(3),3);
});
test("Stage medals reward score, survival and optional clean passes",()=>{
 assert.deepEqual(Object.keys(YACHT_CHAPTER_GOALS),["sakura","typhoon","moonlight","emperor"]);
 assert.equal(yachtMedalsFor("sakura",{completed:false,score:50000,lives:3}),0);
 assert.equal(yachtMedalsFor("sakura",{completed:true,score:0,lives:1}),1);
 assert.equal(yachtMedalsFor("sakura",{completed:true,score:800,lives:1}),2);
 assert.equal(yachtMedalsFor("sakura",{completed:true,score:2300,lives:3}),3);
 assert.equal(yachtMedalsFor("typhoon",{completed:true,score:2000,lives:3,nearMisses:1}),2);
 assert.equal(yachtMedalsFor("typhoon",{completed:true,score:2000,lives:3,nearMisses:2}),3);
 assert.equal(yachtMedalsFor("moonlight",{completed:true,score:2200,lives:3,rivalsPassed:1}),2);
 assert.equal(yachtMedalsFor("moonlight",{completed:true,score:2200,lives:3,rivalsPassed:2}),3);
 assert.equal(yachtMedalsFor("emperor",{completed:true,score:2700,lives:3,nearMisses:2,rivalsPassed:2}),3);
});
test("Chapter best scores and medals load safely and only improve",()=>{
 assert.deepEqual(parseYachtRecords("not-json"),{});
 assert.deepEqual(parseYachtRecords("[]"),{});
 const first=updateYachtRecords({},"moonlight",1800,2);
 assert.deepEqual(first.moonlight,{best:1800,medals:2});
 assert.strictEqual(updateYachtRecords(first,"moonlight",100,1),first);
 const next=updateYachtRecords(first,"moonlight",1950,3);
 assert.deepEqual(next.moonlight,{best:1950,medals:3});
 assert.deepEqual(parseYachtRecords('{"sakura":{"best":42,"medals":9},"unknown":{"best":800}}'),
   {sakura:{best:42,medals:3}});
 assert.strictEqual(updateYachtRecords(first,"unknown",10,3),first);
});
