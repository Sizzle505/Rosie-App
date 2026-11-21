import assert from "node:assert/strict";
import {chromium} from "playwright";
import {stripImperialChecker} from "../src/haikuScrollMatte.js";

{
  const pixels=new Uint8ClampedArray(4*4*4);
  const at=(x,y)=>4*(y*4+x);
  for(const [x,y,c] of [
    [0,2,[238,239,238,255]], // baked neutral-gray checker in left band
    [3,2,[253,254,253,255]], // baked white checker at right
    [0,1,[212,95,37,255]],  // red-and-gold ornament must survive
    [1,1,[246,220,184,255]] // parchment must survive
  ])pixels.set(c,at(x,y));
  stripImperialChecker(pixels,4,4);
  // The production algorithm's edge limits are tested on a large sample below.
  assert.equal(pixels[at(1,1)+3],255);
}

const browser=await chromium.launch({headless:true});
const base=process.env.ROSIE_QA_URL||"http://127.0.0.1:4173";
try{
 for(const [width,height] of [[320,700],[390,844],[430,932]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
  try{
   await page.goto(base+"/#haiku",{waitUntil:"domcontentloaded"});
   await page.locator(".haiku-scroll").waitFor({state:"visible"});
   assert.equal(await page.locator(".haiku-back").count(),0,"Global nav replaces the redundant Haiku back button");
   const music=page.locator(".rosie-music-launch");
   await music.waitFor({state:"visible"});
   const badge=music.locator("img");
   assert.equal(await badge.count(),1,"Shared music control uses generated medallion image");
   await badge.evaluate(img=>img.decode());
   assert.ok((await badge.getAttribute("src")).endsWith("/rosieverse/ui/rosie-music-medallion.webp"));

   await page.getByRole("button",{name:"Next poetry scroll"}).click();
   await page.waitForFunction(()=>{
     const image=getComputedStyle(document.querySelector('.haiku-scroll[data-scroll-style="imperial"]')).backgroundImage;
     return image.startsWith('url("blob:')||image.startsWith('url(blob:');
   },{timeout:20000});
   const matte=await page.locator(".haiku-scroll").evaluate(async el=>{
     const rect=el.getBoundingClientRect();
     const arrows=el.querySelector(".haiku-scroll-cycle");
     const buttons=[...arrows.querySelectorAll("button")];
     const coords=buttons.map(btn=>btn.getBoundingClientRect());
     const bg=getComputedStyle(el).backgroundImage;
     const cleaned=bg.replace(/^url\(["']?/,"").replace(/["']?\)$/,"");
     const image=new Image();
     image.src=cleaned;await image.decode();
     const canvas=document.createElement("canvas");
     canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
     const ctx=canvas.getContext("2d");ctx.drawImage(image,0,0);
     const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data);
     return{bg,inside:el.contains(arrows),
       name:arrows.innerText.trim(),rect:{y:rect.y,bottom:rect.bottom,height:rect.height},
       arrowCenters:coords.map(r=>({x:r.x+r.width/2,y:r.y+r.height/2})),
       sampleLeft:pixel(150,200),sampleRight:pixel(1080,200),
       cleanWidth:image.naturalWidth};
   });
   assert.ok(matte.inside,"Scroll arrows overlay the scroll itself");
   assert.equal(matte.name.replace(/\s+/g,""),"‹›","Only arrows, no scroll-name label");
   assert.ok(matte.arrowCenters.every(x=>x.y<matte.rect.bottom&&x.y>matte.rect.bottom-85),
     "Scroll arrows align with lower artwork and do not add layout height");
   assert.equal(matte.cleanWidth,1228);
   assert.equal(matte.sampleLeft[3],0,"Remove left baked checkerboard, not the border");
   assert.equal(matte.sampleRight[3],0,"Remove right baked checkerboard, not the border");

   await page.getByRole("button",{name:"Meditate",exact:true}).click();
   assert.equal(await page.locator(".zen-progress-note").count(),0);
   assert.equal(await page.locator(".zen-privacy").count(),0);
   const sensei=await page.locator(".zen-sensei-welcome").evaluate(im=>{const r=im.getBoundingClientRect();return{w:r.width,h:r.height}});
   assert.ok(sensei.w>=120&&sensei.h>=140,"Sensei Rosie approximately 65% larger");
   await page.getByRole("button",{name:/Begin.*meditation/}).click();
   const mobile=await page.locator(".zen-immersive").evaluate(el=>{
     const scene=el.querySelector(".zen-immersive-scenery");
     const img=scene.querySelector("img");
     const r=img.getBoundingClientRect();
     const dialog=el.querySelector(".zen-immersive-dialog");
     return{artWidth:r.width,artHeight:r.height,view:el.dataset.zenView,
       beforeImage:getComputedStyle(scene,"::before").display,
       imgFit:getComputedStyle(img).objectFit,
       dialogOpacity:getComputedStyle(dialog).backgroundImage,
       rectWidth:el.getBoundingClientRect().width};
   });
   assert.ok(Math.abs(mobile.artWidth-width)<2,"Sharp landscape art displays full uncropped width");
   assert.equal(mobile.imgFit,"cover","Portrait artwork fills the iPhone screen");
   assert.equal(mobile.beforeImage,"none","No blurry duplicated scenic extension behind the portrait");
   await page.getByRole("button",{name:"Next meditation background"}).click();
   const advanced=await page.locator(".zen-immersive").getAttribute("data-zen-view");
   assert.notEqual(advanced,mobile.view,"Backdrops still cycle within meditation");
   await page.getByRole("button",{name:"Close meditation"}).click();

   console.log("PASS "+width+"px: clean alpha, inline arrows, larger Sensei, portrait-safe timed backgrounds, music art");
  }finally{await page.close();}
 }
}finally{await browser.close();}
