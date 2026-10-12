import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = "http://127.0.0.1:5173";
const imagePaths = [
  "midnight-celestial-full.webp",
  "midnight-celestial-seamless.webp",
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
    await page.locator(".loading-screen-hidden").waitFor();
    await page.waitForTimeout(850); // Allow loading-screen fade before capturing actual artwork.
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
        backdropRepeat:getComputedStyle(content).backgroundRepeat,
        backdropPosition:getComputedStyle(content).backgroundPosition,
        oldMask:getComputedStyle(content,"::before").display,
        appBackground:getComputedStyle(document.querySelector(".app-shell")).backgroundImage,
        rootBackground:getComputedStyle(document.documentElement).backgroundImage,
        wallpaperOffset:getComputedStyle(document.documentElement).getPropertyValue("--rr-wallpaper-offset"),
        pagePadding:getComputedStyle(main).paddingTop };
    });
    assert(Math.abs(placement.top)<2 && Math.abs(placement.left)<2, "Rosie must start at the page origin: " + JSON.stringify(placement));
    assert(Math.abs(placement.heroWidth-width)<3, "Rosie must span the entire screen width");
    assert(Math.abs(placement.imgWidth/placement.imgHeight-placement.naturalW/placement.naturalH)<.01,
      "Rosie's artwork was distorted: "+JSON.stringify(placement));
    assert(placement.position==="relative","Full hero must scroll out rather than stick");
    assert(Math.abs(placement.contentTop-placement.imgHeight)<3,"Celestial begins at wrong vertical position");
    assert(placement.contentTexture.includes("midnight-celestial-seamless.webp"),"Celestial source must begin at the hero bottom");
    assert(placement.backdropRepeat === "repeat-y", "Celestial artwork must repeat vertically rather than fading");
    assert(placement.backdropPosition === "50% 0%", "Wallpaper begins below hero without a dead gap");
    assert(placement.oldMask === "none", "Previous 68% celestial fade must be removed");
    assert(placement.appBackground.includes("midnight-celestial-seamless.webp") &&
       placement.rootBackground.includes("midnight-celestial-seamless.webp"),
      "Celestial artwork must continue behind document and iOS viewport");
    assert(Math.abs(parseFloat(placement.wallpaperOffset) - placement.imgHeight)<2,
      "Page fallback wallpaper not aligned to the hero's bottom");
    assert.equal(await page.locator(".rr-compact-header").count(),0,
      "Do not substitute a new header for the approved original Rosie illustration");
    const heroFull = await page.locator(".rr-hero").evaluate(el => el.getBoundingClientRect().height);
    await page.screenshot({path:"artifacts/rosie-reminders-real-art/" + width + "-entry.png"});
    await page.evaluate(h => scrollTo({top:Math.floor(h * .14),behavior:"instant"}),heroFull);
    await page.waitForTimeout(120);
    assert.equal(await page.locator(".rr-hero-pin.is-pinned").count(),0,
      "Top 15% must move away naturally before the center pins");
    await page.evaluate(h => scrollTo({top:Math.ceil(h * .16),behavior:"instant"}),heroFull);
    await page.waitForTimeout(140);
    const pinned = await page.locator(".rr-hero-pin").evaluate(el => {
      const rect=el.getBoundingClientRect(),img=el.querySelector("img");
      return {top:rect.top,height:rect.height,viewport:innerWidth,
        actualHeight:document.querySelector(".rr-hero").getBoundingClientRect().height,
        imageWidth:img.getBoundingClientRect().width,naturalWidth:img.naturalWidth,
        source:img.currentSrc,shift:getComputedStyle(img).transform,
        visible:getComputedStyle(el).visibility};
    });
    const thresholdState = await page.evaluate(() => {
      const hero=document.querySelector(".rr-hero").getBoundingClientRect();
      const pinned=document.querySelector(".rr-hero-pin");
      return {scroll:window.scrollY,top:hero.top,height:hero.height,threshold:hero.height*.15,
        pinClass:pinned.className,visibility:getComputedStyle(pinned).visibility};
    });
    assert.equal(await page.locator(".rr-hero-pin.is-pinned").count(),1,
      "Existing Rosie middle should stick after the first 15% scrolls away: "+JSON.stringify(thresholdState));
    assert(Math.abs(pinned.top) < 2 && Math.abs(pinned.height - pinned.actualHeight * .7) < 2,
      "Pinned image must show exactly the middle 70% at the top: "+JSON.stringify(pinned));
    assert(pinned.visible==="visible" && pinned.source.includes(width>=760?"hero-desktop":"hero-mobile"),
      "Pinned header must use the preexisting Rosie image, not a new illustration");
    assert(!pinned.shift.includes("none"),"Pinned image crop must remove original upper 15%");
    await page.screenshot({path:"artifacts/rosie-reminders-real-art/" + width + "-pinned.png"});
    await page.evaluate(() => scrollTo({top:0,behavior:"instant"}));
    await page.waitForTimeout(120);
    assert.equal(await page.locator(".rr-hero-pin.is-pinned").count(),0,
      "Returning to top restores the complete original Rosie image");
    const clearance = await page.locator(".rr-content").evaluate(el=>({
      padding:parseFloat(getComputedStyle(el).paddingBottom),
      background:getComputedStyle(el).backgroundImage,
      repeat:getComputedStyle(el).backgroundRepeat,
      firstPixel:el.getBoundingClientRect().top,
      heroBottom:document.querySelector(".rr-hero").getBoundingClientRect().bottom,
      height:el.getBoundingClientRect().height
    }));
    assert(clearance.padding<150,"Remove artificial 325px blank footer: "+JSON.stringify(clearance));
    assert(clearance.repeat==="repeat-y" && clearance.background.includes("midnight-celestial-seamless.webp"),
      "Celestial art must cover content and trailing scroll clearance");
    assert(Math.abs(clearance.firstPixel-clearance.heroBottom)<2,"Celestial start must touch original Rosie image");
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
      bottom:node.getBoundingClientRect().bottom,
      height:node.getBoundingClientRect().height,
      navTop:document.querySelector(".bottom-nav").getBoundingClientRect().top,
    }));
    const pinnedBottom = await page.locator(".rr-hero-pin").evaluate(el => el.getBoundingClientRect().bottom);
    assert(panel.top >= pinnedBottom-4,
      "Calendar must remain below pinned middle Rosie artwork: "+JSON.stringify({panel,pinnedBottom}));
    if (panel.height <= panel.navTop - pinnedBottom - 10) {
      assert(panel.bottom <= panel.navTop-6,
        "Short calendar must be entirely usable above fixed bottom navigation: "+JSON.stringify({panel,pinnedBottom}));
    }
    const reserve = await page.locator(".rr-content").evaluate(node=>parseFloat(getComputedStyle(node).paddingBottom));
    assert(reserve <= 155, "Short panel must not append a vast blank celestial region: "+reserve);
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
    await page.evaluate(() => scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
    await page.waitForTimeout(150);
    await page.screenshot({path:"artifacts/rosie-reminders-real-art/" + width + "-bottom.png"});
    await context.close();
    console.log("PASS original-art Reminders at",width);
  }
} finally { await browser.close(); }
