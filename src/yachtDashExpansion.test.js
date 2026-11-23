import test from "node:test";
import assert from "node:assert/strict";
import { YACHT_CHAPTERS, YACHT_CHAPTER_GOALS, YACHT_CHAPTER_PHASES, YACHT_PLAYTEST_ALL_LEVELS, yachtPlayableLimit, yachtSceneFor, yachtWaveFor, yachtUnlockedLevel, yachtNextUnlocked, yachtMedalsFor, yachtNextMedalHint, parseYachtRecords, updateYachtRecords, isYachtHazard, yachtOccupiedLanes, yachtTouchesHazard, yachtNearMiss, yachtCatchStart, yachtApproachAt, yachtPickupApproachAt, yachtBonusTreatLane, yachtSakuraDelivery, yachtSpawnInterval, yachtObjectSpeed, yachtAssetScale, YACHT_EXTRA_TREAT_MS, YACHT_CLEAN_PASS_POINTS, YACHT_CLEAN_PASS_TURBO, yachtClampLane, yachtSwipeSteps, yachtThreatForecast, yachtCanTakeHit, YACHT_IMPACT_GRACE_MS } from "./yachtDashExpansion.js";

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


test("Larger obstacles become collidable when their artwork reaches the ship",()=>{
 assert.equal(yachtCatchStart({kind:"ball",lane:1}),77);
 assert.equal(yachtCatchStart({kind:"obstacle",footprint:"wide",lane:0}),65);
 assert.equal(yachtCatchStart({kind:"obstacle",footprint:"arch",lane:1}),60);
});

test("Objects arrive from the distant WATERLINE and enlarge toward the yacht",()=>{
 const far = yachtApproachAt(-12);
 const middle = yachtApproachAt(48);
 const near = yachtApproachAt(108);
 assert.equal(far.top,47,"Far objects must start over the water, not in the sky");
 assert.ok(far.scale>=.25 && far.scale<.4);
 assert.ok(middle.top>far.top && middle.top<near.top);
 assert.ok(middle.scale>far.scale && middle.scale<near.scale);
 assert.ok(near.top>=99 && near.top<=104);
 assert.equal(near.scale,1);
 assert.deepEqual(yachtApproachAt(-100),far,"Offscreen initial spawn is clamped");
 assert.deepEqual(yachtApproachAt(900),near,"Past-ship position is clamped");
});

test("Course gestures distinguish taps, one-lane swipes, two-lane flicks and vertical drags", () => {
  assert.equal(yachtSwipeSteps(35, 3, 320), 1);
  assert.equal(yachtSwipeSteps(-35, 1, 320), -1);
  assert.equal(yachtSwipeSteps(150, 4, 320), 2);
  assert.equal(yachtSwipeSteps(-150, 0, 320), -2);
  assert.equal(yachtSwipeSteps(8, 80, 320), 0);
  assert.equal(yachtSwipeSteps(30, 70, 320), 0);
  assert.equal(yachtSwipeSteps(14, 2, 320), 0);
  assert.equal(yachtSwipeSteps(100, 1, 1200), 1);
  assert.equal(yachtSwipeSteps(100, 1, 0), 0);
  assert.equal(yachtClampLane(0, yachtSwipeSteps(160, 2, 320)), 2);
});

test("Forecast shows the nearest imminent hazard and accounts for rival drift", () => {
  assert.equal(yachtThreatForecast(null), null);
  assert.equal(yachtThreatForecast([{kind:"buoy",lane:0,y:5}]), null);
  assert.deepEqual(yachtThreatForecast([{kind:"obstacle",lane:0,blockedLanes:[0,1],y:62}]),
    {kind:"obstacle",blocked:[0,1],urgent:true,open:[2]});
  assert.deepEqual(yachtThreatForecast([{kind:"obstacle",lane:1,blockedLanes:[0,2],y:60}]),
    {kind:"obstacle",blocked:[0,2],urgent:true,open:[1]});
  assert.deepEqual(yachtThreatForecast([{kind:"rival",lane:0,driftTo:1,drifted:false,y:38}]),
    {kind:"rival",blocked:[1],urgent:false,open:[0,2]});
  assert.deepEqual(yachtThreatForecast([{kind:"rival",lane:1,driftTo:2,drifted:true,y:54}]),
    {kind:"rival",blocked:[1],urgent:true,open:[0,2]});
  assert.deepEqual(yachtThreatForecast([
    {kind:"buoy",lane:0,y:35},{kind:"obstacle",lane:2,y:74},
    {kind:"ball",lane:1,y:88}
  ]),{kind:"obstacle",blocked:[2],urgent:true,open:[0,1]});
});

