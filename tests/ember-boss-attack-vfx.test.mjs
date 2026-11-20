import test from "node:test";
import assert from "node:assert/strict";
import {bossVfxBounds,paintBossAttackVfx} from "../src/emberBossAttackVfx.js";

function fakeCanvas(){
 const clips=[];
 const c={clips,
  save(){},restore(){},beginPath(){},clip(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},translate(){},rotate(){},
  rect(...args){clips.push(args);},
  createRadialGradient(){return {addColorStop(){}}}
 };
 return c;
}
test("attack art obeys the collision-aligned danger lanes and never extends warning outside them",()=>{
 const expected={
  "spark-bolt":[154,346],"fireball":[154,346],
  "gear-sweep":[275,500],"quake":[275,500],
  "burrow":[300,500],"earth-burst":[0,215]
 };
 const run={boss:{kind:"copperjack"},bossY:250,time:1.3};
 for(const [attack,[top,bottom]] of Object.entries(expected)){
  assert.deepEqual(bossVfxBounds(attack,250,500),{top,bottom});
  for(const phase of ["warning","active"]){
   const c=fakeCanvas();
   assert.equal(paintBossAttackVfx(c,run,700,500,{attack,phase,progress:.5}),true,attack+" "+phase);
   assert.deepEqual(c.clips[0],[0,top,700,bottom-top],attack+" clipping");
  }
  assert.equal(paintBossAttackVfx(fakeCanvas(),run,700,500,{attack,phase:"recovery",progress:.5}),false);
 }
 assert.equal(bossVfxBounds("missing",250,500),null);
 assert.equal(bossVfxBounds("spark-bolt",NaN,500),null);
 assert.equal(paintBossAttackVfx(fakeCanvas(),{},700,500,{attack:"burrow",phase:"active",progress:.5}),false);
});
