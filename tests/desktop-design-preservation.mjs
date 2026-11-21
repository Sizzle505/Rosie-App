import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

/*
 * Desktop Design Preservation: 1920x1080 is the approved reference.
 * This is a layout/interaction safety net, not a pixel-perfect assertion
 * that would fail on text, live clocks or scene animation.
 */
const base = process.env.ROSIE_QA_URL || "http://127.0.0.1:4173";
const out = "artifacts/desktop-preservation";
const viewports = [
  [1366, 768], [1440, 900], [1600, 900], [1792, 856],
  [1920, 1080], [1920, 1200], [2256, 1504],
  [2560, 1080], [3440, 1440]
];
const screens = [
  ["qr-atelier", ".app-shell.page-qr-atelier .qa-scene"],
  ["calculations", ".app-shell.page-calculations main.rc-page"],
  ["recipes", ".app-shell.page-recipes > .recipes-page"],
  ["haiku", ".app-shell.page-haiku main.haiku-page"],
  ["timekeeper", ".app-shell.page-timekeeper main.rtk-page"],
];
await fs.mkdir(out, { recursive:true });
const browser = await chromium.launch({ headless:true });
const summary=[];
const nearly=(actual,expected,tolerance=3)=>Math.abs(actual-expected)<=tolerance;
const rect = element => {
  if (!element) return null;
  const r=element.getBoundingClientRect();
  return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom };
};
try {
  for (const [width,height] of viewports) {
    const context = await browser.newContext({
      viewport:{width,height}, deviceScaleFactor:1,
      reducedMotion:"reduce", colorScheme:"dark"
    });
    for (const [route,selector] of screens) {
      const page=await context.newPage();
      const errors=[];
      page.on("pageerror",error=>errors.push(String(error)));
      const label=route+"-"+width+"x"+height;
      try {
        await page.goto(base+"/#"+route,{waitUntil:"domcontentloaded",timeout:60000});
        await page.locator(selector).waitFor({state:"attached",timeout:25000});
        await page.locator(".loading-screen").waitFor({state:"hidden",timeout:20000});
        await page.evaluate(()=>document.fonts.ready);
        const info=await page.evaluate(({selector})=>{
          const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();
            return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
          const selected=document.querySelector(selector);
          return {
            screen:box(selected),
            stage:box(document.querySelector(".qa-scene")),
            calculator:box(document.querySelector(".rc-calculator-stage")),
            workspace:box(document.querySelector(".rc-workspace")),
            chef:box(document.querySelector(".recipes-top-scene")),
            cookbook:box(document.querySelector(".recipes-body")),
            controls:document.querySelector(".recipes-desktop-controls")?
              getComputedStyle(document.querySelector(".recipes-desktop-controls")).position:null,
            poemMove:document.querySelector(".haiku-scene-image")?
              getComputedStyle(document.querySelector(".haiku-scene-image")).translate:null,
            layoutToken:getComputedStyle(document.documentElement)
              .getPropertyValue("--rosie-desktop-preservation").trim(),
            overflow:document.documentElement.scrollWidth-innerWidth,
            qrWall:getComputedStyle(document.querySelector(".qa-scene")||document.body,"::before").left
          };
        },{selector});
        assert.equal(info.layoutToken,"active",label+" missing desktop-only layout token");
        assert(info.screen&&info.screen.width>400&&info.screen.height>100,label+" missing layout surface");
        assert(info.screen.x>=-5&&info.screen.right<=width+6,label+" primary layout escapes viewport "+JSON.stringify(info.screen));
        assert(info.overflow<=10,label+" horizontal overflow +"+info.overflow+"px");
        if (width>1920&&["qr-atelier","calculations","recipes"].includes(route)){
          assert(nearly(info.screen.width,1920,3),label+" must preserve 1920px designed stage "+JSON.stringify(info.screen));
          assert(nearly(info.screen.x,(width-1920)/2,3),label+" stage must be centered "+JSON.stringify(info.screen));
        }
        if(route==="recipes"&&info.chef&&info.cookbook){
          assert(info.chef.right<=info.cookbook.x+30,label+" chef illustration collided with cookbook "+JSON.stringify(info));
        }
        if(route==="calculations"&&info.calculator&&info.workspace){
          assert(info.calculator.right<=info.workspace.x+24,label+" calculator collided with instruments "+JSON.stringify(info));
        }
        if(route==="haiku"&&width===1920&&height===1080){
          const diagnostic=await page.evaluate(()=>{
            const el=document.querySelector(".haiku-scene-image");
            const st=el?getComputedStyle(el):null;
            return {
              validCss:CSS.supports("translate","clamp(-102px, -5.3125vw, -78px) clamp(116px, 16.6667dvh, 180px)"),
              media:matchMedia("(min-width:1480px) and (hover:hover) and (pointer:fine)").matches,
              count:document.querySelectorAll(".haiku-scene-image").length,
              inside:!!el?.closest(".app-shell.page-haiku"),
              className:el?.className, translate:st?.translate, transform:st?.transform,
              scrollTranslate:getComputedStyle(document.querySelector(".haiku-scroll")).translate
            };
          });
          console.log("HAIKU DIAGNOSTIC "+JSON.stringify(diagnostic));
          const match=info.poemMove?.match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/);
          assert(match&&nearly(Number(match[1]),-102,1)&&nearly(Number(match[2]),180,1),
            "1920x1080 must preserve the approved Haiku scene offset: "+info.poemMove);
        }
        if(route==="qr-atelier"&&width>1920){
          assert(nearly(parseFloat(info.qrWall),(width-1920)/2,3),
            label+" painted workshop left wall must track centered stage: "+info.qrWall);
        }
        summary.push({label,...info});
        await page.screenshot({path:out+"/"+label+".png",animations:"disabled"});
        assert.equal(errors.length,0,label+" JavaScript errors: "+errors.join(" | "));
        console.log("PASS "+label);
      } catch(error) {
        await page.screenshot({path:out+"/"+label+"-FAILED.png",animations:"disabled"}).catch(()=>{});
        throw error;
      } finally {
        await page.close();
      }
    }
    await context.close();
  }
  // A touch-capable 1366px tablet must remain in the iPad family; phones must
  // remain in their existing layout. A 1024px laptop also stays below this
  // particular desktop preservation layer.
  for (const device of [
    {label:"iphone",width:390,height:844,hasTouch:true},
    {label:"ipad-landscape",width:1366,height:1024,hasTouch:true},
    {label:"compact-desktop",width:1024,height:768,hasTouch:false}
  ]) {
    const ctx=await browser.newContext({
      viewport:{width:device.width,height:device.height},
      hasTouch:device.hasTouch, reducedMotion:"reduce"
    });
    const page=await ctx.newPage();
    await page.goto(base+"/#calculations",{waitUntil:"domcontentloaded",timeout:60000});
    await page.locator(".rc-page").waitFor({state:"attached"});
    const marker=await page.evaluate(()=>getComputedStyle(document.documentElement)
      .getPropertyValue("--rosie-desktop-preservation").trim());
    assert.equal(marker,"",device.label+" must not inherit desktop corrections");
    await page.screenshot({path:out+"/"+device.label+"-isolation.png",animations:"disabled"});
    await ctx.close();
    console.log("PASS "+device.label+" isolation");
  }
  await fs.writeFile(out+"/geometry.json",JSON.stringify(summary,null,2));
} finally {
  await browser.close();
}
console.log("DESKTOP PRESERVATION GEOMETRY AND DEVICE ISOLATION PASSED");
