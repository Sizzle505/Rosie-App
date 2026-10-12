import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = "http://127.0.0.1:5173/#timekeeper";
const output = "artifacts/timekeeper-iphone";
await fs.mkdir(output, { recursive: true });

for (const [engine, type] of [["webkit", webkit], ["chromium", chromium]]) {
  const browser = await type.launch({ headless: true });
  try {
    for (const [width, height] of [[353, 650], [375, 812], [390, 844], [430, 932]]) {
      const context = await browser.newContext({
        viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
        reducedMotion: "reduce"
      });
      const page = await context.newPage();
      const failures = [];
      page.on("pageerror", err => failures.push(String(err)));
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator(".rtk-utility").waitFor();
      await page.waitForTimeout(550);
      const geometry = await page.evaluate(() => {
        const rect = selector => {
          const r = document.querySelector(selector).getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, width: r.width, height: r.height };
        };
        const lap = document.querySelector(".rtk-lap-action");
        return {
          art: document.querySelector(".rtk-background").naturalWidth,
          tray: rect(".rtk-utility"),
          controls: rect(".rtk-controls"),
          nav: rect(".resources-bottom-nav"),
          mode: rect(".rtk-mode-switch"),
          dial: rect(".rtk-dial"),
          ring: rect(".rtk-progress-ring"),
          primary: rect(".rtk-primary-action"),
          marginTop: getComputedStyle(document.querySelector("main.rtk-page")).marginTop,
          squirrelUrl: document.querySelector(".rtk-squirrel-asset")?.getAttribute("href") ?? "",
          longPage: document.documentElement.scrollHeight > innerHeight,
          lapOpacity: Number(getComputedStyle(lap).opacity),
          navLift: getComputedStyle(document.querySelector(".rtk-utility")).getPropertyValue("--rtk-nav-lift"),
          oldImages: [...document.querySelectorAll(".rtk-page button")].some(btn => getComputedStyle(btn).backgroundImage.includes("button-secondary.svg")),
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2
        };
      });
      console.log("LAYOUT", engine, width, height, JSON.stringify(geometry));
      assert(geometry.art >= 800, "Original Timekeeper artwork not loaded");
      assert.equal(geometry.marginTop,"0px","Original Timekeeper scene should begin at top without added dead space");
      assert(geometry.tray.height >= geometry.tray.width*.64 && geometry.tray.height <= geometry.tray.width*.69,
        "Information cabinet should be double its prior height, unchanged width: "+JSON.stringify(geometry));
      assert(geometry.controls.top >= geometry.dial.bottom+4,
        "Round instrument buttons must remain below clock bezel");
      assert(geometry.mode.top >= geometry.controls.bottom - 2,
        "Round buttons must be ABOVE Stopwatch / Timer selector");
      assert(geometry.longPage,"A doubled cabinet needs scroll clearance on short screens");
      assert(geometry.tray.top >= geometry.mode.bottom - 3,
        "Tray must not overlap the action controls: " + JSON.stringify(geometry));
      assert(geometry.lapOpacity >= .99, "Disabled Lap button is translucent");
      assert(Math.abs((geometry.dial.top + geometry.dial.height/2) - (geometry.ring.top + geometry.ring.height/2)) <= 2,
        "Progress halo is floating outside the clock: " + JSON.stringify(geometry));
      assert(geometry.ring.top >= geometry.dial.top - geometry.dial.height*.112 &&
        geometry.ring.width >= geometry.dial.width*1.18 &&
        geometry.ring.width <= geometry.dial.width*1.225,
        "Progress halo should hug the enlarged bezel without escaping the illustrated clock: " + JSON.stringify(geometry));
      assert(!geometry.oldImages, "Procedural stand-in button assets are still referenced");
      assert(!geometry.horizontalOverflow, "Unexpected horizontal scrolling");
      await page.screenshot({ path: output + "/" + engine + "-" + width + "x" + height + "-stopwatch.png", fullPage:true });
      await page.locator(".rtk-utility").evaluate(node=>node.scrollIntoView({block:"center",behavior:"instant"}));
      await page.waitForTimeout(150);
      const navigable = await page.evaluate(()=>{
        const panel=document.querySelector(".rtk-utility").getBoundingClientRect();
        const nav=document.querySelector(".resources-bottom-nav").getBoundingClientRect();
        return panel.bottom <= nav.top+2 && panel.top>=-2;
      });
      assert(navigable,"Users must be able to scroll entire doubled cabinet above fixed navigation");
      await page.getByRole("button", { name: "Start", exact: true }).click();
      await page.waitForTimeout(650);
      assert(await page.locator(".rtk-squirrel-asset").count() === 1, "Original running squirrel image must lead the ring");
      assert((await page.locator(".rtk-time").innerText()).match(/\.\d{3}$/),
        "Stopwatch must display three millisecond digits, not hundredths");
      await page.getByRole("button", { name: "Record lap" }).click();
      assert(await page.locator(".rtk-laps li").count() === 1, "Lap recording failed");
      assert.equal(await page.locator(".rtk-shortcut").count(), 0, "Stopwatch cannot contain countdown shortcuts");
      await page.getByRole("button", { name: "Pause", exact: true }).click();
      await page.getByRole("button", { name: "Timer", exact: true }).click();
      assert(await page.locator(".rtk-progress-ring.is-reverse").count()===1,"Timer arc must travel counterclockwise");
      assert.deepEqual(await page.locator(".rtk-presets button").allTextContents(), ["1m", "2m", "5m", "15m"], "Timer presets must use requested four times");
      const presetsFit = await page.locator(".rtk-utility-inner").evaluate(node => node.scrollHeight <= node.clientHeight+2);
      assert(presetsFit, "Timer presets clipped inside luxury tray");
      await page.getByRole("button", { name: "Set a custom duration" }).click();
      assert.equal(await page.locator(".rtk-presets button").count(), 0, "Presets must hide while custom duration is open");
      const customFits = await page.locator(".rtk-utility-inner").evaluate(node => node.scrollHeight <= node.clientHeight+2);
      assert(customFits, "Custom timer controls clipped inside luxury tray");
      await page.locator(".rtk-custom-timer input[aria-label='Hours']").fill("0");
      await page.locator(".rtk-custom-timer input[aria-label='Minutes']").fill("0");
      await page.locator(".rtk-custom-timer input[aria-label='Seconds']").fill("2");
      await page.getByRole("button", { name: "Set", exact: true }).click();
      await page.getByRole("button", { name: "Start", exact: true }).click();
      await page.waitForTimeout(2400);
      assert.equal((await page.locator(".rtk-caption").textContent()).trim(), "COMPLETE");
      await page.screenshot({ path: output + "/" + engine + "-" + width + "x" + height + "-timer.png", fullPage:true });
      await page.getByRole("button", { name: "Show quick timer presets" }).click();
      assert.equal(await page.locator(".rtk-presets button").count(), 4, "Return to timer presets must work");
      assert.equal(failures.length, 0, "Browser errors: " + failures.join(" | "));
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
console.log("TIMEKEEPER MOBILE CHECKS PASSED");
