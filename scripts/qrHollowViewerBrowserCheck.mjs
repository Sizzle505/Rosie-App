import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
page.setDefaultTimeout(12000);
await fs.mkdir("qa-screenshots/qr-hollow", {recursive:true});
try {
  await page.goto("http://127.0.0.1:4173/#qr-atelier",{waitUntil:"domcontentloaded"});
  await page.locator(".qa-inputs input").first().fill("https://rosie.example.com");
  await page.locator(".qa-svg svg").waitFor();
  const viewer=page.locator(".qa-rosie-viewer");
  for (const finish of ["emerald","burgundy","obsidian","champagne","sapphire"]) {
    await page.locator(".qa-palette-"+finish).click();
    await page.getByRole("button",{name:"View QR in a Rosie frame"}).click();
    await viewer.locator(".qa-rosie-overlay-art").waitFor({state:"visible"});
    for (let frame=0;frame<4;frame++) {
      await page.waitForFunction(()=>{
        const im=document.querySelector(".qa-rosie-viewer .qa-rosie-overlay-art");
        return im instanceof HTMLImageElement&&im.complete&&im.naturalWidth===1448;
      });
      const asset=await viewer.locator(".qa-rosie-overlay-art").getAttribute("src");
      assert.match(asset,/rosie-frame-(seated|presenting|peeking|blank)-hollow\.webp$/,asset);
      const frameIndex=await page.locator(".qa-rosie-frame-controls span").textContent();
      await viewer.locator(".qa-rosie-composition").screenshot({
        path:"qa-screenshots/qr-hollow/"+finish+"-"+frame+".png"
      });
      console.log("SCREENSHOT",finish,frameIndex,asset);
      if (finish==="emerald"&&frame===2) {
        await page.screenshot({path:"qa-screenshots/qr-hollow/iphone-full-view.png"});
      }
      await page.getByRole("button",{name:"Next Rosie frame"}).click();
    }
    await page.getByRole("button",{name:"Close QR preview and return to the Atelier"}).click();
  }
  console.log("PASS: 20 live iPhone QR frame compositions captured, all hollow image assets loaded.");
} finally {await browser.close();}
