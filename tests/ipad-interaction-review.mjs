import fs from "node:fs/promises";
import { chromium, webkit } from "playwright";

const out = "artifacts/ipad-interactions";
await fs.mkdir(out, { recursive: true });
const results = [];
for (const [engine, browserType] of [["webkit", webkit], ["chromium", chromium]]) {
  const browser = await browserType.launch();
  try {
    for (const [device, width, height] of [["ipad-820x1180", 820, 1180], ["ipad-pro-landscape-1366x1024", 1366, 1024]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      try {
        for (const route of ["calculations", "qr-atelier", "reviews", "recipes"]) {
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror", error => errors.push(String(error)));
          await page.goto("http://127.0.0.1:5173/#" + route, { waitUntil: "networkidle" });
          await page.locator(".loading-screen").waitFor({ state: "hidden", timeout: 20000 });
          if (route === "calculations") {
            const cards = await page.locator(".rc-tool-card").evaluateAll(elements => elements.map(element => {
              const box = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return { label: element.getAttribute("aria-label"), x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height), display: style.display, gridColumn: style.gridColumn, imageLoaded: !!element.querySelector("img")?.naturalWidth };
            }));
            console.log(engine, device, "calculator choices", JSON.stringify(cards));
            await page.locator(".rc-tool-card--units").click();
          }
          if (route === "qr-atelier") {
            await page.locator('.qa-panel input[placeholder="https://"]').fill("https://example.com");
            await page.getByRole("button", { name: "View QR in a Rosie frame" }).click();
          }
          if (route === "reviews") await page.locator(".reviews-recommends-actions button").first().click();
          if (route === "recipes") await page.locator(".recipes-card").first().click();
          await page.waitForTimeout(350);
          await page.screenshot({ path: `${out}/${engine}-${device}-${route}-open.png` });
          const measure = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight,
            toolCards: [...document.querySelectorAll(".rc-tool-card")].map(element => ({
              label: element.getAttribute("aria-label"),
              rect: { x: Math.round(element.getBoundingClientRect().x), y: Math.round(element.getBoundingClientRect().y), width: Math.round(element.getBoundingClientRect().width), height: Math.round(element.getBoundingClientRect().height) },
              imageLoaded: !!element.querySelector("img")?.naturalWidth
            }))
          }));
          results.push({ engine, device, route, ...measure, errors });
          await page.close();
        }
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
}
await fs.writeFile(`${out}/metrics.json`, JSON.stringify(results, null, 2));
