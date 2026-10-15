// Visual regression - actual React art registry + production painter (not mock art).
// Capture staggered ceiling roots and rising floor crystals at genuine world x.
// Screenshot each scene with transparent original relief and aligned auger.
import { chromium } from "playwright";
import { build } from "esbuild";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";

const dir="artifacts/ember-designed-course";
await mkdir(dir,{recursive:true});
const jsx=await readFile("src/EmberTunnelDrill.jsx","utf8");
const match=jsx.match(/const DRILL_ART = \{([\s\S]*?)\n\};/);
assert.ok(match);
const art=Object.fromEntries([...match[1].matchAll(/(\w+):"([^"]+)"/g)].map(m=>[m[1],m[2]]));
const bundle=await build({stdin:{contents:`import{paintDrill}from './src/emberDrillPainter.js';import{tunnelCenter}from './src/emberDrillEngine.js';import{FORMATION_LAYOUT}from './src/emberTunnelLayout.js';window.__courseQA={paintDrill,tunnelCenter,FORMATION_LAYOUT}`,resolveDir:process.cwd(),sourcefile:"course-QA.js",loader:"js"},bundle:true,format:"iife",platform:"browser",write:false,logLevel:"silent"});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage();
const errors=[];page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:4173/#captain",{waitUntil:"domcontentloaded",timeout:45000});
await page.addScriptTag({content:bundle.outputFiles[0].text});
await page.evaluate(async m=>{
 const images={};
 await Promise.all(Object.entries(m).map(async([key,file])=>{
  const img=new Image();img.src="/ember-drill/"+file;
  try{await img.decode();images[key]=img}catch(e){if(key.startsWith("og")||key==="auger"||key==="body")throw Error(key+" missing: "+file)}
 }));
 window.__courseAssets=images;
 const canvas=document.createElement("canvas");canvas.width=690;canvas.height=820;
 window.__courseCanvas=canvas;
},art);
const targets=[
  ["ceiling-roots-intro",1530,0,0],
  ["rising-crystals-intro",2070,0,0],
  ["ceiling-canopy-alternate",2610,0,0],
  ["deep-hanging-roots",8990,-.24,0],
  ["late-rising-crystals",23680,.24,0],
  ["turbo-ceiling-roots",14400,-.36,3.5],
];
for(const [name,world,pitch,boost] of targets){
 const report=await page.evaluate(({world,pitch,boost})=>{
   const stage=window.__courseCanvas,c=stage.getContext("2d");
   const calls=[],draw=c.drawImage.bind(c);
   c.drawImage=(im,...args)=>{if(im?.src&&(im.src.includes("/edge/formation/")||im.src.includes("/new-assets/obstacle/")))calls.push(im.src.split("/").pop());return draw(im,...args)};
   const s={scroll:world-430,time:world/330,pitch,boostTime:boost,objects:[],hitCooldown:0,shock:0, y:window.__courseQA.tunnelCenter(world-430+210),running:true};
   const saved=window.__courseAssets;
   window.__courseQA.paintDrill(c,s,null,[],saved);
   const pixels=new Uint8ClampedArray(c.getImageData(0,0,690,820).data);
   const without={...saved};
   for(const key of Object.keys(without))if(key.startsWith("og")||key.startsWith("new"))delete without[key];
   window.__courseQA.paintDrill(c,s,null,[],without);
   const base=c.getImageData(0,0,690,820).data;
   let delta=0,samples=0;
   for(let y=70;y<760;y+=9)for(let x=15;x<685;x+=9){
     const i=(y*690+x)*4;
     delta+=Math.abs(pixels[i]-base[i])+Math.abs(pixels[i+1]-base[i+1])+Math.abs(pixels[i+2]-base[i+2]);samples+=3;
   }
   window.__courseQA.paintDrill(c,s,null,[],saved);
   return {drawn:[...new Set(calls)],diff:delta/samples,obstacles:window.__courseQA.FORMATION_LAYOUT.filter(f=>f.obstacle&&Math.abs(f.at-world)<450).length};
 },{world,pitch,boost});
 const png=await page.evaluate(()=>window.__courseCanvas.toDataURL("image/png"));
 await writeFile(`${dir}/${name}.png`,Buffer.from(png.split(",")[1],"base64"));
 assert.ok(report.drawn.length>0,name+" did not paint real original formation");
 assert.ok(report.diff>1.2,name+" foreground rock art not visible enough "+report.diff);
 assert.ok(report.obstacles>0,name+" no actual geological obstacle nearby");
 console.log("PASS SOURCE-ORIGINAL COURSE",name,JSON.stringify(report));
}
assert.equal(errors.length,0,errors.join(" | "));
await browser.close();
