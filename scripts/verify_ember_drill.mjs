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
  // Guard against the exact cropped-title defect seen on the real iPhone.
  await page.evaluate(()=>document.fonts.ready);
  const banner=await page.evaluate(()=>{
    const header=document.querySelector(".ember-header");
    const h2=header.querySelector(".ember-header-copy h2");
    const copy=header.querySelector(".ember-header-copy");
    const range=document.createRange();range.selectNodeContents(h2);
    const text=range.getBoundingClientRect(),outer=header.getBoundingClientRect();
    return {textLeft:text.left,textRight:text.right,headerRight:outer.right,headerLeft:outer.left,opacity:getComputedStyle(copy).opacity};
  });
  if(banner.opacity!=="1"||banner.textRight>banner.headerRight-2||banner.textLeft<banner.headerLeft)
    throw new Error("Cropped or invisible Captain title: "+JSON.stringify(banner));
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
  // Fixed app tabs float over page content; scroll to the actual game footer before interacting.
  await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
  await page.waitForTimeout(250);
  for (const [label,delay] of [["Angle the drill upward",340],["Angle the drill downward",240]]) {
    const control=page.getByRole("button",{name:label});
    const bounds=await control.boundingBox();
    if(!bounds)throw new Error("Missing "+label+" button bounds");
    const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
    const tapTarget=await page.evaluate(([xx,yy])=>{
      return document.elementFromPoint(xx,yy)?.closest("button")?.getAttribute("aria-label")||"covered";
    },[x,y]);
    if(tapTarget!==label)throw new Error("Overlapping navigation: "+label+" hit "+tapTarget);
    await page.mouse.move(x,y);
    await page.mouse.down();
    await page.waitForTimeout(delay);
    await page.mouse.up();
  }
  const remaining=(await suite.locator(".ember-stats").innerText()).match(/\b7[0-5]s\b/);
  if(!remaining)throw new Error("75-second timer not visible: "+await suite.locator(".ember-stats").innerText());
  await suite.screenshot({path:"artifacts/ember-drill/"+name+"-running.png"});
  if(errors.length)throw new Error("Page errors: "+errors.join(" | "));
  if(failed.length)throw new Error("Missing assets: "+JSON.stringify(failed));
  console.log(name,"PASS",JSON.stringify(artwork),"time",remaining[0]);
  await context.close();await browser.close();
}
