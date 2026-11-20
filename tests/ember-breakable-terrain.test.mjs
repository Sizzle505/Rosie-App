import assert from "node:assert/strict";
import {test} from "node:test";
import {DRILL_ANCHOR,DRILL_TIP_OFFSET,DRILL_TIP_VERTICAL_OFFSET,newRun,triggerTurbo,updateRun} from "../src/emberDrillEngine.js";
import {FORMATION_LAYOUT,formationClearance} from "../src/emberTunnelLayout.js";

function approach(s,b){
  s.objects=[];
  s.scroll=b.x-DRILL_ANCHOR-DRILL_TIP_OFFSET-45;
  s.y=b.y-DRILL_TIP_VERTICAL_OFFSET;
  s.hitCooldown=100;
}
function moveThrough(s,steps=8){
  for(let i=0;i<steps;i++)updateRun(s,.045);
}
test("optional dig sites spawn on the existing course without random variation",()=>{
  const a=newRun(8),b=newRun(9);
  assert.deepEqual(a.breakables,b.breakables);
  assert.equal(a.breakables.length,5);
  assert.equal(a.wallsBroken,0);
  assert.equal(a.relics,0);
});
test("ordinary auger breaks earth and awards treasure charge",()=>{
  const s=newRun();
  const b=s.breakables.find(item=>item.material==="earth");
  approach(s,b);
  moveThrough(s,8);
  assert.equal(b.broken,true);
  assert.equal(s.wallsBroken,1);
  assert.ok(s.charge>0);
  assert.ok(s.score>=125);
});
test("crystals reject ordinary drilling but break under Turbo",()=>{
  const s=newRun();
  const b=s.breakables.find(item=>item.material==="crystal");
  approach(s,b);
  moveThrough(s,7);
  assert.equal(b.broken,false);
  assert.equal(b.integrity,b.maxIntegrity);
  approach(s,b);
  s.charge=100;
  assert.equal(triggerTurbo(s),true);
  moveThrough(s,8);
  assert.equal(b.broken,true);
  assert.equal(s.wallsBroken,1);
});
test("digging a hidden chamber unlocks one relic and spawns treasure",()=>{
  const s=newRun();
  const b=s.breakables.find(item=>item.material==="entrance");
  approach(s,b);
  moveThrough(s,9);
  assert.equal(b.broken,true);
  assert.equal(s.secrets,1);
  assert.equal(s.relics,1);
  assert.ok(s.objects.some(o=>o.kind==="cache"));
});

test("the full visible footprint of every dig site avoids existing solid same-side formations",()=>{
  const run=newRun();
  for(const b of run.breakables){
    const half=b.material==="entrance"?122:86;
    for(const f of FORMATION_LAYOUT){
      if(!f.obstacle||f.side!==b.side)continue;
      for(const x of [b.x-half,b.x,b.x+half]){
        assert.equal(formationClearance(f,x),0,
          b.id+" overlaps original "+f.key+" at "+x);
      }
    }
  }
});
