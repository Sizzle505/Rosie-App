import {chromium} from "playwright";
import assert from "node:assert/strict";
const base=process.env.HAIKU_QA_URL||"http://127.0.0.1:4173";
const screens=[
  {width:1792,height:856,label:"desktop"},
  {width:1440,height:900,label:"desktop-compact"},
  {width:820,height:1180,label:"ipad"},
  {width:390,height:844,label:"iphone"},
];
const browser=await chromium.launch({headless:true});
try{
  for(const {width,height,label} of screens){
    const page=await browser.newPage({viewport:{width,height}});
    try{
      await page.goto(base+"/#haiku",{waitUntil:"domcontentloaded",timeout:60000});
      await page.locator(".haiku-scroll").waitFor({state:"visible"});
      await page.locator(".loading-screen").waitFor({state:"hidden",timeout:15000});
      assert.equal(await page.locator(".haiku-masthead-tagline").count(),0,label+" old subtitle removed");
      assert.ok((await page.locator(".haiku-status").innerText()).includes("Small poems. Deep breaths. Grand opinions."),
        label+" subtitle belongs below poem");
      assert.equal(await page.locator(".haiku-scene-aura").count(),0,label+" stray lotus removed");

      for(const [i,name,filename] of [
        [0,"Flower Field","field-sunrise.webp"],
        [1,"Zen Garden","zen-sunrise.webp"],
        [2,"Temple","temple-sunrise.webp"]
      ]){
        const button=page.locator(".haiku-scene-selector button").nth(i);
        assert.equal((await button.textContent()).trim(),"",label+" scene controls are image-only");
        assert.equal(await button.getAttribute("aria-label"),name);
        const art=button.locator("img");
        await art.evaluate(img=>img.decode());
        assert.ok((await art.getAttribute("src")).endsWith(filename),
          label+" uses existing scenic art "+filename);
        assert.ok((await art.boundingBox()).width>=70,label+" scene art legible");
      }
      for(const [i,name] of [[0,"Save"],[1,"Share Verse"],[2,"Picture Postcard"]]){
        const button=page.locator(".haiku-verse-actions button").nth(i);
        assert.equal((await button.textContent()).trim(),"",label+" poem actions are image-only");
        assert.equal(await button.getAttribute("aria-label"),name);
        assert.equal(await button.locator("svg").count(),1,label+" action graphic");
        assert.ok((await button.locator("svg").boundingBox()).width>=40,label+" graphic legibility");
      }
      const alignment=await page.evaluate(()=>{
        const center=s=>{const r=document.querySelector(s).getBoundingClientRect();return r.x+r.width/2};
        const a=document.querySelector(".haiku-tabs > button");
        const txt=a.querySelector(".haiku-tab-label").getBoundingClientRect();
        const art=a.querySelector("img").getBoundingClientRect();
        const nav=document.querySelector(".haiku-tabs").getBoundingClientRect();
        const body=document.querySelector(".haiku-workbench-body").getBoundingClientRect();
        const outer=getComputedStyle(document.querySelector(".haiku-workbench"));
        return {sceneOffset:Math.abs(center(".haiku-scene-selector")-center(".haiku-scene-rosie")),
          actionOffset:Math.abs(center(".haiku-verse-actions")-center(".haiku-scroll")),
          labelAbove:txt.bottom<=art.top+2,
          panelBelow:body.top>=nav.bottom-1,
          outerBorder:outer.borderTopWidth,
          horizontalOverflow:document.documentElement.scrollWidth-innerWidth};
      });
      assert.ok(alignment.sceneOffset<=45,label+" scenes centered below Rosie "+alignment.sceneOffset);
      assert.ok(alignment.actionOffset<=35,label+" actions centered below poetry "+alignment.actionOffset);
      assert.ok(alignment.labelAbove,label+" labels above tab artwork");
      assert.ok(alignment.panelBelow,label+" panel begins below menu");
      assert.equal(alignment.outerBorder,"0px",label+" menu not enclosed by old frame");
      assert.ok(alignment.horizontalOverflow<=4,label+" no horizontal overflow");
      console.log("PASS HAIKU HELD POLISH "+label+" "+JSON.stringify(alignment));
    }finally{await page.close();}
  }
}finally{await browser.close();}
