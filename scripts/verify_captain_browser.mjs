import { chromium, webkit, devices } from "playwright";
import fs from "node:fs/promises";

const BASE = "http://127.0.0.1:4173/#captain";
const viewports = [
  ["small-iphone", 320, 568],
  ["modern-iphone", 390, 844],
  ["iphone-landscape", 844, 390],
  ["tablet-portrait", 768, 1024],
  ["tablet-landscape", 1024, 768],
  ["desktop", 1440, 900]
];
await fs.mkdir("captain-test-artifacts", { recursive: true });
for (const [engine, Browser] of [["webkit", webkit], ["chromium", chromium]]) {
  const browser = await Browser.launch({ headless: true });
  try {
    for (const [label, width, height] of viewports) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "no-preference" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(BASE, { waitUntil: "networkidle" });
      await page.waitForTimeout(1800);
      const found = await page.locator(".captain-scene img").count();
      const sceneInfo = await page.evaluate(() => ({
        href: location.href,
        hash: location.hash,
        root: document.querySelector("#root")?.textContent?.slice(0,350),
        game: !!document.querySelector(".captain-game-page"),
        image: !!document.querySelector(".captain-scene img"),
        title: document.title
      }));
      if (!found) {
        await page.screenshot({ path: `captain-test-artifacts/${engine}-${label}-diagnostic.png` });
        throw new Error(`${engine}/${label}: Captain scene not mounted: ${JSON.stringify(sceneInfo)}. Browser errors: ${errors.join(" | ")}`);
      }
      await page.locator(".captain-scene img").waitFor({ state: "attached", timeout: 6000 });
      const visible = await page.locator(".captain-scene img").isVisible();
      if (!visible) {
        await page.screenshot({ path: `captain-test-artifacts/${engine}-${label}-diagnostic.png` });
        throw new Error(`${engine}/${label}: mounted but hidden: ${JSON.stringify(sceneInfo)}; browser errors: ${errors.join(" | ")}`);
      }
      const painting = await page.locator(".captain-scene img").evaluate((img) => img.complete && img.naturalWidth > 0);
      if (!painting) throw new Error(`${engine}/${label}: original painting missing`);
      const atmosphere = await page.evaluate(() => {
        const outer = document.querySelector(".captain-outer-scene");
        const painted = document.querySelector(".captain-outer-paint");
        const wave = document.querySelector(".captain-cinematic-wave-glints");
        const glimmer = document.querySelector(".captain-cinematic-sun-track");
        const foam = document.querySelector(".captain-cinematic-foam");
        return {
          outer: !!outer,
          scenicImage: painted ? getComputedStyle(painted).backgroundImage : "",
          animating: painted ? getComputedStyle(painted).animationName !== "none" : false,
          wave: !!wave,
          glimmer: !!glimmer,
          foam: !!foam,
          overflow: document.documentElement.scrollWidth > innerWidth + 2,
        };
      });
      if (!atmosphere.outer || !atmosphere.scenicImage.includes("captain-sakura-course") || !atmosphere.animating
          || !atmosphere.wave || !atmosphere.glimmer || !atmosphere.foam || atmosphere.overflow) {
        throw new Error(`${engine}/${label}: cinematic margin or wave regression: ${JSON.stringify(atmosphere)}`);
      }
      const video = page.locator(".captain-cinematic-water");
      if (await video.count() !== 1) throw new Error(`${engine}/${label}: video layer missing`);
      const format = await video.evaluate((node) => node.canPlayType('video/mp4; codecs="avc1.42E01E"'));
      // Verify media advances *before* taking a screenshot. Headless WebKit
      // sometimes resets its H.264 playback clock on a screenshot (even though
      // decoded frames and the independent CSS water layers are fine).
      await page.waitForTimeout(1100);
      const timeA = await video.evaluate((node) => node.currentTime);
      await page.waitForTimeout(900);
      const timeB = await video.evaluate((node) => node.currentTime);
      if (format && timeB <= timeA + .22) {
        const diagnostics = await video.evaluate((node) => ({
          readyState: node.readyState, paused: node.paused,
          currentTime: node.currentTime, duration: node.duration,
          error: node.error?.message || null
        }));
        throw new Error(`${engine}/${label}: supported MP4 stalled before screenshot (${timeA}->${timeB}): ${JSON.stringify(diagnostics)}`);
      }
      await page.locator(".yacht-course").screenshot({ path: `captain-test-artifacts/${engine}-${label}-start.png` });
      await page.waitForTimeout(2100);
      await page.locator(".yacht-course").screenshot({ path: `captain-test-artifacts/${engine}-${label}-moving.png` });
      // Visible animation is independently evaluated from both frames later;
      // a screenshot-induced media clock reset is not treated as a stall.
      const widthOfScene = await page.locator(".yacht-course").evaluate((node) => node.getBoundingClientRect().width);
      if (widthOfScene < 250) throw new Error(`${engine}/${label}: playfield too narrow`);
      if (errors.length) throw new Error(`${engine}/${label}: ${errors.join(", ")}`);
      await context.close();
    }
    const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const reducedPage = await reduced.newPage();
    await reducedPage.goto(BASE);
    if (await reducedPage.locator(".captain-cinematic video").count() !== 0) throw new Error(`${engine}: reduced motion still renders moving video`);
    const outerStill = await reducedPage.locator(".captain-outer-paint").evaluate((node) => getComputedStyle(node).animationName === "none");
    if (!outerStill) throw new Error(`${engine}: cinematic margins ignored reduced motion`);
    await reduced.close();
    console.log(`${engine}: six responsive layouts and reduced motion passed`);
  } finally {
    await browser.close();
  }
}

