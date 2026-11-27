import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {newRun} from "../src/emberDrillEngine.js";
import {paintDrill} from "../src/emberDrillPainter.js";

// Tidy round: a cold-loaded Molten run soft-locked on its first frame. The
// pickup fallback pushes particles with NO `type` when the treasure-absorb
// atlas has not finished loading, and the painter called p.type.startsWith
// unguarded — a TypeError that skipped the loop's only rAF reschedule and
// froze the timer at 40s forever. The painter must render typeless
// particles as plain circles, exactly like the JSX update loop already did
// (`if(!p.type?.startsWith("fx-"))`).

// A Proxy stub 2D context: any method is a no-op, property writes are
// accepted, gradients return an object with addColorStop.
function stubContext(){
  const gradient={addColorStop(){}};
  return new Proxy({canvas:{width:690,height:820}},{
    get(t,prop){
      if(prop==="createLinearGradient"||prop==="createRadialGradient")return ()=>gradient;
      if(prop==="measureText")return ()=>({width:0});
      if(prop in t)return t[prop];
      return ()=>{};
    },
    set(t,prop,value){t[prop]=value;return true;}
  });
}

// The exact shape the pickup/shatter/boss-hit fallbacks push: no `type`.
const typeless={x:300,y:400,vx:10,vy:-5,life:.5,max:.5,r:2,color:"#ffd182"};

test("paintDrill renders typeless fallback particles instead of throwing",()=>{
  const s=newRun(1467,3);
  const ctx=stubContext();
  assert.doesNotThrow(()=>paintDrill(ctx,s,false,[{...typeless}],{},1));
  // The other particle kinds still paint.
  assert.doesNotThrow(()=>paintDrill(ctx,s,false,[{...typeless,type:"fx-treasure-absorb"}],{},1));
  assert.doesNotThrow(()=>paintDrill(ctx,s,false,[{...typeless,type:"break-v2"}],{},1));
  assert.doesNotThrow(()=>paintDrill(ctx,s,false,[{...typeless,type:"cache-burst"}],{},1));
  assert.doesNotThrow(()=>paintDrill(ctx,s,false,[],{},1));
  // A mixed burst, as a real frame carries after a pickup + a shatter.
  assert.doesNotThrow(()=>paintDrill(ctx,s,false,[
    {...typeless},
    {...typeless,type:"fx-treasure-absorb"},
    {...typeless,type:"break-v2"},
    {...typeless,x:320,y:380},
  ],{},1));
});

test("render loop reschedules in a finally, so no frame throw can kill it",()=>{
  const jsx=readFileSync(new URL("../src/EmberTunnelDrill.jsx",import.meta.url),"utf8");
  // The loop's single reschedule point is the finally; the error itself
  // still propagates so it stays visible in the console.
  assert.ok(jsx.includes("if(alive)raf=requestAnimationFrame(render);"));
  // Exactly two reschedule sites remain: the finally and the initial
  // kick-off after resize(). The old per-early-return reschedules are gone.
  const sites=jsx.match(/requestAnimationFrame\(render\)/g)||[];
  assert.equal(sites.length,2,"expected finally + kick-off, got "+sites.length);
  // The painter guard itself is present (the primary fix).
  const painter=readFileSync(new URL("../src/emberDrillPainter.js",import.meta.url),"utf8");
  assert.ok(painter.includes("if(p.type?.startsWith(\"fx-\"))"));
});