test("Clean passes earn a useful but bounded score and Turbo recharge", () => {
  assert.ok(YACHT_CLEAN_PASS_POINTS >= 20 && YACHT_CLEAN_PASS_POINTS <= 35);
  assert.ok(YACHT_CLEAN_PASS_TURBO >= 5 && YACHT_CLEAN_PASS_TURBO <= 12);
  assert.equal(Math.min(100, 96 + YACHT_CLEAN_PASS_TURBO), 100);
});
test("Threat forecast becomes urgent only close to the yacht", () => {
  const before = yachtThreatForecast([{kind:"buoy",lane:2,y:53}]);
  const after = yachtThreatForecast([{kind:"buoy",lane:2,y:54}]);
  assert.equal(before.urgent, false);
  assert.equal(after.urgent, true);
});
test("Steering lane changes are synchronous, bounded and accept repeated taps",()=>{
 assert.equal(yachtClampLane(1,-1),0);
 assert.equal(yachtClampLane(1,1),2);
 assert.equal(yachtClampLane(0,-1),0);
 assert.equal(yachtClampLane(2,1),2);
 let lane=0;
 for(const direction of [1,1,-1,1,-1,-1]) lane=yachtClampLane(lane,direction);
 assert.equal(lane,0);
 assert.equal(yachtClampLane(NaN,1),2);
});
test("A hit gives one pause-safe recovery window and no double damage",()=>{
 assert.ok(YACHT_IMPACT_GRACE_MS>=1000);
 assert.ok(YACHT_IMPACT_GRACE_MS<=1800);
 assert.equal(yachtCanTakeHit(0),true);
 assert.equal(yachtCanTakeHit(YACHT_IMPACT_GRACE_MS),false);
 assert.equal(yachtCanTakeHit(1),false);
 assert.equal(yachtCanTakeHit(0,true),false);
 assert.equal(yachtCanTakeHit(-1),true);
});
test("All three new stages have attainable medal scores after sparse hazards",()=>{
 const maximumWithNoBoost=(chapter)=>{
   let score=0,streak=0;
   for(let step=0;step<34;step++){
     const item=yachtWaveFor(chapter,step,()=>0)[0];
     if(item.kind==="rival")score+=70;
     else if(item.kind==="supply")score+=item.points;
     else if(["ball","treat","cheese"].includes(item.kind)){
       streak++;
       const multiplier=Math.min(4,1+Math.floor(streak/4));
       score+=({ball:10,treat:20,cheese:40}[item.kind])*multiplier;
     }
   }
   return score;
 };
 for(const {id} of YACHT_CHAPTERS.filter(c=>c.id!=="sakura")){
   const goal=YACHT_CHAPTER_GOALS[id];
   const possible=maximumWithNoBoost(id);
   assert.ok(goal.score < possible*.8, id+" silver target needs excessive pickups");
   assert.ok(goal.expert <= possible+150, id+" gold medal is out of range");
 }
});


test("Every chapter has distinct scene names matching its five artworks",()=>{
 const used = new Set();
 for (const chapter of YACHT_CHAPTERS.filter(c=>c.id!=="sakura")) {
   assert.equal(chapter.sceneTitles.length,5);
   assert.equal(new Set(chapter.sceneTitles).size,5);
   for(let index=0;index<5;index++){
     const scene=yachtSceneFor(YACHT_CHAPTERS.findIndex(c=>c.id===chapter.id),index*15);
     assert.equal(scene.name,chapter.sceneTitles[index]);
     assert.equal(scene.background,chapter.scenes[index]);
     used.add(scene.name);
   }
 }
 assert.equal(used.size,15);
 const sakura=yachtSceneFor(0,0,[0,1,2,3,4]);
 assert.equal(sakura.name,"Torii Sunrise");
 assert.equal(sakura.background,"/captain-levels/sunrise-across-torii-sea.webp");
});

