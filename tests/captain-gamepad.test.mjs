import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const ctx=vm.createContext({});
vm.runInContext(readFileSync(new URL('../public/captain-gamepad.js',import.meta.url),'utf8'),ctx);
const api=ctx.RosieGamepad;
const pad=(axes=[0,0,0,0],indices=[])=>({axes,buttons:Array.from({length:17},(_,i)=>({pressed:indices.includes(i),value:indices.includes(i)?1:0}))});
test('dead zone, dominant cardinal direction and independent aim',()=>{
 assert.equal(api.read(pad([.1,-.2,0,0])).move,null);
 assert.equal(api.read(pad([.8,.4,0,-.9])).move,'right');
 assert.equal(api.read(pad([.8,.4,0,-.9])).aim,'up');
});
test('D-pad takes priority and has no perpendicular drift',()=>{
 const f=api.read(pad([.9,.7,0,0],[12]));assert.equal(f.x,0);assert.equal(f.y,-1);assert.equal(f.move,'up');
});
test('triggers and face buttons fire on press only; neutral clears latch',()=>{
 const idle=api.read(pad()),held=api.read(pad(undefined,[0,6,7,9]));
 assert.equal(api.neutral(idle),true);assert.equal(api.neutral(held),false);
 for(const b of ['a','lt','rt','start']){assert.equal(api.edges(held,idle)[b],true);assert.equal(api.edges(held,held)[b],false);}
});
test('lane repeats at controlled rate, releases and reverses immediately',()=>{
 const state={value:0,next:0};assert.equal(api.repeatAxis(state,1,0),1);assert.equal(api.repeatAxis(state,1,100),0);assert.equal(api.repeatAxis(state,1,320),1);assert.equal(api.repeatAxis(state,-1,330),-1);assert.equal(api.repeatAxis(state,0,331),0);assert.equal(api.repeatAxis(state,1,332),1);
});
