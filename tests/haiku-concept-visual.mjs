import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const base=process.env.HAIKU_QA_URL||"http://127.0.0.1:4173";
const sizes=[
  {width:1920,height:1080,label:"wide-desktop"},
  {width:1792,height:856,label:"desktop-1792"},
  {width:1440,height:900,label:"desktop-1440"},
  {width:1024,height:768,label:"ipad-landscape"},
  {width:820,height:1180,label:"ipad-portrait"},
  {width:390,height:844,label:"iphone"},
];
mkdirSync("artifacts/haiku-layout",{recursive:true});
const browser=await chromium.launch({headless:true});
const report=[];
try{
  for (const {width,height,label} of sizes){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    try{
      await page.goto(base+"/#haiku",{waitUntil:"domcontentloaded",timeout:60000});
      await page.locator(".haiku-workbench").waitFor({state:"visible",timeout:20000});
      await page.locator(".loading-screen").waitFor({state:"hidden",timeout:15000});
      await page.locator(".app-shell-visible").waitFor({state:"visible",timeout:15000});
      const tabs=page.locator(".haiku-tabs > button");
      assert.equal(await tabs.count(),4,label+" must have four illustrated activities");
      const iconRects=[];
      for (const icon of await page.locator(".haiku-tabs > button img").all()){
        await icon.evaluate(im=>im.decode());
        const r=await icon.evaluate(im=>({width:im.getBoundingClientRect().width,
          height:im.getBoundingClientRect().height,natural:im.naturalWidth}));
        assert.ok(r.natural>=200,label+" mode icon source missing");
        assert.ok(r.width >= (width<=600?48:width<900?75:width<1480?69:80),
          label+" mode icon too small: "+r.width);
        iconRects.push(r);
      }
      const panel=await page.locator(".haiku-workbench").evaluate(el=>{
        const style=getComputedStyle(el);
        const rect=el.getBoundingClientRect();
        return {backgroundColor:style.backgroundColor,backgroundImage:style.backgroundImage,
          width:rect.width,x:rect.x,right:rect.right};
      });
      assert.equal(panel.backgroundColor,"rgba(0, 0, 0, 0)",label+" outer studio must be transparent");
      assert.equal(panel.backgroundImage,"none",label+" old opaque studio background must be removed");
      const sceneButtons=await page.locator(".haiku-scene-selector button").evaluateAll(els=>
        els.map(el=>el.getBoundingClientRect().height));
      assert.equal(sceneButtons.length,3);
      assert.ok(sceneButtons.every(v=>v>=(width<=600?63:76)),
        label+" scene choices must be comfortably tappable");
      await page.getByRole("button",{name:"Meditate",exact:true}).click();
      const cards=page.locator(".zen-program-grid .zen-program");
      assert.equal(await cards.count(),5,label+" must show five existing meditations");
      const cardRects=[];
      for(const art of await page.locator(".zen-program-emblem").all()){
        await art.evaluate(im=>im.decode());
        const icon=await art.evaluate(im=>({width:im.getBoundingClientRect().width,
          natural:im.naturalWidth}));
        assert.ok(icon.natural>=200,label+" meditation image not loaded");
        assert.ok(icon.width>=(width<=600?69:width<900?79:width<1480?69:68),
          label+" meditation illustration must be recognizable: "+icon.width);
        cardRects.push(icon);
      }
      const geometry=await page.evaluate(()=>{
        const box=(s)=>{const r=document.querySelector(s).getBoundingClientRect();
          return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
        return {rosie:box(".haiku-scene-stage"),poem:box(".haiku-scroll"),
          studio:box(".haiku-workbench"),title:box(".haiku-heading h1"),
          scene:box(".haiku-scene-image"),
          mode:box(".haiku-tabs"),
          width:document.documentElement.scrollWidth};
      });
      assert.ok(geometry.width<=width+4,label+" page must not overflow horizontally");
      if(width>=1480){
        assert.ok(geometry.rosie.right < geometry.poem.x,
          label+" Rosie and poem must occupy separate visual columns");
        assert.ok(geometry.poem.right < geometry.studio.x,
          label+" poem and studio must occupy separate visual columns");
        assert.ok(geometry.studio.width>=470,label+" roomy studio needed for original art");
      }
      if(width<=600){
        assert.ok(geometry.studio.y>geometry.poem.y,
          label+" stacked phone layout must keep poem ahead of studio");
      }
      await page.screenshot({path:"artifacts/haiku-layout/concept-"+label+".png",
        fullPage:false,animations:"disabled"});
      if(width===1792||width===390)await page.screenshot({
        path:"artifacts/haiku-layout/concept-"+label+"-full.png",
        fullPage:true,animations:"disabled"});
      report.push({label,width,height,iconRects,cardRects,panel,geometry});
      console.log("PASS HAIKU CONCEPT "+label+" mode icons="+iconRects[0].width+
        " program icons="+cardRects[0].width+" transparent="+panel.backgroundColor);
    }catch(error){
      await page.screenshot({path:"artifacts/haiku-layout/concept-"+label+"-failure.png",
        fullPage:true,animations:"disabled"}).catch(()=>{});
      throw error;
    }finally{await page.close();}
  }
  writeFileSync("artifacts/haiku-layout/concept-metrics.json",JSON.stringify(report,null,2));
}finally{await browser.close();}
