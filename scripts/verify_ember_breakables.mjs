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
    // Exercise an independently selected world while leaving Classic QA intact.
    const stagePage=await context.newPage();
    await stagePage.goto(base+"#captain",{waitUntil:"domcontentloaded",timeout:45000});
    await stagePage.locator(".ember-suite").waitFor({state:"visible",timeout:45000});
    await stagePage.locator(".ember-world-choice").nth(2).click();
    await stagePage.locator(".ember-expedition-launch").click();
    await stagePage.locator(".ember-course-plaque").getByText("Clockwork Catacombs").waitFor({state:"visible",timeout:3500});
    const stageTime=await stagePage.locator(".ember-stats").innerText();
    if(!stageTime.includes("15s")&&!stageTime.includes("14s"))throw new Error("Selected route did not start at 15 seconds");
    await stagePage.locator(".ember-stage").screenshot({path:`artifacts/ember-breakables/${name}-clockwork-stage.png`});
    await stagePage.close();
    console.log(name+" passed; image frames loaded and earth formation painted");
  }finally{
    await browser.close();
  }
}
