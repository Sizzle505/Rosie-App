import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

// The second uploaded user export is cumulative. Its Haiku state is identical
// to export (3), and it additionally contains Calculations. Do not sum them.
const approved = JSON.parse(readFileSync(new URL("./fixtures/approved-layout-export-2026-11-20.json", import.meta.url)));
const base = process.env.HAIKU_QA_URL || "http://127.0.0.1:4173";
const targets = {
  haiku: {
    "scene-stage":".haiku-scene-image",
    scroll:".haiku-scroll",
    postcard:".haiku-verse-actions button:nth-child(3)",
    "poem-actions":".haiku-verse-actions",
    share:".haiku-verse-actions button:nth-child(2)",
    save:".haiku-verse-actions button:nth-child(1)",
    field:".haiku-scene-selector button:nth-child(1)",
    "zen-garden":".haiku-scene-selector button:nth-child(2)",
    temple:".haiku-scene-selector button:nth-child(3)",
    studio:".haiku-workbench",
    header:".haiku-header"
  },
  calculations: {
    units:".rc-tool-card--units",
    "tool-grid":".rc-tool-grid",
    "toolkit-heading":".rc-tools-heading",
    currency:".rc-tool-card--currency",
    loan:".rc-tool-card--loan",
    percent:".rc-tool-card--percent",
    split:".rc-tool-card--split",
    date:".rc-tool-card--date",
    tip:".rc-tool-card--tip"
  }
};
const sizes = [
  {width:1920,height:1080,name:"approved-1920"},
  {width:1792,height:856,name:"wide-1792"},
  {width:1440,height:900,name:"standard-1440"},
  {width:820,height:1180,name:"ipad-820"},
  {width:390,height:844,name:"iphone-390"}
];

function parseTranslate(raw) {
  if (!raw || raw === "none") return [0,0];
  const pieces = raw.split(/\s+/);
  return [Number.parseFloat(pieces[0]),Number.parseFloat(pieces[1]||"0")];
}
function parseScale(raw) {
  if (!raw || raw === "none") return 1;
  return Number.parseFloat(raw.split(/\s+/)[0]);
}
function near(actual, expected, label) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual-expected)<.001,
    label+": expected "+expected+"; got "+actual);
}
const browser = await chromium.launch({headless:true});
mkdirSync("artifacts/haiku-layout",{recursive:true});
try {
  for (const {width,height,name} of sizes) {
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    try {
      for(const section of ["haiku","calculations"]){
        await page.goto(base+"/#"+section,{waitUntil:"domcontentloaded",timeout:60000});
        const root=section==="haiku"?".haiku-page":".rc-page";
        await page.locator(root).waitFor({state:"visible",timeout:20000});
        await page.locator(".loading-screen").waitFor({state:"hidden",timeout:15000});
        const selectors = targets[section];
        const state=approved.layouts[section+"/desktop"];
        assert.equal(Object.keys(selectors).length,Object.keys(state).length);
        const computed=await page.evaluate(selectors => {
          const data={};
          for(const [id,selector] of Object.entries(selectors)) {
            const element=document.querySelector(selector);
            if(!element)throw new Error("Missing "+id+" at "+selector);
            const cs=getComputedStyle(element);
            data[id]={
              translate:cs.translate,
              scale:cs.scale,
              rect:element.getBoundingClientRect().toJSON()
            };
          }
          return {data,scrollWidth:document.documentElement.scrollWidth};
        },selectors);
        assert.ok(computed.scrollWidth<=width+4,name+" "+section+" adds horizontal overflow "+computed.scrollWidth);
        for(const [id,expected] of Object.entries(state)) {
          const actual = computed.data[id];
          const [x,y] = parseTranslate(actual.translate);
          const scale=parseScale(actual.scale);
          // Only calibrate 1480px+ screens. Existing 1440, iPad, and iPhone
          // page layouts are intentionally unchanged by the uploaded preset.
          const active=width>=1480;
          near(x,active?expected.x:0,name+"/"+section+"/"+id+" X");
          near(y,active?expected.y:0,name+"/"+section+"/"+id+" Y");
          near(scale,active?expected.scale:1,name+"/"+section+"/"+id+" scale");
        }
        if(width===1920){
          await page.screenshot({
            path:"artifacts/haiku-layout/"+name+"-"+section+"-approved.png",
            fullPage:true,animations:"disabled"
          });
        }
        console.log("PASS APPROVED LAYOUT "+name+" "+section+" ("+Object.keys(state).length+" exact positions)");
      }
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
