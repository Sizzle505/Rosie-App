import assert from "node:assert/strict";
import {test} from "node:test";
import {paintBarkrootArrival,paintRecoveredTurboTrail,BARKROOT_GATE_WORLD_X}
  from "../src/emberRecoveredArtAccents.js";
import {newRun} from "../src/emberDrillEngine.js";

function mockCanvas(){
  const draws=[];
  const context={
    globalAlpha:1,globalCompositeOperation:"source-over",
    save(){},restore(){},translate(){},beginPath(){},ellipse(){},clip(){},
    drawImage(...args){draws.push(args);}
  };
  return {context,draws};
}
const asset=(w,h)=>({complete:true,naturalWidth:w,naturalHeight:h});
test("recovered gate is a decorative Barkroot-only background, never a classic obstacle",()=>{
  const {context,draws}=mockCanvas();
  const assets={terrainPassageGate:asset(280,280)};
  const classic=newRun();
  assert.equal(paintBarkrootArrival(context,classic,assets,690),false);
  assert.equal(draws.length,0);
  const ruby=newRun(1467,1);
  assert.equal(paintBarkrootArrival(context,ruby,assets,690),false);
  const barkroot=newRun(1467,0);
  assert.equal(paintBarkrootArrival(context,barkroot,assets,690),true);
  assert.equal(draws.length,1);
  const [img,sx,sy,sw,sh]=draws[0];
  assert.equal(img,assets.terrainPassageGate);
  assert.ok(sx>70&&sy>70);
  assert.ok(sx+sw<=190,"damaged right-hand stripe must be excluded");
  assert.ok(sh>100&&sh<150);
  barkroot.scroll=BARKROOT_GATE_WORLD_X+200;
  assert.equal(paintBarkrootArrival(context,barkroot,assets,690),false);
  assert.equal(draws.length,1);
  barkroot.scroll=0;
  assert.equal(paintBarkrootArrival(context,barkroot,{},690),false);
});
test("recovered Turbo flame excludes its duplicate right-hand drill silhouette",()=>{
  const {context,draws}=mockCanvas();
  const s=newRun();
  const assets={boosttrail:asset(390,120)};
  assert.equal(paintRecoveredTurboTrail(context,s,assets),false);
  s.boostTime=1.5;
  assert.equal(paintRecoveredTurboTrail(context,s,assets),true);
  assert.equal(draws.length,1);
  const [,sx,sy,sw,sh,dx,dy,dw,dh]=draws[0];
  assert.equal(sx,0);assert.equal(sy,0);
  assert.ok(sw<=.45*390,"full auger must never render");
  assert.equal(sh,120);
  assert.ok(dx+dw<0,"plume stays behind the cockpit");
  assert.ok(dy+dh>0);
  assert.equal(paintRecoveredTurboTrail(context,{...s,boostTime:0},assets),false);
  assert.equal(paintRecoveredTurboTrail(context,s,{}),false);
  assert.equal(draws.length,1);
});
