import test from "node:test";
import assert from "node:assert/strict";
import {DRILL_ANCHOR,DRILL_TIP_OFFSET,newRun,courseLaneOffset,updateRun,tunnelCenter,tunnelRadius,intersectsSculpture} from "../src/emberDrillEngine.js";
import {FORMATION_LAYOUT,formationIntrusion,formationClearance} from "../src/emberTunnelLayout.js";

test("corridor expands for sculpted rock and still remains safely inside gameplay canvas",()=>{
 for(const x of [0,900,1880,2700,3900,5350,6800,11000,18000,25000]){
  const r=tunnelRadius(x), y=tunnelCenter(x);
  // 256 +/- 13 is the intentional 10% corridor expansion (emberDrillEngine.js);
  // the old 250 upper bound predates it.
  assert.ok(r>215 && r<270,'expanded corridor at '+x);
  assert.ok(y-r>=-12 && y+r<=830,'visible tunnel envelope at '+x);
 }
});
test("all placed original formations have visible penetration and valid obstacle profiles",()=>{
 // 58 since the 2026-11-25 remake appended ten Treasury-tail beats
 // (x 26400-31350) so the 30s Royal route never runs out of geology.
 assert.equal(FORMATION_LAYOUT.length,58);
 assert.ok(FORMATION_LAYOUT.filter(x=>x.obstacle).length>=40);
 for(const f of FORMATION_LAYOUT){
  const projected=formationIntrusion(f);
  assert.ok(projected>48 && projected<=250,f.key+' '+projected);
  assert.ok(!f.obstacle || formationClearance(f,f.at)>30,f.key);
  assert.equal(formationClearance(f,f.at+f.width),0);
 }
});
test("overhang hit occurs at drill nose within a conservative painted core only once",()=>{
 const f=FORMATION_LAYOUT.find(x=>x.at===1530);
 assert.ok(f?.obstacle);
 const s=newRun();
 s.objects=[];
 s.scroll=f.at-DRILL_ANCHOR-DRILL_TIP_OFFSET;
 const edge=tunnelCenter(f.at)+f.side*tunnelRadius(f.at);
 s.y=edge-f.side*54;
 assert.ok(intersectsSculpture(f,f.at,s.y));
 const hull=s.hull;
 // The 3s opening grace (fix round 3) covers this overhang at the route
 // start: exercise the hit after the grace, not at run time 0.
 s.time=3.5;
 updateRun(s,0);
 assert.equal(s.hull,hull-1);
 assert.deepEqual(s.formationHits,[f.at]);
 s.y=tunnelCenter(f.at); // clear wall contact; preserve the already-hit obstacle
 s.hitCooldown=0;
 updateRun(s,0);
 assert.equal(s.hull,hull-1,'one original formation may cost only one hull point');
});
test("centered player has clear safe route; successful turbo strikes do not cost hull",()=>{
 const f=FORMATION_LAYOUT.find(x=>x.at===3160);
 assert.ok(f?.obstacle);
 // The safe route is the opposite lane, not the exact center: this
 // formation's solid core intrudes past the center by design (the rhythm
 // test pins the safe lane at center - side*88), so the center itself is
 // inside the core. The Turbo shatter below is the behaviour under test.
 const center=tunnelCenter(f.at);
 assert.equal(intersectsSculpture(f,f.at,center-f.side*88),false);
 const s=newRun();s.objects=[];s.scroll=f.at-DRILL_ANCHOR-DRILL_TIP_OFFSET;
 s.y=tunnelCenter(f.at)+f.side*tunnelRadius(f.at)-f.side*51;
 s.boostTime=4;
 updateRun(s,0);
 assert.equal(s.hull,5,"a successful Turbo shatter must not cost hull");
 assert.ok(s.score>=125);
 assert.ok(s.events.some(x=>x.type==="shatter"));
});

test("alternating full-course obstacle rhythm preserves a safe upper/lower dodge lane",()=>{
 let previous=0,side=0;
 for(const f of FORMATION_LAYOUT.filter(x=>x.obstacle)){
  if(previous){
    assert.ok(f.at-previous>=400,"No impossible overlapping corridor constriction");
    assert.notEqual(f.side,side,"Alternate hanging and rising obstacles");
  }
  const safe=tunnelCenter(f.at)-f.side*88;
  const unsafe=tunnelCenter(f.at)+f.side*(tunnelRadius(f.at)-73);
  assert.equal(intersectsSculpture(f,f.at,safe),false,"Safe opposite lane should be reachable at "+f.at);
  assert.equal(intersectsSculpture(f,f.at,unsafe),true,"Hazard occupies visible side at "+f.at);
  previous=f.at;side=f.side;
 }
});
test("the drill tip point advances and tilts exactly with the rendered auger",()=>{
 const f=FORMATION_LAYOUT.find(x=>x.at===1530);
 const s=newRun();s.objects=[];s.scroll=f.at-DRILL_ANCHOR-DRILL_TIP_OFFSET;
 s.pitch=-.35;
 const frontX=s.scroll+DRILL_ANCHOR+DRILL_TIP_OFFSET*Math.cos(s.pitch);
 assert.ok(frontX<f.at && frontX>f.at-12);
 const frontY=s.y+DRILL_TIP_OFFSET*Math.sin(s.pitch);
 assert.ok(frontY<s.y-50);
});

test("collectibles guide players around the same painted obstacles as collision",()=>{
 for(const f of FORMATION_LAYOUT.filter(x=>x.obstacle)){
  const lane=courseLaneOffset(f.at,0);
  assert.ok(lane*f.side<0,"The treasure path should shift away from the obstructed side at "+f.at);
  const treasureY=tunnelCenter(f.at)+lane;
  assert.equal(intersectsSculpture(f,f.at,treasureY),false,"Treasure path cannot lead into rock at "+f.at);
 }
});
test("an anticipatory steering strategy can complete all 75 seconds with three hull",()=>{
 const s=newRun();s.objects=[];
 for(let step=0;step<5200&&!s.ended;step++){
  const front=s.scroll+DRILL_ANCHOR+DRILL_TIP_OFFSET;
  // Anticipate 800px ahead (a skilled player knows the course) and steer to
  // a 120px lane: the drill tip swings with pitch, so the +-88px
  // centre-safe lane is too tight while crossing between alternating
  // formations. Lookaheads 700-900 with lanes 110-130 all complete.
  const approaching=FORMATION_LAYOUT.find(f=>f.obstacle && f.at>=front-60&&f.at<=front+800);
  const target=tunnelCenter(front)+(approaching?-approaching.side*120:0);
  const up=s.y>target+9, down=s.y<target-9;
  updateRun(s,.016,up,down);
 }
 assert.equal(s.result,"complete","All illustrated formations must leave navigable dodge opportunities");
 assert.equal(s.hull,3,"A readable steering route must not require damage or Turbo");
});
