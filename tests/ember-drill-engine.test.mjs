import assert from "node:assert/strict";
import { test } from "node:test";
import { DRILL_ANCHOR, DRILL_TIP_OFFSET, DRILL_HEIGHT, RUN_DURATION, makeCourse, newRun, tunnelCenter, triggerTurbo, updateRun } from "../src/emberDrillEngine.js";

test("same seed gives reproducible treasure and hazard placement",()=>{
  assert.deepEqual(makeCourse(15),makeCourse(15));
  assert.notDeepEqual(makeCourse(15),makeCourse(16));
});
test("run begins centered with full hull and a genuine 75-second duration",()=>{
  const s=newRun();
  assert.equal(s.hull,3);
  assert.equal(s.y,tunnelCenter(DRILL_ANCHOR));
  assert.equal(s.score,0);
  assert.equal(RUN_DURATION,75);
});
test("holding up climbs, holding down dives, releasing levels the nose",()=>{
  const s=newRun();
  const initialY=s.y;
  for(let i=0;i<25;i++) updateRun(s,.016,true,false);
  assert.ok(s.y<initialY,"up should decrease vertical position");
  assert.ok(s.pitch<0,"up should pitch nose upward");
  const upY=s.y;
  for(let i=0;i<50;i++) updateRun(s,.016,false,true);
  assert.ok(s.y>upY,"down should increase vertical position");
  const pitched=s.pitch;
  for(let i=0;i<60;i++) updateRun(s,.016,false,false);
  assert.ok(Math.abs(s.pitch)<Math.abs(pitched),"release should level the drill");
});
test("world scrolls rightward while player's screen x stays anchored",()=>{
  const s=newRun();
  const initial=s.scroll;
  for(let i=0;i<10;i++)updateRun(s,.016,false,false);
  assert.ok(s.scroll>initial);
  assert.equal(DRILL_ANCHOR,210);
});
test("treasure pickups increase score and turbo charge",()=>{
  const s=newRun();
  const worldX=s.scroll+DRILL_ANCHOR;
  s.objects=[{id:1,kind:"bone",x:worldX+3,y:s.y,radius:20,taken:false}];
  updateRun(s,.016);
  assert.ok(s.score>0);
  assert.ok(s.charge>0);
  assert.equal(s.bones,1);
  assert.equal(s.objects[0].taken,true);
});
test("hazards cost a hull point, with a collision grace period",()=>{
  const s=newRun();
  const x=s.scroll+DRILL_ANCHOR;
  s.objects=[{id:1,kind:"rock",x:x+DRILL_TIP_OFFSET+5,y:s.y,radius:40,taken:false},{id:2,kind:"spike",x:x+DRILL_TIP_OFFSET+9,y:s.y,radius:35,taken:false}];
  updateRun(s,.016);
  assert.equal(s.hull,2);
  assert.ok(s.hitCooldown>0);
});
test("fully charged turbo is triggered by player and smashes hazards safely",()=>{
  const s=newRun();s.charge=100;
  assert.equal(triggerTurbo(s),true);
  assert.ok(s.boostTime>0);
  assert.equal(s.charge,0);
  const x=s.scroll+DRILL_ANCHOR;
  s.objects=[{id:1,kind:"spike",x:x+DRILL_TIP_OFFSET+5,y:s.y,radius:35,taken:false}];
  updateRun(s,.016);
  assert.equal(s.hull,3);
  assert.ok(s.score>0);
});
test("run ends in a win after 75 seconds if hull survives",()=>{
  const s=newRun();s.objects=[];
  // This test checks the precise 75-second clock, independently of course
  // difficulty. Invulnerability is intentional rather than claiming a
  // stationary centerline pilot can dodge the new original-source obstacles.
  s.hitCooldown=RUN_DURATION+1;
  for(let i=0;i<2500&&!s.ended;i++){
    s.y=tunnelCenter(s.scroll+DRILL_ANCHOR);
    updateRun(s,.04);
    s.hitCooldown=RUN_DURATION+1;
  }
  assert.equal(s.ended,true);
  assert.equal(s.result,"complete");
  assert.equal(s.time,75);
});
test("run fails when all three hull points are lost",()=>{
  const s=newRun();s.objects=[];
  for(let i=0;i<3;i++){
    s.hitCooldown=0;
    s.y=DRILL_HEIGHT-65;
    updateRun(s,.016);
  }
  assert.equal(s.ended,true);
  assert.equal(s.result,"hull");
});