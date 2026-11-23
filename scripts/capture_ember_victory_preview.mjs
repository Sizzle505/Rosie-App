import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts/ember-victory",{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  for(const device of [
    {name:"iphone",viewport:{width:390,height:844},mobile:true,dpr:2},
    {name:"desktop",viewport:{width:1440,height:900},mobile:false,dpr:1}
  ]){
    const context=await browser.newContext({
      viewport:device.viewport,isMobile:device.mobile,
      hasTouch:device.mobile,deviceScaleFactor:device.dpr,
      reducedMotion:"reduce"
    });
    const page=await context.newPage();
    for(let index=0;index<5;index++){
      await page.goto("http://127.0.0.1:4173/?emberVictoryPreview="+index+"#captain",{waitUntil:"domcontentloaded",timeout:45000});
      await page.locator(".ember-canonical-victory").waitFor({state:"visible",timeout:45000});
      await page.locator(".ember-start-overlay.is-ended.has-canonical-victory").waitFor({state:"visible",timeout:45000});
      await page.locator(".ember-canonical-victory-drill").evaluate(async img=>{await img.decode()});
      await page.locator(".ember-stage").scrollIntoViewIfNeeded();
      await page.screenshot({path:"artifacts/ember-victory/"+device.name+"-"+(index+1)+"-victory.png",fullPage:false});
      await page.locator(".ember-stage").screenshot({path:"artifacts/ember-victory/"+device.name+"-"+(index+1)+"-victory-panel.png"});
      console.log("Captured "+device.name+" victory world "+(index+1));
    }
    await context.close();
  }
}finally{await browser.close()}
