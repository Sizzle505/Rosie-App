import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const base=process.env.HAIKU_QA_URL||"http://127.0.0.1:4173";
mkdirSync("artifacts/rosie-zen-polish",{recursive:true});
const browser=await chromium.launch({headless:true});

try {
  for(const {width,height,label} of [
    {width:390,height:844,label:"iphone"},
    {width:430,height:932,label:"iphone-large"}
  ]) {
    const page=await browser.newPage({
      viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true
    });
    try {
      await page.clock.install();
      await page.goto(base+"/#haiku",{waitUntil:"domcontentloaded",timeout:60000});
      await page.locator(".loading-screen").waitFor({state:"hidden"});
      await page.locator(".haiku-workbench").waitFor({state:"visible"});

      await page.getByRole("button",{name:"Compose",exact:true}).click();
      const heading=page.locator(".haiku-desk-feature h2");
      await heading.waitFor({state:"visible"});
      assert.deepEqual(await heading.locator("span").allTextContents(),
        ["A Poem for","Everything"],label+" must deliberately place title on two lines");
      const desk=await page.evaluate(()=>{
        const feature=document.querySelector(".haiku-desk-feature").getBoundingClientRect();
        const title=document.querySelector(".haiku-desk-feature h2").getBoundingClientRect();
        return {feature:feature.toJSON(),title:title.toJSON()};
      });
      assert.ok(desk.title.left>=desk.feature.left+desk.feature.width*.14,
        label+" desk title must stay between the legs");
      assert.ok(desk.title.right<=desk.feature.right-desk.feature.width*.14,
        label+" desk title may not cross either table leg");
      assert.ok(desk.title.bottom<=desk.feature.bottom+3,
        label+" desk title should stay attached to the painted desk");
      await page.screenshot({
        path:"artifacts/rosie-zen-polish/"+label+"-poetry-desk.png",
        animations:"disabled",fullPage:false
      });

      await page.getByRole("button",{name:"Meditate",exact:true}).click();
      assert.equal(await page.getByRole("button",{name:"Sunlit Zen Garden"}).count(),0,
        label+" must not offer blurry legacy sand on iPhone");
      await page.locator(".zen-begin").click();
      const dialog=page.getByRole("dialog",{name:"Breathe with Rosie"});
      await dialog.waitFor({state:"visible"});
      assert.notEqual(await page.locator(".zen-immersive").getAttribute("data-zen-view"),
        "raked",label+" should start on approved scenery");
      const controls=page.locator(".zen-session-controls button");
      assert.equal(await controls.count(),2);
      assert.equal(await controls.locator("img[src$='-circle.svg']").count(),2,
        label+" must render two standalone circular vector assets");
      assert.match(await controls.first().locator("img").getAttribute("src"),
        /meditation-pause-circle\\.svg$/);
      assert.match(await controls.last().locator("img").getAttribute("src"),
        /meditation-end-circle\\.svg$/);
      assert.ok(await controls.first().getAttribute("aria-label")==="Pause meditation");
      await controls.first().click();
      assert.equal(await controls.first().getAttribute("aria-label"),"Resume meditation");
      assert.match(await controls.first().locator("img").getAttribute("src"),
        /meditation-resume-circle\\.svg$/);
      await controls.first().click();
      assert.equal(await controls.first().getAttribute("aria-label"),"Pause meditation");
      for(let i=0;i<8;i++){
        const scene=await page.locator(".zen-immersive").getAttribute("data-zen-view");
        assert.notEqual(scene,"raked",label+" must skip blurry background in session carousel");
        await dialog.getByRole("button",{name:"Next meditation background"}).click();
      }
      const ambience=await page.evaluate(()=>{
        const root=document.querySelector(".zen-immersive .rosie-ambient");
        return {
          overallOpacity:parseFloat(getComputedStyle(root).opacity),
          petals:root.querySelectorAll(".rosie-ambient-petal").length,
          decorative:[...root.querySelectorAll("img")].filter(img=>getComputedStyle(img).display!=="none").map(img=>({
            width:img.getBoundingClientRect().width,
            height:img.getBoundingClientRect().height
          }))
        };
      });
      assert.ok(ambience.overallOpacity>=.9,label+" effects need visible contrast");
      assert.equal(ambience.petals,10,label+" should display 10 independently drifting petals");
      assert.ok(ambience.decorative.every(x=>x.width<=90 && x.height<=110),
        label+" ornament must never cover painted garden");
      await page.screenshot({
        path:"artifacts/rosie-zen-polish/"+label+"-session.png",
        animations:"disabled",fullPage:false
      });

      await page.clock.fastForward(5*60*1000+1200);
      await page.locator(".zen-complete").waitFor({state:"visible",timeout:15000});
      const finished=await page.evaluate(()=>{
        const stage=document.querySelector(".zen-complete-stage").getBoundingClientRect();
        const copy=document.querySelector(".zen-complete-copy").getBoundingClientRect();
        const rose=document.querySelector(".zen-victory-rosie").getBoundingClientRect();
        const seal=document.querySelector(".zen-enlightenment-seal").getBoundingClientRect();
        const stats=document.querySelector(".zen-complete-stats");
        return {stage:stage.toJSON(),copy:copy.toJSON(),rose:rose.toJSON(),
          seal:seal.toJSON(),statsCount:stats?.querySelectorAll("span").length,
          end:window.innerHeight};
      });
      assert.ok(finished.stage.height>=180,label+" Rosie should be the prominent reward");
      assert.ok(finished.rose.height>=140,label+" victory Rosie must be visible");
      assert.ok(finished.seal.width<=100,label+" seal must not dominate the portrait");
      assert.ok(finished.stage.bottom<=finished.copy.top+8,
        label+" reward image and caption should not overlap");
      assert.ok(finished.copy.bottom<=finished.end+1,
        label+" caption card must stay fully visible on iPhone");
      assert.equal(finished.statsCount,2,label+" clean two-stat reward layout");
      await page.screenshot({
        path:"artifacts/rosie-zen-polish/"+label+"-victory.png",
        animations:"disabled",fullPage:false
      });
      console.log("PASS "+label+" desk, controls, background rotation, ambient decorations, and victory layout");
    } finally {await page.close();}
  }
} finally {await browser.close();}
