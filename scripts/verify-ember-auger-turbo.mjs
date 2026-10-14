import {chromium} from "playwright";
import {build} from "esbuild";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
const dir="artifacts/ember-auger-turbo-iphone";
await mkdir(dir,{recursive:true});
const jsx=await readFile("src/EmberTunnelDrill.jsx","utf8");
const match=jsx.match(/const DRILL_ART = \{([\s\S]*?)\n\};/);
assert.ok(match,"Original DRILL_ART asset registry present");
const art=Object.fromEntries([...match[1].matchAll(/(\w+):"([^"]+)"/g)].map(m=>[m[1],m[2]]));
const out=await build({stdin:{
  contents:`import{paintDrill}from './src/emberDrillPainter.js';import{tunnelCenter}from './src/emberDrillEngine.js';import{augerFrameIndex,turboFrameIndex}from './src/emberAugerFX.js';window.__drillQA={paintDrill,tunnelCenter,augerFrameIndex,turboFrameIndex}`,
  resolveDir:process.cwd(),sourcefile:"auger-QA-entry.js",loader:"js"},
  bundle:true,format:"iife",platform:"browser",write:false,logLevel:"silent"});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,recordVideo:{dir,size:{width:393,height:852}}});
const page=await context.newPage();
const errors=[];
page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:4173/#captain",{waitUntil:"domcontentloaded",timeout:45000});
await page.locator(".ember-stage").waitFor({state:"visible",timeout:45000});
await page.addScriptTag({content:out.outputFiles[0].text});
await page.evaluate(async map=>{
 const assets={};await Promise.all(Object.entries(map).map(async([key,filename])=>{
  const img=new Image();img.src="/ember-drill/"+filename;
  try{await img.decode();assets[key]=img}catch(e){if(["auger","body","turboAtlas","boosttrail"].includes(key))throw new Error(key+" not loaded")}
 }));
 window.__drillArtQA=assets;window.__drillCanvasQA=document.createElement("canvas");
 const canvas=window.__drillCanvasQA;canvas.width=690;canvas.height=820;
},art);
async function draw(label,time,boost,pitch=0){
 const data=await page.evaluate(({time,boost,pitch})=>{
  const canvas=window.__drillCanvasQA,c=canvas.getContext("2d");
  const calls=[];const native=c.drawImage.bind(c);
  c.drawImage=(image,...args)=>{
   if(image?.src)calls.push({asset:image.src.split("/").pop(),args:args.slice(0,4)});
   return native(image,...args);
  };
  const scroll=3000;
  const s={scroll,time,pitch,y:window.__drillQA.tunnelCenter(scroll+210),
   running:true,boostTime:boost,objects:[],shock:0,hitCooldown:0};
  window.__drillQA.paintDrill(c,s,null,[],window.__drillArtQA);
  const shaft=Array.from(c.getImageData(267,Math.round(s.y)-42,105,84).data);
  const tail=Array.from(c.getImageData(5,Math.round(s.y)-48,150,96).data);
  return {calls:calls.filter(v=>/auger-spin|turbo-animation|turbo-head-frames|feature-boosttrail/.test(v.asset)),
   phase:window.__drillQA.augerFrameIndex(time,boost>0),turboPhase:boost>0?window.__drillQA.turboFrameIndex(boost):null,shaft,tail};
 },{time,boost,pitch});
 const png=await page.evaluate(()=>window.__drillCanvasQA.toDataURL("image/png"));
 await writeFile(`${dir}/${label}.png`,Buffer.from(png.split(",")[1],"base64"));
 console.log("PAINT",label,JSON.stringify({phase:data.phase,turboPhase:data.turboPhase,draws:data.calls}));
 return data;
}
const baseline=await draw("normal-first-frame",3.0,0);
const next=await draw("normal-rotated-frame",3.082,0);
const turbo=await draw("turbo-at-same-moment",3.082,4.65);
const turboLater=await draw("turbo-later",3.182,4.5);
const pitched=await draw("turbo-climbing",3.182,3.1,-.5);
const diff=(x,y)=>{let sum=0;for(let i=0;i<x.length;i+=4)sum+=Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]);return sum/(x.length/4*3);};
assert.notEqual(baseline.phase,next.phase,"Original sprite frames must actually advance");
assert.ok(baseline.calls.some(x=>x.asset==="auger-spin.png"));
assert.ok(next.calls.some(x=>x.asset==="auger-spin.png"));
assert.ok(turbo.calls.some(x=>x.asset==="turbo-head-frames.webp"),"Ten-frame source-derived Turbo atlas must be drawn");
assert.notEqual(turbo.turboPhase,turboLater.turboPhase,"Turbo animation must advance every 60ms");
assert.notDeepEqual(turbo.calls.find(x=>x.asset==="turbo-head-frames.webp").args,turboLater.calls.find(x=>x.asset==="turbo-head-frames.webp").args,"Canvas must actually select different original Turbo atlas frames");
assert.ok(turbo.calls.some(x=>x.asset==="feature-boosttrail.webp"),"Original exhaust must be drawn");
assert.ok(!next.calls.some(x=>x.asset==="turbo-head-frames.webp"),"No Turbo artwork in normal play");
assert.ok(!next.calls.some(x=>x.asset==="feature-boosttrail.webp"),"No Turbo exhaust in normal play");
assert.ok(pitched.calls.some(x=>x.asset==="auger-spin.png"),"Spin must remain attached while steering");
const spinDelta=diff(baseline.shaft,next.shaft),turboHeadDelta=diff(next.shaft,turbo.shaft),
  tailDelta=diff(next.tail,turbo.tail),laterDelta=diff(turbo.shaft,turboLater.shaft);
console.log("PIXEL AUDIT",JSON.stringify({spinDelta,turboHeadDelta,tailDelta,laterDelta}));
assert.ok(spinDelta>1.2,"Auger not visibly spinning "+spinDelta);
assert.ok(turboHeadDelta>3,"Turbo auger glow/texture not visually distinct "+turboHeadDelta);
assert.ok(tailDelta>2,"Original exhaust is not visible behind the engine "+tailDelta);
assert.ok(laterDelta>1.0,"Turbo drill frozen rather than spinning "+laterDelta);
// Also test real interaction remains accessible (no fake screenshot-only mode).
await page.locator(".ember-stage").scrollIntoViewIfNeeded();
await page.getByRole("button",{name:"START DIGGING"}).click();
await page.waitForTimeout(1300);
await page.locator(".ember-stage").screenshot({path:`${dir}/actual-393-iphone-running.png`});
assert.equal(errors.length,0,"Unexpected runtime errors: "+errors.join(" | "));
await context.close();await browser.close();
console.log("PASS - original 8-frame sprite spins; source Turbo glow/exhaust used and properly registered; 393px real running gameplay captured.");
