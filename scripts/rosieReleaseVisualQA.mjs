import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {chromium} from "playwright";
const out="qa-screenshots/release";
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const expectFiles=[
 "rosie-frame-seated-hollow.png",
 "rosie-frame-presenting-hollow.png",
 "rosie-frame-peeking.webp",
 "rosie-frame-blank-hollow.png",
];
let screenshots=0;
try {
  for (const viewport of [{name:"iphone",width:393,height:852,mobile:true},{name:"desktop",width:1440,height:900,mobile:false}]) {
    const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:viewport.mobile?2:1,isMobile:viewport.mobile,hasTouch:viewport.mobile});
    page.setDefaultTimeout(20000);
    await page.goto("http://127.0.0.1:4173/#qr-atelier",{waitUntil:"domcontentloaded"});
    await page.locator(".qa-inputs input").first().fill("https://example.org/rosie");
    await page.locator(".qa-svg svg").waitFor({state:"visible"});
    await page.waitForTimeout(1800);
    await page.screenshot({path:out+"/"+viewport.name+"-atelier-before-view.png",fullPage:false});screenshots++;
    const finishes=viewport.mobile?["emerald","burgundy","sapphire"]:["emerald"];
    for (const finish of finishes) {
      await page.locator(".qa-palette-"+finish).click();
      await page.getByRole("button",{name:"View QR in a Rosie frame"}).click();
      const viewer=page.getByRole("dialog",{name:"Rosie framed scannable QR code"});
      await viewer.waitFor();
      const seen=new Set();
      for (let frame=0;frame<4;frame++) {
        const im=viewer.locator(".qa-rosie-overlay-art");
        await im.waitFor({state:"visible"});
        await page.waitForFunction(()=>{const x=document.querySelector(".qa-rosie-viewer .qa-rosie-overlay-art");return x instanceof HTMLImageElement&&x.complete&&x.naturalWidth===1448;});
        const src=await im.getAttribute("src");
        const name=src.split("/").at(-1);
        assert.ok(expectFiles.includes(name),"Wrong frame: "+src);
        seen.add(name);
        const qr=viewer.locator(".qa-rosie-live-qr svg");
        assert.equal(await qr.count(),1,"White QR square missing");
        const mat=viewer.locator(".qa-rosie-insert-underlay svg");
        assert.equal(await mat.count(),1,"Jewel-colored underlay missing");
        const z=await page.evaluate(()=>{const root=document.querySelector(".qa-rosie-viewer");return [".qa-rosie-insert-underlay",".qa-rosie-overlay-art",".qa-rosie-live-qr"].map(x=>Number(getComputedStyle(root.querySelector(x)).zIndex));});
        assert.deepEqual(z,[1,3,5],"Incorrect three-layer order");
        await viewer.locator(".qa-rosie-composition").screenshot({path:out+"/"+viewport.name+"-"+finish+"-"+frame+"-"+name+".png"});
        screenshots++;
        if(viewport.mobile&&finish==="emerald"&&frame===0){await page.screenshot({path:out+"/iphone-full-screen.png",fullPage:false});screenshots++;}
        await viewer.getByRole("button",{name:"Next Rosie frame"}).click();
      }
      assert.equal(seen.size,4,"Missing one of four original frames");
      assert.ok(seen.has("rosie-frame-peeking.webp"),"Curious Rosie not preserved");
      await viewer.getByRole("button",{name:"Close QR preview and return to the Atelier"}).click();
      await viewer.waitFor({state:"hidden"});
    }
    if(viewport.mobile){
      for(const [route,label] of [["haiku","Haiku"],["timekeeper","Timekeeper"]]){
        await page.goto("http://127.0.0.1:4173/#"+route,{waitUntil:"domcontentloaded"});
        await page.waitForTimeout(350);
        await page.screenshot({path:out+"/iphone-"+route+".png",fullPage:false});screenshots++;
        assert.ok((await page.locator("body").innerText()).length>100,label+" page failed to render");
      }
    }else {
      for(const route of ["haiku","timekeeper"]){
        await page.goto("http://127.0.0.1:4173/#"+route,{waitUntil:"domcontentloaded"});
        await page.waitForTimeout(500);
        await page.screenshot({path:out+"/desktop-"+route+".png",fullPage:false});screenshots++;
      }
    }
    await page.close();
  }
  console.log("RELEASE QA PASS: "+screenshots+" screenshots, 4 frames, original Curious Rosie, 3 palettes, two viewports, Haiku and Timekeepers");
}finally{await browser.close();}
