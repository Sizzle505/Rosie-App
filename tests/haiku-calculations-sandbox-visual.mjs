import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";

const base = process.env.HAIKU_QA_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
mkdirSync("artifacts/haiku-layout", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1792, height: 950 },
    acceptDownloads: true
  });
  const frame = page.frameLocator(".lp-preview-viewport iframe");
  await page.goto(base + "/?layout=1&focus=haiku-calculations#haiku", { waitUntil:"domcontentloaded" });
  await page.getByRole("button", { name:"Haiku Zen Garden", exact:true }).waitFor();
  assert.equal(await page.locator("#lp-page").inputValue(), "haiku");
  assert.equal(await page.locator(".lp-sandbox-page-buttons button").count(), 2);

  await frame.locator(".haiku-scene-rosie").waitFor({state:"visible",timeout:35000});
  await page.getByRole("button",{name:"Meditating Rosie",exact:true}).click();
  await frame.locator(".lp-preview-highlight").waitFor({state:"visible"});
  const baseline = await frame.locator(".haiku-scene-rosie").boundingBox();
  await page.locator(".lp-coordinates input").nth(0).fill("24");
  await page.locator(".lp-coordinates input").nth(0).press("Tab");
  await page.waitForFunction(() => {
    const s=JSON.parse(localStorage.getItem("rosieverse.layout-sandbox.haiku-calculations.v1")||"{}");
    return s["haiku/desktop"]?.rosie?.x === 24;
  });
  const moved = await frame.locator(".haiku-scene-rosie").boundingBox();
  assert.ok(moved.x>baseline.x+6,"Rosie should move right in real Haiku preview");

  const highlight = frame.locator(".lp-preview-highlight");
  const start = await highlight.boundingBox();
  await page.mouse.move(start.x+start.width/2,start.y+start.height/2);
  await page.mouse.down();
  await page.mouse.move(start.x+start.width/2+20,start.y+start.height/2+15,{steps:5});
  await page.mouse.up();
  await page.waitForFunction(() => {
    const s=JSON.parse(localStorage.getItem("rosieverse.layout-sandbox.haiku-calculations.v1")||"{}");
    return s["haiku/desktop"]?.rosie?.x > 24;
  });

  await page.getByRole("button",{name:"Meditate",exact:true}).click();
  await frame.locator(".zen-program-grid").waitFor({state:"visible"});
  await page.getByRole("button",{name:"Meditation program buttons",exact:true}).click();
  await frame.locator(".lp-preview-highlight").waitFor({state:"visible"});
  await page.screenshot({path:"artifacts/haiku-layout/zen-sandbox-desktop.png",animations:"disabled"});

  await page.getByRole("button",{name:"Calculations",exact:true}).click();
  assert.equal(await page.locator("#lp-page").inputValue(),"calculations");
  await frame.locator(".rc-tools-heading").waitFor({state:"visible",timeout:35000});
  await page.getByRole("button",{name:"The Pocket Toolkit heading",exact:true}).click();
  // Compare within the iframe's CSS-pixel coordinate system. The parent
  // deliberately shrinks the preview, so Playwright boundingBox() measures
  // screen pixels instead, and 19 CSS pixels can be fewer than 15 onscreen.
  const original = await frame.locator(".rc-tools-heading").evaluate(el=>el.getBoundingClientRect().y);
  await page.locator(".lp-coordinates input").nth(1).fill("-19");
  await page.locator(".lp-coordinates input").nth(1).press("Tab");
  await page.waitForFunction(previousY=>{
    const el=document.querySelector(".lp-preview-viewport iframe")?.contentDocument?.querySelector(".rc-tools-heading");
    return el && el.getBoundingClientRect().y < previousY-17;
  },original,{timeout:8000});
  const after = await frame.locator(".rc-tools-heading").evaluate(el=>el.getBoundingClientRect().y);
  assert.ok(after < original-17,"Toolkit heading should move 19 CSS pixels up in the iframe");
  const buttons=["Tip Calculator button","Unit Conversions button","Date Calculator button",
    "Split Bill button","Percentages & Discounts button","Loan & Interest button","Currency Converter button"];
  for(const name of buttons){
    await page.getByRole("button",{name,exact:true}).click();
    await frame.locator(".lp-preview-highlight").waitFor({state:"visible"});
  }
  await page.screenshot({path:"artifacts/haiku-layout/calculations-sandbox-desktop.png",animations:"disabled"});

  await page.getByRole("button",{name:"iPad",exact:true}).click();
  assert.ok((await frame.locator(".rc-page").boundingBox()).width<=821);
  await page.getByRole("button",{name:"iPhone",exact:true}).click();
  assert.ok((await frame.locator(".rc-page").boundingBox()).width<=391);
  await page.getByRole("button",{name:"Desktop",exact:true}).click();
  assert.ok((await frame.locator(".rc-page").boundingBox()).width>=1400);
  await page.waitForFunction(()=>{
    const s=JSON.parse(localStorage.getItem("rosieverse.layout-sandbox.haiku-calculations.v1")||"{}");
    return s["calculations/desktop"]?.["toolkit-heading"]?.y === -19
      && !!s["haiku/desktop"]?.rosie
      && !s["calculations/mobile"];
  });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button",{name:"Export layout",exact:true}).click()
  ]);
  assert.equal(download.suggestedFilename(),"rosie-haiku-calculations-sandbox.json");
  const filePath = await download.path();
  const payload = JSON.parse(readFileSync(filePath,"utf8"));
  assert.equal(payload.tool,"RosieVerse Layout Playground");
  assert.equal(payload.layouts["calculations/desktop"]["toolkit-heading"].y,-19);
  assert.ok(payload.layouts["haiku/desktop"].rosie.x>24);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#lp-page").waitFor();
  assert.equal(await page.locator("#lp-page").inputValue(),"calculations");
  await page.getByRole("button",{name:"The Pocket Toolkit heading",exact:true}).click();
  assert.equal(await page.locator(".lp-coordinates input").nth(1).inputValue(),"-19");
  console.log("PASS two-page editable sandbox: selecting, exact nudges, drag, activity tabs, device isolation, export, reload persistence");
  await page.close();
} finally {
  await browser.close();
}
