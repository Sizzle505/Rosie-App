import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {chromium} from "playwright";
await fs.mkdir("qr-review-shots",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const expected={
 "rosie-frame-seated.webp":{x:912,y:859},
 "rosie-frame-presenting.webp":{x:967,y:847},
 "rosie-frame-peeking.webp":{x:782,y:919},
 "rosie-frame-blank.webp":{x:724,y:920}
};
try {
 for (const device of [
  {name:"iphone",width:393,height:852,touch:true},
  {name:"ipad",width:834,height:1112,touch:true},
  {name:"desktop",width:1400,height:850,touch:false}
 ]) {
  const page=await browser.newPage({viewport:{width:device.width,height:device.height},isMobile:device.touch,hasTouch:device.touch,deviceScaleFactor:1,acceptDownloads:true});
  page.setDefaultTimeout(12000);
  page.on("pageerror",error=>{console.error("BROWSER_ERROR",error.message);process.exitCode=1;});
  await page.goto("http://127.0.0.1:4173/#qr-atelier",{waitUntil:"domcontentloaded"});
  await page.waitForTimeout(4500);
  await page.locator(".qa-inputs input").first().fill("https://example.com");
  await page.getByRole("button",{name:"Burgundy",exact:true}).click();
  await page.getByRole("button",{name:"View QR in a Rosie frame"}).evaluate(btn=>btn.click());
  await page.locator(".qa-rosie-viewer").waitFor();
  await page.locator(".qa-rosie-viewer .qa-rosie-title-field").fill("Centered Title");
  const visited=new Set();
  for(let i=0;i<4;i++){
   const d=await page.locator(".qa-rosie-viewer").evaluate(async dlg=>{
    const art=dlg.querySelector(".qa-rosie-overlay-art"), title=dlg.querySelector(".qa-rosie-title-field");
    const code=dlg.querySelector(".qa-rosie-live-qr svg");
    await art.decode();
    const frame=dlg.querySelector(".qa-rosie-composition").getBoundingClientRect();
    const titleRect=title.getBoundingClientRect();
    const x=dlg.querySelector(".qa-rosie-close").getBoundingClientRect();
    const path=dlg.querySelector(".qa-rosie-insert-underlay path");
    return {
      img:art.getAttribute("src").split("/").pop(),
      loaded:art.naturalWidth===1448,
      frame:{left:frame.left,top:frame.top,width:frame.width,height:frame.height,right:frame.right},
      title:{x:titleRect.left+titleRect.width/2,y:titleRect.top+titleRect.height/2},
      codeColor:code.querySelector("path")?.getAttribute("fill"),
      bgColor:getComputedStyle(path).fill,
      whiteCode:code.querySelector("rect")?.getAttribute("fill"),
      goldEdge:getComputedStyle(dlg.querySelector(".qa-rosie-live-qr")).boxShadow,
      x:{left:x.left,right:x.right,top:x.top,bottom:x.bottom},
      closeTop:document.elementFromPoint(x.left+x.width/2,x.top+x.height/2)?.closest(".qa-rosie-close")!==null
    }
   });
   console.log(device.name,i,JSON.stringify(d));
   assert.ok(d.loaded,"frame art failed to load");
   assert.equal(d.codeColor,"#4e102a","selected code color lost");
   assert.equal(d.bgColor,"rgb(78, 16, 42)","selected background changed");
   assert.equal(d.whiteCode,"#ffffff","white scannable square missing");
   assert.match(d.goldEdge,/183, 126, 54/,"main preview gold edge is missing");
   assert.ok(d.x.left>=0&&d.x.right<=device.width&&d.x.top>=0&&d.x.bottom<=device.height&&d.closeTop,"X not visible/clickable");
   assert.ok(d.frame.left>=-1&&d.frame.right<=device.width+1,"frame cropped on "+device.name);
   const expect=expected[d.img];assert.ok(expect,"unexpected frame");
   assert.ok(Math.abs(d.title.x-(d.frame.left+d.frame.width*expect.x/1448))<1.2,"horizontal title center wrong");
   assert.ok(Math.abs(d.title.y-(d.frame.top+d.frame.height*expect.y/1086))<1.2,"vertical title center wrong");
   visited.add(d.img);
   await page.screenshot({path:"qr-review-shots/"+device.name+"-"+i+".png",fullPage:false});
   await page.getByRole("button",{name:"Next Rosie frame"}).click();
  }
  assert.equal(visited.size,4,"not all four frames");
  await page.getByRole("button",{name:"Close QR preview and return to the Atelier"}).click();
  assert.equal(await page.locator(".qa-rosie-viewer").count(),0);
  await page.reload({waitUntil:"domcontentloaded"});
  assert.equal(await page.getByRole("button",{name:"Burgundy",exact:true}).getAttribute("aria-pressed"),"true");
  console.log("PASS",device.name);
  await page.close();
 }
}finally{await browser.close();}
if(process.exitCode)process.exit(process.exitCode);
console.log("PASS all popup frames at three device sizes");
