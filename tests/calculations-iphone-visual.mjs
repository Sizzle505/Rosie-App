import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = "http://127.0.0.1:5173/#calculations";
const sizes = [[375,812],[390,844],[430,932],[844,390]];
const output = "artifacts/calculations-iphone";
await fs.mkdir(output, { recursive: true });
const results = [];

for (const [engine, browserType] of [["webkit",webkit],["chromium",chromium]]) {
  const browser = await browserType.launch({ headless:true });
  try {
    for (const [width,height] of sizes) {
      const context = await browser.newContext({
        viewport:{width,height}, deviceScaleFactor:2, isMobile:true,
        hasTouch:true, reducedMotion:"reduce"
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(String(error)));
      await page.goto(base,{waitUntil:"networkidle"});
      await page.locator(".loading-screen-hidden").waitFor();
      const hero=page.locator(".rc-custom-hero");
      await hero.evaluate(async img => {if(!img.complete) await img.decode();});
      const frame=page.locator(".rac-frame");
      const geometry=await page.evaluate(()=>{
        const rect=selector=>{
          const r=document.querySelector(selector).getBoundingClientRect();
          return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
        };
        const img=document.querySelector(".rc-custom-hero");
        const keys=[...document.querySelectorAll(".rac-key,.rac-backspace,.rac-all-clear")];
        return {
          width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
          hero:rect(".rc-hero"),image:rect(".rc-custom-hero"),
          frame:rect(".rac-frame"),display:rect(".rac-display"),
          quickRow:rect(".rac-memory-keys"),
          frameFilter:getComputedStyle(document.querySelector(".rac-frame")).filter,
          railIndex:getComputedStyle(document.querySelector(".rac-frame"),"::before").zIndex,
          value:rect(".rac-readout output"),history:rect(".rac-readout small"),
          nativeWidth:img.naturalWidth,nativeHeight:img.naturalHeight,
          imageLoaded:img.complete,objectFit:getComputedStyle(img).objectFit,
          keys:keys.map(key=>{const r=key.getBoundingClientRect();return {name:key.getAttribute("aria-label"),left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};})
        };
      });
      console.log("GEOMETRY",engine,width,height,JSON.stringify({viewport:geometry.width,image:geometry.image,hero:geometry.hero,frame:geometry.frame,native:[geometry.nativeWidth,geometry.nativeHeight],scrollWidth:geometry.scrollWidth}));
      await page.screenshot({path:output+"/"+engine+"-"+width+"x"+height+"-diagnostic.png",fullPage:true});
      assert(geometry.imageLoaded && geometry.nativeWidth>0 && geometry.nativeHeight>0, "high-resolution header missing");
      assert(geometry.nativeWidth>=1000, "header resolution unexpectedly low");
      assert.equal(geometry.objectFit,"contain","artwork must never be cropped");
      assert(Math.abs(geometry.image.width-width)<=1.5,"header must span entire viewport");
      assert(Math.abs(geometry.image.height-geometry.image.width*geometry.nativeHeight/geometry.nativeWidth)<=1.5,
        "header natural aspect ratio was distorted");
      assert(Math.abs(geometry.hero.bottom-geometry.frame.top)<=1.5,"calculator must touch header seam");
      assert(Math.abs(geometry.frame.width-width)<=1.5,"calculator must fill viewport");
      assert(Math.abs(geometry.frame.left)<=1.5,"calculator left edge offset");
      assert(geometry.scrollWidth<=width+2,"horizontal overflow");
      assert(geometry.display.right-geometry.value.right>=27,"result touches display's decorative right border");
      assert(geometry.display.right-geometry.history.right>=27,"history touches display's decorative right border");
      assert(geometry.keys.every(k=>k.left>=geometry.frame.left+26&&k.right<=geometry.frame.right-26),
        "calculator keys intrude into the decorative gold side rails");
      assert(geometry.display.left>=geometry.frame.left+26&&geometry.display.right<=geometry.frame.right-26,
        "parchment display intrudes into frame");
      assert(geometry.quickRow.top-geometry.display.bottom>=0&&geometry.quickRow.top-geometry.display.bottom<=12,
        "dead space between parchment and quick keys");
      assert.equal(geometry.frameFilter,"none","outer frame filter causes full repaint / flicker");
      assert.equal(geometry.railIndex,"0","border image must sit behind controls");
      assert(geometry.keys.every(k=>k.width>=30&&k.height>=38),"unusable small key");
      assert.equal(await page.locator(".rc-tool-card").count(),7,"pocket tools removed");
      assert.equal(await page.locator(".rac-command-keys").count(),0,"obsolete separate clear row remains");
      assert.deepEqual(await page.locator(".rac-memory-keys button").evaluateAll(nodes=>nodes.map(n=>n.getAttribute("aria-label"))),
        ["Backspace","Clear all","Add to memory","Subtract from memory","Percent","Change sign","Divide"],
        "quick row must start with Backspace and AC in place of MC/MR");
      const name=engine+"-"+width+"x"+height;
      await page.screenshot({path:output+"/"+name+"-full.png",fullPage:true});
      await hero.screenshot({path:output+"/"+name+"-header.png"});
      await frame.screenshot({path:output+"/"+name+"-calculator.png"});

      const digit=n=>page.getByRole("button",{name:String(n),exact:true});
      await digit(7).click();
      await page.getByRole("button",{name:"Multiply"}).click();
      await digit(8).click();
      await page.getByRole("button",{name:"Equals"}).click();
      assert.equal(await page.locator(".rac-readout output").innerText(),"56","arithmetic regression");
      await page.getByRole("button",{name:"Clear all"}).click();
      for(const n of "123") await digit(n).click();
      await page.getByRole("button",{name:"Backspace"}).click();
      assert.equal(await page.locator(".rac-readout output").innerText(),"12","backspace regression");
      await page.getByRole("button",{name:"Add to memory"}).click();
      assert.equal(await page.locator(".rac-memory-indicator").innerText(),"M","memory storage regression");
      await page.getByRole("button",{name:"Clear all"}).click();
      assert.equal(await page.locator(".rac-memory-indicator").innerText(),"M","AC must preserve memory");
      assert.equal(await page.locator(".rac-readout output").innerText(),"0","AC reset regression");
      assert.equal(await page.getByRole("button",{name:"Memory recall"}).count(),0,"unused MR key must be removed");
      assert.equal(await page.getByRole("button",{name:"Memory clear"}).count(),0,"unused MC key must be removed");
      await page.getByRole("button",{name:"Clear all"}).click();
      for(const n of "12345678901234") await digit(n).click();
      const fits=await page.locator(".rac-readout output").evaluate(el=>el.scrollWidth<=el.clientWidth+2);
      const stable=await frame.evaluate(el=>{
        const frameRect=el.getBoundingClientRect();
        const border=getComputedStyle(el,"::before");
        return {width:frameRect.width,top:frameRect.top,railIndex:border.zIndex,filter:getComputedStyle(el).filter};
      });
      assert(Math.abs(stable.width-geometry.frame.width)<=1,"frame changes width while typing");
      assert.equal(stable.railIndex,"0","gold rail lost stable lower layer after input");
      assert.equal(stable.filter,"none","frame filter reapplied after input");
      assert(fits,"long values clipped in parchment");
      assert.equal(errors.length,0,"console page error(s): "+errors.join(" | "));
      // Rosie Resources is now the approved observatory: one backdrop, a title crest,
      // and three complete, independently clickable image-buttons.
      await page.goto("http://127.0.0.1:5173/#resources",{waitUntil:"networkidle"});
      await page.locator(".rr-hub-button").first().waitFor();
      const art = page.locator(".rr-hub-crest,.rr-hub-button img");
      await art.evaluateAll(async images => {
        await Promise.all(images.map(async img => {
          if (!img.complete || img.naturalWidth === 0) await img.decode();
        }));
      });
      const resources = await page.locator(".rr-hub-button").evaluateAll(elements => elements.map(el => {
        const rect=el.getBoundingClientRect();
        const img=el.querySelector("img");
        return {title:el.getAttribute("aria-label"),height:rect.height,width:rect.width,x:rect.x,
          naturalWidth:img.naturalWidth,loaded:img.complete,src:img.getAttribute("src")};
      }));
      const backdrop=await page.locator(".rr-hub-page").evaluate(el=>getComputedStyle(el).backgroundImage);
      assert(backdrop.includes("observatory.webp"),"Approved observatory background is missing");
      assert.equal(await page.locator(".rr-hub-crest").count(),1,"Resources title crest missing");
      assert.equal(resources.length,3,"Resources needs exactly three image-buttons");
      assert(resources.every(x=>x.loaded&&x.naturalWidth>=1000),"Resources button imagery is missing or low resolution");
      assert(resources.every(x=>x.width<=width+1&&x.x>=-1&&x.x+x.width<=width+1),"Resources buttons overflow the screen");
      assert.deepEqual(resources.map(x=>x.title),[
        "Open Rosie’s Reminders","Open Rosie’s Timekeeper","Open Rosie’s Calculations"
      ],"Resources order or destination text changed");
      await page.screenshot({path:output+"/"+name+"-resources.png",fullPage:true});
      for(const [index,hash] of [[0,"reminders"],[1,"timekeeper"],[2,"calculations"]]){
        await page.locator(".rr-hub-button").nth(index).click();
        await page.waitForURL("**/#"+hash);
        await page.goto("http://127.0.0.1:5173/#resources",{waitUntil:"networkidle"});
        await page.locator(".rr-hub-button").first().waitFor();
      }
      results.push({engine,width,height,headerNatural:[geometry.nativeWidth,geometry.nativeHeight],seam:geometry.frame.top-geometry.hero.bottom,displayInset:geometry.display.right-geometry.value.right,passed:true});
      await context.close();
      console.log("PASS",name,JSON.stringify(results.at(-1)));
    }
  } finally { await browser.close(); }
}
await fs.writeFile(output+"/metrics.json",JSON.stringify(results,null,2));
console.log("All calculations iPhone viewports and interactions passed");
