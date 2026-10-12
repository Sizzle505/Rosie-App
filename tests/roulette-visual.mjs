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
      const frame = salon.locator('img[src="/randomizers/roulette/wheel-frame-stationary.webp"]');
      const pointer = salon.locator('img[src="/randomizers/roulette/pointer-stationary.webp"]');
      const crest = salon.locator('[class*="wheelHub"] img[src="/randomizers/rosie-signet.webp"]');
      const face = salon.locator('[class*="wheelFace"]');
      const sectorPaths = face.locator('path[d^="M 200 200 L "]');
      const wheel = salon.locator('[class*="wheelWrap"] > [class*="wheel_"]');
      await frame.waitFor();
      assert.equal(await frame.count(), 1);
      assert.equal(await pointer.count(), 1);
      assert.equal(await crest.count(), 1);
      assert.equal(await sectorPaths.count(), 6);
      // Confirm real decoded artwork instead of merely validating <img> DOM nodes.
      for (const img of [frame, pointer, crest]) {
        await img.evaluate(element => element.decode());
        assert(await img.evaluate(element => element.naturalWidth > 0 && element.naturalHeight > 0),
          "approved image must decode with nonzero dimensions");
      }
      assert.equal(await frame.evaluate(el => el.naturalWidth), 1024);
      assert.equal(await pointer.evaluate(el => el.naturalWidth), 150);
      const patterns = await face.evaluate(el => [...el.querySelectorAll('pattern image')].map(node => node.getAttribute('href')));
      assert.deepEqual(patterns, [
        "/randomizers/roulette/slice-texture-crimson.webp",
        "/randomizers/roulette/slice-texture-onyx.webp"
      ]);
      await page.waitForFunction(async () => {
        const paths = [
          "/randomizers/roulette/slice-texture-crimson.webp",
          "/randomizers/roulette/slice-texture-onyx.webp"
        ];
        return (await Promise.all(paths.map(async path => {
          const response = await fetch(path);
          return response.ok && response.headers.get("content-type")?.includes("image");
        }))).every(Boolean);
      });
      await page.screenshot({ path: `artifacts/roulette/${engine}-${width}-six.png`, fullPage: true });
      const fixedSelectors = [
        'img[src="/randomizers/roulette/wheel-frame-stationary.webp"]',
        'img[src="/randomizers/roulette/pointer-stationary.webp"]',
        '[class*="wheelHub"] img[src="/randomizers/rosie-signet.webp"]'
      ];
      const fixedBefore = await salon.evaluate((root, selectors) => selectors.map(selector => {
        const wheelRect = root.querySelector('[class*="wheelWrap"]')?.getBoundingClientRect();
        const rect = root.querySelector(selector)?.getBoundingClientRect();
        if (!rect || !wheelRect) return null;
        // Use wheel-local coordinates; clicking Spin may scroll the mobile viewport.
        return { x: rect.x - wheelRect.x, y: rect.y - wheelRect.y, width: rect.width, height: rect.height };
      }), fixedSelectors);
      assert(fixedBefore.every(Boolean), "all three fixed overlays must exist");
      const spin = salon.getByRole("button", { name: /SPIN THE WHEEL/i });
      await spin.click();
      await page.waitForFunction(() => {
        const button = [...document.querySelectorAll("button")].find(node => node.textContent.includes("SPIN THE WHEEL"));
        const verdict = document.querySelector('section[aria-label="Custom decision wheel"] [class*="wheelVerdict"] strong');
        if (!button || !verdict || button.disabled) return false;
        const choices = [...document.querySelectorAll('section[aria-label="Custom decision wheel"] input[aria-label^="Wheel choice"]')].map(i => i.value);
        return choices.includes(verdict.textContent.trim());
      }, null, { timeout: 7500 });
      assert(!(await spin.isDisabled()), "existing spin must finish with a selectable verdict");
      const fixedAfter = await salon.evaluate((root, selectors) => selectors.map(selector => {
        const wheelRect = root.querySelector('[class*="wheelWrap"]')?.getBoundingClientRect();
        const rect = root.querySelector(selector)?.getBoundingClientRect();
        if (!rect || !wheelRect) return null;
        // Use wheel-local coordinates; clicking Spin may scroll the mobile viewport.
        return { x: rect.x - wheelRect.x, y: rect.y - wheelRect.y, width: rect.width, height: rect.height };
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
        const ring = root.querySelector('img[src="/randomizers/roulette/wheel-frame-stationary.webp"]');
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
