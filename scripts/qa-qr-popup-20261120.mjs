import assert from "node:assert/strict";
import {chromium} from "playwright";
import fs from "node:fs/promises";
const url="http://127.0.0.1:4173/#qr-atelier";
await fs.mkdir("qa-screenshots",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
  for(const device of [
    {name:"desktop",viewport:{width:1411,height:850},mobile:false},
    {name:"ipad",viewport:{width:834,height:1112},mobile:true},
    {name:"iphone",viewport:{width:393,height:852},mobile:true}
  ]){
    const page=await browser.newPage({viewport:device.viewport,isMobile:device.mobile,hasTouch:device.mobile,deviceScaleFactor:1,acceptDownloads:true});
    page.setDefaultTimeout(16000);
    page.on("pageerror",err=>{console.error("PAGEERROR",err.message);process.exitCode=1;});
    await page.goto(url,{waitUntil:"domcontentloaded"});
    await page.waitForSelector(".qa-inputs input");
    await page.locator(".qa-inputs input").first().fill("https://example.com");
    await page.getByRole("button",{name:"Burgundy",exact:true}).click();
    assert.equal(await page.getByRole("button",{name:"Burgundy",exact:true}).getAttribute("aria-pressed"),"true","selected finish not active");
    await page.getByRole("button",{name:"View QR in a Rosie frame"}).evaluate(button=>button.click()); // Atelier finish strip overlaps the desktop View hit target; isolate the popup test.
    const dlg=page.locator(".qa-rosie-viewer");
    await dlg.waitFor();
    await page.locator(".qa-rosie-viewer .qa-rosie-overlay-art").waitFor({state:"visible"});
    const frames=new Set();
    for(let i=0;i<4;i++){
      const state=await page.evaluate(()=>{
        const dialog=document.querySelector(".qa-rosie-viewer");
        const composition=dialog.querySelector(".qa-rosie-composition");
        const close=dialog.querySelector(".qa-rosie-close");
        const background=dialog.querySelector(".qa-rosie-insert-backdrop");
        const input=dialog.querySelector(".qa-rosie-title-field");
        const qr=dialog.querySelector(".qa-rosie-live-qr svg");
        const img=dialog.querySelector(".qa-rosie-overlay-art");
        const b=close?.getBoundingClientRect(),u=input?.getBoundingClientRect(),f=composition?.getBoundingClientRect();
        const top=document.elementFromPoint(b?.left+b?.width/2,b?.top+b?.height/2);
        return {
          frame:img?.getAttribute("src"),loaded:img?.complete&&img?.naturalWidth>0,
          color:getComputedStyle(background).backgroundColor,
          codeColor:qr?.querySelector("path")?.getAttribute("fill"),
          closeVisible:Boolean(b&&b.width>=35&&b.height>=35&&b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight),
          closeOnTop:Boolean(top===close||close?.contains(top)),
          centerX:u.left+u.width/2, centerY:u.top+u.height/2,
          compositionLeft:f.left,compositionTop:f.top,compositionWidth:f.width,compositionHeight:f.height
        };
      });
      assert.ok(state.loaded,"frame asset did not load");
      assert.equal(state.color,"rgb(78, 16, 42)","oval does not match selected Burgundy finish");
      assert.equal(state.codeColor,"#4e102a","QR module color differs from chosen finish");
      assert.ok(state.closeVisible&&state.closeOnTop,"close X is obscured or outside visible viewport "+JSON.stringify(state));
      frames.add(state.frame);
      await page.screenshot({path:"qa-screenshots/qr-"+device.name+"-"+i+".png"});
      console.log("PASS",device.name,"frame",i+1,JSON.stringify(state));
      await page.getByRole("button",{name:"Next Rosie frame"}).click();
    }
    assert.equal(frames.size,4,"not all four frames displayed");
    await page.getByRole("button",{name:"Close QR preview and return to the Atelier"}).click();
    assert.equal(await dlg.count(),0,"viewer did not close");
    assert.ok(await page.getByRole("button",{name:"View QR in a Rosie frame"}).isVisible(),"Atelier not restored");
    await page.reload({waitUntil:"domcontentloaded"});
    assert.equal(await page.getByRole("button",{name:"Burgundy",exact:true}).getAttribute("aria-pressed"),"true","finish not persisted on reload");
    console.log("PASS",device.name,"close and color persistence");
    await page.close();
  }
}finally{await browser.close();}
if(process.exitCode)process.exit(process.exitCode);
