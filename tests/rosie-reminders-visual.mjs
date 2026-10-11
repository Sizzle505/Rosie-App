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
      // Entire ornamental images are native clickable buttons, not inset medallions.
      for (const section of ["tasks", "shopping", "appointments", "notes", "goals"]) {
        const tile = page.locator(".rr-feature-" + section);
        assert.equal(await tile.count(), 1, "missing full-art button " + section);
        const art = tile.locator(".rr-button-image");
        await tile.scrollIntoViewIfNeeded();
        await art.evaluate(async image => { if (!image.complete) await image.decode(); });
        const geometry = await tile.evaluate(node => {
          const rect = node.getBoundingClientRect();
          const image = node.querySelector("img");
          return { buttonWidth: rect.width, imageWidth: image.getBoundingClientRect().width,
            naturalWidth: image.naturalWidth, ratio: image.naturalWidth / image.naturalHeight,
            textDuplicate: Boolean(node.querySelector(".rr-feature-copy,.rr-feature-art,.rr-feature-icon")) };
        });
        assert(geometry.naturalWidth >= 1000, "full-size button art failed: " + section + " " + JSON.stringify(geometry));
        assert(Math.abs(geometry.buttonWidth - geometry.imageWidth) <= 2, "art is an inset, not button: " + section);
        assert(!geometry.textDuplicate, "duplicate title or medallion found: " + section);
        assert(geometry.ratio > 2 && geometry.ratio < 3.5, "button ratio unexpected: " + section);
        assert(await tile.getAttribute("aria-label").then(label => label.includes("Open ")), "button inaccessible");
      }
      // The approved button arrangement now balances the tall shopping banner
      // with Notes on the first row, and the task banner with Appointments below.
      const order = await page.locator(".rr-feature-grid > button").evaluateAll(nodes =>
        nodes.map(node => [...node.classList].find(cls => cls.startsWith("rr-feature-") && cls !== "rr-feature-grid"))
      );
      assert.deepEqual(order, [
        "rr-feature-notes", "rr-feature-shopping", "rr-feature-appointments",
        "rr-feature-tasks", "rr-feature-goals"
      ], "Incorrect illustrated button order");
      // Original mockup: two compact button columns, followed by a wide fifth.
      const gridLayout = await page.locator(".rr-feature-grid").evaluate(grid => {
        const metrics = section => grid.querySelector(".rr-feature-"+section).getBoundingClientRect();
        const tasks=metrics("tasks"), shopping=metrics("shopping"), appointments=metrics("appointments");
        const notes=metrics("notes"), goals=metrics("goals");
        return {columns:getComputedStyle(grid).gridTemplateColumns,
          sameTopRow:Math.abs(notes.top-shopping.top)<3,
          sameSecondRow:Math.abs(appointments.top-tasks.top)<3,
          goalsBelow:goals.top>=Math.max(appointments.bottom,tasks.bottom)-1,
          goalsWider:goals.width>tasks.width*1.8,
          totalHeight:grid.getBoundingClientRect().height,
          minButtonWidth:Math.min(tasks.width,shopping.width,appointments.width,notes.width)
        };
      });
      assert(gridLayout.sameTopRow && gridLayout.sameSecondRow && gridLayout.goalsBelow,
        "Not the approved 2x2-plus-wide arrangement: "+JSON.stringify(gridLayout));
      assert(gridLayout.goalsWider || (width >= 600 && gridLayout.goalsBelow && gridLayout.minButtonWidth >= 300),
        "Goals & Gratitude does not occupy the intended bottom row: "+JSON.stringify(gridLayout));
      const frameAlignment = await page.locator(".rr-feature-grid").evaluate(grid => {
        const r = category => grid.querySelector(".rr-feature-"+category).getBoundingClientRect();
        const n=r("notes"),s=r("shopping"),a=r("appointments"),t=r("tasks");
        return {
          firstTop:Math.abs(n.top-s.top), firstBottom:Math.abs(n.bottom-s.bottom),
          secondTop:Math.abs(a.top-t.top), secondBottom:Math.abs(a.bottom-t.bottom),
          noClipping:[...grid.querySelectorAll(".rr-feature")].every(button=>getComputedStyle(button).overflow==="visible")
        };
      });
      assert(frameAlignment.firstTop<=2 && frameAlignment.firstBottom<=2,
        "First-row gold borders are not aligned: "+JSON.stringify(frameAlignment));
      assert(frameAlignment.secondTop<=2 && frameAlignment.secondBottom<=2,
        "Second-row gold borders are not aligned: "+JSON.stringify(frameAlignment));
      assert(frameAlignment.noClipping, "Illustration is being cropped");
      if (width<600) {
        assert(gridLayout.totalHeight < 400, "Mobile tool buttons too tall: "+JSON.stringify(gridLayout));
        assert(gridLayout.minButtonWidth >= 135, "Mobile button artwork too narrow: "+JSON.stringify(gridLayout));
      }
      const overflow = () => page.evaluate(() => ({
        document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
        viewport: window.innerWidth, nav: Boolean(document.querySelector(".bottom-nav"))
      }));
      const entry = await overflow();
      assert(entry.document <= width + 3, "horizontal overflow: " + JSON.stringify(entry));
      assert(entry.nav, "existing navigation missing");
      // Reminders belongs to Resources, not the five entertainment destinations.
      const resourceNav = page.locator("nav.bottom-nav.resources-bottom-nav");
      assert.equal(await resourceNav.count(), 1, "Resources-specific bottom nav missing");
      assert.deepEqual(await resourceNav.locator("button").evaluateAll(nodes =>
        nodes.map(n => n.getAttribute("aria-label"))), [
        "Open Rosie’s Reminders",
        "Open Rosie’s Timekeepers",
        "Open Rosie’s Calculations"
      ], "Resources navigation must contain only its three utility pages");
      assert.equal(await page.getByRole("button", {name:"Open Rosie’s Randomizers"}).count(), 0,
        "Entertainment tabs must not appear in Reminders bottom nav");
      assert.equal(await page.getByRole("button", {name:"Open Rosie’s Resources hub"}).count(), 1,
        "Resources hub shortcut missing beneath Home");
      const spacing = await page.locator(".rr-page").evaluate(node => {
        const grid = node.querySelector(".rr-feature-grid");
        return {
          rowGap: parseFloat(getComputedStyle(grid).rowGap),
          pagePadding: parseFloat(getComputedStyle(node).paddingBottom),
          footerMargin: parseFloat(getComputedStyle(node.querySelector(".rr-storage-note")).marginBottom),
          outerNavPadding: parseFloat(getComputedStyle(document.querySelector(".app-shell")).paddingBottom)
        };
      });
      assert(spacing.rowGap <= 5, "Too much space between illustrated rows: "+JSON.stringify(spacing));
      assert(spacing.pagePadding <= 32 && spacing.footerMargin < 15, "Excess bottom dead space: "+JSON.stringify(spacing));
      assert(spacing.outerNavPadding >= 60, "Footer would be covered by fixed navigation");
      await page.evaluate(() => window.scrollTo({top:0,behavior:"instant"}));
      await page.waitForTimeout(140);
      assert(!(await page.locator(".rr-sticky-dock").evaluate(n=>n.classList.contains("is-visible"))),
        "Compact header visible before reaching the top");
      await page.screenshot({path: dir + "/" + name + "-empty.png", fullPage:true});
      await page.evaluate(() => {
        const hero=document.querySelector(".rr-hero");
        window.scrollTo({top: window.scrollY + hero.getBoundingClientRect().bottom + 85, behavior:"instant"});
      });
      await page.waitForFunction(() => document.querySelector(".rr-sticky-dock")?.classList.contains("is-visible"));
      const sticky = await page.locator(".rr-sticky-dock").evaluate(el => ({
        top: el.getBoundingClientRect().top,
        position: getComputedStyle(el).position,
        title: el.querySelector(".rr-sticky-title")?.textContent,
        visible: getComputedStyle(el.querySelector(".rr-sticky-banner")).opacity
      }));
      assert.equal(sticky.position, "sticky", "Reminders header must stick on scroll");
      assert(sticky.top >= -1 && sticky.top <= 90, "Sticky header out of view: "+JSON.stringify(sticky));
      assert(sticky.title === "Rosie’s Reminders", "Sticky header title incorrect");
      await page.screenshot({path:dir + "/" + name + "-sticky.png"});
      await page.evaluate(() => window.scrollTo({top:0,behavior:"instant"}));
      await page.waitForFunction(() => !document.querySelector(".rr-sticky-dock")?.classList.contains("is-visible"));

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