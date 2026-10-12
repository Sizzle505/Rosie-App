import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = "http://127.0.0.1:5173";
const imagePaths = [
  "midnight-celestial-full.webp",
  "midnight-velvet-tile.webp",
  "today-art.webp",
  "calendar-art.webp",
  "today-calendar-continuous.webp",
  "add-art.webp",
  "save-art.webp",
  "planner-parchment.webp",
];
await fs.mkdir("artifacts/rosie-reminders-real-art", { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [320, 390, 768]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      deviceScaleFactor: 1,
      acceptDownloads: true,
    });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const consoleErrors = [];
    page.on("pageerror", error => consoleErrors.push(error.message));
    await page.goto(base + "/#reminders", { waitUntil: "networkidle" });
    await page.locator(".rr-feature-grid").waitFor();
    assert.equal(await page.locator(".rr-hero img").count(), 1, "Original Rosie hero missing");
    const placement = await page.evaluate(() => {
      const hero = document.querySelector(".rr-hero"), picture = hero.querySelector("img");
      const main = document.querySelector("main.rr-page");
      const content = document.querySelector(".rr-content");
      const img = picture.getBoundingClientRect(), rect = hero.getBoundingClientRect();
      return { top:rect.top, left:rect.left, heroWidth:rect.width, viewport:innerWidth,
        imgWidth:img.width,imgHeight:img.height,naturalW:picture.naturalWidth,naturalH:picture.naturalHeight,
        position:getComputedStyle(hero).position,contentTop:content.getBoundingClientRect().top,
        contentTexture:getComputedStyle(content).backgroundImage,
        celestial:getComputedStyle(content,"::before").backgroundImage,
        pagePadding:getComputedStyle(main).paddingTop };
    });
    assert(Math.abs(placement.top)<2 && Math.abs(placement.left)<2, "Rosie must start at the page origin: " + JSON.stringify(placement));
    assert(Math.abs(placement.heroWidth-width)<3, "Rosie must span the entire screen width");
    assert(Math.abs(placement.imgWidth/placement.imgHeight-placement.naturalW/placement.naturalH)<.01,
      "Rosie's artwork was distorted: "+JSON.stringify(placement));
    assert(placement.position==="relative","Full hero must scroll out rather than stick");
    assert(Math.abs(placement.contentTop-placement.imgHeight)<3,"Celestial begins at wrong vertical position");
    assert(placement.celestial.includes("midnight-celestial-full.webp"),"Real generated celestial art missing");
    assert(placement.contentTexture.includes("midnight-velvet-tile.webp"),"Velvet repeat background missing");
    assert(!placement.celestial.includes("blue-celestial-luxury.svg"),"SVG substitute still loaded");
    await page.evaluate(() => scrollTo(0,Math.ceil(document.querySelector(".rr-hero").getBoundingClientRect().height*.75)));
    await page.waitForTimeout(180);
    assert(await page.locator(".rr-compact-header.is-visible").count()===1,
      "Compact header should appear at 70% of full hero scroll");
    await page.evaluate(() => scrollTo(0,0));
    await page.waitForTimeout(120);
    assert.equal(await page.locator(".rr-compact-header.is-visible").count(),0,
      "Large Rosie should return without a compact header at the top");
    for (const filename of imagePaths) {
      const response = await page.request.get(base + "/rosieverse/reminders/approved-art/" + filename);
      assert.equal(response.status(), 200, "Missing genuine asset: " + filename);
      assert.match(response.headers()["content-type"] || "", /image\/webp/, "Unexpected asset content type");
    }
    const imgState = await page.locator(".rr-tabs-continuous-art").evaluateAll(nodes => nodes.map(img => ({
      complete: img.complete, width: img.naturalWidth, height: img.naturalHeight, source: img.currentSrc,
    })));
    assert.equal(imgState.length,1,"Today and Calendar must share ONE unbroken gold frame");
    assert(imgState[0].complete && imgState[0].width > 2400 && imgState[0].height > 350,
      "Continuous button art failed to load at original crop resolution");
    assert.equal(await page.locator(".rr-tabs > button").count(),2,
      "Both halves of the continuous artwork must have independent clickable regions");
    const alpha = await page.evaluate(async () => {
      const files = ["today-calendar-continuous.webp","add-art.webp","save-art.webp"];
      return await Promise.all(files.map(async filename => {
        const img = new Image();
        img.src = "/rosieverse/reminders/approved-art/" + filename;
        await img.decode();
        const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
        const c = canvas.getContext("2d", {willReadFrequently:true}); c.drawImage(img,0,0);
        return { filename, corner:c.getImageData(0,0,1,1).data[3],
          center:c.getImageData(Math.floor(img.width/2),Math.floor(img.height/2),1,1).data[3] };
      }));
    });
    assert(alpha.every(a => a.corner < 60 && a.center > 150),
      "Buttons lost transparency or interior artwork: " + JSON.stringify(alpha));
    await page.getByRole("tab",{name:"Calendar"}).click();
    await page.locator(".rr-calendar-grid").waitFor();
    await page.waitForTimeout(170);
    const panel = await page.locator(".rr-paper").evaluate(node => ({
      top:node.getBoundingClientRect().top,
      navTop:document.querySelector(".bottom-nav").getBoundingClientRect().top,
    }));
    assert(panel.top>=65 && panel.top<=108, "Calendar should navigate immediately below compact header: "+JSON.stringify(panel));
    await page.getByRole("tab",{name:"Today"}).click();
    await page.getByRole("button",{name:/Open Goals & Gratitude/}).click();
    await page.locator(".rr-goals").waitFor();
    assert.equal(await page.locator(".rr-goals .rr-art-add img").count(), 2, "Genuine Add art missing");
    await page.getByRole("textbox",{name:"New goal"}).fill("Original-art quality check");
    await page.locator(".rr-goals .rr-art-add").first().click();
    assert((await page.locator(".rr-goals").innerText()).includes("Original-art quality check"), "Add button stopped working");
    await page.getByRole("button",{name:/Open Appointments/}).click();
    await page.getByRole("button",{name:/Add Appointment/}).click();
    const save = page.getByRole("button",{name:"Save Reminder"});
    assert.equal(await save.count(),1,"Original Save control inaccessible");
    assert.equal(await save.locator("img").count(),1,"Original Save artwork not rendered");
    await page.locator(".rr-modal input[required]").fill("Original artwork test appointment");
    await save.click();
    assert((await page.locator(".rr-paper").innerText()).includes("Original artwork test appointment"), "Save button stopped working");
    const overflow = await page.evaluate(() => ({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(overflow.doc <= overflow.viewport + 3,"Page overflows mobile viewport: "+JSON.stringify(overflow));
    assert.equal(consoleErrors.length,0,consoleErrors.join(" | "));
    await page.screenshot({path:"artifacts/rosie-reminders-real-art/" + width + ".png",fullPage:true});
    await context.close();
    console.log("PASS original-art Reminders at",width);
  }
} finally { await browser.close(); }
