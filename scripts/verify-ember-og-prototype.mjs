// Real production Canvas renderer, 393x852 iPhone browser plus continuous video.
// Fail if original-source edge sprites merely load but are never DRAWN.
import { chromium } from "playwright";
import { build } from "esbuild";
import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises";

const dir="artifacts/ember-og-prototype";
await mkdir(dir,{recursive:true});
const text=await readFile("src/EmberTunnelDrill.jsx","utf8");
const block=text.match(/const DRILL_ART = \{([\s\S]*?)\n\};/)?.[1];
if(!block)throw new Error("DRILL_ART not found");
const art=Object.fromEntries([...block.matchAll(/(\w+):"([^"]+)"/g)].map(m=>[m[1],m[2]]));
const bundle=await build({stdin:{contents:`import {paintDrill} from './src/emberDrillPainter.js';import {tunnelCenter} from './src/emberDrillEngine.js';window.__og={paintDrill,tunnelCenter};`,resolveDir:process.cwd(),sourcefile:"ember-browser-entry.js",loader:"js"},bundle:true,format:"iife",platform:"browser",write:false,logLevel:"silent"});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2,recordVideo:{dir,size:{width:393,height:852}}});
const page=await context.newPage(),errors=[],missing=[];
page.on("pageerror",e=>errors.push(String(e)));
page.on("response",r=>{if(r.url().includes("/ember-drill/")&&r.status()>=400)missing.push([r.status(),r.url()])});
await page.goto("http://127.0.0.1:4173/#captain",{waitUntil:"domcontentloaded",timeout:45000});
const stage=page.locator(".ember-stage");
await stage.waitFor({state:"visible",timeout:45000});
await stage.scrollIntoViewIfNeeded();
await page.waitForTimeout(1300);
await page.addScriptTag({content:bundle.outputFiles[0].text});
const loaded=await page.evaluate(async map=>{
 const assets={};await Promise.all(Object.entries(map).map(async ([k,f])=>{
  const img=new Image();img.src="/ember-drill/"+f;
  try{await img.decode();assets[k]=img}catch(e){if(k.startsWith("edgeBarkroot"))throw Error("Original OG edge missing: "+f)}
 }));
 window.__ogAssets=assets;
 const canvas=document.createElement("canvas");canvas.width=690;canvas.height=820;
 canvas.id="ember-og-proof";canvas.style.cssText="display:block;width:100%;height:auto";
 window.__ogCanvas=canvas;return Object.keys(assets).length;
},art);
if(!loaded||loaded<71)throw new Error("Full original formation set not decoded: "+loaded);
const proof=async (label,scroll,pitch,time)=>{
 const result=await page.evaluate(({label,scroll,pitch,time})=>{
  const c=window.__ogCanvas.getContext("2d");
  const drawn=new Set();
  const call=c.drawImage.bind(c);
  c.drawImage=(im,...args)=>{
    if(im?.src)drawn.add(im.src.split("/").slice(-2).join("/"));
    return call(im,...args);
  };
  const s={scroll,time,pitch,y:window.__og.tunnelCenter(scroll+210),running:true,
    hitCooldown:0,shock:0,objects:[],boostTime:0};
  window.__og.paintDrill(c,s,null,[],window.__ogAssets);
  const needed=["edge/barkroot-top.webp","edge/barkroot-bottom.webp"];
  if(needed.some(x=>!drawn.has(x)))throw Error("Original edge images loaded but not DRAWN: "+[...drawn].join(","));
  const formations=[...drawn].filter(x=>x.startsWith("formation/")||x.startsWith("obstacle/"));
  if(!formations.length)throw Error("Real OG ceiling/floor formations NOT DRAWN in "+label);
  const exact=label==="original-hanging-roots"?"obstacle/newRootCurtain.webp":
    label==="rising-floor-crystals"?"obstacle/newCrystalMound.webp":null;
  if(exact&&!drawn.has(exact))throw Error("Specified original designed art not drawn: "+exact);
  const before=new Uint8ClampedArray(c.getImageData(0,0,690,820).data);
  const artless={...window.__ogAssets};
  for(const key of Object.keys(artless))if(key.startsWith("og")||key.startsWith("new"))delete artless[key];
  window.__og.paintDrill(c,s,null,[],artless);
  const after=c.getImageData(0,0,690,820).data;
  let absolute=0, samples=0;
  for(let y=40;y<790;y+=11)for(let x=20;x<670;x+=11){
    const j=(y*690+x)*4;
    absolute+=Math.abs(before[j]-after[j])+Math.abs(before[j+1]-after[j+1])+Math.abs(before[j+2]-after[j+2]);
    samples+=3;
  }
  const formationDifference=absolute/samples;
  if(formationDifference<0.75)throw Error("Original ceiling/floor drawn offscreen or visually imperceptible in "+label+": "+formationDifference);
  // Restore THE REAL version before capturing screenshot.
  window.__og.paintDrill(c,s,null,[],window.__ogAssets);
  return {label,scroll,pitch,time,formationDifference,drawn:[...drawn].filter(x=>x.startsWith("edge/")||x.startsWith("formation/")||x.startsWith("obstacle/")),
    pixel:c.getImageData(210,410,1,1).data[3]};
 },{label,scroll,pitch,time});
 const image=await page.evaluate(()=>window.__ogCanvas.toDataURL("image/png"));
 await writeFile(dir+"/"+label+".png",Buffer.from(image.split(",")[1],"base64"));
 console.log("SOURCE-DERIVED RIBBON PROOF:",JSON.stringify(result));
};
await proof("barkroot-level",520,0,5);
await proof("barkroot-climb",4600,-.54,14);
await proof("barkroot-dive",7000,.54,23);
await proof("barkroot-level-to-climb",5400,-.35,18);
await proof("original-hanging-roots",1250,0,7);
await proof("rising-floor-crystals",5780,.32,20);
// True gameplay recording, not static mockups.
await page.getByRole("button",{name:"START DIGGING"}).click();
await stage.scrollIntoViewIfNeeded();
await page.waitForTimeout(1600);
await stage.screenshot({path:dir+"/actual-iphone-running.png"});
const up=page.getByRole("button",{name:"Angle the drill upward"});
const down=page.getByRole("button",{name:"Angle the drill downward"});
async function hold(control,ms){
 await control.scrollIntoViewIfNeeded();
 const rect=await control.boundingBox();
 if(!rect)throw Error("Missing steering control");
 await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
 await page.mouse.down();await page.waitForTimeout(ms);await page.mouse.up();
}
await hold(up,1050);await stage.screenshot({path:dir+"/actual-iphone-climbing.png"});
await page.waitForTimeout(350);
await hold(down,1170);await stage.screenshot({path:dir+"/actual-iphone-diving.png"});
await page.waitForTimeout(3300);
await stage.screenshot({path:dir+"/actual-iphone-six-seconds.png"});
if(errors.length||missing.length)throw Error(JSON.stringify({errors,missing}));
const video=await page.video().path();
await context.close();
await browser.close();
await copyFile(video,dir+"/actual-iphone-gameplay.webm");
console.log("PASS: original-derived structural edge DRAWN in 4 browser-rendered samples; actual controls/video captured; "+loaded+" game assets decoded.");
