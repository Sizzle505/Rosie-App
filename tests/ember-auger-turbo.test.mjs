import test from "node:test";
import assert from "node:assert/strict";
import {
 newRun,triggerTurbo,updateRun,tunnelCenter,DRILL_ANCHOR,
 TURBO_DURATION
} from "../src/emberDrillEngine.js";
import {AUGER_SHEET,augerFrameIndex,augerFrameRect,TURBO_ATLAS,turboFrameIndex,turboFrameRect} from "../src/emberAugerFX.js";

test("actual original 8-frame drill head advances and is faster during Turbo",()=>{
 assert.deepEqual(AUGER_SHEET,{columns:4,rows:2,frameWidth:500,frameHeight:410});
 const frames=Array.from({length:8},(_,i)=>augerFrameRect(i));
 assert.equal(new Set(frames.map(f=>f.sx+","+f.sy)).size,8);
 assert.deepEqual(frames[4],{sx:0,sy:410,sw:500,sh:410});
 assert.equal(augerFrameIndex(0),0);
 assert.equal(augerFrameIndex(.06,false),1);
 assert.equal(augerFrameIndex(.06,true),2);
 assert.ok(augerFrameIndex(.07,true)!==augerFrameIndex(.07,false));
});
test("ten true original Turbo frames repeat precisely at 60ms phase boundaries",()=>{
 assert.equal(TURBO_ATLAS.frames,10);
 assert.equal(TURBO_ATLAS.columns,5);
 assert.deepEqual(turboFrameRect(TURBO_DURATION),{sx:0,sy:0,sw:308,sh:126});
 assert.equal(turboFrameIndex(TURBO_DURATION-.12),2);
 assert.deepEqual(turboFrameRect(TURBO_DURATION-.30),{sx:0,sy:126,sw:308,sh:126});
 assert.equal(turboFrameIndex(TURBO_DURATION-.60),0);
});
test("Turbo activation spends a full charge once and accelerates the entire drill",()=>{
 const normal=newRun(),boosted=newRun();
 normal.objects=[];boosted.objects=[];
 assert.equal(triggerTurbo(boosted),false,"No boost before charge");
 boosted.charge=99;
 assert.equal(triggerTurbo(boosted),false,"No rounding up");
 boosted.charge=100;
 assert.equal(triggerTurbo(boosted),true);
 assert.equal(boosted.boostTime,TURBO_DURATION);
 assert.equal(boosted.charge,0);
 assert.equal(triggerTurbo(boosted),false,"Do not double spend an active boost");
 updateRun(normal,.04);
 updateRun(boosted,.04);
 assert.ok(boosted.scroll>normal.scroll*1.4,
  "Burrow Turbo must meaningfully increase forward travel speed");
 assert.equal(boosted.hull,normal.hull);
});
test("Turbo meter drains for 4.8 seconds, expires, and can be recharged",()=>{
 const s=newRun();
 s.objects=[];s.hull=30;s.charge=100;
 assert.equal(triggerTurbo(s),true);
 for(let i=0;i<125;i++){
  s.y=tunnelCenter(s.scroll+DRILL_ANCHOR);
  updateRun(s,.04);
 }
 assert.equal(s.boostTime,0);
 assert.ok(s.time>4.8);
 s.charge=100;
 assert.equal(triggerTurbo(s),true,"New charge should work once prior Turbo expires");
});