test("New chapters use themed and distinct stage messages without changing Sakura",()=>{
 assert.equal(YACHT_CHAPTER_PHASES.sakura,undefined);
 const keys=["harbor","riviera","sunset"];
 for(const chapter of ["typhoon","moonlight","emperor"]){
   const messages=keys.map(k=>YACHT_CHAPTER_PHASES[chapter][k]);
   assert.equal(messages.length,3);
   assert.equal(new Set(messages.map(m=>m.name)).size,3);
   assert.ok(messages.every(m=>m.copy.length>=20));
 }
 assert.equal(YACHT_CHAPTER_PHASES.typhoon.sunset.name,"Stormbreak Run");
 assert.equal(YACHT_CHAPTER_PHASES.moonlight.sunset.name,"Midnight Sprint");
 assert.equal(YACHT_CHAPTER_PHASES.emperor.sunset.name,"Royal Finish");
});

test("Mobile chapter selection captions are short and distinct",()=>{
 const previews=YACHT_CHAPTERS.map(stage=>YACHT_CHAPTER_GOALS[stage.id].preview);
 assert.equal(new Set(previews).size,4);
 assert.ok(previews.every(copy=>copy.length>15 && copy.length<=54));
 assert.ok(previews.every(copy=>copy.endsWith(".")));
});

test("Captain's Log provides the next attainable medal goal instead of generic praise",()=>{
  const sailor={completed:true,score:0,lives:3,nearMisses:0,rivalsPassed:0};
  assert.match(yachtNextMedalHint("typhoon",{...sailor,completed:false}),/Complete this passage/);
  assert.match(yachtNextMedalHint("typhoon",sailor),/700 points/);
  assert.match(yachtNextMedalHint("typhoon",{...sailor,score:900}),/1,350 points/);
  assert.match(yachtNextMedalHint("typhoon",{...sailor,score:1500,lives:1}),/two or more hull/);
  assert.match(yachtNextMedalHint("typhoon",{...sailor,score:1500}),/2 clean near misses/);
  assert.match(yachtNextMedalHint("moonlight",{...sailor,score:1700,rivalsPassed:1}),/2 rival yachts/);
  assert.match(yachtNextMedalHint("emperor",{...sailor,score:2100,nearMisses:2,rivalsPassed:2}),/All three medals/);
  assert.equal(yachtNextMedalHint("unknown",sailor),"");
});

