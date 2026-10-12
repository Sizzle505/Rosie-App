import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium, webkit } from "playwright";

const base = "http://127.0.0.1:5173/#randomizers";
await fs.mkdir("artifacts/roulette", { recursive: true });

for (const [engine, browserType] of [["webkit", webkit], ["chromium", chromium]]) {
  const browser = await browserType.launch({ headless: true });
  try {
    for (const width of [375, 390, 430]) {
      const page = await browser.newPage({
        viewport: { width, height: 932 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      });
      const errors = [];
      page.on("pageerror", error => errors.push(String(error)));
      await page.goto(base, { waitUntil: "networkidle" });
      const salon = page.locator('section[aria-label="Custom decision wheel"]');
      const frame = salon.locator('img[src="/randomizers/roulette/frame.svg"]');
      const pointer = salon.locator('img[src="/randomizers/roulette/pointer.svg"]');
      const crest = salon.locator('[class*="wheelHub"] img[src="/randomizers/rosie-signet.webp"]');
      const face = salon.locator('[class*="wheelFace"]');
      const sectorPaths = face.locator('path[d^="M 200 200 L "]');
      const wheel = salon.locator('[class*="wheelWrap"] > [class*="wheel_"]');
      await frame.waitFor();
      assert.equal(await frame.count(), 1);
      assert.equal(await pointer.count(), 1);
      assert.equal(await crest.count(), 1);
      assert.equal(await sectorPaths.count(), 6);
      await page.screenshot({ path: `artifacts/roulette/${engine}-${width}-six.png`, fullPage: true });
      const fixedSelectors = [
        'img[src="/randomizers/roulette/frame.svg"]',
        'img[src="/randomizers/roulette/pointer.svg"]',
        '[class*="wheelHub"] img[src="/randomizers/rosie-signet.webp"]'
      ];
      const fixedBefore = await salon.evaluate((root, selectors) => selectors.map(selector => {
        const rect = root.querySelector(selector)?.getBoundingClientRect();
        if (!rect) return null;
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }), fixedSelectors);
      assert(fixedBefore.every(Boolean), "all three fixed overlays must exist");
      const spin = salon.getByRole("button", { name: /SPIN THE WHEEL/i });
      await spin.click();
      assert(await spin.isDisabled(), "spin must lock during its existing animation");
      await page.waitForTimeout(2450);
      assert(!(await spin.isDisabled()), "existing spin must finish");
      const fixedAfter = await salon.evaluate((root, selectors) => selectors.map(selector => {
        const rect = root.querySelector(selector)?.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }), fixedSelectors);
      for (let i = 0; i < fixedBefore.length; i++) {
        for (const field of ["x", "y", "width", "height"]) {
          assert(Math.abs(fixedBefore[i][field] - fixedAfter[i][field]) <= 1,
            `${engine} ${width}: fixed artwork moved (${i}, ${field})`);
        }
      }
      const countLabels = async () => salon.locator('[class*="wheelLabel"] b').count();
      assert.equal(await countLabels(), 6);
      for (let n = 6; n > 2; n--) {
        await salon.locator('button[aria-label^="Remove "]').first().click();
        assert.equal(await sectorPaths.count(), n - 1);
        assert.equal(await countLabels(), n - 1);
      }
      await page.screenshot({ path: `artifacts/roulette/${engine}-${width}-two.png`, fullPage: true });
      const firstChoice = salon.locator('input[aria-label="Wheel choice 1"]');
      await firstChoice.fill("A Fine Choice");
      await firstChoice.blur();
      assert((await salon.locator('[class*="wheelLabel"] b').allTextContents()).includes("A Fine Choice"),
        "edited label must remain live DOM text");
      for (let n = 2; n < 10; n++) {
        await salon.locator('input[id="rosie-wheel-choice"]').fill(`Choice ${n + 1}`);
        await salon.getByRole("button", { name: "ADD", exact: true }).click();
        assert.equal(await sectorPaths.count(), n + 1);
        assert.equal(await countLabels(), n + 1);
      }
      await page.screenshot({ path: `artifacts/roulette/${engine}-${width}-ten.png`, fullPage: true });
      const widths = await salon.evaluate(root => {
        const e = root.querySelector('[class*="wheelWrap"]');
        const ring = root.querySelector('img[src="/randomizers/roulette/frame.svg"]');
        const disc = root.querySelector('[class*="wheelFace"]');
        return [e?.getBoundingClientRect().width, ring?.getBoundingClientRect().width, disc?.getBoundingClientRect().width];
      });
      assert(widths.every(Number.isFinite));
      assert(widths[2] < widths[1], "rotating face must fit inside stationary frame");
      assert.equal(errors.length, 0, errors.join("\n"));
      await page.close();
    }
  } finally { await browser.close(); }
}
