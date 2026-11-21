import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.ROSIE_QA_URL || "http://127.0.0.1:4173";
const output = "artifacts/tesla-display";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const targetPages = ["reviews", "recipes", "calculations", "qr-atelier"];

async function mountedContext(viewport, dpr = 1.53, maxTouches = 16) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: dpr,
    isMobile: false,
    hasTouch: false
  });
  await context.addInitScript(touches => {
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true, get: () => touches
    });
  }, maxTouches);
  return context;
}

try {
  const context = await mountedContext({ width: 1256, height: 706 });
  const page = await context.newPage();
  await page.goto(origin + "/#reviews", { waitUntil: "domcontentloaded" });

  const stage = page.locator("#rosie-tesla-stage");
  const iframe = stage.locator("iframe");
  await iframe.waitFor({ state: "attached", timeout: 15000 });
  const child = page.frameLocator("#rosie-tesla-stage iframe");
  await child.locator(".app-shell.page-reviews").waitFor({ timeout: 15000 });

  const measurements = await page.evaluate(() => {
    const iframe = document.querySelector("#rosie-tesla-stage iframe");
    const rect = iframe.getBoundingClientRect();
    return {
      width: innerWidth, height: innerHeight, scale: rect.width / 1920,
      renderedWidth: rect.width, renderedHeight: rect.height,
      frameWidth: iframe.contentWindow.innerWidth,
      frameHeight: iframe.contentWindow.innerHeight,
      innerOrigin: iframe.contentWindow.location.origin,
      rootHidden: getComputedStyle(document.getElementById("root")).display === "none"
    };
  });
  assert.equal(measurements.frameWidth, 1920);
  assert.equal(measurements.frameHeight, 1080);
  assert.equal(measurements.rootHidden, true);
  assert.equal(measurements.innerOrigin, new URL(origin).origin);
  assert(measurements.renderedWidth <= 1257 && measurements.renderedWidth >= 1250);
  assert(measurements.renderedHeight <= 707 && measurements.renderedHeight >= 700);
  assert(Math.abs(measurements.scale - 1256 / 1920) < .002, JSON.stringify(measurements));
  console.log("TESLA ACTUAL PROFILE", JSON.stringify(measurements));

  for (const destination of targetPages) {
    if (destination !== "reviews") {
      // Exercise browser history and the cross-document hash bridge.
      await page.evaluate(hash => window.history.pushState(null, "", hash), "#" + destination);
      await child.locator(".app-shell.page-" + destination).waitFor({ timeout: 10000 });
      assert.equal(await child.locator(".app-shell.page-" + destination).count(), 1);
    }
    const desktop = await child.locator(".app-shell.page-" + destination).evaluate((shell, name) => {
      const query = selector => shell.querySelector(selector);
      const display = el => el ? getComputedStyle(el).display : null;
      const rect = el => el ? el.getBoundingClientRect() : null;
      return {
        viewport: [innerWidth, innerHeight],
        fine: matchMedia("(pointer: fine)").matches,
        hover: matchMedia("(hover: hover)").matches,
        desktopDiscovery: display(query(name === "reviews" ? ".reviews-desktop-discovery" : ".recipes-desktop-discovery")),
        desktopControls: display(query(".recipes-desktop-controls")),
        stageWidth: rect(query(name === "qr-atelier" ? ".qa-scene" : name === "calculations" ? "main.rc-page" : name === "reviews" ? ".rosie-reviews" : ".recipes-page"))?.width
      };
    }, destination);
    assert.deepEqual(desktop.viewport, [1920, 1080], JSON.stringify(desktop));
    assert.equal(desktop.fine, true);
    assert.equal(desktop.hover, true);
    if (destination === "reviews" || destination === "recipes") {
      assert.equal(desktop.desktopDiscovery, "block", JSON.stringify(desktop));
    }
    if (destination === "recipes") assert.equal(desktop.desktopControls, "block");
    if (destination === "qr-atelier") assert(desktop.stageWidth > 1700, JSON.stringify(desktop));
    await page.screenshot({ path: `${output}/tesla-${destination}.png` });
    console.log("PASS Tesla " + destination + " " + JSON.stringify(desktop));
  }

  // A child navigation must update the visible browser route and keep stage.
  await child.locator(".app-shell.page-qr-atelier").evaluate(() => {
    window.history.pushState(null, "", "#calculations");
  });
  await page.waitForFunction(() => location.hash === "#calculations");
  await child.locator(".app-shell.page-calculations").waitFor({ timeout: 10000 });
  assert.equal(await stage.count(), 1);
  console.log("PASS iframe navigation synchronizes parent browser history");

  // Switching to a non-target app page drops the iframe and mounts one React
  // tree, avoiding duplicate music playback or an altered Captain game.
  await page.evaluate(() => window.history.pushState(null, "", "#home"));
  await page.locator("#rosie-tesla-stage").waitFor({ state: "detached", timeout: 15000 });
  await page.locator(".app-shell.page-home").waitFor({ timeout: 15000 });
  console.log("PASS non-target pages preserve the normal RosieVerse app");

  await context.close();

  for (const [label, viewport, dpr, touches] of [
    ["desktop", { width: 1920, height: 1080 }, 1, 0],
    ["touch-ipad", { width: 1366, height: 1024 }, 2, 10],
    ["iphone", { width: 390, height: 844 }, 3, 5]
  ]) {
    const isolated = await mountedContext(viewport, dpr, touches);
    const screen = await isolated.newPage();
    await screen.goto(origin + "/#reviews", { waitUntil: "domcontentloaded" });
    await screen.locator(".app-shell.page-reviews").waitFor({ timeout: 15000 });
    assert.equal(await screen.locator("#rosie-tesla-stage").count(), 0, label + " profile incorrectly applied");
    console.log("PASS " + label + " isolation");
    await isolated.close();
  }

  const manual = await mountedContext({ width: 1256, height: 706 });
  const manualPage = await manual.newPage();
  await manualPage.goto(origin + "/?tesla=0#reviews", { waitUntil: "domcontentloaded" });
  await manualPage.locator(".app-shell.page-reviews").waitFor({ timeout: 15000 });
  assert.equal(await manualPage.locator("#rosie-tesla-stage").count(), 0);
  await manualPage.goto(origin + "/?tesla=1#reviews", { waitUntil: "domcontentloaded" });
  await manualPage.locator("#rosie-tesla-stage iframe").waitFor({ timeout: 15000 });
  console.log("PASS manual opt-out and override for Tesla diagnosis");
  await manual.close();
  console.log("ALL TESLA STAGE CHECKS PASSED");
} finally {
  await browser.close();
}
