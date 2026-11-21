import test from 'node:test';
import assert from 'node:assert/strict';
import {boxFromPoints,pickMarquee,alignmentSnap,distribute,edgeSpeed,filterNestedSelection} from './layoutStudioGeometry.js';

const box=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
test('marquee selects crossed elements while leaving others untouched',()=>{
 const a=[{id:'one',rect:box(10,10,50,40)},{id:'two',rect:box(80,10,50,40)},{id:'three',rect:box(250,10,40,40)}];
 assert.deepEqual(pickMarquee(a,boxFromPoints(2,0,155,70)),['one','two']);
});
test('snap aligns centers and edges within tolerance only',()=>{
 const snap=alignmentSnap(box(111,85,40,30),[box(100,100,60,30)],9);
 assert.equal(snap.dx,-1);assert.equal(snap.dy,0); // center lines coincide within tolerance
 assert.equal(alignmentSnap(box(117,110,40,30),[box(100,100,60,30)],9).dx,3);
});
test('spacing normalization preserves order and supports manual gap',()=>{
 const a=[{id:'a',rect:box(0,0,20,10)},{id:'b',rect:box(40,0,20,10)},{id:'c',rect:box(100,0,20,10)}];
 assert.deepEqual(distribute(a,'x',15).map(x=>x.delta),[0,-5,-30]);
 assert.deepEqual(distribute(a,'x',null).map(x=>x.delta),[0,10,0]);
});
test('edge-scroll permits motion while finger remains on border',()=>{
 assert.ok(edgeSpeed(4,800)<0);
 assert.ok(edgeSpeed(790,800)>0);
 assert.equal(edgeSpeed(400,800),0);
});
test('nested targets cannot be moved twice in one drag',()=>{
 const parent={contains:()=>true},child={contains:n=>n===child};
 assert.deepEqual(filterNestedSelection([{id:'p',node:parent},{id:'c',node:child}],['p','c']),['c']);
});
