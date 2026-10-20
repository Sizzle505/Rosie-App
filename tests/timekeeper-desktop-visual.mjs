import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium, webkit } from "playwright";

// Desktop-only Timekeepers QA. Mobile geometry is independently protected by
// timekeeper-observatory-visual.mjs, and this pass checks the 800px boundary.
const url = "http://127.0.0.1:5173/#timekeeper";
const output = "artifacts/timekeeper-desktop";
await fs.mkdir(output, { recursive: true });

const desktopSizes = [[800, 600], [1024, 768], [1280, 800], [1440, 900]];
for (const [engine, browserType] of [["chromium", chromium], ["webkit", webkit]]) {
  const browser = await browserType.launch({ headless: true });
  try {
    for (const [width, height] of desktopSizes) {
      const context = await browser.newContext({
        viewport: { width, height }, deviceScaleFactor: 1,
        reducedMotion: "reduce"
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", e => errors.push(String(e)));
      await page.goto(url, { waitUntil: "networkidle" });
      await page.locator(".loading-screen-hidden").waitFor();
      await page.locator(".rtk-utility").waitFor();

      const geometry = await page.evaluate(() => {
        const rect = selector => {
          const e = document.querySelector(selector);
          assertElement(e, selector);
          const r = e.getBoundingClientRect();
          return { left:r.left, right:r.right, top:r.top, bottom:r.bottom,
            width:r.width, height:r.height };
        };
        const assertElement = (element, selector) => {
          if (!element) throw new Error("Missing " + selector);
        };
        const utility = document.querySelector(".rtk-utility-inner");
        return {
          scene:rect(".rtk-scene"),
          art:rect(".rtk-art-stage"),
          dial:rect(".rtk-dial"),
          enamel:rect(".rtk-enamel-strip"),
          actions:rect(".rtk-action-deck"),
          mode:rect(".rtk-top-controls .rtk-mode-switch"),
          panel:rect(".rtk-utility"),
          panelInner:rect(".rtk-utility-inner"),
          utilityScrollHeight:utility.scrollHeight,
          utilityClientHeight:utility.clientHeight,
          nav:rect(".resources-bottom-nav"),
          hasDesktopMQ:matchMedia("(min-width: 800px)").matches,
          overflow:document.documentElement.scrollWidth > innerWidth + 2
        };
      });
      assert(geometry.hasDesktopMQ, "Desktop-only MQ must apply: "+width);
      assert(geometry.art.right + 15 < geometry.panel.left,
        "Cabinet must sit to the right of the illustrated stage: " + JSON.stringify(geometry));
      assert(geometry.panel.right <= geometry.scene.right + 2,
        "Cabinet must remain within the desktop scene: " + JSON.stringify(geometry));
      assert(geometry.panel.width >= 298 && geometry.panel.height >= 235,
        "Cabinet must remain legible: " + JSON.stringify(geometry));
      assert(geometry.panelInner.height >= 130,
        "Cabinet contents need usable height: " + JSON.stringify(geometry));
      assert(geometry.enamel.bottom <= geometry.actions.top + 22,
        "Jewel/enamel must be clear of action buttons: " + JSON.stringify(geometry));
      assert(geometry.actions.bottom <= geometry.mode.top + 34,
        "Mode selector must be below action buttons: " + JSON.stringify(geometry));
      assert(geometry.dial.bottom <= geometry.actions.top + 30,
        "Clock and buttons must not stack on each other: " + JSON.stringify(geometry));
      assert(!geometry.overflow, "Horizontal overflow on desktop: " + JSON.stringify(geometry));
      assert.equal(errors.length, 0, "Browser errors: " + errors.join(" | "));
      await page.screenshot({ path: `${output}/${engine}-${width}x${height}-stopwatch.png` });

      await page.getByRole("button", { name: "Play", exact: true }).click();
      await page.waitForTimeout(180);
      await page.getByRole("button", { name: "Pause", exact: true }).click();
      await page.getByRole("button", { name: "Timer", exact: true }).click();
      assert.equal(await page.locator(".rtk-time-wheel").count(), 3);
      await page.screenshot({ path: `${output}/${engine}-${width}x${height}-timer.png` });
      await page.getByRole("button", { name: "World Clock" }).click();
      await page.screenshot({ path: `${output}/${engine}-${width}x${height}-world.png` });
      await page.getByRole("button", { name: "Choose clock face and color" }).click();
      const dialog = page.locator(".rtk-customization-dialog");
      await dialog.waitFor();
      const dialogRect = await dialog.boundingBox();
      assert(dialogRect && dialogRect.width > 150 && dialogRect.height > 100,
        "Clock customization dialog must remain usable");
      await page.getByRole("button", { name: "Close clock face chooser" }).click();
      assert.equal(errors.length, 0, "Browser errors: " + errors.join(" | "));
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

// The desktop layout is deliberately absent from iPhone and 799px layouts.
const phone = await chromium.launch({ headless: true });
try {
  for (const width of [390, 799]) {
    const ctx = await phone.newContext({ viewport: { width, height: 844 }, reducedMotion:"reduce" });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil:"networkidle" });
    await page.locator(".loading-screen-hidden").waitFor();
    const dimensions = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      return {
        desktop:matchMedia("(min-width: 800px)").matches,
        art:rect(".rtk-art-stage").toJSON(),
        panel:rect(".rtk-utility").toJSON()
      };
    });
    assert(!dimensions.desktop, "Desktop CSS leaked below 800px");
    assert(dimensions.panel.left < dimensions.art.right,
      "Below 800px the information cabinet must stay on the illustrated stage");
    await ctx.close();
  }
} finally {
  await phone.close();
}
console.log("TIMEKEEPER DESKTOP LAYOUT AND MOBILE ISOLATION CHECKS PASSED");
