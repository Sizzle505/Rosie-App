import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const labels = [
  "Tip Calculator",
  "Unit Conversions",
  "Date Calculator",
  "Split Bill",
  "Percentages & Discounts",
  "Loan & Interest",
  "Currency Converter"
];
const dir = "artifacts/calculations-instruments";
await fs.mkdir(dir, { recursive:true });
const browser = await chromium.launch({headless:true});
try {
  for (const width of [375,390,430]) {
    const page = await browser.newPage({
      viewport:{width,height:844},
      deviceScaleFactor:2,
      isMobile:true,
      hasTouch:true,
      reducedMotion:"reduce"
    });
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto("http://127.0.0.1:5173/#calculations",{waitUntil:"networkidle"});
    await page.locator(".loading-screen-hidden").waitFor();
    assert.equal(await page.locator(".rc-tool-card").count(),7);
    for (let index=0;index<labels.length;index++) {
      await page.locator(".rc-tool-card").nth(index).click();
      const panel=page.locator(".rc-device");
      await panel.waitFor();
      assert.equal(await panel.locator("h2").innerText(),labels[index]);
      const geometry=await panel.evaluate(el => {
        const frame=el.getBoundingClientRect();
        const surface=el.querySelector(".rc-device-surface").getBoundingClientRect();
        const inputs=[...el.querySelectorAll("input,select")].map(node => {
          const r=node.getBoundingClientRect();
          return {x:r.x,right:r.right,width:r.width,height:r.height};
        });
        return {frame:{x:frame.x,right:frame.right,width:frame.width},surface:{x:surface.x,right:surface.right,width:surface.width},inputs,
          scrollWidth:document.documentElement.scrollWidth};
      });
      assert(geometry.frame.x>=-1 && geometry.frame.right<=width+1,
        "Device frame horizontally clipped: "+labels[index]+" "+JSON.stringify(geometry));
      assert(geometry.surface.x>=geometry.frame.x+20 && geometry.surface.right<=geometry.frame.right-20,
        "Tool surface invades ornamental rails: "+labels[index]);
      assert(geometry.inputs.every(field => field.width>=120 && field.height>=43 &&
        field.x>=geometry.surface.x-1 && field.right<=geometry.surface.right+1),
        "Input fields overflow frame: "+labels[index]);
      assert(geometry.scrollWidth<=width+2,
        "Page has horizontal overflow: "+labels[index]+" "+geometry.scrollWidth);
      assert(await panel.locator(".rc-tool-result").count()===1);
      assert(await panel.locator("input,select").count()>=3);
      if(width===390) await panel.screenshot({path:dir+"/"+(index+1)+"-"+labels[index].replace(/[^a-z]+/gi,"-").toLowerCase()+".png"});
    }
    await page.locator(".rc-tool-card").first().click(); // open tip
    const tip=page.locator(".rc-device");
    await tip.getByLabel("Bill before tip ($)").fill("84.5");
    await tip.getByLabel("Tip (%)").fill("20");
    await tip.getByLabel("People").fill("3");
    assert((await tip.locator(".rc-tool-result").innerText()).includes("$33.8"),
      "Live tip-per-person calculation stopped updating");
    await page.locator(".rc-tool-card").nth(5).click();
    const loan=page.locator(".rc-device");
    assert((await loan.locator(".rc-tool-result").innerText()).includes("$304.22"),
      "Loan amortization changed unexpectedly");
    await page.locator(".rc-tool-card").nth(6).click();
    const currency=page.locator(".rc-device");
    await currency.getByLabel("Rate (units of target per 1 source)").fill("0.92");
    assert((await currency.locator(".rc-tool-result").innerText()).includes("92 EUR"),
      "Currency conversion no longer responds to rate input");
    assert.equal(errors.length,0,errors.join("\n"));
    await page.close();
  }
} finally {
  await browser.close();
}
