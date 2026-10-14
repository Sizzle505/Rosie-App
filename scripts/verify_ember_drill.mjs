import { chromium, webkit } from "playwright";
import { mkdir } from "node:fs/promises";

const url="http://127.0.0.1:4173/#captain";
await mkdir("artifacts/ember-drill",{recursive:true});
for (const [name,browserType] of [["chromium",chromium],["webkit",webkit]]) {
  const browser=await browserType.launch({headless:true});
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage();
  const errors=[],failed=[];
  page.on("pageerror",error=>errors.push(String(error)));
  page.on("response",response=>{if(response.url().includes("/ember-drill/")&&response.status()>=400)failed.push([response.status(),response.url()])});
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
  await page.locator(".ember-suite").waitFor({state:"visible",timeout:45000});
  const suite=page.locator(".ember-suite");
  await suite.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  const title=await page.locator(".ember-header").innerText();
  if(!title.includes("CAPTAIN ROSIE"))throw new Error("Header title absent");
  const artwork=await page.evaluate(()=>{
    const canvas=document.querySelector(".ember-canvas");
    const context=canvas?.getContext("2d");
    const pix=context?.getImageData(200,410,1,1).data;
    return {canvasWidth:canvas?.width,canvasHeight:canvas?.height,pixel:[...(pix||[])],imageRequestCount:performance.getEntriesByType("resource").filter(x=>x.name.includes("/ember-drill/")).length};
  });
  if(!artwork.pixel[3])throw new Error("Canvas is empty");
  if(artwork.imageRequestCount<15)throw new Error("Too few artwork requests: "+artwork.imageRequestCount);
  await suite.screenshot({path:"artifacts/ember-drill/"+name+"-idle.png"});
  await page.getByRole("button",{name:"START DIGGING"}).click();
  await page.waitForTimeout(400);
  await page.getByRole("button",{name:"Angle the drill upward"}).dispatchEvent("pointerdown",{pointerId:1,pointerType:"touch"});
  await page.waitForTimeout(340);
  await page.getByRole("button",{name:"Angle the drill upward"}).dispatchEvent("pointerup",{pointerId:1,pointerType:"touch"});
  await page.getByRole("button",{name:"Angle the drill downward"}).dispatchEvent("pointerdown",{pointerId:2,pointerType:"touch"});
  await page.waitForTimeout(240);
  await page.getByRole("button",{name:"Angle the drill downward"}).dispatchEvent("pointerup",{pointerId:2,pointerType:"touch"});
  const remaining=(await suite.locator(".ember-stats").innerText()).match(/\b7[0-5]s\b/);
  if(!remaining)throw new Error("75-second timer not visible: "+await suite.locator(".ember-stats").innerText());
  await suite.screenshot({path:"artifacts/ember-drill/"+name+"-running.png"});
  if(errors.length)throw new Error("Page errors: "+errors.join(" | "));
  if(failed.length)throw new Error("Missing assets: "+JSON.stringify(failed));
  console.log(name,"PASS",JSON.stringify(artwork),"time",remaining[0]);
  await context.close();await browser.close();
}
