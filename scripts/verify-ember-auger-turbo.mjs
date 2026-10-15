import { chromium } from "playwright";
import { build } from "esbuild";
import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises";
import assert from "node:assert/strict";

const dir="artifacts/ember-auger-turbo-iphone";
await mkdir(dir,{recursive:true});
const jsx=await readFile("src/EmberTunnelDrill.jsx","utf8");
const match=jsx.match(/const DRILL_ART = \{([\s\S]*?)\n\};/);
assert.ok(match,"DRILL_ART asset registry must exist");
const art=Object.fromEntries([...match[1].matchAll(/(\w+):"([^"]+)"/g)].map(m=>[m[1],m[2]]));
const out=await build({stdin:{
  contents:"import{paintDrill}from './src/emberDrillPainter.js';import{tunnelCenter}from './src/emberDrillEngine.js';import{augerFrameIndex,jetFrameIndex,impactFrameIndex}from './src/emberAugerFX.js';window.__drillQA={paintDrill,tunnelCenter,augerFrameIndex,jetFrameIndex,impactFrameIndex}",
  resolveDir:process.cwd(),sourcefile:"registered-QA-entry.js",loader:"js"},
  bundle:true,format:"iife",platform:"browser",write:false,logLevel:"silent"});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,
  recordVideo:{dir,size:{width:393,height:852}}});
const page=await context.newPage(),errors=[],badResponses=[];
page.on("pageerror",e=>errors.push(String(e)));
page.on("response",r=>{if(r.status()>=400&&r.url().includes("/ember-drill/"))badResponses.push(r.url()+" "+r.status());});
await page.goto("http://127.0.0.1:4173/#captain",{waitUntil:"domcontentloaded",timeout:45000});
await page.locator(".ember-stage").waitFor({state:"visible",timeout:45000});
await page.addScriptTag({content:out.outputFiles[0].text});
await page.evaluate(async map=>{
  const assets={};
  await Promise.all(Object.entries(map).map(async([key,filename])=>{
    const img=new Image();img.src="/ember-drill/"+filename;
    try{await img.decode();assets[key]=img}
    catch(e){if(["auger","body","turnNeutral","turnUp","turnDown","jetSheet","impactSheet"].includes(key))throw new Error("Missing "+key);}
  }));
  window.__drillArtQA=assets;
  window.__drillCanvasQA=document.createElement("canvas");
  window.__drillCanvasQA.width=690;window.__drillCanvasQA.height=820;
},art);

async function draw(label,time,boost,pitch=0,burstAge=null) {
  const data=await page.evaluate(({time,boost,pitch,burstAge})=>{
    const canvas=window.__drillCanvasQA,c=canvas.getContext("2d");
    c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;
    const calls=[],native=c.drawImage.bind(c);
    c.drawImage=(image,...args)=>{
      const key=image?.__spriteName||image?.src?.split("/").pop();
      if(key){const m=c.getTransform();calls.push({asset:key,args:args.slice(),
        matrix:[m.a,m.b,m.c,m.d,m.e,m.f]});}
      return native(image,...args);
    };
    const scroll=3000,s={scroll,time,pitch,
      y:window.__drillQA.tunnelCenter(scroll+210),
      running:true,boostTime:boost,objects:[],shock:0,hitCooldown:0,
      tipBurstAt:burstAge===null?undefined:time-burstAge};
    window.__drillQA.paintDrill(c,s,null,[],window.__drillArtQA);
    c.drawImage=native;
    const shaft=Array.from(c.getImageData(265,Math.round(s.y)-56,114,112).data);
    const tail=Array.from(c.getImageData(0,Math.round(s.y)-64,170,128).data);
    return {calls:calls.filter(x=>/registered-16-frame-auger|golden_jet_flame|golden_drill_impact|wall-turn|drill-body|auger-spin|feature-boosttrail|turbo-head-frames/.test(x.asset)),
      phase:window.__drillQA.augerFrameIndex(time,boost>0),
      jetPhase:boost>0?window.__drillQA.jetFrameIndex(time):null,shaft,tail};
  },{time,boost,pitch,burstAge});
  const png=await page.evaluate(()=>window.__drillCanvasQA.toDataURL("image/png"));
  await writeFile(dir+"/"+label+".png",Buffer.from(png.split(",")[1],"base64"));
  console.log("PAINT",label,JSON.stringify({phase:data.phase,jetPhase:data.jetPhase,calls:data.calls}));
  return data;
}
const still=await draw("normal-first-frame",3.0,0);
const spin=await draw("normal-rotated-frame",3.083,0);
const turbo=await draw("turbo-ignition",3.083,4.65,0,.12);
const turboLater=await draw("turbo-spinning",3.183,4.5,0,.22);
const climb=await draw("turbo-climbing",3.183,3.1,-.5,.12);
const dive=await draw("turbo-diving",3.283,2.9,.5,.22);
const expired=await draw("turbo-expired",8.1,0,.5);
const diff=(a,b)=>{
  let sum=0;for(let i=0;i<a.length;i+=4)sum+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);
  return sum/(a.length/4*3);
};
assert.notEqual(still.phase,spin.phase,"Distinct auger frames selected");
assert.notEqual(turbo.phase,turboLater.phase,"Turbo auger frames advance");
assert.notEqual(turbo.jetPhase,turboLater.jetPhase,"Rear exhaust cycles");
for(const data of [still,spin,turbo,turboLater,climb,dive,expired]){
  const auger=data.calls.filter(x=>x.asset==="registered-16-frame-auger");
  const chassis=data.calls.find(x=>/wall-turn-neutral|drill-body/.test(x.asset));
  assert.equal(auger.length,1,"A SINGLE auger is rendered");
  assert.ok(chassis,"Only preserved Rosie source vehicle");
  for(let k=0;k<6;k++)assert.ok(Math.abs(auger[0].matrix[k]-chassis.matrix[k])<1e-6,
    "Auger detached from body at transform "+k);
  assert.equal(auger[0].args.at(-4),40,"Auger spindle must sit inside the original brass collar");
  assert.equal(auger[0].args.at(-3),-20,"Auger axle must align with the original lower engine socket");
  assert.equal(auger[0].args.at(-2),120,"Auger scale may not change");
  assert.equal(auger[0].args.at(-1),110,"Auger scale may not change");
  assert.equal(data.calls.filter(x=>x.asset==="auger-spin.png").length,0,"Old cone must not be painted");
  assert.equal(data.calls.filter(x=>x.asset==="turbo-head-frames.webp").length,0,"No ghost head");
}
for(const data of [turbo,turboLater,climb,dive]){
  const jet=data.calls.find(x=>x.asset==="golden_jet_flame_vfx_sprite_sheet.webp");
  const head=data.calls.find(x=>x.asset==="registered-16-frame-auger");
  const impact=data.calls.find(x=>x.asset==="golden_drill_impact_effect_sprite_sheet.webp");
  assert.ok(jet,"NEW eight-frame rear jet missing");
  assert.ok(impact,"NEW eight-frame event flare missing");
  assert.equal(impact.args.at(-4),131,"Impact follows the socket-mounted tip X");
  assert.equal(impact.args.at(-3),-4,"Impact follows the socket-mounted tip Y");
  const dot=jet.matrix[0]*head.matrix[0]+jet.matrix[1]*head.matrix[1];
  assert.ok(dot<-.5,"Only jet must mirror horizontally");
  const dx=jet.matrix[4]-head.matrix[4],dy=jet.matrix[5]-head.matrix[5];
  const backward=dx*head.matrix[0]+dy*head.matrix[1];
  assert.ok(Math.abs(backward+116)<1e-6,"Jet ignition moves off tailpipe: "+backward);
  for(let k=0;k<6;k++)assert.ok(Math.abs(impact.matrix[k]-head.matrix[k])<1e-6,
    "Impact detached from nose at transform "+k);
}
for(const data of [still,spin,expired]){
  assert.ok(!data.calls.some(x=>/golden_jet_flame|golden_drill_impact/.test(x.asset)),
    "New Turbo effects must end fully with the meter");
}
console.log("PIXEL AUDIT",JSON.stringify({
  normalSpin:diff(still.shaft,spin.shaft),
  turboGlow:diff(spin.shaft,turbo.shaft),
  jet:diff(spin.tail,turbo.tail),
  turboSpin:diff(turbo.shaft,turboLater.shaft)
}));
assert.ok(diff(still.shaft,spin.shaft)>1,"Auger animation not visible");
assert.ok(diff(spin.tail,turbo.tail)>1,"Jet flame not visible");
assert.ok(diff(turbo.shaft,turboLater.shaft)>1,"Turbo drill does not animate");

