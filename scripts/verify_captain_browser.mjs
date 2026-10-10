import { chromium, webkit, devices } from "playwright";
import fs from "node:fs/promises";

const BASE = "http://127.0.0.1:4173/#captain";
const viewports = [
  ["small-iphone", 320, 568],
  ["compact-iphone", 320, 650],
  ["standard-iphone", 375, 667],
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
      if (!atmosphere.outer || !atmosphere.scenicImage.includes("captain-levels/") || !atmosphere.animating
          || !atmosphere.wave || !atmosphere.glimmer || !atmosphere.foam || atmosphere.overflow) {
        throw new Error(`${engine}/${label}: cinematic margin or wave regression: ${JSON.stringify(atmosphere)}`);
      }
      const scene = await page.locator(".yacht-course").evaluate((el) => {
        const src = el.querySelector(".captain-level-painting img")?.getAttribute("src");
        return { id: el.dataset.captainLevel, passage: el.dataset.captainPassage, src };
      });
      const sceneNames = ["sunrise", "twilight", "moonlight", "golden", "tempest"];
      if (!sceneNames.includes(scene.id) || scene.passage !== "1" || !scene.src?.startsWith("/captain-levels/")) {
        throw new Error(`${engine}/${label}: randomized opening scene missing: ${JSON.stringify(scene)}`);
      }
      if (await page.locator(".captain-level-effects img").count() < 4) {
        throw new Error(`${engine}/${label}: animated transparent layers missing`);
      }
      if (label === "modern-iphone") {
        for (const path of [
          "sunrise-across-torii-sea", "twilight-sakura-harbor", "moonlit-shrine-valley",
          "golden-misty-isles", "tempest-gate", "wake-splash", "ocean-wave-frame",
          "ocean-wave-wide", "sakura-petals", "ocean-mist", "rain-spray",
          "lightning", "golden-reflections"
        ]) {
          const resp = await page.request.get(`http://127.0.0.1:4173/captain-levels/${path}.webp`);
          if (!resp.ok() || !resp.headers()["content-type"]?.includes("image/")) {
            throw new Error(`${engine}: missing optimized background/effect ${path}: ${resp.status()}`);
          }
        }
      }
      const ship = await page.locator(".captain-painted-sprite").evaluate((img) => {
        const boat = img.closest(".captain-yacht");
        const world = img.closest(".yacht-course");
        const rect = boat?.getBoundingClientRect();
        const courseRect = world?.getBoundingClientRect();
        return {
          complete: img.complete,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
          boatWidth: rect?.width,
          boatHeight: rect?.height,
          courseWidth: courseRect?.width,
          courseHeight: courseRect?.height,
          currentAnimation: getComputedStyle(img).animationName,
        };
      });
      if (!ship.complete || ship.imageWidth < 320 || ship.imageHeight < 580
          || ship.boatWidth < 90 || ship.boatWidth > ship.courseWidth * .6
          || ship.boatHeight > ship.courseHeight * .9
          || ship.currentAnimation === "none") {
        throw new Error(`${engine}/${label}: painted Rosie ship not sized or rendered correctly: ${JSON.stringify(ship)}`);
      }
      // The captain is a transparency-extracted EXISTING Rosie portrait,
      // not a newly synthesized Shiba or an SVG hue-key that loses navy trim.
      const reference = await page.locator("img.captain-painted-rosie").evaluate((img) => ({
        asset: img.getAttribute("src"),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        width: img.getBoundingClientRect().width,
        animation: getComputedStyle(img).animationName,
      }));
      if (reference.asset !== "/captain-rosie-deck.webp"
          || !reference.complete || reference.naturalWidth !== 207
          || reference.naturalHeight !== 240
          || reference.width < ship.boatWidth * .40
          || reference.width > ship.boatWidth * .46
          || reference.animation === "none") {
        throw new Error(`${engine}/${label}: authentic Rosie portrait missing or displaced: ${JSON.stringify(reference)}`);
      }
      const actualReferenceResponse = await page.request.get("http://127.0.0.1:4173/captain-rosie-deck.webp");
      if (!actualReferenceResponse.ok()) {
        throw new Error(`${engine}/${label}: authentic Rosie artwork failed to load: ${actualReferenceResponse.status()}`);
      }
      const widthLimit = label === "modern-iphone" ? 105
        : (label === "standard-iphone" ? 104 : label === "compact-iphone" ? 94 : null);
      if (widthLimit !== null && ship.boatWidth > widthLimit) {
        throw new Error(`${engine}/${label}: ship did not shrink by about ten percent (width=${ship.boatWidth})`);
      }
      if (await page.locator(".captain-cinematic-current i").count() !== 4
          || await page.locator(".captain-cinematic-water-stars i").count() !== 6) {
        throw new Error(`${engine}/${label}: living water highlight layers missing`);
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
      if (label === "modern-iphone") {
        await page.screenshot({ path: `captain-test-artifacts/${engine}-modern-iphone-full.png`, fullPage: true });
      }
      await page.locator(".yacht-course").screenshot({ path: `captain-test-artifacts/${engine}-${label}-start.png` });
      await page.waitForTimeout(2100);
      await page.locator(".yacht-course").screenshot({ path: `captain-test-artifacts/${engine}-${label}-moving.png` });
      // Visible animation is independently evaluated from both frames later;
      // a screenshot-induced media clock reset is not treated as a stall.
      const widthOfScene = await page.locator(".yacht-course").evaluate((node) => node.getBoundingClientRect().width);
      if (widthOfScene < 250) throw new Error(`${engine}/${label}: playfield too narrow`);
      // Capture the vessel in PLAY, not behind the departure modal. The
      // first-generation screenshots hid Rosie's face with the start panel.
      if (["modern-iphone", "standard-iphone", "compact-iphone", "tablet-portrait", "desktop"].includes(label)) {
        await page.getByRole("button", { name: "CAST OFF" }).click();
        await page.waitForTimeout(750);
        await page.locator(".yacht-course").screenshot({
          path: `captain-test-artifacts/${engine}-${label}-gameplay.png`
        });
        if (label === "modern-iphone") {
          await page.screenshot({
            path: `captain-test-artifacts/${engine}-modern-iphone-gameplay-full.png`,
            fullPage: true,
          });
        }
      }
      if (errors.length) throw new Error(`${engine}/${label}: ${errors.join(", ")}`);
      await context.close();
    }
    const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const reducedPage = await reduced.newPage();
    await reducedPage.goto(BASE);
    if (await reducedPage.locator(".captain-cinematic video").count() !== 0) throw new Error(`${engine}: reduced motion still renders moving video`);
    const shipStill = await reducedPage.locator(".captain-painted-sprite").evaluate((node) => getComputedStyle(node).animationName === "none");
    if (!shipStill) throw new Error(`${engine}: painted ship pitch ignores reduced motion`);
    const outerStill = await reducedPage.locator(".captain-outer-paint").evaluate((node) => getComputedStyle(node).animationName === "none");
    if (!outerStill) throw new Error(`${engine}: cinematic margins ignored reduced motion`);
    await reduced.close();
    console.log(`${engine}: eight responsive layouts and reduced motion passed`);
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
  const scenesSeen = [];
  await page.evaluate(() => {
    window.__captainScenesSeen = new Set();
    window.__captainScenesTrack = window.setInterval(() => {
      const scene = document.querySelector(".yacht-course")?.dataset.captainLevel;
      if (scene) window.__captainScenesSeen.add(scene);
    }, 150);
  });
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
  await page.evaluate(() => {
    clearInterval(window.__captainPilot);
    clearInterval(window.__captainScenesTrack);
  });
  const visited = await page.evaluate(() => [...window.__captainScenesSeen]);
  if (visited.length !== 5 || new Set(visited).size !== 5) {
    throw new Error(`Five Sea passage rotation failed: ${JSON.stringify(visited)}`);
  }
  console.log("Five unique scenery levels completed:", visited.join(" -> "));
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
