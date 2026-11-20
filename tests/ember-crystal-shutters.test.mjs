import assert from "node:assert/strict";
import {test} from "node:test";
import {DRILL_ANCHOR,DRILL_TIP_OFFSET,DRILL_TIP_VERTICAL_OFFSET,newRun,
  tunnelCenter,tunnelRadius,updateRun,triggerTurbo} from "../src/emberDrillEngine.js";
import {makeCrystalShutters,shutterReach} from "../src/emberCrystalShutters.js";
import {FORMATION_LAYOUT,formationClearance} from "../src/emberTunnelLayout.js";

function approach(run,h,gap=48,nearWall=true,clearWalls=true){
 run.objects=[];if(clearWalls)run.breakables=[];
 run.scroll=h.x-DRILL_ANCHOR-DRILL_TIP_OFFSET-gap;
 const edge=tunnelCenter(h.x)+h.side*tunnelRadius(h.x);
 const tipY=nearWall ? edge-h.side*124 : tunnelCenter(h.x);
 run.y=tipY-DRILL_TIP_VERTICAL_OFFSET;
 run.pitch=0;
}
test("crystal shutter sites are deterministic, spaced and avoid solid formations",()=>{
 const a=makeCrystalShutters(),b=makeCrystalShutters();
 assert.deepEqual(a,b);
 assert.equal(a.length,3);
 assert.ok(a.every(h=>h.maxReach<180&&h.maxReach>100));
 for(const h of a){
   for(const f of FORMATION_LAYOUT){
     if(!f.obstacle||f.side!==h.side)continue;
     for(const x of [h.x-115,h.x,h.x+115])
       assert.equal(formationClearance(f,x),0,"shutter overlaps "+f.key+" at "+x);
   }
 }
});
test("shutters extend smoothly, remain anchored and retract after passing",()=>{
 const h=makeCrystalShutters()[0];
 const values=[700,300,210,95,0,-100,-175,-265,-400].map(g=>shutterReach(h,g));
 assert.equal(values[0],24);
 assert.ok(values[2]>values[1]);
 assert.equal(values[3],h.maxReach);
 assert.equal(values[4],h.maxReach);
 assert.ok(values[6]<h.maxReach);
 assert.equal(values[7],0);
 assert.equal(values[8],0);
});
test("warning arrives before a moving shelf can hit, and is emitted once",()=>{
 const s=newRun(),h=s.crystalShutters[0];
 approach(s,h,510,false);
 updateRun(s,.016);
 assert.ok(s.events.some(e=>e.type==="shutter-warning"));
 assert.equal(s.hull,5);
 updateRun(s,.016);
 assert.equal(s.events.filter(e=>e.type==="shutter-warning").length,0);
});
test("unpowered contact costs just one hull and Turbo destroys the shelf safely",()=>{
 const a=newRun(),ha=a.crystalShutters[0];
 approach(a,ha);
 updateRun(a,.016);
 assert.equal(ha.hit,true);
 assert.equal(a.hull,4);
 for(let i=0;i<3;i++)updateRun(a,.016);
 assert.equal(a.hull,4);
 const b=newRun(),hb=b.crystalShutters[0];
 approach(b,hb);b.charge=100;
 assert.equal(triggerTurbo(b),true);
 updateRun(b,.016);
 assert.equal(hb.shattered,true);
 assert.equal(b.hull,5);
 assert.ok(b.events.some(e=>e.type==="shutter-shatter"));
 assert.ok(b.score>=150);
});
test("safe maneuver earns one-time dodge points and mission bonus in Ruby",()=>{
 const s=newRun(),h=s.crystalShutters.find(h=>h.id==="ruby-shutter");
 approach(s,h,75,false);
 for(let i=0;i<18;i++){
   s.y=tunnelCenter(s.scroll+DRILL_ANCHOR)-DRILL_TIP_VERTICAL_OFFSET;
   updateRun(s,.045);
 }
 assert.equal(h.resolved,true);
 assert.equal(h.hit,false);
 assert.equal(s.hazardsDodged,1);
 assert.equal(s.objectives.ruby,true);
 assert.equal(s.objectiveBonus,350);
 assert.ok(s.score>=450);
 const score=s.score;
 for(let i=0;i<8;i++)updateRun(s,.045);
 assert.equal(s.hazardsDodged,1);
 assert.equal(s.objectiveBonus,350);
 assert.ok(s.score>=score);
});
test("Barkroot mission rewards the first earth excavation only once",()=>{
 const s=newRun(),b=s.breakables.find(b=>b.material==="earth");
 approach(s,b,48,true,false);
 s.y=b.y-DRILL_TIP_VERTICAL_OFFSET;
 s.hitCooldown=100;
 for(let i=0;i<12;i++)updateRun(s,.045);
 assert.equal(b.broken,true);
 assert.equal(s.objectives.barkroot,true);
 assert.equal(s.objectiveBonus,250);
 for(let i=0;i<4;i++)updateRun(s,.045);
 assert.equal(s.objectiveBonus,250);
});
