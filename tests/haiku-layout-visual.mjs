import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.env.HAIKU_QA_URL || "http://127.0.0.1:4173";
const sizes = [
  { width: 1920, height: 1080, label: "approved-desktop" },
  { width: 1792, height: 856, label: "user-desktop" },
  { width: 1440, height: 900, label: "desktop" },
  { width: 1024, height: 768, label: "ipad-landscape" },
  { width: 820, height: 1180, label: "ipad-portrait" },
  { width: 390, height: 844, label: "iphone" },
];
mkdirSync("artifacts/haiku-layout", { recursive: true });
const browser = await chromium.launch({ headless: true });
const summary = [];
try {
  for (const { width, height, label } of sizes) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    try {
      await page.route("**/api/rosie-ai", async route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({feature:"haiku",id:"qa-original-"+label,
          lines:["Bright stars crown the night","My nose finds the hidden path","Cheese waits on the plate"],
          revised:false,metre:"verified",counts:[5,7,5]})
      }));
      await page.goto(base + "/#haiku", { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.locator(".haiku-scene-image").waitFor({ state: "visible", timeout: 20000 });
      assert.equal(await page.locator(".haiku-heading h1").innerText(),"Haiku Zen Garden");
      await page.locator(".haiku-scroll").waitFor({ state: "visible", timeout: 20000 });
      await page.locator(".haiku-workbench").waitFor({ state: "visible", timeout: 20000 });
      // The site intentionally shows a 950ms intro plus a 600ms fade. Never
      // capture the splash screen and misrepresent it as a checked layout.
      await page.locator(".loading-screen").waitFor({ state: "hidden", timeout: 15000 });
      await page.locator(".app-shell-visible").waitFor({ state: "visible", timeout: 15000 });
      await page.locator(".haiku-page-landscape").evaluate((image) => image.decode());
      const masthead = page.locator(".haiku-masthead-art img");
      await masthead.evaluate(image=>image.decode());
      const headerGeometry = await page.evaluate(() => {
        const rect = selector => document.querySelector(selector)?.getBoundingClientRect()?.toJSON() ?? null;
        const image = document.querySelector(".haiku-masthead-art img");
        return {banner:rect(".haiku-masthead-art"), title:rect(".haiku-heading h1"),
          tagline:rect(".haiku-masthead-tagline"), back:rect(".haiku-back"),
          src:image.currentSrc,naturalWidth:image.naturalWidth};
      });
      assert.ok(headerGeometry.naturalWidth>1000,label+" should load the real full-resolution masthead");
      assert.ok(headerGeometry.src.includes(width<=600?"masthead-compact.webp":"masthead-grand.webp"),
        label+" should select the correct phone/desktop artwork: "+headerGeometry.src);
      assert.ok(headerGeometry.title.x>headerGeometry.banner.x+headerGeometry.banner.width*.10 &&
        headerGeometry.title.right<headerGeometry.banner.right-headerGeometry.banner.width*.10,
        label+" masthead title must fit within illustrated frame");
      assert.ok(headerGeometry.title.y>headerGeometry.banner.y+headerGeometry.banner.height*.28 &&
        headerGeometry.title.bottom<headerGeometry.banner.bottom-headerGeometry.banner.height*.13,
        label+" masthead title must avoid the ornamental paw and bottom border");
      assert.equal(headerGeometry.tagline,null,label+" legacy tagline must remain absent");
      assert.equal(headerGeometry.back,null,label+" redundant back button must remain absent");

      const boxes = await page.evaluate(() => {
        const box = (selector) => {
          const el = document.querySelector(selector);
          if (!el) throw new Error("Missing " + selector);
          const r = el.getBoundingClientRect();
          return { x:Math.round(r.x), y:Math.round(r.y), width:Math.round(r.width), height:Math.round(r.height),
                   right:Math.round(r.right), bottom:Math.round(r.bottom) };
        };
        return {
          page:box(".haiku-page"), header:box(".haiku-header"), title:box(".haiku-heading h1"),
          garden:box(".haiku-scene-image"), backdrop:box(".haiku-scene"), scroll:box(".haiku-scroll"), studio:box(".haiku-workbench"),
          navbar:document.querySelector(".bottom-nav")?.getBoundingClientRect()?.toJSON() || null,
          scrollWidth:document.documentElement.scrollWidth
        };
      });
      assert.ok(boxes.page.width >= width-2, label + " must fill available viewport rather than cap at 980px: " + boxes.page.width);
      assert.ok(boxes.scroll.width > 230, label + " poem must be legible: " + boxes.scroll.width);
      assert.ok(boxes.backdrop.width >= width-2, label + " background must fill viewport horizontally");
      assert.ok(boxes.backdrop.height >= height-2, label + " background must fill viewport vertically");
      const sceneAppearance = await page.locator(".haiku-scene-image").evaluate((element) => {
        const style = getComputedStyle(element);
        return { border:parseFloat(style.borderTopWidth), background:style.backgroundColor };
      });
      assert.equal(sceneAppearance.border, 0, label + " must not reintroduce a framed scene panel");
      assert.equal(sceneAppearance.background, "rgba(0, 0, 0, 0)", label + " scene panel must be transparent");
      assert.ok(boxes.garden.width > 300 || width < 600, label + " garden too small");
      assert.ok(boxes.scrollWidth <= width+4, label + " horizontal page overflow: " + boxes.scrollWidth);
      const newZenGeometry = await page.evaluate(() => {
        const area = r => { const b=r.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom}; };
        const rosie = document.querySelector(".haiku-scene-rosie--slow-breath");
        const selector = document.querySelector(".haiku-scene-selector");
        const wisdom = document.querySelector(".haiku-scene-quote");
        const verse = document.querySelector(".haiku-verse p");
        return {rosie:area(rosie),selector:area(selector),wisdom:area(wisdom),
          breathDuration:getComputedStyle(rosie).animationDuration,
          verseFont:getComputedStyle(verse).fontFamily,
          verseItalic:getComputedStyle(verse).fontStyle
        };
      });
      assert.equal(newZenGeometry.breathDuration,"10s",label+" Rosie must breathe on a ten-second rhythm");
      assert.equal(newZenGeometry.verseItalic,"italic",label+" poem must use the literary italic font");
      assert.ok(Math.abs(newZenGeometry.wisdom.x+newZenGeometry.wisdom.width/2-width/2)<Math.max(32,width*.07),
        label+" The Way of the Shiba must be horizontally centered in the page");
      if (width===1792 && height===856) {
         const pageBottom=await page.locator(".haiku-page").evaluate(el=>el.getBoundingClientRect().bottom);
         assert.ok(newZenGeometry.wisdom.bottom <= pageBottom+8,
           label+" Zen wisdom must remain reachable in the scrollable garden: "+newZenGeometry.wisdom.bottom);
       }
      // The user's 1920x1080 approved export deliberately repositions
      // entire elements via translate/scale. Existing rules for the previous
      // pre-export geometry must not override that approved arrangement.
      if (width < 1480) {
        assert.ok(newZenGeometry.wisdom.y >= boxes.garden.y+boxes.garden.height-10,
          label+" Zen wisdom must appear below Rosie’s scenery");
        assert.ok(newZenGeometry.selector.y >= newZenGeometry.rosie.bottom-30,
          label+" background selectors should sit beneath Rosie’s paws");
        assert.ok(Math.abs(newZenGeometry.selector.x+newZenGeometry.selector.width/2-(newZenGeometry.rosie.x+newZenGeometry.rosie.width/2))<Math.max(65,width*.07),
          label+" selector buttons must align under Rosie");
      }
      if (width === 1440) {
        assert.ok(boxes.scroll.width >= 475, "Standard desktop scroll shrank below legible reading width: " + boxes.scroll.width);
      }
      if (width >= 601) {
        const verseLineBoxes = await page.locator(".haiku-verse p").evaluateAll((nodes) =>
          nodes.map((node) => ({ text:node.textContent, height:node.getBoundingClientRect().height,
            lineHeight:parseFloat(getComputedStyle(node).lineHeight) }))
        );
        for (const line of verseLineBoxes) {
          assert.ok(line.height <= line.lineHeight * 1.25, label + " haiku line wraps awkwardly: " + line.text);
        }
      }
      if (width >= 601 && width < 900) {
        const positions = await page.evaluate(() => {
          const stage = document.querySelector(".haiku-scene-image").getBoundingClientRect();
          const rosie = document.querySelector(".haiku-scene-rosie").getBoundingClientRect();
          return { stageTop:stage.top, rosieTop:rosie.top };
        });
        assert.ok(positions.rosieTop >= positions.stageTop - 1, label + " Rosie ears are cropped by garden stage");
      }
      if (width >= 1024) {
        assert.ok(boxes.title.y > 68, label + " title intrudes into desktop global navigation: " + boxes.title.y);
        assert.ok(boxes.scroll.y < Math.round(height*.55), label + " poem starts below initial view: " + boxes.scroll.y);
        assert.ok(boxes.garden.y < Math.round(height*.55), label + " garden starts below initial view: " + boxes.garden.y);
        if (boxes.navbar) {
          assert.ok(boxes.title.y >= Math.round(boxes.navbar.bottom + 8), label + " title overlaps floating navigation");
        }
      }
      if (width >= 1480) {
        // Do not impose rigid three-column separation on the user's adjusted
        // 1920px design: decorative cards may intentionally overlap at edges.
        assert.ok(boxes.scroll.right > 0 && boxes.scroll.x < width,
          label+" moved haiku scroll must remain reachable on screen");
        assert.ok(boxes.studio.right > 0 && boxes.studio.x < width,
          label+" moved activity studio must remain reachable on screen");
      } else if (width >= 900) {
        assert.ok(boxes.garden.right < boxes.scroll.x, label + " desktop garden must be beside poem");
      }
      await page.screenshot({ path: `artifacts/haiku-layout/${label}.png`, fullPage: false, animations: "disabled" });
      if (label === "user-desktop" || label === "approved-desktop" || label === "iphone") {
        await page.screenshot({ path: `artifacts/haiku-layout/${label}-full.png`, fullPage: true, animations:"disabled" });
      }
      for (const [text, expected] of [["Flower Field","field-sunrise.webp"],["Zen Garden","zen-sunrise.webp"],["Temple","temple-sunrise.webp"]]) {
        await page.getByRole("button",{ name:text, exact:true }).click();
        await page.waitForFunction((substring) => document.querySelector(".haiku-page-landscape")?.src.includes(substring), expected);
        await page.locator(".haiku-page-landscape").evaluate((image) => image.decode());
        if (label === "user-desktop") {
          await page.screenshot({
            path: `artifacts/haiku-layout/garden-${expected.replace(".webp","")}.png`,
            fullPage: false,
            animations: "disabled"
          });
        }
      }
      await page.getByRole("button",{ name:"Compose", exact:true }).click();
      assert.ok(await page.locator("#haiku-topic").isVisible(), label + " compose input must be visible");
      await page.locator("#haiku-topic").fill("birthday");
      await page.getByRole("button", { name:"Unfurl a New Haiku" }).click();
      await page.waitForFunction(() =>
        document.querySelector(".haiku-scene-rosie")?.src.includes("/rosie-inspired.webp")
      );
      await page.getByRole("button", { name:/Save/ }).click();
      await page.waitForFunction(() =>
        document.querySelector(".haiku-scene-rosie")?.src.includes("/rosie-triumphant.webp")
      );
      // Meditation is an actual timed session, not a decorative mockup.
      await page.getByRole("button",{name:"Meditate",exact:true}).click();
      assert.ok(await page.getByRole("button",{name:"Haiku Reflection"}).isVisible(),
        label+" should have a poem-led meditation program");
      await page.getByRole("button",{name:"Silence",exact:true}).click();
      await page.locator(".zen-begin").click();
      const room = page.getByRole("dialog",{name:"Breathe with Rosie"});
      await room.waitFor({state:"visible"});
      await room.locator(".zen-breath-portrait img").evaluate(img => img.decode());
      const scenery = page.locator(width <= 600 ? ".zen-scenery-phone" : ".zen-scenery-desktop");
      await scenery.evaluate(img => img.decode());
      assert.ok(await room.locator(".zen-breath-portrait img").evaluate(img =>
         img.complete && img.naturalWidth > 200 && (
           img.src.endsWith("/rosie-meditating-paws-up.webp") ||
           (img.src.includes("/new/characters/meditating-") && img.src.endsWith(".webp"))
         )
       ), label+" meditation must use a transparent Rosie outfit master");
       await room.getByRole("button",{name:"Next Rosie outfit",exact:true}).click();
       await room.locator(".zen-breath-portrait img").evaluate(img=>img.decode());
       assert.ok(await room.locator(".zen-breath-portrait img").evaluate(img=>img.src.includes("/new/characters/meditating-pink-sakura.webp")),
         label+" outfit arrow should display the next Rosie kimono");
       await room.getByRole("button",{name:"Previous Rosie outfit",exact:true}).click();
       assert.ok(await scenery.evaluate(img =>
         img.complete && img.naturalWidth >= 700 && img.src.includes("/new/meditation/") &&
         (width > 600 || img.src.includes("/iphone/"))
       ), label+" meditation must display approved device-specific sanctuary background");
      assert.equal(await page.locator(".zen-immersive .rosie-ambient").count(),1,
        label+" meditation effects must render exactly once");
      if(label==="user-desktop"||label==="iphone") {
        await page.screenshot({path:"artifacts/haiku-layout/"+label+"-meditation.png",fullPage:false,animations:"disabled"});
      }
      await room.getByRole("button",{name:"Pause meditation",exact:true}).click();
      assert.ok(await room.getByRole("button",{name:"Resume meditation",exact:true}).isVisible(),label+" pause must work");
      await room.getByRole("button",{name:"Resume meditation",exact:true}).click();
      assert.ok(await room.getByRole("button",{name:"Pause meditation",exact:true}).isVisible(),label+" resume must work");
      await room.getByRole("button",{name:"End meditation",exact:true}).click();
      await room.waitFor({state:"hidden"});
      if (label==="user-desktop" || label==="desktop") {
        await page.goto(base+"/#calculations",{waitUntil:"domcontentloaded",timeout:60000});
        await page.locator(".rc-tools-heading").waitFor({state:"visible",timeout:20000});
        const offsets = await page.evaluate(() => {
          const top = selector=>getComputedStyle(document.querySelector(selector)).top;
          const left = selector=>getComputedStyle(document.querySelector(selector)).left;
          return {
            heading:top(".rc-workspace .rc-tools-heading"),
            grid:top(".rc-workspace .rc-tool-grid"),
            cardCount:document.querySelectorAll(".rc-tool-grid .rc-tool-card").length,
            tip:left(".rc-tool-card--tip"),
            split:left(".rc-tool-card--split"),
            date:left(".rc-tool-card--date"),
            loan:left(".rc-tool-card--loan")
          };
        });
        assert.deepEqual(offsets,{heading:"-15px",grid:"-25px",cardCount:7,tip:"10px",split:"10px",date:"-10px",loan:"-10px"},
          label+" must honor exact Pocket Toolkit position changes");
        await page.screenshot({path:"artifacts/haiku-layout/"+label+"-calculations-toolkit.png",fullPage:false,animations:"disabled"});
      }
      summary.push({ label, width, height, ...boxes });
      console.log("PASS " + label + ": " + JSON.stringify(boxes));
    } catch (err) {
      await page.screenshot({path:`artifacts/haiku-layout/${label}-failure.png`, fullPage:true}).catch(()=>{});
      throw err;
    } finally {
      await page.close();
    }
  }
  writeFileSync("artifacts/haiku-layout/metrics.json", JSON.stringify(summary,null,2));
} finally {
  await browser.close();
}
