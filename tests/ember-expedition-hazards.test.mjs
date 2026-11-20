import assert from "node:assert/strict";
import {test} from "node:test";
import {DRILL_ANCHOR,DRILL_TIP_OFFSET,DRILL_TIP_VERTICAL_OFFSET,newRun,
  tunnelCenter,tunnelRadius,updateRun,triggerTurbo} from "../src/emberDrillEngine.js";
import {makeExpeditionHazards,EXPEDITION_HAZARD_LAYOUT,expeditionHazardReach,
  updateExpeditionHazards} from "../src/emberExpeditionHazards.js";
import {FORMATION_LAYOUT,formationClearance} from "../src/emberTunnelLayout.js";
import {excavationNotice} from "../src/emberBreakableFeedback.js";

function pose(s,h,gap=48,atWall=true){
 s.objects=[];s.breakables=[];s.crystalShutters=[];
 s.formationHits=FORMATION_LAYOUT.map(f=>f.at);
 s.scroll=h.x-DRILL_ANCHOR-DRILL_TIP_OFFSET-gap;
 const edge=tunnelCenter(h.x)+h.side*tunnelRadius(h.x);
 s.y=(atWall?edge-h.side*122:tunnelCenter(h.x))-DRILL_TIP_VERTICAL_OFFSET;
 s.pitch=0;
}
test("the classic game has no new world hazards, but the five-world routes do",()=>{
 assert.equal(newRun().worldHazards.length,0);
 assert.deepEqual([0,1,2,3,4].map(i=>newRun(1467,i).worldHazards.length),[0,1,2,3,2]);
 assert.equal(EXPEDITION_HAZARD_LAYOUT.length,8);
 assert.deepEqual(makeExpeditionHazards(3).map(h=>h.kind),["geyser","basalt","geyser"]);
});
test("hazards occupy deliberately clear, reachable sides of the original cave",()=>{
 for(const h of EXPEDITION_HAZARD_LAYOUT){
   for(const f of FORMATION_LAYOUT){
     if(!f.obstacle||f.side!==h.side)continue;
     for(const x of [h.x-95,h.x,h.x+95]){
       assert.ok(formationClearance(f,x)<31,
         h.id+" overlaps existing geological collision "+f.key+" at x="+x);
     }
   }
 }
});
test("all mechanical hazards visibly extend and retract with predictable geometry",()=>{
 for(const h of EXPEDITION_HAZARD_LAYOUT){
   const a=expeditionHazardReach(h,420);
   const b=expeditionHazardReach(h,220);
   const c=expeditionHazardReach(h,60);
   const d=expeditionHazardReach(h,-265);
   assert.equal(a,18);
   assert.ok(b>a);
   assert.equal(c,h.maxReach);
   assert.equal(d,0);
 }
});
test("Ruby trap shows a warning before arrival, then collision costs only one hull",()=>{
 const s=newRun(1467,1),h=s.worldHazards[0];
 pose(s,h,450,false);
 updateRun(s,.016);
 assert.ok(s.events.some(e=>e.type==="world-hazard-warning"));
 assert.equal(s.hull,5);
 pose(s,h,48,true);
 updateRun(s,.016);
 assert.equal(h.hit,true);
 assert.equal(s.hull,4);
 for(let i=0;i<5;i++)updateRun(s,.016);
 assert.equal(s.hull,4);
 assert.equal(s.worldObjective,false);
});
test("a safely dodged Clockwork piston earns one bonus and is not farmable",()=>{
 const s=newRun(1467,2),h=s.worldHazards[0];
 pose(s,h,350,false);
 s.hitCooldown=100;
 for(let i=0;i<46;i++){
   s.y=tunnelCenter(s.scroll+DRILL_ANCHOR)-DRILL_TIP_VERTICAL_OFFSET;
   updateRun(s,.045);
 }
 assert.equal(h.hit,false);
 assert.equal(h.resolved,true);
 assert.equal(s.worldObjective,true);
 assert.equal(s.objectiveBonus,375);
 const bonus=s.objectiveBonus,score=s.score;
 for(let i=0;i<6;i++)updateRun(s,.045);
 assert.equal(s.objectiveBonus,bonus);
 assert.equal(h.resolved,true);
 assert.ok(s.score>=score);
});
test("Turbo shatters a Molten geyser without damage and pays the world objective",()=>{
 const s=newRun(1467,3),h=s.worldHazards[0];
 pose(s,h,48,true);
 s.charge=100;
 assert.equal(triggerTurbo(s),true);
 updateRun(s,.016);
 assert.equal(h.shattered,true);
 assert.equal(h.hit,true);
 assert.equal(s.hull,5);
 assert.equal(s.objectiveBonus,425);
 assert.ok(s.events.some(e=>e.type==="world-hazard-shatter"));
});
test("ceiling basalt warns before dropping, and safe center passage earns no repeated reward",()=>{
 const s=newRun(1467,3),rock=s.worldHazards.find(h=>h.kind==="basalt");
 assert.ok(rock&&rock.side===-1);
 pose(s,rock,360,false);
 s.hitCooldown=100;
 updateRun(s,.016);
 assert.ok(s.events.some(e=>e.type==="world-hazard-warning"&&e.kind==="basalt"));
 assert.equal(rock.hit,false);
 for(let i=0;i<50;i++){
   s.y=tunnelCenter(s.scroll+DRILL_ANCHOR)-DRILL_TIP_VERTICAL_OFFSET;
   updateRun(s,.045);
 }
 assert.equal(rock.hit,false);
 assert.equal(rock.resolved,true);
 assert.equal(s.worldObjective,true);
 assert.equal(s.objectiveBonus,425);
 const bonus=s.objectiveBonus;
 for(let i=0;i<5;i++)updateRun(s,.045);
 assert.equal(s.objectiveBonus,bonus);
 const message=excavationNotice({type:"world-hazard-warning",kind:"basalt",side:-1});
 assert.match(message.title,/BASALT/);
 assert.match(message.detail,/ceiling/i);
});
test("passing a Royal burst from behind cannot award a phantom dodge",()=>{
 const s=newRun(1467,4),h=s.worldHazards[0];
 pose(s,h,-300,false);
 const score=s.score;
 updateRun(s,.045);
 assert.equal(h.resolved,true);
 assert.equal(s.score,score);
 assert.equal(s.worldObjective,false);
});
test("warning and bonus notices identify different gameplay hazards",()=>{
 const w=excavationNotice({type:"world-hazard-warning",kind:"geyser",side:1});
 assert.match(w.title,/GEYSER/);
 assert.equal(w.placement,"top");
 assert.match(excavationNotice({type:"world-hazard-shatter"}).detail,/175/);
 assert.match(excavationNotice({type:"world-objective-complete",points:500}).detail,/500/);
});