// Genuine 393x852 Chromium UI interaction, not a mockup of the HUD.
await page.locator(".ember-stage").scrollIntoViewIfNeeded();
await page.getByRole("button",{name:"START DIGGING"}).click();
await page.waitForTimeout(650);
await page.locator(".ember-stage").screenshot({path:dir+"/actual-393-iphone-running.png"});

// Also record the ACTUAL imported renderer and images in motion at a 393x852
// mobile viewport, held in a fixed debug canvas so viewers can see axial
// rotation / pitch / ignition / exhaustion without background masking it.
await page.evaluate(()=>{
  const c=document.createElement("canvas");c.width=690;c.height=820;
  c.style.cssText="position:fixed;left:0;top:165px;width:393px;height:467px;z-index:2147483646;pointer-events:none;border:1px solid #d2a75c";
  document.body.appendChild(c);window.__drillMotionCanvas=c;
});
const video=page.video();
const playing=page.evaluate(()=>new Promise(resolve=>{
  const canvas=window.__drillMotionCanvas,c=canvas.getContext("2d"),start=performance.now();
  const doFrame=(now)=>{
    const t=Math.min(6.2,(now-start)/1000),burn=t>=.7&&t<5.5;
    const pitch=t>=1.55&&t<2.35?-.5:t>=2.35&&t<3.15?.5:0;
    const s={scroll:3000+t*310,time:3+t,pitch,
      y:window.__drillQA.tunnelCenter(3210),running:true,
      boostTime:burn?5.5-t:0,shock:0,hitCooldown:0,objects:[],
      tipBurstAt:burn?(t<1.02?3+.7:t>2.55&&t<2.88?3+2.55:undefined):undefined};
    c.setTransform(1,0,0,1,0,0);
    window.__drillQA.paintDrill(c,s,null,[],window.__drillArtQA);
    if(t<6.2)requestAnimationFrame(doFrame);else resolve(true);
  };
  requestAnimationFrame(doFrame);
}));
for(const [name,delay] of [["motion-normal",300],["motion-turbo-neutral",900],
  ["motion-turbo-climb",850],["motion-turbo-dive",850],["motion-turbo-ending",2650]]){
  await page.waitForTimeout(delay);
  await page.screenshot({path:dir+"/"+name+"-393x852.png"});
}
await playing;
assert.deepEqual(errors,[],"Runtime errors: "+errors.join(" | "));
assert.deepEqual(badResponses,[],"Sprite HTTP errors: "+badResponses.join(" | "));
await page.close();await context.close();
await copyFile(await video.path(),dir+"/registered-spin-turbo-393x852.webm");
await browser.close();
console.log("PASS - 16 distinct indexed frames, rooted nose and reflected tailpipe jet, event-only impact, iPhone capture and video. No production merge.");
