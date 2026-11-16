import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts/secret-santa", { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [device, width, height] of [
    ["desktop", 1366, 900], ["ipad", 820, 1180], ["iphone", 390, 844]
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5173/#randomizers", { waitUntil: "networkidle" });
    const secret = page.locator(".ss-shell");
    await secret.waitFor({ state: "visible" });
    assert.equal(await page.locator(".ss-inline-create form").isVisible(), true,
      device + " must show create form immediately");
    assert.equal(await page.locator(".ss-inline-create textarea").isVisible(), true);
    assert.equal(await page.getByRole("button", { name: "CREATE EXCHANGE" }).isVisible(), true);
    assert.equal(await secret.getByText(/gift budget|exchange date/i).count(), 0);
    assert.equal(await page.locator(".ss-hero__banner").isVisible(), width > 760);
    assert.equal(await page.locator(".ss-hero__mobile").isVisible(), width <= 760);
    const img = width > 760 ? page.locator(".ss-hero__banner") : page.locator(".ss-hero__mobile img").first();
    await img.evaluate(node => node.decode());
    const dims = await secret.evaluate(node => ({ client: node.clientWidth, scroll: node.scrollWidth }));
    assert.ok(dims.scroll <= dims.client + 3,
      device + " panel overflows horizontally " + JSON.stringify(dims));
    await secret.screenshot({ path: "artifacts/secret-santa/" + device + ".png" });
    await context.close();
  }
} finally { await browser.close(); }
console.log("Secret Santa responsive layout verified for desktop, iPad and iPhone");
