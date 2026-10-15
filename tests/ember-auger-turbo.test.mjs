import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
 newRun,triggerTurbo,updateRun,tunnelCenter,DRILL_ANCHOR,
 DRILL_TIP_OFFSET,TURBO_DURATION
} from "../src/emberDrillEngine.js";
import {
 AUGER_SHEET, DRILL_REGISTRATION, JET_SHEET, IMPACT_SHEET,
 augerFrameIndex, augerFrameRect, jetFrameIndex, impactFrameIndex,
 TURBO_ATLAS, turboFrameIndex, turboFrameRect,
} from "../src/emberAugerFX.js";

test("all SIXTEEN registered original frames have unique source rectangles",()=>{
 assert.deepEqual(AUGER_SHEET,{columns:4,rows:4,frameWidth:360,frameHeight:300,frames:16});
 const frames=Array.from({length:16},(_,i)=>augerFrameRect(i));
 assert.equal(new Set(frames.map(f=>f.sx+","+f.sy)).size,16);
 assert.deepEqual(frames[4],{sx:0,sy:300,sw:360,sh:300});
 assert.deepEqual(frames[15],{sx:1080,sy:900,sw:360,sh:300});
 assert.deepEqual(augerFrameRect(16),frames[0]);
 assert.equal(augerFrameIndex(0),0);
 assert.equal(augerFrameIndex(.09,false),1);
 assert.equal(augerFrameIndex(.09,true),2);
 assert.notEqual(augerFrameIndex(.09,true),augerFrameIndex(.09,false));
});
test("the single auger and rear jet have locked vehicle-local geometry",()=>{
 assert.equal(DRILL_REGISTRATION.rootX,63);
 assert.equal(DRILL_REGISTRATION.tipX,DRILL_TIP_OFFSET);
 assert.equal(DRILL_REGISTRATION.nozzleX,-116);
 assert.equal(DRILL_REGISTRATION.nozzleY,4);
 const x=DRILL_REGISTRATION.augerX+345/360*DRILL_REGISTRATION.augerW;
 assert.ok(Math.abs(x-DRILL_TIP_OFFSET)<2,"Source auger tip is physically registered");
 // The physically same two anchors must rotate identically with the hull.
 for(const pitch of [0,-.5,.5]){
  const ship=(x,y)=>({x:DRILL_ANCHOR+x*Math.cos(pitch)-y*Math.sin(pitch),
    y:300+x*Math.sin(pitch)+y*Math.cos(pitch)});
  const tip=ship(DRILL_REGISTRATION.tipX,0);
  assert.ok(Math.abs(tip.x-(DRILL_ANCHOR+DRILL_TIP_OFFSET*Math.cos(pitch)))<1e-7);
  assert.ok(Math.abs(tip.y-(300+DRILL_TIP_OFFSET*Math.sin(pitch)))<1e-7);
  const rear=ship(-116,4);
  assert.ok(rear.x<DRILL_ANCHOR-95,"Exhaust remains behind the vehicle");
 }
});
test("real eight-cell rear jet loops and tip impact is event-driven",()=>{
 assert.equal(JET_SHEET.frames,8);
 assert.equal(IMPACT_SHEET.frames,8);
 assert.equal(jetFrameIndex(0),0);
 assert.equal(jetFrameIndex(.067),1);
 assert.equal(jetFrameIndex(8/15),0);
 assert.equal(impactFrameIndex(0),0);
 assert.equal(impactFrameIndex(.08),2);
 assert.equal(impactFrameIndex(.319),7);
 assert.equal(impactFrameIndex(.32),-1);
 assert.equal(impactFrameIndex(-1),-1);
});
test("approved Rosie poses and exact mechanical source files stay registered",()=>{
 const jsx=readFileSync(new URL("../src/EmberTunnelDrill.jsx",import.meta.url),"utf8");
 const painter=readFileSync(new URL("../src/emberDrillPainter.js",import.meta.url),"utf8");
 for(const name of [
  "steampunk_golden_drill_sprite_sheet.webp",
  "golden_jet_flame_vfx_sprite_sheet.webp",
  "golden_drill_impact_effect_sprite_sheet.webp",
  "wall-turn-neutral.webp","wall-turn-up.webp","wall-turn-down.webp"
 ])assert.ok(jsx.includes(name),name);
 assert.ok(painter.includes("c.rect(-168,-125,236,252)"),"Only baked nose area may be excluded");
 assert.ok(painter.includes("c.translate(DRILL_ANCHOR,s.y);c.rotate(s.pitch)"));
 assert.ok(jsx.includes('if(event.type==="shatter"&&s.boostTime>0)s.tipBurstAt=s.time'));
 assert.ok(jsx.includes("s.tipBurstAt=s.time;"));
});
test("previous ten-frame atlas remains API compatible, but is not overlaid",()=>{
 assert.equal(TURBO_ATLAS.frames,10);
 assert.deepEqual(turboFrameRect(TURBO_DURATION),{sx:0,sy:0,sw:308,sh:126});
 assert.equal(turboFrameIndex(TURBO_DURATION-.12),2);
 const fx=readFileSync(new URL("../src/emberAugerFX.js",import.meta.url),"utf8");
 assert.ok(!fx.includes("c.drawImage(assets.turboAtlas"),"No full ghost drill head");
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
