import { chromium } from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";

const base=process.env.HAIKU_QA_URL||"http://127.0.0.1:4173";
const fixtures=[
  {width:1920,height:1080,label:"desktop"},
  {width:820,height:1180,label:"ipad"},
  {width:390,height:844,label:"iphone"}
];
mkdirSync("artifacts/haiku-layout",{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  for(const {width,height,label} of fixtures){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    try{
      await page.goto(base+"/#haiku",{waitUntil:"domcontentloaded",timeout:60000});
      await page.getByRole("heading",{name:"Haiku Zen Garden"}).waitFor({timeout:20000});
      // The two recovered source archives must render as actual approved art.
      assert.equal(await page.locator(".haiku-tabs > button").count(),4,label+" should have four illustrated activities");
      for (const icon of await page.locator(".haiku-tabs > button img").all()) {
        assert.ok(await icon.evaluate(el=>el.complete&&el.naturalWidth>=200),
          label+" must load high-resolution activity icon");
      }
      const crest=await page.locator(".haiku-header-mark").evaluate(el=>getComputedStyle(el).backgroundImage);
      assert.ok(crest.includes("imperial-paw-crest.webp"),label+" must use imperial Rosie crest");
      assert.equal(await page.locator(".haiku-archive-petal").count(),12,label+" twelve separate petal artworks");
      assert.equal(await page.locator(".haiku-archive-sunbeams").count(),1,label+" Field sunbeams");
      assert.equal(await page.locator(".haiku-archive-pollen").count(),1,label+" Field pollen");
      await page.getByRole("button",{name:"Zen Garden"}).click();
      assert.equal(await page.locator(".haiku-archive-zen-sand").count(),1,label+" Zen sand light sweep");
      assert.equal(await page.locator(".haiku-archive-sunbeams").count(),0,label+" Field sunbeams absent in Zen");
      await page.getByRole("button",{name:"Temple",exact:true}).click();
      assert.equal(await page.locator(".haiku-archive-temple-lantern").count(),1,label+" Temple lantern");
      assert.equal(await page.locator(".haiku-archive-zen-sand").count(),0,label+" Zen sand absent in Temple");
      await page.getByRole("button",{name:"Flower Field"}).click();

      // The approved atmospheric overlays must be present, below controls, and image-backed.
      assert.equal(await page.locator(".haiku-scene-canopy").count(),1,label+" sakura layer");
      assert.equal(await page.locator(".haiku-scene-atmosphere").count(),1,label+" atmosphere layer");
      for (const [selector,asset] of [
        [".haiku-scene-canopy","sakura-canopy.webp"],
        [".haiku-scene-atmosphere","garden-atmosphere.webp"],
        [".haiku-scene-aura","lotus-breath-halo.webp"]
      ]) {
        assert.equal(await page.locator(selector).count(),1,label+" missing "+selector);
        const image=await page.locator(selector).evaluate(el=>getComputedStyle(el).backgroundImage);
        assert.ok(image.includes(asset),label+" should use approved image "+asset);
      }

      await page.locator(".haiku-tabs button").filter({hasText:"Meditate"}).click();
      const badges=page.locator(".zen-program-emblem");
      assert.equal(await badges.count(),5,label+" should offer five independent meditation emblems");
      for(let i=0;i<5;i++){
        await badges.nth(i).scrollIntoViewIfNeeded();
        await badges.nth(i).evaluate(async img=>{if(!img.complete)await new Promise((resolve,reject)=>{
          img.addEventListener("load",resolve,{once:true});
          img.addEventListener("error",()=>reject(new Error("Failed to load "+img.src)),{once:true});
        });});
        assert.ok(await badges.nth(i).evaluate(img=>img.naturalWidth>=200),
          label+" should load a real meditation badge at "+i);
      }
      const halo=await page.locator(".zen-breath-halo").count();
      // The breathing halo lives inside the immersive dialog.
      assert.equal(halo,0,"Halo should stay hidden until meditation begins");
      await page.locator(".zen-program").first().click();
      await page.locator(".zen-begin").click();
      await page.locator(".zen-breath-halo").waitFor({state:"visible",timeout:12000});
      const bg=await page.locator(".zen-breath-halo").evaluate(el=>getComputedStyle(el).backgroundImage);
      assert.ok(bg.includes("lotus-breath-halo.webp"),label+" should render illustrated halo");
      await page.getByRole("button",{name:"Close meditation"}).click();
      await page.locator(".zen-immersive").waitFor({state:"hidden"});
      await page.locator(".haiku-tabs button").filter({hasText:"Journal"}).click();
      await page.locator(".haiku-journal-art--closed").waitFor({state:"visible"});
      assert.ok(await page.locator(".haiku-journal-art--closed").evaluate(el=>el.complete&&el.naturalWidth>200),
        label+" should display illustrated closed journal");
      await page.locator(".haiku-verse-actions button").first().click();
      await page.locator(".haiku-journal-art--open").waitFor({state:"visible"});
      await page.locator(".haiku-journal-art--open").scrollIntoViewIfNeeded();
      assert.ok(await page.locator(".haiku-journal-art--open").evaluate(el=>el.complete&&el.naturalWidth>400),
        label+" should display illustrated open journal after saving");
      assert.equal(await page.locator(".haiku-journal-list button").count(),1);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
      assert.ok(overflow<=4,label+" should have no horizontal overflow; actual "+overflow+"px");
      await page.screenshot({path:"artifacts/haiku-layout/final-art-"+label+".png",fullPage:false,animations:"disabled"});
      console.log("PASS FINAL ART "+label+" badges journal halo and responsive layout");
    }finally{await page.close();}
  }
}finally{await browser.close();}
