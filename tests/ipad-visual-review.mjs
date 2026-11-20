import fs from "node:fs/promises";
import { chromium, webkit } from "playwright";

const pages = ["home", "resources", "calculations", "qr-atelier", "reviews", "recipes"];
const devices = [
  {name:"iphone-390x844", width:390, height:844, mobile:true},
  {name:"ipad-mini-768x1024", width:768, height:1024, mobile:true},
  {name:"ipad-820x1180", width:820, height:1180, mobile:true},
  {name:"ipad-landscape-1180x820", width:1180, height:820, mobile:true},
  {name:"ipad-pro-landscape-1366x1024", width:1366, height:1024, mobile:true},
  {name:"desktop-1440x900", width:1440, height:900, mobile:false}
];
const out = "artifacts/ipad-review";
await fs.mkdir(out, {recursive:true});
const results = [];
for (const [engine, browserType] of [["webkit",webkit],["chromium",chromium]]) {
  const browser = await browserType.launch();
  try {
    for (const device of devices) {
      const context = await browser.newContext({
        viewport:{width:device.width,height:device.height},
        deviceScaleFactor:1,
        isMobile:device.mobile,
        hasTouch:device.mobile
      });
      try {
        for (const name of pages) {
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror",e=>errors.push(String(e)));
          await page.goto("http://127.0.0.1:5173/#"+name,{waitUntil:"networkidle"});
          await page.locator(".loading-screen-hidden").waitFor({state:"attached",timeout:10000}).catch(()=>{});
          await page.waitForTimeout(550);
          const measure = await page.evaluate(() => {
            const rect = el => {
              if(!el)return null;
              const r=el.getBoundingClientRect();
              return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bottom:Math.round(r.bottom)};
            };
            const picks={
              home:["main.home","header.banner","section.hero","nav.worldGrid"],
              resources:[".rr-hub-content",".rr-hub-header",".rr-hub-buttons"],
              calculations:[".rc-page",".rc-hero",".rc-calculator-stage",".rc-workspace",".rc-device"],
              "qr-atelier":[".qa-scene",".qa-hero",".qa-preview-stage",".qa-panel",".qa-collection"],
              reviews:[".reviews-page",".reviews-hero",".reviews-grid",".reviews-panel"],
              recipes:[".recipes-body",".recipes-top-scene",".recipes-heading",".recipes-grid"]
            };
            const route=location.hash.slice(1);
            return {viewport:{w:innerWidth,h:innerHeight},scroll:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight},
              main:rect(document.querySelector("main")),
              boxes:Object.fromEntries((picks[route]||[]).map(selector=>[selector,rect(document.querySelector(selector))])),
              media:{coarse:matchMedia("(pointer: coarse)").matches,tablet:matchMedia("(min-width: 721px) and (max-width: 1199px)").matches,desktop:matchMedia("(min-width: 1200px)").matches}
            };
          });
          const stem=engine+"-"+device.name+"-"+name;
          await page.screenshot({path:out+"/"+stem+".png"});
          results.push({engine,device:device.name,page:name,...measure,errors});
          console.log(stem,JSON.stringify({scroll:measure.scroll,errors}));
          await page.close();
        }
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
}
await fs.writeFile(out+"/metrics.json",JSON.stringify(results,null,2));
