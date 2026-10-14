import test from "node:test";
import assert from "node:assert/strict";
import {DRILL_ANCHOR,newRun,updateRun,tunnelCenter,tunnelRadius,intersectsSculpture} from "../src/emberDrillEngine.js";
import {FORMATION_LAYOUT,formationIntrusion,formationClearance} from "../src/emberTunnelLayout.js";

test("corridor expands for sculpted rock and still remains safely inside gameplay canvas",()=>{
 for(const x of [0,900,1880,2700,3900,5350,6800,11000,18000,25000]){
  const r=tunnelRadius(x), y=tunnelCenter(x);
  assert.ok(r>215 && r<250,'expanded corridor at '+x);
  assert.ok(y-r>=-12 && y+r<=830,'visible tunnel envelope at '+x);
 }
});
test("all placed original formations have visible penetration and valid obstacle profiles",()=>{
 assert.equal(FORMATION_LAYOUT.length,36);
 assert.ok(FORMATION_LAYOUT.filter(x=>x.obstacle).length>=7);
 for(const f of FORMATION_LAYOUT){
  const projected=formationIntrusion(f);
  assert.ok(projected>48 && projected<=129,f.key+' '+projected);
  assert.ok(!f.obstacle || formationClearance(f,f.at)>30,f.key);
  assert.equal(formationClearance(f,f.at+f.width),0);
 }
});
test("overhang hit occurs at drill nose within a conservative painted core only once",()=>{
 const f=FORMATION_LAYOUT.find(x=>x.at===2690);
 assert.ok(f?.obstacle);
 const s=newRun();
 s.objects=[];
 s.scroll=f.at-DRILL_ANCHOR-105;
 const edge=tunnelCenter(f.at)+f.side*tunnelRadius(f.at);
 s.y=edge-f.side*54;
 assert.ok(intersectsSculpture(f,f.at,s.y));
 const hull=s.hull;
 updateRun(s,0);
 assert.equal(s.hull,hull-1);
 assert.deepEqual(s.formationHits,[f.at]);
 s.y=tunnelCenter(f.at); // clear wall contact; preserve the already-hit obstacle
 s.hitCooldown=0;
 updateRun(s,0);
 assert.equal(s.hull,hull-1,'one original formation may cost only one hull point');
});
test("centered player has clear safe route; successful turbo strikes do not cost hull",()=>{
 const f=FORMATION_LAYOUT.find(x=>x.at===5350);
 assert.ok(f?.obstacle);
 const center=tunnelCenter(f.at);
 assert.equal(intersectsSculpture(f,f.at,center),false);
 const s=newRun();s.objects=[];s.scroll=f.at-DRILL_ANCHOR-105;
 s.y=tunnelCenter(f.at)+f.side*tunnelRadius(f.at)-f.side*51;
 s.boostTime=4;
 updateRun(s,0);
 assert.equal(s.hull,3);
 assert.ok(s.score>=125);
 assert.ok(s.events.some(x=>x.type==="shatter"));
});
