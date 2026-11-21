import {chromium} from "playwright";
import assert from "node:assert/strict";
const base=process.env.ROSIE_QA_URL||"http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true});
const opts={viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true};
const open=async route=>{
  const p=await browser.newPage(opts);
  await p.goto(base+"/#"+route,{waitUntil:"domcontentloaded",timeout:60000});
  await p.locator(".loading-screen").waitFor({state:"hidden",timeout:15000});
  return p;
};
try{
  {
    const page=await open("captain");
    const imgs=[
      "/yacht-dash/victories/emperor.webp",
      "/yacht-dash/victories/moonlight.webp",
      "/yacht-dash/victories/sakura.webp",
      "/yacht-dash/victories/typhoon.webp"
    ];
    for(const src of imgs){
      const info=await page.evaluate(async src=>{
        document.querySelector(".yacht-victory-overlay")?.remove();
        const overlay=document.createElement("div");
        overlay.className="yacht-victory-overlay";
        overlay.innerHTML='<div class="yacht-victory-backdrop"></div><div class="yacht-victory-content"><img class="yacht-victory-art"><div class="yacht-victory-actions"><button type="button">VIEW CAPTAIN’S LOG</button></div></div>';
        document.body.append(overlay);
        const img=overlay.querySelector("img");
        img.src=src;await img.decode();
        const r=img.getBoundingClientRect(),nat=img.naturalWidth/img.naturalHeight;
        return{src,rendered:r.width/r.height,natural:nat,width:r.width,height:r.height,
          cssHeight:getComputedStyle(img).height,available:innerHeight,
          imageBottom:r.bottom};
      },src);
      assert.ok(Math.abs(info.rendered-info.natural)<.025,
        "Yacht victory frame has dead letterbox space: "+JSON.stringify(info));
      assert.ok(info.imageBottom<info.available,"Victory image within iPhone viewport");
      console.log("PASS Yacht victory portrait frame fills artwork "+src,JSON.stringify(info));
    }
    await page.close();
  }
  {
    const page=await open("captain2");
    await page.getByRole("button",{name:/CAST OFF|SAIL AGAIN/}).first().click();
    await page.waitForTimeout(200);
    const full=await page.locator(".captain-fs-captain2").evaluate(el=>
      el.classList.contains("is-expanded")||document.fullscreenElement===el);
    assert.ok(full,"Captain 2 start should enter fullscreen");
    console.log("PASS Captain 2 launches fullscreen without a toggle");
    await page.close();
  }
  {
    const page=await open("captain");
    const iframe=page.frameLocator("#cosmic-odyssey-embedded-game iframe");
    await iframe.locator("#start").waitFor({state:"visible",timeout:20000});
    await iframe.locator("#start").click();
    await page.waitForTimeout(230);
    const full=await page.locator(".captain-fs-cosmic").evaluate(el=>
      el.classList.contains("is-expanded")||document.fullscreenElement===el);
    assert.ok(full,"Cosmic launch should expand parent frame");
    console.log("PASS Cosmic Odyssey launches fullscreen from embedded iframe");
    await page.close();
  }
}finally{await browser.close();}
