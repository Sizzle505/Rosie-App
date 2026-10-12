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
      assert(Math.abs(geometry.hero.bottom-geometry.frame.top-18)<=1.5,"calculator must start 18px above header seam");
      assert(await page.locator(".rc-calculator-stage").evaluate(el=>Number(getComputedStyle(el).zIndex)) <
        await page.locator(".rc-hero").evaluate(el=>Number(getComputedStyle(el).zIndex)),
        "the Calculations header must be in front of the raised normal calculator");
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
        ["Clear all","Add to memory","Subtract from memory","Percent","Change sign","Divide","Backspace"],
        "quick row must start with AC and end with Backspace");
      const toolkitLayout=await page.evaluate(()=>{
        const heading=document.querySelector(".rc-tools-heading");
        const grid=document.querySelector(".rc-tool-grid");
        return {headingMargin:parseFloat(getComputedStyle(heading).marginTop),
          rowGap:parseFloat(getComputedStyle(grid).rowGap),
          cardMargin:parseFloat(getComputedStyle(grid.querySelector("button")).marginTop)};
      });
      assert(toolkitLayout.headingMargin<=14 && toolkitLayout.rowGap===0 && toolkitLayout.cardMargin<=-4,
        "Pocket Toolkit dead space was not reduced: "+JSON.stringify(toolkitLayout));
      await page.locator(".rc-tool-card").first().click();
      if(width<=600) {
        await page.waitForTimeout(480);
        const alignment=await page.evaluate(async ()=>{
          const panel=document.querySelector(".rc-device").getBoundingClientRect();
          const stage=document.querySelector(".rc-active-tool-viewport").getBoundingClientRect();
          const overlay=document.querySelector(".rc-active-tool-overlay");
          const backdrop=getComputedStyle(overlay);
          const nav=document.querySelector(".bottom-nav").getBoundingClientRect();
          const image=new Image();
          image.src="/rosieverse/calculations/burgundy-satin.png";
          await image.decode();
          return {panel:{top:panel.top,bottom:panel.bottom,left:panel.left,right:panel.right},
            stage:{top:stage.top,bottom:stage.bottom},
            width:innerWidth,height:innerHeight,navTop:nav.top,
            overlayTop:overlay.getBoundingClientRect().top,
            overlayBottom:overlay.getBoundingClientRect().bottom,
            toolMid:(panel.top+panel.bottom)/2,
            usableMid:(stage.top+stage.bottom)/2,
            background:backdrop.backgroundImage,
            repeat:backdrop.backgroundRepeat,
            backgroundSize:backdrop.backgroundSize,
            underlay:getComputedStyle(document.querySelector(".rc-page--tool-open")).backgroundImage,
            pageBackdrop:getComputedStyle(document.querySelector(".app-shell.page-calculations")).backgroundImage,
            pageBackdropRepeat:getComputedStyle(document.querySelector(".app-shell.page-calculations")).backgroundRepeat,
            naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight
          };
        });
        assert(alignment.background.includes("/rosieverse/calculations/burgundy-satin.png") &&
          alignment.repeat==="no-repeat" && alignment.backgroundSize==="cover" &&
          alignment.naturalWidth>=900 && alignment.naturalHeight>=1600,
          "Original full-resolution satin artwork must fill one full viewport without tiling: "+JSON.stringify(alignment));
        assert(Math.abs(alignment.overlayTop)<=1 && Math.abs(alignment.overlayBottom-alignment.height)<=2,
          "Satin must cover original header from top to bottom of iPhone: "+JSON.stringify(alignment));
        assert(alignment.underlay==="none" &&
          !alignment.pageBackdrop.includes("rosie-salon-burgundy-texture.svg") &&
          alignment.pageBackdrop.includes("/rosieverse/calculations/burgundy-satin.png") &&
          alignment.pageBackdropRepeat==="no-repeat",
          "Old tiled red background must disappear completely beneath satin and translucent navigation: "+JSON.stringify(alignment));
        assert(Math.abs(alignment.toolMid-alignment.usableMid)<17 &&
          alignment.panel.top>=alignment.stage.top-3 &&
          alignment.panel.bottom<=alignment.navTop-6 &&
          alignment.panel.left>=-1 && alignment.panel.right<=alignment.width+1,
          "Entire scaled gold tool must fit centered above navigation: "+JSON.stringify(alignment));
      }
      const layers=await page.evaluate(()=>({
        hero:Number(getComputedStyle(document.querySelector(".rc-hero")).zIndex),
        normal:Number(getComputedStyle(document.querySelector(".rc-calculator-stage")).zIndex),
        gold:Number(getComputedStyle(document.querySelector(".rc-tool-panel.rc-device")).zIndex),
        selectors:Number(getComputedStyle(document.querySelector(".rc-tool-grid")).zIndex),
        workspace:getComputedStyle(document.querySelector(".rc-workspace")).zIndex
      }));
      assert(layers.gold>layers.hero && layers.hero>layers.normal &&
        layers.hero>layers.selectors && layers.workspace==="auto",
        "Calculations header must cover selector buttons, while only the gold tool is above it: "+JSON.stringify(layers));
      await page.getByRole("button",{name:"Close gold tool and return to calculator choices"}).click();
      const name=engine+"-"+width+"x"+height;
      await page.screenshot({path:output+"/"+name+"-full.png",fullPage:true});
      await hero.screenshot({path:output+"/"+name+"-header.png"});
      await frame.screenshot({path:output+"/"+name+"-calculator.png"});

      // The user's approved Rosie banner is itself sticky. No substitute
      // title-only bar is permitted, and the full uncropped image remains pinned.
      assert.equal(await page.locator(".rc-pinned-dock").count(),0,
        "The replacement Calculations text banner should have been removed");
      assert.equal(await page.locator(".rc-hero").evaluate(el=>getComputedStyle(el).position),
        "sticky","The original Calculations banner is not sticky");
      await page.evaluate(()=>{
        const banner=document.querySelector(".rc-hero");
        window.scrollTo({top:banner.getBoundingClientRect().height+160,behavior:"instant"});
      });
      await page.waitForTimeout(200);
      const pinnedHero=await page.locator(".rc-hero").evaluate(el=>({
        top:el.getBoundingClientRect().top,
        position:getComputedStyle(el).position,
        imgHeight:el.querySelector("img").getBoundingClientRect().height,
        scroll:window.scrollY
      }));
      assert(pinnedHero.scroll>90, "Calculations does not scroll past the full banner");
      assert.equal(pinnedHero.position,"sticky","The Rosie Calculations artwork stopped being sticky");
      assert(pinnedHero.top>=-26 && pinnedHero.top<=-24,
        "Full Calculations image should slide up 25px before pinning: "+JSON.stringify(pinnedHero));
      assert(pinnedHero.imgHeight>90,"Pinned Rosie Calculations picture was hidden");
      await page.screenshot({path:output+"/"+name+"-pinned-banner.png"});
      await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
      await page.waitForTimeout(130);
      const navOffset=await page.locator(".nav-family-toggle").evaluate(el=>{
        const m=getComputedStyle(el).transform.match(/^matrix\(([^)]+)\)$/);
        return m ? Number(m[1].split(",")[5]) : NaN;
      });
      assert(Math.abs(navOffset-10)<=0.5,
        "Calculations pendant must be raised 4px from the previous 14px offset: "+navOffset);
      const raisedNavContent=await page.locator(".bottom-nav .nav-icon-wrap").first()
        .evaluate(el=>getComputedStyle(el).top);
      assert.equal(raisedNavContent,"-7px",
        "bottom navigation content should be 5px above the Games/Tools pendant");

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
      // Grand Salon approved illustration must be full width, not the previous two-column tile.
      await page.goto("http://127.0.0.1:5173/#home",{waitUntil:"networkidle"});
      const salonNav = page.locator('nav[aria-label="RosieVerse destinations"]');
      const resourceTile = salonNav.getByRole("button",{name:"Open Rosie’s Resources"});
      await resourceTile.locator("img").evaluate(async img => {if (!img.complete) await img.decode();});
      const tileGeometry = await resourceTile.evaluate(el => {
        const r=el.getBoundingClientRect(), nav=el.parentElement.getBoundingClientRect();
        const img=el.querySelector("img");
        return {width:r.width,navWidth:nav.width,left:r.left,right:r.right,
          imageWidth:img.getBoundingClientRect().width,naturalWidth:img.naturalWidth,
          currentSrc:img.currentSrc};
      });
      assert(tileGeometry.currentSrc.endsWith("/rosieverse/buttons/resources.png"),
        "wrong Grand Salon Resources button asset");
      assert.equal(tileGeometry.naturalWidth,2172,"original button art was replaced or missing");
      assert(tileGeometry.width>=tileGeometry.navWidth*.93 && Math.abs(tileGeometry.width-tileGeometry.imageWidth)<=2,
        "Resources button is still a tiny two-column tile: "+JSON.stringify(tileGeometry));
      assert(tileGeometry.left>=-1 && tileGeometry.right<=width+1,
        "full-width Resources tile overflows iPhone");
      const homeNavLift=await salonNav.evaluate(el=>parseFloat(getComputedStyle(el).marginTop));
      assert.equal(homeNavLift,-36,"all illustrated Grand Salon navigation buttons must rise 36px");
      if (width<=600) {
        const homeFit=await page.locator("main[aria-label=\"RosieVerse - discover Rosie's worlds\"]").evaluate(home=>{
          const title=home.querySelector("header");
          const homeRect=home.getBoundingClientRect();
          const titleRect=title.getBoundingClientRect();
          return {bottom:homeRect.bottom,height:homeRect.height,viewport:window.innerHeight,
            titleWidth:titleRect.width,contentWidth:home.clientWidth,
            titleOffset:titleRect.top-homeRect.top,
            vaultLift:getComputedStyle(home.querySelector('[aria-label="Open Card Vault"]')).top,
            resourcesLift:getComputedStyle(home.querySelector('[aria-label="Open Rosie’s Resources"]')).top,
            cheeseLift:getComputedStyle(home.querySelector('[aria-label="Open Cheese Board Exam"]')).top,
            cheeseRight:getComputedStyle(home.querySelector('[aria-label="Open Cheese Board Exam"]')).left,
            captainLift:getComputedStyle(home.querySelector('[aria-label="Open Captain Rosie"]')).top,
            resourcesZ:getComputedStyle(home.querySelector('[aria-label="Open Rosie’s Resources"]')).zIndex,
            vaultZ:getComputedStyle(home.querySelector('[aria-label="Open Card Vault"]')).zIndex};
        });
        assert(Math.abs(homeFit.bottom-homeFit.viewport)<=2 && Math.abs(homeFit.height-homeFit.viewport)<=2,
          "Grand Salon scenery must end at the iPhone viewport, not below it: "+JSON.stringify(homeFit));
        assert(homeFit.titleWidth<=homeFit.contentWidth*.87 && homeFit.titleWidth>=homeFit.contentWidth*.81,
          "RosieVerse header should be another 8% larger: "+JSON.stringify(homeFit));
        assert(homeFit.titleOffset>=3 && homeFit.titleOffset<=9,
          "RosieVerse header must rise 8px from previous position: "+JSON.stringify(homeFit));
        assert(homeFit.vaultLift==="-18px" && homeFit.resourcesLift==="-23px" &&
          homeFit.cheeseLift==="-3px" && homeFit.cheeseRight==="6px" &&
          homeFit.captainLift==="-6px" && Number(homeFit.resourcesZ)<Number(homeFit.vaultZ),
          "Landing card nudges and Resources-behind layering incorrect: "+JSON.stringify(homeFit));
      }
      await page.screenshot({path:output+"/"+name+"-grand-salon.png",fullPage:true});

      await resourceTile.click();
      await page.waitForURL("**/#resources");
      const resourceNav = page.locator("nav.resources-bottom-nav");
      assert.equal(await resourceNav.locator("button").count(),3,"Resources needs 3 utility nav tabs");
      assert.deepEqual(await resourceNav.locator("button").evaluateAll(nodes=>
        nodes.map(n=>n.getAttribute("aria-label"))),[
          "Open Rosie’s Reminders","Open Rosie’s Timekeepers","Open Rosie’s Calculations"
        ],"Resources bottom nav destinations are incorrect");
      await resourceNav.getByRole("button",{name:"Open Rosie’s Timekeepers"}).click();
      await page.waitForURL("**/#timekeeper");
      assert.equal(await page.getByRole("button",{name:"Open Cheese Board Exam"}).count(),0,
        "Entertainment nav leaked into Timekeepers");
      await page.getByRole("button",{name:"Open Rosie’s Resources hub"}).click();
      await page.waitForURL("**/#resources");
      await page.goto("http://127.0.0.1:5173/#randomizers",{waitUntil:"networkidle"});
      const randomPadding=await page.locator("main").first().evaluate(el=>parseFloat(getComputedStyle(el).paddingTop));
      assert.equal(randomPadding,2,"Randomizers page must begin 18px higher than its original 20px inset");
      await page.screenshot({path:output+"/"+name+"-randomizers.png",fullPage:true});
      await page.goto("http://127.0.0.1:5173/#fortune",{waitUntil:"networkidle"});
      const fortuneOffset=await page.locator("main.fortune-page").evaluate(el=>getComputedStyle(el).top);
      assert.equal(fortuneOffset,"-8px","Fortune Teller must start 8px higher");
      assert.equal(await page.getByRole("button",{name:"Open Cheese Board Exam"}).count(),1,
        "ordinary entertainment nav changed");
      await page.getByRole("button",{name:"Open Rosie’s Resources hub"}).click();
      await page.waitForURL("**/#resources");
            results.push({engine,width,height,headerNatural:[geometry.nativeWidth,geometry.nativeHeight],seam:geometry.frame.top-geometry.hero.bottom,displayInset:geometry.display.right-geometry.value.right,passed:true});
      await context.close();
      console.log("PASS",name,JSON.stringify(results.at(-1)));
    }
  } finally { await browser.close(); }
}
await fs.writeFile(output+"/metrics.json",JSON.stringify(results,null,2));
console.log("All calculations iPhone viewports and interactions passed");
