import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const out="qa-screenshots/remaining-release";
await fs.mkdir(out,{recursive:true});
try {
  for(const v of [{name:"iphone",width:393,height:852,mobile:true},{name:"desktop",width:1440,height:900,mobile:false}]){
    const page=await browser.newPage({viewport:{width:v.width,height:v.height},deviceScaleFactor:v.mobile?2:1,isMobile:v.mobile,hasTouch:v.mobile});
    page.setDefaultTimeout(22000);
    const errs=[];page.on("pageerror",err=>errs.push(err.message));
    await page.goto("http://127.0.0.1:4173/#qr-atelier",{waitUntil:"domcontentloaded"});
    await page.locator(".qa-inputs input").first().fill("https://example.com/rosie");
    await page.locator(".qa-svg svg").waitFor({state:"visible"});
    for(const finish of ["emerald","burgundy","sapphire"]){
      await page.locator(".qa-palette-"+finish).click();
      await page.getByRole("button",{name:"View QR in a Rosie frame"}).click();
      const viewer=page.getByRole("dialog",{name:"Rosie framed scannable QR code"});
      await viewer.waitFor();
      let found=new Set();
      for(let step=0;step<4;step++){
        const art=viewer.locator(".qa-rosie-overlay-art");
        await page.waitForFunction(()=>{
          const im=document.querySelector(".qa-rosie-viewer .qa-rosie-overlay-art");
          return im instanceof HTMLImageElement&&im.complete&&im.naturalWidth===1448;
        });
        const name=(await art.getAttribute("src")).split("/").at(-1);
        found.add(name);
        const data=await viewer.locator(".qa-rosie-insert-underlay").evaluate(node=>{
          const st=getComputedStyle(node),art=getComputedStyle(node.nextElementSibling);
          const rect=node.getBoundingClientRect();
          return {bg:st.backgroundImage,z:+st.zIndex,artZ:+art.zIndex,width:rect.width,height:rect.height,left:rect.left};
        });
        assert.ok(data.bg.includes("conic-gradient(")&&data.bg.includes("radial-gradient("),JSON.stringify(data));
        assert.ok(data.width>50&&data.height>50&&Number.isFinite(data.left),JSON.stringify(data));
        assert.ok(data.z<data.artZ,"Material must be behind frame");
        await viewer.locator(".qa-rosie-composition").screenshot({path:out+"/"+v.name+"-"+finish+"-"+name+".png"});
        await viewer.getByRole("button",{name:"Next Rosie frame"}).click();
      }
      assert.deepEqual([...found].sort(),["rosie-frame-blank-hollow.png","rosie-frame-peeking.webp","rosie-frame-presenting-hollow.png","rosie-frame-seated-hollow.png"].sort());
      await viewer.getByRole("button",{name:"Close QR preview and return to the Atelier"}).click();
    }
    await page.goto("http://127.0.0.1:4173/#captain",{waitUntil:"domcontentloaded"});
    await page.waitForTimeout(600);
    assert.ok((await page.locator("body").innerText()).includes("Yacht Dash"));
    await page.screenshot({path:out+"/"+v.name+"-captain.png",fullPage:false});
    await page.goto("http://127.0.0.1:4173/#haiku",{waitUntil:"domcontentloaded"});
    await page.waitForTimeout(300);
    assert.ok((await page.locator("body").innerText()).length>100);
    await page.screenshot({path:out+"/"+v.name+"-haiku.png",fullPage:false});
    assert.equal(errs.length,0,"Browser errors: "+errs.join("; "));
    console.log("PASS",v.name,"3 QR finishes x 4 frames, Yacht page and Haiku page");
    await page.close();
  }
}finally{await browser.close();}
