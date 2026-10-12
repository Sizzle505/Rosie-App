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
      // Calendar is the landing view. Empty dates do not render a schedule message or blank list.
      assert.equal(await page.getByRole("tab", {name:"Calendar"}).getAttribute("aria-selected"),
        "true", "Calendar must be selected on initial load");
      assert.equal(await page.locator(".rr-calendar").count(), 1, "Calendar must be visible by default");
      assert.equal(await page.locator(".rr-rows").count(), 0, "Empty schedule section must not render");
      assert.equal(await page.locator(".rr-empty").count(), 0, "Empty schedule message must not render");
      assert.equal(await page.getByRole("button", {name:/Add Reminder/i}).count(),1,
        "Add Reminder must remain available when the schedule is empty");
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
      // The complete APPROVED image banner, not a text-only replacement,
      // must remain visible and fixed at the viewport top during scrolling.
      assert.equal(await page.locator(".rr-sticky-dock").count(),0,
        "Old substitute text dock must be removed");
      await page.evaluate(() => window.scrollTo({top:0,behavior:"instant"}));
      await page.waitForTimeout(150);
      const heroAtEntry = await page.locator(".rr-hero").evaluate(el => ({
        position:getComputedStyle(el).position,
        top:el.getBoundingClientRect().top,
        picture:Boolean(el.querySelector("picture img")),
        height:el.getBoundingClientRect().height
      }));
      assert.equal(heroAtEntry.position,"sticky","Approved Reminders artwork must itself be sticky");
      assert(heroAtEntry.picture && heroAtEntry.height>120, "Actual illustrated Rosie header missing");
      await page.screenshot({path:dir + "/" + name + "-empty.png",fullPage:true});
      await page.evaluate(() => {
        const hero=document.querySelector(".rr-hero");
        window.scrollTo({top:hero.getBoundingClientRect().height + 140,behavior:"instant"});
      });
      await page.waitForTimeout(230);
      const pinned = await page.locator(".rr-hero").evaluate(el=>({
        top:el.getBoundingClientRect().top,
        position:getComputedStyle(el).position,
        imgVisible:el.querySelector("picture img").getBoundingClientRect().height>120,
        scroll:window.scrollY
      }));
      assert(pinned.scroll>100,"Reminders should scroll past the banner while image remains pinned");
      assert.equal(pinned.position,"sticky","Approved Reminders image no longer sticky");
      assert(pinned.top>=-1 && pinned.top<=90,
        "Original Rosie artwork did not stay pinned: "+JSON.stringify(pinned));
      assert(pinned.imgVisible,"Original Rosie header picture disappeared on scroll");
      await page.screenshot({path:dir + "/" + name + "-sticky.png"});
      await page.evaluate(() => window.scrollTo({top:0,behavior:"instant"}));
      await page.waitForTimeout(130);

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
      assert.equal(await page.getByRole("tab", {name:"Calendar"}).getAttribute("aria-selected"),"true",
        "Calendar must remain the default after reload");
      assert.equal(await page.getByRole("button", {name:"Mark incomplete: Test Rosie reminder"}).count(),1, "completion not persisted");
      await page.getByRole("tab", {name:"Calendar"}).click();
      assert(await page.locator(".rr-calendar-grid button").count() >= 28, "calendar missing");
      await page.getByRole("tab", {name:"Today"}).click();

      await page.getByRole("button", {name:"Open Shopping List"}).click();
      await page.getByRole("textbox", {name:"Grocery list items"}).fill("Rosie cheese treats, bananas, eggs");
      await page.getByRole("button", {name:/Add Items/i}).click();
      assert.equal(await page.locator(".rr-simple-row").count(),3,
        "Bulk grocery paste should create three individual rows");
      assert.equal(await page.locator(".rr-grocery-group").count(),0,
        "Groceries must not be divided into invented categories");
      assert.equal(await page.locator(".rr-grocery-rows").count(),1,
        "Shopping items should appear on one continuous list");
      const groceryOrder=await page.locator(".rr-grocery-rows .rr-grocery-row > span").allTextContents();
      assert.deepEqual(groceryOrder,["Rosie cheese treats","Bananas","Eggs"],
        "Bulk-pasted grocery items must keep the entered order");
      assert((await page.locator(".rr-simple-rows").allInnerTexts()).join(" ").includes("Rosie cheese treats"),
        "First grocery item lost");
      await page.getByRole("button", {name:"Complete: Bananas"}).click();
      assert.equal(await page.getByRole("button", {name:"Mark incomplete: Bananas"}).count(),1,
        "Grocery checkbox did not mark item complete");
      await page.getByRole("button", {name:"Open Task List"}).click();
      await page.getByRole("textbox", {name:"New task"}).fill("Walk Rosie");
      await page.getByRole("button", {name:"Add task"}).click();
      await page.getByRole("textbox", {name:"New task"}).fill("Research the stars");
      await page.getByRole("textbox", {name:"New task"}).press("Enter");
      assert.equal(await page.locator(".rr-task-rows .rr-simple-row").filter({hasText:"Walk Rosie"}).count(),1,
        "First typed task should create one checkbox row");
      assert.equal(await page.locator(".rr-task-rows .rr-simple-row").filter({hasText:"Research the stars"}).count(),1,
        "Pressing Enter should create exactly one new task row");
      await page.getByRole("button", {name:"Complete: Walk Rosie"}).click();
      assert.equal(await page.getByRole("button", {name:"Mark incomplete: Walk Rosie"}).count(),1);

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
      const sampleQuestions = page.locator(".quick-prompts button");
      assert.equal(await sampleQuestions.count(),4,"Fortune should offer four whimsical sample questions");
      // The original approved 28-question pool is the only source of samples.
      const questionSource = await fs.readFile("src/main.jsx","utf8");
      const questionArray = questionSource.match(/const QUICK_QUESTIONS = (\[[\s\S]*?\]);/);
      assert(questionArray, "Fortune sample pool must exist in source");
      const approvedPool = JSON.parse(questionArray[1]);
      assert.equal(approvedPool.length,28,"Exactly 28 approved Fortune samples should remain");
      assert.equal(new Set(approvedPool).size,28,"Fortune questions should not be duplicated");
      assert.equal(approvedPool[0],"Would this problem improve after a walk and a snack?");
      assert.equal(approvedPool[27],"Should I follow the sensible route, or the one with better snacks?");
      for (const text of await sampleQuestions.allTextContents()) {
        assert(approvedPool.includes(text.trim()),"Unapproved Fortune prompt surfaced: "+text);
      }
      assert.equal(await page.locator(".fortune-sample-heading").count(),1,"Sample questions label missing");
      const ask = page.locator(".ask-button");
      const fortuneText = page.locator("#question");
      assert.equal(await fortuneText.inputValue(),"","Fortune should start with an empty input");
      // Safari's sticky cabinet and persistent bottom nav otherwise overlap a
      // center-of-viewport test tap. A visitor can scroll the form into clear view.
      await ask.evaluate(el => el.scrollIntoView({block:"center",behavior:"instant"}));
      await page.waitForTimeout(110);
      await ask.click();
      const autoQuestion=await fortuneText.inputValue();
      assert(autoQuestion.length>15 && autoQuestion.endsWith("?"),
        "Blank Ask should visibly fill in a sample, not silently submit");
      assert.equal(await page.locator(".fortune-ticket-visible").count(),0,
        "Choosing a sample should not submit a fortune yet");
      await ask.click();
      await page.waitForTimeout(80);
      assert.equal(await page.locator("#question").inputValue(),"",
        "Second Ask should submit selected question");
      const navToggle=page.getByRole("button",{name:"Switch bottom buttons to Rosie’s Resources"});
      assert.equal(await navToggle.count(),1,"Navigation family switch missing");
      const position = await navToggle.evaluate(element => {
        const toggle=element.getBoundingClientRect();
        const nav=document.querySelector(".bottom-nav").getBoundingClientRect();
        return {
          horizontalOffset:Math.abs((toggle.left+toggle.right)/2-(nav.left+nav.right)/2),
          aboveBarBottom:nav.bottom-toggle.top,
          hangingBelowBar:toggle.bottom-nav.bottom,
          visibleBottom:window.innerHeight-toggle.bottom,
          offsetY: Number(new DOMMatrixReadOnly(getComputedStyle(element).transform).m42.toFixed(1)),
        };
      });
      assert(position.horizontalOffset<4 && position.offsetY===14
        && position.aboveBarBottom>=-6 && position.aboveBarBottom<=12
        && position.hangingBelowBar>=15 && position.hangingBelowBar<=33
        && position.visibleBottom>=-1,
        "Games/Tools toggle must hang 8px lower without clipping the viewport: "+JSON.stringify(position));
      await navToggle.click();
      assert.equal(await page.locator("nav.resources-bottom-nav button").count(),3,
        "Resources nav should expose the three utility destinations");
      await page.getByRole("button",{name:"Switch bottom buttons to RosieVerse games"}).click();
      assert.equal(await page.locator("nav.bottom-nav:not(.resources-bottom-nav) button").count(),5,
        "Navigation switch failed to restore entertainment buttons");
      await page.goto(base + "/#home",{waitUntil:"networkidle"});
      assert.equal(await page.getByRole("button",{name:"Open Rosie’s Resources hub"}).count(),1,
        "Grand Salon should expose the Resources side shortcut");
      await page.getByRole("button",{name:"Open Rosie’s Resources hub"}).click();
      await page.waitForURL("**/#resources");
      assert.equal(await page.locator(".rr-hub-button").count(),3,
        "Resources shortcut did not open the illustrated Resources hub");
      await page.goto(base + "/#timekeeper",{waitUntil:"networkidle"});
      const offset=await page.locator("main.rtk-page").evaluate(node=>getComputedStyle(node).marginTop);
      assert.equal(offset,"15px","Timekeeper scene should be lowered by 15px without distorting its artwork");
      assert.equal(errors.length,0,"Browser errors: "+errors.join(" | "));
      results.push({engine,width,height,hero:displayedHero.split("/").at(-1),errors:0});
      await context.close();
      console.log("PASS",name);
    }
  } finally { await browser.close(); }
}
await fs.writeFile(dir+"/metrics.json",JSON.stringify(results,null,2));
console.log("All six engine/viewport Reminders smoke tests passed.");