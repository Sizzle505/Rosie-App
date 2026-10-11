import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = "http://127.0.0.1:5173";
const dir = "artifacts/rosie-reminders-visual";
await fs.mkdir(dir, { recursive: true });
const results = [];

for (const [engine, browserType] of [["webkit", webkit], ["chromium", chromium]]) {
  const browser = await browserType.launch({ headless: true });
  try {
    for (const [width, height] of [[320, 650], [390, 844], [768, 1024]]) {
      const name = engine + "-" + width;
      const context = await browser.newContext({
        viewport: { width, height }, deviceScaleFactor: width < 600 ? 2 : 1,
        isMobile: width < 600, hasTouch: width < 600, acceptDownloads: true
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(String(e)));
      page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
      await page.goto(base + "/#reminders", { waitUntil: "networkidle" });
      await page.locator(".rr-page").waitFor();
      await page.locator(".loading-screen-hidden").waitFor();
      await page.waitForTimeout(1100); // Wait for the loading overlay fade before visual capture.
      const img = page.locator(".rr-hero img");
      await img.evaluate(async node => { if (!node.complete) await node.decode(); });
      assert(await img.evaluate(node => node.naturalWidth >= 1000), "Rosie hero did not load");
      const displayedHero = await img.evaluate(node => node.currentSrc);
      assert(displayedHero.includes(width >= 760 ? "hero-desktop" : "hero-mobile"), "wrong hero: " + displayedHero);
      for (const path of [
        "/rosieverse/reminders/hero-mobile.webp", "/rosieverse/reminders/hero-desktop.webp",
        "/rosieverse/reminders/textures/parchment.webp", "/rosieverse/reminders/cards/shopping.webp",
        "/rosieverse/reminders/cards/goals.webp"
      ]) {
        const response = await page.request.get(base + path);
        assert.equal(response.status(), 200, "missing asset " + path);
        assert(Number(response.headers()["content-length"] || 2000) >= 1000, "empty asset " + path);
      }
      // The five bespoke RosieVerse medallions must load, not generic glyphs.
      for (const section of ["tasks", "shopping", "appointments", "notes", "goals"]) {
        const tile = page.locator(".rr-feature-" + section);
        const illustration = tile.locator(".rr-feature-art img");
        assert.equal(await illustration.count(), 1, "missing custom icon markup: " + section);
        await illustration.evaluate(async img => { if (!img.complete) await img.decode(); });
        assert(await illustration.evaluate(img => img.naturalWidth === 320), "icon failed: " + section);
        const geom = await tile.evaluate(node => ({
          artBottom: node.querySelector(".rr-feature-art").getBoundingClientRect().bottom,
          labelTop: node.querySelector(".rr-feature-copy").getBoundingClientRect().top
        }));
        if (section !== "goals") assert(geom.labelTop >= geom.artBottom - 4,
          "illustration overlaps text: " + section + " " + JSON.stringify(geom));
      }
      const overflow = () => page.evaluate(() => ({
        document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
        viewport: window.innerWidth, nav: Boolean(document.querySelector(".bottom-nav"))
      }));
      const entry = await overflow();
      assert(entry.document <= width + 3, "horizontal overflow: " + JSON.stringify(entry));
      assert(entry.nav, "existing navigation missing");
      assert.equal(await page.getByRole("button", {name:"Open Rosie’s Randomizers"}).count(), 1);
      await page.screenshot({path: dir + "/" + name + "-empty.png", fullPage:true});

      await page.getByRole("button", {name:/Add Reminder/i}).click();
      await page.getByLabel("Title", {exact:true}).fill("Test Rosie reminder");
      await page.getByLabel("Notes (optional)").fill("From organizer QA");
      await page.getByLabel("Priority").selectOption("high");
      await page.getByRole("button", {name:"Save Reminder"}).click();
      assert.equal(await page.locator(".rr-entry-content strong").filter({hasText:"Test Rosie reminder"}).count(), 1);
      assert((await page.locator(".rr-priority").innerText()).includes("Test Rosie reminder"));
      await page.getByRole("button", {name:"Complete: Test Rosie reminder"}).click();
      await page.reload({waitUntil:"networkidle"});
      await page.locator(".rr-page").waitFor();
      assert.equal(await page.getByRole("button", {name:"Mark incomplete: Test Rosie reminder"}).count(),1, "completion not persisted");
      await page.getByRole("tab", {name:"Calendar"}).click();
      assert(await page.locator(".rr-calendar-grid button").count() >= 28, "calendar missing");
      await page.getByRole("tab", {name:"Today"}).click();

      await page.getByRole("button", {name:"Open Shopping List"}).click();
      await page.getByRole("button", {name:/Add Shopping Item/i}).click();
      await page.getByLabel("Title", {exact:true}).fill("Rosie cheese treats");
      await page.getByRole("button", {name:"Save Reminder"}).click();
      assert((await page.locator(".rr-rows").innerText()).includes("Rosie cheese treats"));

      await page.getByRole("button", {name:"Open Notes & Ideas"}).click();
      await page.getByRole("button", {name:/New note/i}).click();
      await page.getByRole("textbox", {name:"Note title"}).fill("Genius Rosie notes");
      await page.getByRole("textbox", {name:"Note text"}).fill("Remember to demand treats.");
      await page.reload({waitUntil:"networkidle"});
      await page.getByRole("button", {name:"Open Notes & Ideas"}).click();
      assert.equal(await page.getByRole("textbox", {name:"Note text"}).inputValue(), "Remember to demand treats.");

      await page.getByRole("button", {name:"Open Goals & Gratitude"}).click();
      await page.getByRole("textbox", {name:"New goal"}).fill("Walk every day");
      await page.getByRole("button", {name:"Add", exact:true}).first().click();
      assert((await page.locator(".rr-goals").innerText()).includes("Walk every day"));
      await page.getByRole("textbox", {name:"Gratitude entry"}).fill("Rosie is brilliant");
      await page.getByRole("button", {name:"Add", exact:true}).last().click();
      assert((await page.locator(".rr-goals").innerText()).includes("Rosie is brilliant"));
      const after = await overflow();
      assert(after.document <= width + 3, "horizontal overflow after interactions: " + JSON.stringify(after));
      if (width < 600) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(120);
        const pos = await page.evaluate(() => ({
          noteBottom: document.querySelector(".rr-storage-note").getBoundingClientRect().bottom,
          navTop: document.querySelector(".bottom-nav").getBoundingClientRect().top
        }));
        assert(pos.noteBottom <= pos.navTop - 8,
          "footer behind bottom nav: " + JSON.stringify(pos));
      }
      await page.screenshot({path:dir + "/" + name + "-goals.png",fullPage:true});
      const [download] = await Promise.all([
        page.waitForEvent("download"), page.getByRole("button", {name:"Export backup"}).click()
      ]);
      assert(download.suggestedFilename().startsWith("rosie-reminders-backup-"));
      const raw = JSON.parse(await fs.readFile(await download.path(),"utf8"));
      assert(raw.items.some(item=>item.title==="Rosie cheese treats"));
      assert(raw.notes.some(note=>note.title==="Genius Rosie notes"));
      assert(raw.gratitude.some(g=>g.text==="Rosie is brilliant"));
      await page.goto(base + "/#fortune",{waitUntil:"networkidle"});
      assert.equal(await page.locator("main.fortune-page").count(),1,"fortune route broken");
      assert.equal(errors.length,0,"Browser errors: "+errors.join(" | "));
      results.push({engine,width,height,hero:displayedHero.split("/").at(-1),errors:0});
      await context.close();
      console.log("PASS",name);
    }
  } finally { await browser.close(); }
}
await fs.writeFile(dir+"/metrics.json",JSON.stringify(results,null,2));
console.log("All six engine/viewport Reminders smoke tests passed.");