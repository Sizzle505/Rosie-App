import test from 'node:test';
import assert from 'node:assert/strict';
import { screenSignature, normalizeOffset, normalizedLayouts } from './layoutStudioScope.js';

function screen({width=393,height=660,sw=393,sh=852,dpr=3,touch=true}={}) {
  return {
    innerWidth:width, innerHeight:height, devicePixelRatio:dpr,
    screen:{width:sw,height:sh},
    matchMedia:() => ({matches:touch})
  };
}
test('iPhone Safari toolbar changes cannot change a layout screen signature', () => {
  assert.equal(screenSignature(screen({height:660})), screenSignature(screen({height:740})));
});
test('touch displays are isolated by actual logical screen size and orientation', () => {
  const reference = screenSignature(screen());
  assert.notEqual(reference, screenSignature(screen({sw:402,sh:874,width:402})));
  assert.notEqual(reference, screenSignature(screen({width:852,height:393})));
  assert.notEqual(reference, screenSignature(screen({width:350})));
  assert.notEqual(reference, screenSignature(screen({dpr:2})));
});
test('desktop viewport dimensions are exact, not breakpoint approximations', () => {
  const reference = screenSignature(screen({touch:false,width:1440,height:900,dpr:1}));
  assert.notEqual(reference, screenSignature(screen({touch:false,width:1440,height:901,dpr:1})));
  assert.notEqual(reference, screenSignature(screen({touch:false,width:1439,height:900,dpr:1})));
});
test('normalizeOffset constrains values and rejects nonfinite numbers', () => {
  assert.deepEqual(normalizeOffset({x:5000,y:-5000,scale:8}), {x:2500,y:-2500,scale:3,rotate:0});
  assert.deepEqual(normalizeOffset({x:'oops',y:Infinity,scale:NaN}), {x:0,y:0,scale:1,rotate:0});
});
test('layouts never add unknown pages or selectors', () => {
  const targets = {haiku:[['scroll','Scroll','.haiku-scroll']],fortune:[['machine','Machine','.machine']]};
  const result = normalizedLayouts({
    haiku:{scroll:{x:20,y:10,scale:1,rotate:0},unknown:{x:500,y:30,scale:2}},
    fortune:{machine:{x:0,y:0,scale:1}},
    private:{secret:{x:100,y:0,scale:1}}
  }, targets);
  assert.deepEqual(result,{haiku:{scroll:{x:20,y:10,scale:1,rotate:0}}});
});