// Full 45-second voyage with steering, score/cargo assertions and a restart.
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(BASE);
  await page.getByRole("button", { name: "CAST OFF" }).click();
  await page.evaluate(() => {
    window.__captainPilot = window.setInterval(() => {
      const course = document.querySelector(".yacht-course");
      if (!course || !course.classList.contains("is-underway")) return;
      const pickups = [...course.querySelectorAll(".sea-pickup")].map((item) => {
        const percent = parseFloat(item.style.left.match(/[0-9.]+/)?.[0] || "50");
        const lane = Math.round((percent - 16.666) / 33.333);
        return { lane, y: parseFloat(item.style.top), hazard: item.classList.contains("sea-pickup-buoy") };
      });
      const dangerous = new Set(pickups.filter((p) => p.hazard && p.y > 32 && p.y < 99).map((p) => p.lane));
      const good = pickups.filter((p) => !p.hazard && p.y > 40 && p.y < 80 && !dangerous.has(p.lane)).sort((a,b) => b.y - a.y)[0];
      const current = Number(course.querySelector(".captain-yacht")?.className.match(/lane-(\d)/)?.[1] || 1);
      const safe = [current, 1, 0, 2].find((lane) => !dangerous.has(lane)) ?? current;
      const lane = good?.lane ?? safe;
      if (lane === current) return;
      const rect = course.getBoundingClientRect();
      const x = rect.left + (lane + .5) * rect.width / 3;
      const y = rect.top + rect.height * .65;
      course.dispatchEvent(new PointerEvent("pointerdown", { bubbles:true, clientX:x, clientY:y, pointerId:1 }));
      course.dispatchEvent(new PointerEvent("pointerup", { bubbles:true, clientX:x, clientY:y, pointerId:1 }));
    }, 140);
  });
  await page.waitForTimeout(45900);
  await page.evaluate(() => clearInterval(window.__captainPilot));
  const time = await page.locator(".captain-hud > div:nth-child(2) strong").innerText();
  const score = Number(await page.locator(".captain-hud > div:first-child strong").innerText());
  const cargo = Number(await page.locator(".captain-hud > div:nth-child(4) strong").innerText());
  if (time !== "0s") throw new Error(`45-second round ended prematurely (time: ${time})`);
  if (score < 0 || cargo < 0) throw new Error("Invalid gameplay counters");
  await page.getByRole("button", { name: "SAIL AGAIN" }).click();
  if (!(await page.locator(".yacht-course").evaluate((node) => node.classList.contains("is-underway")))) throw new Error("Restart failed");
  console.log(`full voyage and restart passed: score=${score}, cargo=${cargo}`);
  await context.close();
} finally { await browser.close(); }
