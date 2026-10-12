import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = "http://127.0.0.1:5173";
const imagePaths = [
  "midnight-celestial-full.webp",
  "midnight-velvet-tile.webp",
  "today-art.webp",
  "calendar-art.webp",
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
    const consoleErrors = [];
    page.on("pageerror", error => consoleErrors.push(error.message));
    await page.goto(base + "/#reminders", { waitUntil: "networkidle" });
    await page.locator(".rr-feature-grid").waitFor();
    assert.equal(await page.locator(".rr-hero img").count(), 1, "Original Rosie hero missing");
    const bg = await page.locator(".rr-page").evaluate(el => getComputedStyle(el).backgroundImage);
    assert(bg.includes("midnight-celestial-full.webp"), "Real generated background absent");
    assert(bg.includes("midnight-velvet-tile.webp"), "Material source absent");
    assert(!bg.includes("blue-celestial-luxury.svg"), "Substitute SVG remains active");
    for (const filename of imagePaths) {
      const response = await page.request.get(base + "/rosieverse/reminders/approved-art/" + filename);
      assert.equal(response.status(), 200, "Missing genuine asset: " + filename);
      assert.match(response.headers()["content-type"] || "", /image\/webp/, "Unexpected asset content type");
    }
    const imgState = await page.locator(".rr-tab-art").evaluateAll(nodes => nodes.map(img => ({
      complete: img.complete, width: img.naturalWidth, height: img.naturalHeight,
      source: img.currentSrc,
    })));
    assert.equal(imgState.length, 2, "Today and Calendar must be separate image assets");
    assert(imgState.every(img => img.complete && img.width > 1200 && img.height > 300), "Original button art was not loaded at full source resolution");
    const alpha = await page.evaluate(async () => {
      const files = ["today-art.webp","calendar-art.webp","add-art.webp","save-art.webp"];
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
