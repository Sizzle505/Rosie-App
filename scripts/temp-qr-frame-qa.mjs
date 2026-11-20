import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
await fs.mkdir("qa-screenshots",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const dev of [{name:"desktop",w:1400,h:850},{name:"iphone",w:393,h:852}]){
  const page=await browser.newPage({viewport:{width:dev.w,height:dev.h},deviceScaleFactor:1});
  page.on("pageerror",err=>{console.error("BROWSER",err.message);process.exitCode=1});
  await page.goto("http://127.0.0.1:4173/#qr-atelier");
  await page.waitForTimeout(4500);
  await page.locator(".qa-inputs input").first().fill("https://example.com");
  await page.getByRole("button",{name:"Burgundy",exact:true}).click();
  await page.getByRole("button",{name:"View QR in a Rosie frame"}).evaluate(b=>b.click());
  await page.locator(".qa-rosie-viewer").waitFor();
  for(let i=0;i<4;i++){
   const data=await page.evaluate(async()=>{
    const viewer=document.querySelector(".qa-rosie-viewer");
    const image=viewer.querySelector(".qa-rosie-overlay-art image");
    const close=viewer.querySelector(".qa-rosie-close");
    const title=viewer.querySelector(".qa-rosie-title-field");
    const frame=image.getAttribute("href");
    const img=new Image();img.src=frame;await img.decode();
    const el=viewer.querySelector(".qa-rosie-insert-underlay");
    const code=viewer.querySelector(".qa-rosie-live-qr svg path");
    const b=close.getBoundingClientRect();
    return {frame,imageLoaded:img.naturalWidth>0,hasMask:Boolean(image.getAttribute("mask")),
      ellipses:viewer.querySelectorAll("mask ellipse").length,
      forefill:viewer.querySelector(".qa-rosie-insert-backdrop")!==null,
      color:getComputedStyle(el).backgroundColor,codeColor:code?.getAttribute("fill"),
      visibleX:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight,
      titlePos:{x:title.getBoundingClientRect().x,y:title.getBoundingClientRect().y},
      titleString:title.value};
   });
   console.log("VISUAL",dev.name,i,data);
   assert.ok(data.imageLoaded&&data.hasMask&&data.ellipses===1,"Missing opaque-art mask");
   assert.ok(!data.forefill,"Unwanted foreground ellipse");
   assert.equal(data.color,"rgb(78, 16, 42)");
   assert.equal(data.codeColor,"#4e102a");
   assert.ok(data.visibleX,"Close cropped");
   await page.screenshot({path:"qa-screenshots/fixed-"+dev.name+"-"+i+".png"});
   await page.getByRole("button",{name:"Next Rosie frame"}).click();
  }
  await page.getByRole("button",{name:"Close QR preview and return to the Atelier"}).click();
  assert.equal(await page.locator(".qa-rosie-viewer").count(),0);
  await page.close();
 }
}finally{await browser.close()}
if(process.exitCode)process.exit(process.exitCode);