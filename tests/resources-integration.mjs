import { chromium,webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts/resources-integration",{recursive:true});
const origin="http://127.0.0.1:5173";
for(const [name,browserType,width,height] of [
  ["Safari393",webkit,393,852],
  ["Safari375",webkit,375,667],
  ["Chrome393",chromium,393,852]
]) {
 const browser=await browserType.launch({headless:true});
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto(origin+"/#resources",{waitUntil:"networkidle"});
 await page.locator(".app-shell.app-shell-visible").waitFor();
 await page.locator(".rr-hub-buttons button").first().waitFor();
 assert.deepEqual(await page.locator(".rr-hub-buttons button").evaluateAll(buttons=>buttons.map(b=>b.getAttribute("aria-label"))),[
 "Open Rosie’s Reminders","Open Rosie’s QR Atelier","Open Rosie’s Calculations","Open Rosie’s Recipes","Open Rosie’s Timekeeper"
 ],name+": hub order");
 const nav=page.locator(".resources-bottom-nav button");
 assert.equal(await nav.count(),5,name+": five tabs");
 assert.deepEqual(await nav.locator("small").allTextContents(),["Reminders","QR","Calculations","Recipes","Timekeepers"]);
 await page.screenshot({path:`artifacts/resources-integration/${name}-hub.png`,fullPage:false});
 await page.goto(origin+"/#recipes",{waitUntil:"networkidle"});
 await page.locator(".recipes-card").first().waitFor();
 assert.equal(await page.locator(".recipes-card").count(),25);
 await page.screenshot({path:`artifacts/resources-integration/${name}-recipes.png`,fullPage:false});
 await page.goto(origin+"/#qr-atelier",{waitUntil:"networkidle"});
 await page.locator(".app-shell.page-qr-atelier").waitFor();
 await page.screenshot({path:`artifacts/resources-integration/${name}-qr.png`,fullPage:false});
 await page.goto(origin+"/#calculations",{waitUntil:"networkidle"});
 await page.locator(".rc-tool-grid .rc-tool-card").last().waitFor();
 const measurement=await page.evaluate(()=>{
   const selectors=[".app-shell",".rc-page",".rc-hero",".rc-calculator-stage",".rc-workspace",".rc-tools-heading",".rc-tool-grid",".rc-tool-card--currency",".rc-footer-note"];
   const parts=Object.fromEntries(selectors.map(s=>{const el=document.querySelector(s);const rect=el.getBoundingClientRect();const cs=getComputedStyle(el);return [s,{top:Math.round(rect.top+window.scrollY),bottom:Math.round(rect.bottom+window.scrollY),height:Math.round(rect.height),paddingBottom:cs.paddingBottom,marginBottom:cs.marginBottom,minHeight:cs.minHeight}];}));
   const footer=document.querySelector(".rc-footer-note").getBoundingClientRect().bottom+window.scrollY;
   return {viewport:window.innerHeight,docHeight:document.scrollingElement.scrollHeight,footerBottom:Math.round(footer),extra:Math.round(document.scrollingElement.scrollHeight-footer),parts};
 });
 console.log("CALCULATIONS_METRICS "+name+" "+JSON.stringify(measurement));
 await page.locator(".rc-footer-note").scrollIntoViewIfNeeded();
 await page.screenshot({path:`artifacts/resources-integration/${name}-calculations-bottom.png`,fullPage:false});
 assert.deepEqual(errors,[],name+": no runtime errors");
 await browser.close();
}
