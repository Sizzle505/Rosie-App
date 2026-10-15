// Verifies hash-matched runtime assets are actually drawn by the real Ember
// production painter in iPhone Chromium - not just present in the repo.
import {chromium} from "playwright";
import {build} from "esbuild";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {join} from "node:path";
import {createHash} from "node:crypto";

const root="public/ember-drill/new-assets";
const m=JSON.parse(await readFile(join(root,"integration-manifest.json"),"utf8"));
assert.equal(m.assets.filter(a=>a.role==="background").length,7);
assert.equal(m.assets.filter(a=>a.role==="parallax").length,3);
assert.equal(m.assets.filter(a=>a.role==="sculptural gameplay formation").length,12);
for(const asset of m.assets.filter(a=>a.output)){
 const bytes=await readFile(join(root,asset.output));
 assert.equal(createHash("sha256").update(bytes).digest("hex"),asset.output_sha256,asset.id);
}
const jsx=await readFile("src/EmberTunnelDrill.jsx","utf8");
const section=jsx.match(/const DRILL_ART = \{([\s\S]*?)\n\};/);
assert.ok(section,"DRILL_ART registry missing");
const art=Object.fromEntries([...section[1].matchAll(/(\w+):"([^"]+)"/g)].map(x=>[x[1],x[2]]));
const entry=await build({stdin:{contents:`import{paintDrill}from './src/emberDrillPainter.js';import{tunnelCenter}from './src/emberDrillEngine.js';import{FORMATION_LAYOUT}from './src/emberTunnelLayout.js';import{softenedFormation}from './src/emberTunnelSculpture.js';window.__newAssetQA={paintDrill,tunnelCenter,FORMATION_LAYOUT,softenedFormation};`,resolveDir:process.cwd(),sourcefile:"new-background-integration-qa.js",loader:"js"},bundle:true,format:"iife",platform:"browser",write:false,logLevel:"silent"});
const dir="artifacts/ember-new-assets-iphone";
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[];
page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:4173/#captain",{waitUntil:"domcontentloaded",timeout:45000});
await page.locator(".ember-stage").waitFor({state:"visible",timeout:45000});
await page.addScriptTag({content:entry.outputFiles[0].text});
const loaded=await page.evaluate(async registry=>{
 const images={};let failures=[];
 await Promise.all(Object.entries(registry).map(async([key,file])=>{
  const img=new Image();img.src="/ember-drill/"+file;
  try{await img.decode();images[key]=img}catch(e){failures.push(file)}
 }));
 if(failures.length)throw new Error("Missing art: "+failures.join(","));
 window.__newArt=images;const canvas=document.createElement("canvas");canvas.width=690;canvas.height=820;window.__newCanvas=canvas;
 return Object.keys(images).length;
},art);
// Refuse the exact visual regression in the provided iPhone screenshot:
// formation JPEG/PNG masks must NOT leave straight visible hard vertical bars.
const edgeAudit=await page.evaluate(()=>{
 const checked=[];
 for(const key of ["newRootShelf","newCrystalRidge","newCrystalMound","newSlopeFloor","newRootCurtain","ogCanopyA"]){
  const im=window.__newArt[key];
  if(!im)throw new Error("Missing original source "+key);
  const masked=window.__newAssetQA.softenedFormation(im);
  const cx=masked.getContext("2d"),w=masked.width,h=masked.height;
  const alphaAt=x=>{
   const pixels=cx.getImageData(x,0,1,h).data;
   let a=0;for(let y=0;y<h;y++)a+=pixels[y*4+3];
   return a/h;
  };
  const left=alphaAt(0),right=alphaAt(w-1),middle=alphaAt(Math.floor(w*.5));
  if(left>1||right>1||middle<22)throw new Error("Hard sprite edge: "+key+" "+[left,right,middle]);
  if(masked.src!==im.src)throw new Error("Lost asset provenance for "+key);
  checked.push({key,left,right,middle});
 }
 return checked;
});
console.log("PASS HARD-EDGE CROP REGRESSION",JSON.stringify(edgeAudit));
const scenes=[
 ["barkroot-and-roots",8,1530,"bg01","bg02","newRootCurtain"],
 ["lantern-and-crystal-ridge",25,2070,"bg03","bg02","newCrystalRidge"],
 ["amber-geode",32,6320,"bg04","bg02","newCrystalMound"],
 ["amber-ruby-fault",36,7900,"bg05","bg02","newBarkrootRoof"],
 ["ruby-heart-and-colonnade",43,10600,"bg06","bg07","newCrystalTeeth"],
 ["temple-reveal",57,12780,"bg08","bg09","newSlopeFloor"],
 ["ember-vault",70,17660,"bg10","bg09","newSlopeRoof"],
];
for(const [name,time,world,plate,parallax,formation] of scenes){
 const results=await page.evaluate(({name,time,world})=>{
  const c=window.__newCanvas.getContext("2d");
  const tracked=[],native=c.drawImage.bind(c);
  c.drawImage=(img,...rest)=>{
   if(img?.src?.includes("/new-assets/"))tracked.push({
    file:img.src.split("/").slice(-2).join("/"),
    alpha:c.globalAlpha,composite:c.globalCompositeOperation,dest:rest.slice(-4)
   });
   return native(img,...rest);
  };
  const scroll=world-385;
  const s={scroll,time,pitch:0,y:window.__newAssetQA.tunnelCenter(scroll+210),running:true,
   hitCooldown:0,shock:0,boostTime:0,objects:[]};
  window.__newAssetQA.paintDrill(c,s,null,[],window.__newArt);
  return {name,records:tracked,drawn:[...new Set(tracked.map(x=>x.file))],
    alpha:c.getImageData(210,410,1,1).data[3]};
 },{name,time,world});
 const prefix=id=>[...results.drawn].some(p=>p.endsWith("/"+id+".webp"));
 assert.ok(prefix(plate),name+": scenic plate not actually drawn: "+plate+" "+JSON.stringify(results.drawn));
 assert.ok(prefix(parallax),name+": parallax not actually drawn: "+parallax+" "+JSON.stringify(results.drawn));
 assert.ok(prefix(formation),name+": original new obstacle not painted: "+formation+" "+JSON.stringify(results.drawn));
 const painting=results.records.filter(x=>x.file==="background/"+plate+".webp");
 assert.ok(painting.length>0);
 assert.ok(painting.every(x=>x.composite==="screen"&&x.alpha<=.34),
  name+": scenic study incorrectly used as opaque full-screen mural "+JSON.stringify(painting));
 const depth=results.records.filter(x=>x.file==="background/"+parallax+".webp");
 assert.ok(depth.length>0);
 assert.ok(depth.every(x=>x.alpha<.58),name+": parallax too opaque");
 if(parallax==="bg02"){
  assert.ok(depth.every(x=>x.dest[3]<=350),name+": roots not anchored to cave ceiling");
 }

 assert.ok(results.alpha>0,name+": empty Canvas");
 const data=await page.evaluate(()=>window.__newCanvas.toDataURL("image/png"));
 await writeFile(join(dir,name+".png"),Buffer.from(data.split(",")[1],"base64"));
 console.log("PASS NEW ASSETS",name,JSON.stringify(results.drawn));
}
assert.equal(errors.length,0,"Browser errors "+errors.join("; "));
await browser.close();
console.log("PASS: 31 archive hashes + "+loaded+" game images + seven actual iPhone scenic/formation/parallax proof frames.");
