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

test('only selected cabinet receives inputs; held actions must release after switching or disconnecting',()=>{
 const listeners={},events={},pending=new Map();let next=0,pads=[];
 const doc={hidden:false,hasFocus:()=>true,body:{closest:()=>null},documentElement:{closest:()=>null},addEventListener:(n,fn)=>listeners[n]=fn,removeEventListener:n=>delete listeners[n]};
 doc.activeElement=doc.body;
 const root=()=>({isConnected:true,contains(el){return el===this;},closest:()=>null,getClientRects:()=>[1],getBoundingClientRect:()=>({left:0,top:0,right:100,bottom:100}),setAttribute(n,v){this[n]=v;},removeAttribute(n){delete this[n];}});
 const context=vm.createContext({document:doc,navigator:{getGamepads:()=>pads},innerWidth:100,innerHeight:100,requestAnimationFrame:fn=>{pending.set(++next,fn);return next;},cancelAnimationFrame:id=>pending.delete(id),addEventListener:(n,fn)=>events[n]=fn,removeEventListener:n=>delete events[n]});
 vm.runInContext(readFileSync(new URL('../public/captain-gamepad.js',import.meta.url),'utf8'),context);
 const a=root(),b=root(),calls=[],releases=[];
 const stopA=context.RosieGamepad.subscribe(a,f=>calls.push(['a',f.pressed.a]),()=>releases.push('a'));
 const stopB=context.RosieGamepad.subscribe(b,f=>calls.push(['b',f.pressed.a]),()=>releases.push('b'));
 const step=(buttons=[],axes=[0,0,0,0])=>{pads=[{...pad(axes,buttons),mapping:'standard',connected:true,index:0}];const [id,cb]=pending.entries().next().value;pending.delete(id);cb(id*16);};
 listeners.pointerdown({target:a});step([0]);assert.deepEqual(calls,[]);step();step([0]);assert.deepEqual(calls,[['a',true]]);
 listeners.pointerdown({target:b});step([0]);assert.deepEqual(releases,['a']);assert.equal(a['data-gamepad'],undefined);assert.equal(b['data-gamepad'],'connected');
 step();step([0]);assert.deepEqual(calls,[['a',true],['b',true]]);
 events.gamepaddisconnected();assert.deepEqual(releases,['a','b']);assert.equal(b['data-gamepad'],undefined);
 step([0]);assert.equal(calls.length,2);stopA();stopB();assert.equal(pending.size,0);
});
