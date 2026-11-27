import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/cosmic-odyssey/maze-layout.js';
const {phone}=globalThis.CosmicMazeLayout;
const coverage=(width,height,layout)=>{
 const tile=Math.min((width-10)/layout.cols,(height-10)/layout.rows);
 return {width:layout.cols*tile/(width-10),height:layout.rows*tile/(height-10)};
};
test('short phone playfields keep the designed tall maze',()=>{
 // Repinned 2026-11-26 to Mitchell's direction: the gameplay window is
 // limited only by the screen width with height significantly beyond
 // its width, as designed — a short playfield must not collapse the
 // maze toward square. The 11x15 design holds; the fit uses the full
 // height and however much width the tall maze needs.
 const layout=phone(348,350),fit=coverage(348,350,layout);
 assert.equal(layout.rows,15);
 assert.ok(layout.rows>layout.cols);
 assert.ok(fit.height>.95);
});
test('taller playfields retain a tall maze with square cells',()=>{
 const layout=phone(363,470),fit=coverage(363,470,layout);
 assert.ok(layout.rows>=13);
 assert.ok(fit.width>.9&&fit.height>.9);
});
test('phone layouts remain compatible with the odd-cell maze generator',()=>{
 for(const width of [320,348,375,414])for(const height of [300,380,470,560]){
  const {cols,rows}=phone(width,height);
  assert.equal(cols%2,1);assert.equal(rows%2,1);
  assert.ok(cols>=11&&rows>=11&&rows<=19);
 }
});
