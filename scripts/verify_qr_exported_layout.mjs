import { chromium } from "playwright";
import fs from "node:fs/promises";

const selectors = {
  ring: ".qa-preview-stage > .qa-ring",
  "preview-actions": ".qa-preview-actions",
  title: ".qa-title",
  panel: ".qa-panel",
  palettes: ".qa-finish-strip .qa-palettes",
  collection: ".qa-collection"
};
// Original coordinates from the user's actual November 16 Playground JSON.
const cases = [
  { id: "desktop", width: 1440, height: 900,
    entries: { ring: [-71, -27, 1], "preview-actions": [-71, -37, 1],
      title: [32, 22, .9], panel: [-71, -42, .92],
      palettes: [-71, -413, .74], collection: [42, -137, 1] } },
  { id: "tablet", width: 820, height: 1024,
    entries: { palettes: [0, -18, 1], panel: [0, -30, 1],
      collection: [0, -38, 1], "preview-actions": [-1, -50, 1.4] } },
  { id: "mobile", width: 390, height: 844,
    entries: { ring: [0, -9, 1], "preview-actions": [-1, -6, 1],
      palettes: [0, -9, 1], panel: [-1, -21, 1], collection: [-3, -34, 1] } }
];

await fs.mkdir("artifacts/qr-layout", { recursive: true });
const browser = await chromium.launch({ headless: true });
let count = 0;
try {
  for (const c of cases) {
    const context = { viewport: { width: c.width, height: c.height },
      deviceScaleFactor: 1, reducedMotion: "reduce" };
    const original = await browser.newPage(context);
    const revised = await browser.newPage(context);
    try {
      await Promise.all([
        original.goto("http://127.0.0.1:5174/#qr-atelier", {waitUntil:"networkidle"}),
        revised.goto("http://127.0.0.1:5173/#qr-atelier", {waitUntil:"networkidle"})
      ]);
      await Promise.all([
        original.locator(".qa-scene").waitFor({timeout:30000}),
        revised.locator(".qa-scene").waitFor({timeout:30000})
      ]);
      await Promise.all([original,revised].map(p=>p.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(i => i.decode().catch(()=>{})));
      })));
      await original.evaluate(({entries, selectors}) => {
        for (const [id,[x,y,s]] of Object.entries(entries)) {
          const el = document.querySelector(selectors[id]);
          if(!el) throw Error("Original element missing: " + id);
          el.style.translate = x + "px " + y + "px";
          el.style.scale = String(s);
        }
      }, {entries:c.entries,selectors});
      const measure = async p => p.evaluate(selectors => {
        const output = {};
        for (const [id,sel] of Object.entries(selectors)) {
          const el = document.querySelector(sel);
          if (!el) continue;
          const {x,y,width,height} = el.getBoundingClientRect();
          output[id] = {x,y,width,height};
        }
        output.scene = {
          background: getComputedStyle(document.querySelector(".qa-scene")).backgroundImage,
          before: getComputedStyle(document.querySelector(".qa-scene"), "::before").content
        };
        return output;
      }, selectors);
      const [a,b]=await Promise.all([measure(original),measure(revised)]);
      let failed = false;
      for (const id of Object.keys(c.entries)) {
        if(!a[id]||!b[id]) throw Error("Missing element: "+id);
        const result = ["x","y","width","height"].map(k=>Math.abs(a[id][k]-b[id][k]));
        const maxDelta = Math.max(...result);
        console.log(c.id+" "+id+": pixel delta="+maxDelta.toFixed(2));
        if(maxDelta>1.5) {failed=true;count++;console.error("MISMATCH "+JSON.stringify({id,reference:a[id],candidate:b[id]}));}
      }
      if(c.id==="desktop" && a.scene.before!==b.scene.before){
        failed=true;count++;console.error("BACKGROUND pseudo-element mismatch "+JSON.stringify({reference:a.scene,candidate:b.scene}));
      }
      await Promise.all([
        original.screenshot({path:"artifacts/qr-layout/"+c.id+"-playground.png",fullPage:true}),
        revised.screenshot({path:"artifacts/qr-layout/"+c.id+"-corrected.png",fullPage:true})
      ]);
      console.log(c.id+": "+(failed?"FAIL":"PASS")+" - screenshots saved");
    } finally { await original.close(); await revised.close(); }
  }
} finally { await browser.close(); }
if(count) {console.error("QR layout verification failed: "+count+" position mismatches");process.exit(1);}
console.log("All 15 exported target geometries match original playground.");
