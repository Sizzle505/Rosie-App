import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const origin = "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
await fs.mkdir("artifacts/layout-playground", { recursive: true });
try {
  const context = await browser.newContext({
    viewport: {width:1440,height:900}, deviceScaleFactor:1,
    reducedMotion:"reduce", acceptDownloads:true
  });
  const plain = await context.newPage();
  await plain.goto(origin+"/#qr-atelier", { waitUntil:"networkidle" });
  await plain.locator(".qa-panel").waitFor();
  const reference = await plain.locator(".qa-panel").evaluate(el => {
    const r=el.getBoundingClientRect(), style=getComputedStyle(el);
    return {x:r.x,y:r.y,width:r.width,height:r.height,translate:style.translate,scale:style.scale};
  });

  const page = await context.newPage();
  await page.goto(origin+"/?layout=1#qr-atelier", { waitUntil:"networkidle" });
  const iframe = page.frameLocator('iframe[title="Editable qr-atelier preview"]');
  await iframe.locator(".qa-panel").waitFor({ timeout:30000 });
  await page.getByText("Live preview", {exact:false}).first().waitFor({timeout:20000});
  const baseline = await iframe.locator(".qa-panel").evaluate(el => {
    const r=el.getBoundingClientRect(), style=getComputedStyle(el);
    return {x:r.x,y:r.y,width:r.width,height:r.height,translate:style.translate,scale:style.scale};
  });
  for(const prop of ["x","y","width","height"]){
    assert.ok(Math.abs(reference[prop]-baseline[prop])<0.1,
      "Editor must start at current app CSS baseline: "+prop+" "+reference[prop]+" vs "+baseline[prop]);
  }
  assert.equal(baseline.translate,reference.translate,"Editor must retain existing CSS translate");
  console.log("PASS: Current Rosie App baseline preserved without zeroing CSS styles");

  await page.getByRole("button",{name:"Fullscreen editing"}).click();
  await page.locator(".lp-root.lp-immersive").waitFor();
  await page.waitForTimeout(250);
  const frameMetrics = await page.evaluate(() => {
    const f=document.querySelector(".lp-preview-viewport iframe");
    return { outer:window.innerWidth,inner:f?.getBoundingClientRect().width,
      zoom:f?.style.transform, fullscreen:document.fullscreenElement !== null };
  });
  assert.ok(Math.abs(frameMetrics.inner-frameMetrics.outer)<=2,
    "Desktop iframe must fill true fullscreen viewport width "+JSON.stringify(frameMetrics));
  assert.equal(frameMetrics.zoom,"scale(1)");
  console.log("PASS: Fullscreen desktop is a true 1:1 browser-width CSS viewport");
  await page.getByRole("button",{name:"Hide tools"}).click();
  await page.locator(".lp-hud-minimized").waitFor();
  assert.equal(await page.locator(".lp-immersive-tip").count(),0,"Hidden controls must reveal the unobstructed page");
  await page.getByRole("button",{name:"Show tools"}).click();
  await page.locator(".lp-immersive-hud:not(.lp-hud-minimized)").waitFor();
  console.log("PASS: Fullscreen toolbar can collapse and restore without changing viewport");


  await page.getByRole("button",{name:"Elements & position"}).click();
  await page.locator(".lp-floating-inspector").waitFor();
  await page.locator(".lp-floating-inspector .lp-target-list").getByRole("button",{name:"Editor panel"}).click();
  await page.locator(".lp-floating-inspector .lp-coordinates input").first().fill("33");
  await page.waitForTimeout(300);
  const moved = await iframe.locator(".qa-panel").evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {x:r.x,y:r.y,translate:el.style.translate};
  });
  assert.ok(Math.abs(moved.x-reference.x-33)<0.2,
    "Editor must apply +33px relative to the existing CSS position: "+JSON.stringify({reference,moved}));
  assert.ok(Math.abs(moved.y-reference.y)<0.2);
  await page.screenshot({path:"artifacts/layout-playground/desktop-fullscreen.png",fullPage:false});
  console.log("PASS: Drag-inspector offset composes with existing layout in fullscreen");

  await page.getByRole("button",{name:"Undo"}).last().click();
  await page.waitForTimeout(200);
  const restored = await iframe.locator(".qa-panel").evaluate(el=>el.getBoundingClientRect().x);
  assert.ok(Math.abs(restored-reference.x)<0.2,"Undo must restore CSS-defined page baseline");
  console.log("PASS: Undo restores original CSS layout");

  await page.getByRole("button",{name:"Arrange: ON"}).click();
  await page.getByRole("button",{name:"Interact: ON"}).waitFor();
  await iframe.locator('.qa-palette').nth(1).click();
  assert.equal(await iframe.locator('.qa-palette').nth(1).getAttribute("aria-pressed"),"true");
  console.log("PASS: Interact mode allows working page buttons without dragging them");
  await page.getByRole("button",{name:"Interact: ON"}).click();

  await page.getByRole("combobox",{name:"Device in fullscreen"}).selectOption("tablet");
  const tablet=page.frameLocator('iframe[title="Editable qr-atelier preview"]');
  await tablet.locator(".qa-panel").waitFor();
  assert.equal(await tablet.locator("body").evaluate(()=>window.innerWidth),820);
  await page.screenshot({path:"artifacts/layout-playground/ipad-fullscreen.png",fullPage:false});
  await page.getByRole("combobox",{name:"Device in fullscreen"}).selectOption("mobile");
  const mobile=page.frameLocator('iframe[title="Editable qr-atelier preview"]');
  await mobile.locator(".qa-panel").waitFor();
  assert.equal(await mobile.locator("body").evaluate(()=>window.innerWidth),390);
  await page.screenshot({path:"artifacts/layout-playground/iphone-fullscreen.png",fullPage:false});
  console.log("PASS: iPad and iPhone fullscreen simulators use real CSS viewport sizes");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button",{name:"Export JSON"}).click()
  ]);
  const exportText=await fs.readFile(await download.path(),"utf8");
  const data=JSON.parse(exportText);
  assert.equal(data.version,2);
  assert.ok(data.baselineCommit && data.baselineCommit.length===40);
  assert.ok(data.referenceViewport);
  console.log("PASS: JSON includes source revision and exact simulated viewport");

  await page.getByRole("button",{name:"Exit fullscreen"}).click();
  await page.locator(".lp-root:not(.lp-immersive)").waitFor();
  console.log("PASS: Exit returns to standard layout editor");
  await context.close();
} finally {
  await browser.close();
}
