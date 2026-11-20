import test from "node:test";
import assert from "node:assert/strict";
import {bossAttackDanger,bossDangerLane} from "../src/emberExpeditionBossStage.js";

test("all six boss attack warnings match their physical damage boundaries",()=>{
 const y=250;
 const expectations=[
  ["spark-bolt",154,346],["fireball",154,346],
  ["gear-sweep",275,Infinity],["quake",275,Infinity],
  ["burrow",300,Infinity],["earth-burst",-Infinity,215]
 ];
 for(const [attack,top,bottom] of expectations){
  assert.deepEqual(bossDangerLane(attack,y),{top,bottom});
  const b={attack,phase:"active"};
  assert.equal(bossAttackDanger(b,top,y),false,attack+" inclusive start");
  if(Number.isFinite(bottom))assert.equal(bossAttackDanger(b,bottom,y),false,attack+" inclusive end");
  const inside=Number.isFinite(top)&&Number.isFinite(bottom)?(top+bottom)/2:Number.isFinite(top)?top+1:bottom-1;
  assert.equal(bossAttackDanger(b,inside,y),true,attack+" inside");
  assert.equal(bossAttackDanger({...b,phase:"warning"},inside,y),false,attack+" warning is safe");
  assert.equal(bossAttackDanger({...b,phase:"recovery"},inside,y),false,attack+" recovery is safe");
 }
 assert.equal(bossDangerLane("unknown",y),null);
 assert.equal(bossAttackDanger({attack:"unknown",phase:"active"},250,y),false);
 assert.equal(bossAttackDanger({attack:"burrow",phase:"active"},NaN,y),false);
});
