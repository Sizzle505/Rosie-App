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
      await page.locator(".app-shell-visible").waitFor();
      await page.locator(".loading-screen-hidden").waitFor();
      await page.waitForTimeout(900);
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
          longPage: document.documentElement.scrollHeight > innerHeight + 2,
          artTop: rect(".rtk-background").top,
          sceneHeight: rect(".rtk-scene").height,
          primaryMid: (()=>{let r=document.querySelector(".rtk-primary-action").getBoundingClientRect();return (r.top+r.bottom)/2})(),
          sideMids:[...document.querySelectorAll(".rtk-secondary-action")].map(n=>{let r=n.getBoundingClientRect();return (r.top+r.bottom)/2}),
          background:getComputedStyle(document.querySelector(".rtk-scene")).backgroundImage,
          lapOpacity: Number(getComputedStyle(lap).opacity),
          navLift: getComputedStyle(document.querySelector(".rtk-utility")).getPropertyValue("--rtk-nav-lift"),
          oldImages: [...document.querySelectorAll(".rtk-page button")].some(btn => getComputedStyle(btn).backgroundImage.includes("button-secondary.svg")),
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2
        };
      });
      console.log("LAYOUT", engine, width, height, JSON.stringify(geometry));
      assert(geometry.art >= 800, "Original Timekeeper artwork not loaded");
      assert.equal(geometry.marginTop,"0px","Original Timekeeper scene should begin at top without added dead space");
      assert(geometry.tray.width >= width*.70 && geometry.tray.height >= 42 &&
        geometry.tray.height <= geometry.tray.width*.69,
        "Full-width gold cabinet may reduce only its height to fit a short locked screen: "+JSON.stringify(geometry));
      assert(geometry.controls.top >= geometry.dial.bottom+4,
        "Round instrument buttons must remain below clock bezel");
      assert(geometry.mode.top >= geometry.controls.top + 38,
        "Round buttons must be ABOVE Stopwatch / Timer selector");
      assert(!geometry.longPage, "Timekeeper must not scroll vertically");
      assert(Math.abs(geometry.artTop)<2,"Background image must start at the viewport top");
      assert(Math.abs(geometry.sceneHeight-height)<3,"Scene should fill full viewport height");
      assert(geometry.background.includes("gradient"),"Remaining bottom area needs a decorative background");
      assert(geometry.tray.bottom <= geometry.nav.top-4,"Cabinet must clear fixed nav without page scroll");
      assert(geometry.sideMids.every(x=>Math.abs(x-geometry.primaryMid)<1.6),"Side buttons must align at the enlarged primary midpoint");
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
      assert(navigable,"Cabinet must be visible above fixed nav without scrolling");
      await page.getByRole("button", { name: "Start", exact: true }).click();
      await page.waitForTimeout(650);
      assert(await page.locator(".rtk-squirrel-asset").count() === 1, "Original running squirrel image must lead the ring");
      assert((await page.locator(".rtk-time").innerText()).replace(/\s/g,"").match(/\.\d{3}$/),
        "Stopwatch must display three millisecond digits, not hundredths");
      await page.getByRole("button", { name: "Record lap" }).click();
      assert(await page.locator(".rtk-laps li").count() === 1, "Lap recording failed");
      assert.equal(await page.locator(".rtk-shortcut").count(), 0, "Stopwatch cannot contain countdown shortcuts");
      await page.getByRole("button", { name: "Pause", exact: true }).click();
      await page.getByRole("button", { name: "Timer", exact: true }).click();
      assert(await page.locator(".rtk-progress-ring.is-reverse").count()===1,"Timer arc must travel counterclockwise");
      await page.getByRole("button",{name:"Start",exact:true}).click();
      await page.waitForTimeout(220);
      assert.equal(await page.locator(".rtk-squirrel-asset").getAttribute("transform"),"scale(-1 1)",
        "Timer squirrel must face the other direction");
      await page.getByRole("button",{name:"Pause",exact:true}).click();
      assert.deepEqual(await page.locator(".rtk-presets button").allTextContents(), ["1m", "2m", "5m", "15m"], "Timer presets must use requested four times");
      const presetsAccessible = await page.locator(".rtk-utility-inner").evaluate(node => node.clientHeight >= 32);
      assert(presetsAccessible, "Timer presets must remain accessible inside the fixed cabinet");
      await page.getByRole("button", { name: "Set a custom duration" }).click();
      assert.equal(await page.locator(".rtk-presets button").count(), 0, "Presets must hide while custom duration is open");
      const customAccessible = await page.locator(".rtk-utility-inner").evaluate(node => node.clientHeight >= 32);
      assert(customAccessible, "Custom timer controls must remain accessible via internal panel scroll");
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
