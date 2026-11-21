import { chromium, webkit } from "playwright";
import { mkdir } from "node:fs/promises";

const base="http://127.0.0.1:4173/";
await mkdir("artifacts/ember-breakables",{recursive:true});
const files=[
  "01-earth-wall-intact.webp","02-earth-wall-cracked.webp",
  "03-crystal-wall-intact.webp","04-crystal-wall-cracked.webp",
  "05-secret-entrance-closed.webp","06-secret-entrance-open.webp",
  "09-royal-bone-medallion.webp","10-rock-crystal-shatter-vfx-5x2.webp"
];
for(const [name,engine,viewport,mobile] of [
  ["chromium-mobile",chromium,{width:393,height:852},true],
  ["webkit-mobile",webkit,{width:390,height:844},true],
  ["webkit-ipad",webkit,{width:1024,height:768},true],
  ["chromium-desktop",chromium,{width:1440,height:900},false]
]){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:2});
  const page=await context.newPage();
  const errors=[],failed=[];
  page.on("pageerror",error=>errors.push(String(error)));
  page.on("response",response=>{
    if(response.url().includes("/ember-drill/")&&response.status()>=400){
      failed.push([response.status(),response.url()]);
    }
  });
  await page.addInitScript(()=>{
    window.__emberBreakablePaints=[];
    const prior=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(im,...args){
      if(typeof im?.src==="string"&&im.src.includes("/breakables/v2/")){
        window.__emberBreakablePaints.push(im.src.split("/").pop());
      }
      return prior.call(this,im,...args);
    };
  });
  try{
    await page.goto(base+"#captain",{waitUntil:"domcontentloaded",timeout:45000});
    const suite=page.locator(".ember-suite");
    await suite.waitFor({state:"visible",timeout:45000});
    await page.locator(".ember-stage").scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector(".ember-canvas")?.getContext("2d")?.getImageData(10,10,1,1)?.data[3]>0,null,{timeout:20000});
    const checks=await page.evaluate(async filenames=>{
      return await Promise.all(filenames.map(async file=>{
        const src="/ember-drill/breakables/v2/"+file;
        const img=new Image();img.src=src;
        try{await img.decode();return {file,ok:img.naturalWidth>0&&img.naturalHeight>0};}
        catch{return {file,ok:false};}
      }));
    },files);
    if(checks.some(x=>!x.ok))throw new Error("Broken imported imagery: "+JSON.stringify(checks));
    const worldButtons=suite.locator(".ember-world-choice");
    if(await worldButtons.count()!==5)throw new Error("Five selectable expedition worlds missing");
    await worldButtons.nth(2).click();
    if(!(await suite.locator(".ember-expedition-launch").innerText()).includes("CLOCKWORK"))
      throw new Error("World picker did not select Clockwork");
    await suite.screenshot({path:`artifacts/ember-breakables/${name}-worlds.png`});
    const layout=await suite.evaluate(el=>({
      outer:Math.ceil(el.getBoundingClientRect().width),
      scroll:el.scrollWidth,
      available:document.documentElement.clientWidth,
      controls:!!el.querySelector(".ember-controls")
    }));
    if(layout.scroll>layout.outer+4||layout.outer>layout.available+4||!layout.controls)
      throw new Error("Tunnel responsive overflow or missing controls: "+JSON.stringify(layout));
    await suite.screenshot({path:`artifacts/ember-breakables/${name}-idle.png`});
    await page.getByRole("button",{name:"START DIGGING"}).click();
    await page.locator(".ember-dig-hint").waitFor({state:"visible",timeout:3500});
    const achievements=await suite.locator(".ember-caption").innerText();
    if(!achievements.includes("EXPEDITION"))throw new Error("Expedition progress missing");
    const mission=page.locator(".ember-passage-mission");
    await mission.waitFor({state:"visible",timeout:3000});
    if(!(await mission.innerText()).includes("BREAK AN EARTH WALL"))
      throw new Error("The Barkroot passage objective is missing");
    const stageRect=await page.locator(".ember-stage").boundingBox();
    const missionRect=await mission.boundingBox();
    if(stageRect&&missionRect&&missionRect.y+missionRect.height>stageRect.y+3)
      throw new Error("The objective panel overlaps the playable tunnel");
    await page.locator(".ember-stage").scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>window.__emberBreakablePaints.includes("01-earth-wall-intact.webp"),null,{timeout:20000});
    await page.locator(".ember-stage").screenshot({path:`artifacts/ember-breakables/${name}-drilling.png`});
    if(errors.length)throw new Error("Browser errors: "+errors.join(" | "));
    if(failed.length)throw new Error("Asset requests failed: "+JSON.stringify(failed));
    const hud=await suite.locator(".ember-stats").innerText();
    if(!hud.includes("HULL")||!hud.includes("TIME"))throw new Error("HUD missing");
    // Pause/resume must work from the keyboard without ending the run.
    await page.locator(".ember-stage").scrollIntoViewIfNeeded();
    await page.keyboard.press("p");
    await page.locator(".ember-pause-overlay").waitFor({state:"visible",timeout:4000});
    await page.keyboard.press("p");
    await page.locator(".ember-pause-overlay").waitFor({state:"hidden",timeout:4000});
    // In particular on iPad WebKit, two separate 2x-resolution canvases can
    // starve the later page's animation loop. Close Classic after validating it.
    await page.close();
    // Exercise an independently selected world while leaving Classic QA intact.
    const stagePage=await context.newPage();
    await stagePage.goto(base+"#captain",{waitUntil:"domcontentloaded",timeout:45000});
    await stagePage.locator(".ember-suite").waitFor({state:"visible",timeout:45000});
    await stagePage.bringToFront();
    await stagePage.locator(".ember-world-choice").nth(2).click();
    await stagePage.locator(".ember-expedition-launch").click();
    await stagePage.locator(".ember-course-plaque").getByText("Clockwork Catacombs").waitFor({state:"visible",timeout:3500});
    await stagePage.locator(".ember-stage").scrollIntoViewIfNeeded();
    await stagePage.locator('.ember-stage[data-hazard-art-loaded="true"]').waitFor({timeout:16000});
    // The warning is a short lived UI notification. Verify its persistent
    // registered event instead of racing an animation frame on WebKit.
    await stagePage.waitForFunction(()=>{
      const el=document.querySelector(".ember-stage");
      return Number(el?.getAttribute("data-world-warnings")||0)>0;
    },null,{timeout:40000});
    const stageDuration=await stagePage.locator(".ember-stage").getAttribute("data-stage-duration");
    if(stageDuration!=="30")throw new Error("Clockwork boss route must provide a 30-second countdown: "+stageDuration);
    await stagePage.locator(".ember-stage").screenshot({path:`artifacts/ember-breakables/${name}-clockwork-stage.png`});
    await stagePage.close();
    // Boss-stage smoke: prove Molten transitions into its interactive encounter.
    const bossPage=await context.newPage();
    await bossPage.bringToFront();
    await bossPage.goto(base+"#captain",{waitUntil:"domcontentloaded",timeout:45000});
    await bossPage.locator(".ember-suite").waitFor({state:"visible",timeout:45000});
    await bossPage.locator(".ember-world-choice").nth(3).click();
    await bossPage.locator(".ember-expedition-launch").click();
    await bossPage.bringToFront();
    await bossPage.locator(".ember-stage").scrollIntoViewIfNeeded();
    const afterLaunch=await bossPage.evaluate(()=>({
      visibility:document.visibilityState,
      world:document.querySelector(".ember-course-plaque")?.innerText,
      startVisible:!!document.querySelector(".ember-start-overlay"),
      active:!!document.querySelector(".ember-stage.is-active"),
      timer:document.querySelector(".ember-stats")?.innerText
    }));
    if(!afterLaunch.active||!afterLaunch.world?.includes("Molten"))
      throw new Error("Molten launch did not engage: "+JSON.stringify(afterLaunch));
    try{
      await bossPage.waitForFunction(()=>{
        const phase=document.querySelector(".ember-stage")?.getAttribute("data-boss-phase");
        return phase&&phase!=="none";
      },null,{timeout:65000});
    }catch(error){
      const details=await bossPage.evaluate(()=>({
        visibility:document.visibilityState,
        active:!!document.querySelector(".ember-stage.is-active"),
        timer:document.querySelector(".ember-stats")?.innerText,
        stage:document.querySelector(".ember-stage")?.outerHTML?.slice(0,850),
        world:document.querySelector(".ember-course-plaque")?.innerText,
        notices:document.querySelector(".ember-dig-notice")?.innerText,
        end:document.querySelector(".ember-start-overlay")?.innerText?.slice(0,350)
      }));
      throw new Error("Boss phase not reached: "+JSON.stringify(details)+"; "+error);
    }
    await bossPage.locator('.ember-stage[data-boss-art-loaded="true"]').waitFor({timeout:16000});
    const status=await bossPage.locator(".ember-boss-accessible").innerText();
    if(!status.includes("Cinderclaw")||!status.includes("3 of 3 health"))
      throw new Error("Molten boss did not enter a healthy, readable encounter: "+status);
    await bossPage.locator(".ember-stage").screenshot({path:`artifacts/ember-breakables/${name}-cinderclaw-boss.png`});
    await bossPage.close();
    console.log(name+" passed; Classic art, illustrated Clockwork hazard and Cinderclaw boss sprite loaded");
  }finally{
    await browser.close();
  }
}
