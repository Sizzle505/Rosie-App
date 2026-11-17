import { chromium } from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";

const baseline = "http://127.0.0.1:5174/#qr-atelier";
const candidate = "http://127.0.0.1:5173/#qr-atelier";
const selectors = Object.freeze({
  panel: ".qa-panel",
  palettes: ".qa-finish-strip .qa-palettes",
  collection: ".qa-collection",
  "preview-actions": ".qa-preview-actions",
  inputs: ".qa-inputs",
  finishes: ".qa-finish-strip",
  title: ".qa-title"
});
const approved = Object.freeze({
  panel: [0, 99, 1.19],
  palettes: [0, 1, 1],
  collection: [56, 202, 1],
  "preview-actions": [0, -17, 1],
  inputs: [2, 1, 1],
  finishes: [1, 4, 1],
  title: [-28, 37, 1]
});
const browser = await chromium.launch({headless:true});
await fs.mkdir("artifacts/qr-20261117", {recursive:true});

async function loaded(page) {
  await page.locator(".qa-panel").waitFor({timeout:20000});
  await page.evaluate(async ()=>{
    await document.fonts.ready;
    await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));
  });
  await page.waitForTimeout(250);
}
try {
  for (const [id,width,height] of [["desktop-1920",1920,1080],["desktop-1440",1440,900],["ipad-820",820,1180],["iphone-390",390,844]]) {
    const context=await browser.newContext({
      viewport:{width,height}, deviceScaleFactor:1,
      reducedMotion:"reduce"
    });
    const original=await context.newPage();
    const revised=await context.newPage();
    try {
      await Promise.all([
        original.goto(baseline,{waitUntil:"networkidle"}),
        revised.goto(candidate,{waitUntil:"networkidle"})
      ]);
      await Promise.all([loaded(original),loaded(revised)]);

      if (width>=1200){
        // Exactly emulate the v2 fullscreen playground's offset-composition:
        // CSS translate and scale are preserved and user offsets are added.
        await original.evaluate(({approved,selectors})=>{
          const add=(base,offset)=>offset===0?base:
            "calc("+base+(offset>0?" + ":" - ")+Math.abs(offset)+"px)";
          for(const [id,[x,y,scale]] of Object.entries(approved)){
            const element=document.querySelector(selectors[id]);
            if(!element)throw Error("Missing original element: "+id);
            const computed=getComputedStyle(element);
            const parts=computed.translate==="none"?[]:computed.translate.split(/\s+/);
            const factors=computed.scale==="none"?[1]:computed.scale.split(/\\s+/).map(Number);
            element.style.translate=add(parts[0]||"0px",x)+" "+add(parts[1]||"0px",y);
            element.style.scale=factors.map(n=>Number((n*scale).toFixed(6))).join(" ");
          }
        },{approved,selectors});
      }
      const [a,b]=await Promise.all([
        original.evaluate(({selectors})=>{
          const out={};
          for(const [id,sel] of Object.entries(selectors)){
            const r=document.querySelector(sel).getBoundingClientRect();
            out[id]={x:r.x,y:r.y,width:r.width,height:r.height};
          }
          return out;
        },{selectors}),
        revised.evaluate(({selectors})=>{
          const out={};
          for(const [id,sel] of Object.entries(selectors)){
            const r=document.querySelector(sel).getBoundingClientRect();
            out[id]={x:r.x,y:r.y,width:r.width,height:r.height};
          }
          return out;
        },{selectors})
      ]);

      let failed=0;
      for(const id of Object.keys(selectors)){
        const deltas=["x","y","width","height"].map(key=>Math.abs(a[id][key]-b[id][key]));
        const delta=Math.max(...deltas);
        const tolerance=width>=1200?1:0.15;
        if(delta>tolerance){
          failed++;
          console.error("MISMATCH "+id+" at "+width+"px: "+JSON.stringify({baseline:a[id],candidate:b[id],delta}));
        } else {
          console.log("PASS "+width+"px "+id+" max bounding-box delta "+delta.toFixed(3)+"px");
        }
      }
      await Promise.all([
        original.screenshot({path:"artifacts/qr-20261117/"+id+"-playground.png",fullPage:true}),
        revised.screenshot({path:"artifacts/qr-20261117/"+id+"-implemented.png",fullPage:true})
      ]);
      assert.equal(failed,0,"Layout parity failed for "+id);
      console.log("PASS "+id+": exact exported target geometry and screenshot evidence");
    } finally {await Promise.all([original.close(),revised.close()]);await context.close();}
  }
  console.log("QR EXPORT VERIFIED: 7 target groups match on both desktops; tablet and mobile unchanged.");
} finally {await browser.close();}
