import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = "http://127.0.0.1:5173/#timekeeper";
const output = "artifacts/timekeeper-iphone";
await fs.mkdir(output, { recursive: true });

for (const [engine, type] of [["webkit", webkit], ["chromium", chromium]]) {
  const browser = await type.launch({ headless: true });
  try {
    for (const [width, height] of [[353, 650], [390, 844], [430, 932]]) {
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
          lapOpacity: Number(getComputedStyle(lap).opacity),
          navLift: getComputedStyle(document.querySelector(".rtk-utility")).getPropertyValue("--rtk-nav-lift"),
          oldImages: [...document.querySelectorAll(".rtk-page button")].some(btn => getComputedStyle(btn).backgroundImage.includes("button-secondary.svg")),
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2
        };
      });
      console.log("LAYOUT", engine, width, height, JSON.stringify(geometry));
      assert(geometry.art >= 800, "Original Timekeeper artwork not loaded");
      assert(geometry.tray.bottom <= geometry.nav.top - 1,
        "Information tray hidden behind fixed navigation: " + JSON.stringify(geometry));
      assert(geometry.tray.top >= geometry.controls.bottom - 3,
        "Tray must not overlap the action controls: " + JSON.stringify(geometry));
      assert(geometry.lapOpacity >= .99, "Disabled Lap button is translucent");
      assert(!geometry.oldImages, "Procedural stand-in button assets are still referenced");
      assert(!geometry.horizontalOverflow, "Unexpected horizontal scrolling");
      await page.screenshot({ path: output + "/" + engine + "-" + width + "x" + height + "-stopwatch.png" });
      await page.getByRole("button", { name: "Start", exact: true }).click();
      await page.waitForTimeout(650);
      assert(await page.locator(".rtk-progress-charm").count() === 1, "Leading paw must follow the live progress");
      await page.getByRole("button", { name: "Record lap" }).click();
      assert(await page.locator(".rtk-laps li").count() === 1, "Lap recording failed");
      await page.getByRole("button", { name: "Pause", exact: true }).click();
      await page.getByRole("button", { name: "Timer", exact: true }).click();
      await page.locator(".rtk-custom-timer input[aria-label='Hours']").fill("0");
      await page.locator(".rtk-custom-timer input[aria-label='Minutes']").fill("0");
      await page.locator(".rtk-custom-timer input[aria-label='Seconds']").fill("2");
      await page.getByRole("button", { name: "Set", exact: true }).click();
      await page.getByRole("button", { name: "Start", exact: true }).click();
      await page.waitForTimeout(2400);
      assert.equal((await page.locator(".rtk-caption").textContent()).trim(), "COMPLETE");
      await page.screenshot({ path: output + "/" + engine + "-" + width + "x" + height + "-timer.png" });
      assert.equal(failures.length, 0, "Browser errors: " + failures.join(" | "));
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
console.log("TIMEKEEPER MOBILE CHECKS PASSED");