test("Sakura begins with an approachable, rewarding cargo tutorial", () => {
  assert.deepEqual([0,1,2].map(n => yachtSakuraDelivery(n, () => 2)),
    [{kind:"ball",lane:1},{kind:"treat",lane:1},{kind:"cheese",lane:1}]);
  for(let seq=3;seq<100;seq++) {
    const delivery=yachtSakuraDelivery(seq,n=>seq % n);
    assert.ok(["ball","treat","cheese","buoy"].includes(delivery.kind));
    assert.ok(delivery.lane>=0 && delivery.lane<=2);
    if(delivery.kind==="buoy"){
      assert.ok(seq>=7, "no hazard before the controls are learned");
      assert.notEqual(yachtSakuraDelivery(seq-1,()=>0).kind,"buoy");
      assert.notEqual(yachtSakuraDelivery(seq+1,()=>0).kind,"buoy");
    }
  }
  assert.ok(Array.from({length:80},(_,i)=>yachtSakuraDelivery(i,()=>0))
    .filter(drop=>drop.kind==="cheese").length >= 8,
    "Golden Cheese must appear often enough to build meaningful Turbo");
});
test("Wave rhythm eases the opening, accelerates the finale, and spaces major hazards", () => {
  const early=yachtSpawnInterval("sakura","harbor",0);
  const late=yachtSpawnInterval("sakura","sunset",0);
  assert.ok(early>=1050 && early<=1300);
  assert.ok(late>=880 && late<early);
  const sakuraSeconds=["harbor","riviera","sunset"]
    .reduce((sum,phase)=>sum+25,0);
  assert.equal(sakuraSeconds,75);
  for(const chapter of ["typhoon","moonlight","emperor"]){
    for(const phase of ["harbor","riviera","sunset"]){
      for(let seq=0;seq<40;seq++){
        const interval=yachtSpawnInterval(chapter,phase,seq);
        assert.ok(interval>=1700 && interval<=3200,chapter+" cadence outside fair bounds");
      }
      const gateSequence=chapter==="moonlight"?-1:6;
      if(gateSequence>=0){
        assert.ok(yachtSpawnInterval(chapter,phase,gateSequence) >
          yachtSpawnInterval(chapter,phase,gateSequence-1)+300,
          "Torii needs extra approach spacing");
      }
    }
    assert.ok(yachtSpawnInterval(chapter,"harbor",0) >
      yachtSpawnInterval(chapter,"sunset",0));
  }
});
test("Travel speed variation is tight and obstacles cannot run down fresh treats", () => {
  for(const chapter of ["sakura","typhoon","moonlight","emperor"]){
    const hazards=Array.from({length:5},(_,seed)=>yachtObjectSpeed(chapter,"obstacle",()=>seed));
    const treats=Array.from({length:5},(_,seed)=>yachtObjectSpeed(chapter,"treat",()=>seed));
    assert.ok(Math.max(...hazards)-Math.min(...hazards)<.15);
    assert.ok(Math.max(...treats)-Math.min(...treats)<.15);
    assert.ok(Math.max(...hazards) < Math.min(...treats),
      "A new hazard must never catch a slower collectible on approach");
    assert.ok(Math.min(...hazards)>=1.9 && Math.max(...treats)<=2.25);
  }
});
test("Supplemental treat cadence is moderate and does not increase hazards",()=>{
 assert.ok(YACHT_EXTRA_TREAT_MS>=7500 && YACHT_EXTRA_TREAT_MS<=10000);
 const extra=Math.floor(75000 / YACHT_EXTRA_TREAT_MS);
 assert.ok(extra>=7 && extra<=10,"Extra treats should be occasional, not another rapid-fire wave");
 for(const id of ["typhoon","moonlight","emperor"]){
   const hazards=Array.from({length:34},(_,seq)=>
     yachtWaveFor(id,seq,()=>seq%3).filter(entry=>isYachtHazard(entry.kind)).length);
   assert.ok(hazards.reduce((sum,n)=>sum+n,0)<=15);
 }
});
test("Collectibles start legibly but arrive at exactly their previous full size",()=>{
 const far=yachtPickupApproachAt(-12),middle=yachtPickupApproachAt(48),end=yachtPickupApproachAt(108);
 const oldFar=yachtApproachAt(-12),oldEnd=yachtApproachAt(108);
 assert.equal(far.scale,.56);
 assert.ok(far.scale>oldFar.scale);
 assert.ok(middle.scale>far.scale && middle.scale<end.scale);
 assert.equal(end.scale,1);
 assert.equal(end.scale,oldEnd.scale);
 assert.equal(far.top,oldFar.top);
 assert.ok(far.opacity>oldFar.opacity);
});
test("Extra treats choose a safe lane when new multi-lane or drifting hazards are present",()=>{
 assert.equal(yachtBonusTreatLane([],1),1);
 assert.equal(yachtBonusTreatLane([{kind:"obstacle",lane:0,blockedLanes:[0,1],y:2}],0),2);
 assert.equal(yachtBonusTreatLane([{kind:"obstacle",lane:1,blockedLanes:[0,2],y:2}],0),1);
 assert.equal(yachtBonusTreatLane([{kind:"rival",lane:0,driftTo:1,y:3}],0),2);
 assert.equal(yachtBonusTreatLane([{kind:"obstacle",lane:0,blockedLanes:[0,1],y:3},
   {kind:"rival",lane:2,y:5}],0),-1);
 assert.equal(yachtBonusTreatLane([{kind:"obstacle",lane:0,blockedLanes:[0,1],y:50}],0),0);
 assert.equal(yachtBonusTreatLane([{kind:"cheese",lane:1,y:5}],1),2,
   "Do not stack a bonus treat onto fresh cheese");
 assert.equal(yachtBonusTreatLane([{kind:"cheese",lane:0,y:0},
   {kind:"treat",lane:1,y:6},{kind:"ball",lane:2,y:20}],0),-1,
   "If all release corridors are full, defer the bonus treat");
 assert.equal(yachtBonusTreatLane([{kind:"treat",lane:0,y:44}],0),0,
   "Distant rewards cannot indefinitely block the next wave");
 assert.equal(yachtBonusTreatLane([{kind:"rival",lane:0,driftTo:1,drifted:true,y:10}],0),1,
   "A rival that already drifted must not reserve its former target lane");
});
test("Only the approved undersized skiff and crescent props receive selective scaling",()=>{
 assert.equal(yachtAssetScale("/yacht-dash/obstacles/fishing-skiff.webp"),1.48);
 assert.equal(yachtAssetScale("/yacht-dash/obstacles/moonlight-race-buoy.webp"),1.38);
 assert.equal(yachtAssetScale("/yacht-dash/obstacles/regatta-beacon.webp"),1.38);
 assert.equal(yachtAssetScale("/yacht-dash/obstacles/reef-rocks.webp"),1);
 assert.equal(yachtAssetScale(null),1);
});
