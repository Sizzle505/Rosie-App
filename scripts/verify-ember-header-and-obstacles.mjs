import { chromium } from "playwright";
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
const root="artifacts/ember-og-header-audit";
await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true});
for(const width of [320,360,375,393,430,768,1024]){
 const mobile=width<=430;
 const height=mobile?852:880;
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage();
 const errors=[];
 page.on("pageerror",error=>errors.push(String(error)));
 await page.goto("http://127.0.0.1:4173/#captain",{waitUntil:"domcontentloaded",timeout:45000});
 const section=page.locator(".ember-suite");
 await section.waitFor({state:"visible",timeout:35000});
 await section.scrollIntoViewIfNeeded();
 const inspected=await page.evaluate(async()=>{
  const header=document.querySelector(".ember-header"),img=header?.querySelector(".ember-header-full-art");
  const stage=document.querySelector(".ember-stage");
  if(!header||!img||!stage)throw Error("Original header or stage missing");
  await img.decode();
  const hr=header.getBoundingClientRect(),ir=img.getBoundingClientRect(),sr=stage.getBoundingClientRect();
  const css=getComputedStyle(img);
  return {
   width:hr.width,height:hr.height,stageWidth:sr.width,
   imageWidth:ir.width,imageHeight:ir.height,naturalWidth:img.naturalWidth,
   naturalHeight:img.naturalHeight,objectFit:css.objectFit,
   siblings:header.children.length,overflow:header.scrollWidth-header.clientWidth,
   imageLeft:ir.left,headerLeft:hr.left,imageRight:ir.right,headerRight:hr.right,
   imageTop:ir.top,headerTop:hr.top,imageBottom:ir.bottom,headerBottom:hr.bottom
  };
 });
 assert.equal(inspected.naturalWidth,1280);
 assert.equal(inspected.naturalHeight,350);
 assert.equal(inspected.siblings,1,"No duplicate lettering or image");
 assert.equal(inspected.objectFit,"contain");
 assert.ok(Math.abs(inspected.width-inspected.stageWidth)<=2,JSON.stringify(inspected));
 assert.ok(Math.abs(inspected.height-inspected.width*350/1280)<3,JSON.stringify(inspected));
 assert.ok(inspected.imageLeft>=inspected.headerLeft-2&&inspected.imageRight<=inspected.headerRight+2,JSON.stringify(inspected));
 assert.ok(inspected.imageTop>=inspected.headerTop-2&&inspected.imageBottom<=inspected.headerBottom+2,JSON.stringify(inspected));
 assert.ok(inspected.overflow<=2,JSON.stringify(inspected));
 await page.locator(".ember-header").screenshot({path:`${root}/header-${width}.png`});
 if(mobile){
  await page.locator(".ember-stage").scrollIntoViewIfNeeded();
  await page.getByRole("button",{name:"START DIGGING"}).click();
  await page.waitForTimeout(700);
  await page.locator(".ember-stage").screenshot({path:`${root}/playing-${width}.png`});
  const state=await page.evaluate(()=>{
   const canvas=document.querySelector(".ember-canvas");
   return {
    canvasAlpha:canvas.getContext("2d").getImageData(350,410,1,1).data[3],
    stageWidth:document.querySelector(".ember-stage").getBoundingClientRect().width,
    imageLoads:performance.getEntriesByType("resource").filter(r=>r.name.includes("/ember-drill/edge/formation/")).length
   };
  });
  assert.ok(state.canvasAlpha>0,"Game Canvas not painted");
  assert.ok(state.imageLoads>=14,"Large original formations not loaded: "+state.imageLoads);
 }
 if(errors.length)throw Error("Console errors at "+width+": "+errors.join(" / "));
 console.log("PASS HEADER",width,JSON.stringify(inspected));
 await context.close();
}
await browser.close();
