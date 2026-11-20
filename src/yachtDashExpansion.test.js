import test from "node:test";
import assert from "node:assert/strict";
import { YACHT_CHAPTERS, YACHT_CHAPTER_GOALS, YACHT_PLAYTEST_ALL_LEVELS, yachtPlayableLimit, yachtSceneFor, yachtWaveFor, yachtUnlockedLevel, yachtNextUnlocked, yachtMedalsFor, parseYachtRecords, updateYachtRecords, isYachtHazard, yachtOccupiedLanes, yachtTouchesHazard, yachtNearMiss } from "./yachtDashExpansion.js";

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
 assert.ok(yachtWaveFor("moonlight",4,()=>0).some(x=>x.kind==="rival"));
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

test("Large rocks and driftwood block exactly two adjacent lanes; the torii leaves center clear",()=>{
  for(const chapter of ["typhoon","emperor"]){
    const wide=yachtWaveFor(chapter,2,()=>0)[0];
    assert.equal(wide.footprint,"wide");
    assert.ok(["reef-rocks","driftwood","barrel-raft"].some(x=>wide.asset.includes(x)));
    assert.deepEqual(yachtOccupiedLanes(wide),[0,1]);
    assert.equal(yachtTouchesHazard(wide,0),true);
    assert.equal(yachtTouchesHazard(wide,1),true);
    assert.equal(yachtTouchesHazard(wide,2),false);
    assert.equal(yachtNearMiss(wide,2),true);
    const right=yachtWaveFor(chapter,2,()=>2)[0];
    assert.deepEqual(yachtOccupiedLanes(right),[1,2]);
    assert.equal(yachtTouchesHazard(right,0),false);
    const gate=yachtWaveFor(chapter,6,()=>1)[0];
    assert.equal(gate.footprint,"arch");
    assert.equal(gate.asset,"/yacht-dash/obstacles/storm-torii.webp");
    assert.deepEqual(yachtOccupiedLanes(gate),[0,2]);
    assert.equal(yachtTouchesHazard(gate,0),true);
    assert.equal(yachtTouchesHazard(gate,1),false);
    assert.equal(yachtTouchesHazard(gate,2),true);
    assert.equal(yachtNearMiss(gate,1),true);
  }
});

test("Sparse obstacles leave more open water and no overlapping dangerous waves",()=>{
  for(const chapter of YACHT_CHAPTERS.filter(c=>c.id!=="sakura")){
    assert.ok(chapter.cadence>=2000,"Obstacle cadence too fast for "+chapter.id);
    const waves=Array.from({length:34},(_,step)=>yachtWaveFor(chapter.id,step,n=>step % n));
    assert.ok(waves.every(w=>w.length===1));
    const hazards=waves.flat().filter(w=>isYachtHazard(w.kind));
    assert.ok(hazards.length<=15,"Too many hazards: "+chapter.id);
    assert.ok(waves.flat().some(w=>w.kind==="ball"),"No collectible waves");
    for(const wave of waves){
      const occupied=new Set(wave.filter(x=>isYachtHazard(x.kind)).flatMap(yachtOccupiedLanes));
      assert.ok(occupied.size<=2,"All three lanes blocked in "+chapter.id);
    }
  }
});

test("The supply chest is a useful once-per-new-level reward, not a common hazard",()=>{
  for(const chapter of ["typhoon","moonlight","emperor"]){
    const waves=Array.from({length:45},(_,step)=>yachtWaveFor(chapter,step,n=>step % n));
    const supply=waves.flat().filter(x=>x.kind==="supply");
    assert.equal(supply.length,1);
    assert.equal(supply[0].asset,"/yacht-dash/obstacles/cargo-crate.webp");
    assert.ok(supply[0].points>=100 && supply[0].turbo>=50);
    assert.equal(isYachtHazard(supply[0].kind),false);
    assert.ok(waves.flat().every(x=>!x.asset?.includes("cargo-crate") || x.kind==="supply"));
  }
  assert.deepEqual(yachtWaveFor("sakura",12,()=>1),[]);
});

