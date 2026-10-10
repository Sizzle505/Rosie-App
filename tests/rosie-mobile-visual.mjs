import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium, webkit } from "playwright";

const sizes = [
  [320, 650], [375, 667], [390, 844], [768, 1024], [1440, 900]
];
const base = "http://127.0.0.1:5173";
const output = "artifacts/rosie-visual";
await fs.mkdir(output, { recursive: true });

const summary = [];
for (const [browserName, browserType] of [["webkit", webkit], ["chromium", chromium]]) {
  const browser = await browserType.launch({ headless: true });
  try {
    for (const [width, height] of sizes) {
      const narrow = width < 700;
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: narrow ? 2 : 1,
        isMobile: narrow,
        hasTouch: narrow
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(String(error)));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      const title = browserName + "-" + width;

      await page.goto(base + "/#randomizers", { waitUntil: "networkidle" });
      await page.locator("section[aria-label='Quick randomizers'] article").first().waitFor();
      const panels = await page.locator("section[aria-label='Quick randomizers'] article").evaluateAll(nodes =>
        nodes.map(node => {
          const rect = node.getBoundingClientRect();
          const coin = node.querySelector("[aria-label^='Coin shows']");
          const button = node.querySelector("button");
          return {
            height: Math.round(rect.height),
            width: Math.round(rect.width),
            buttonHeight: Math.round(button.getBoundingClientRect().height),
            coinWidth: coin ? Math.round(coin.getBoundingClientRect().width) : null
          };
        })
      );
      assert.equal(panels.length, 2);
      if (narrow) {
        assert(panels.every(p => p.height < 375), "mobile randomizer panels too tall: " + JSON.stringify(panels));
        assert(panels.every(p => p.buttonHeight >= 47), "randomizer touch targets below 48px");
        assert(panels.every(p => p.width <= width), "mobile randomizer card exceeds viewport");
      }
      await page.screenshot({ path: output + "/" + title + "-randomizers.png", fullPage: true });
      const coin = page.getByRole("button", { name: /FLIP THE COIN/i });
      const dice = page.getByRole("button", { name: /ROLL THE DIE/i });
      await coin.click();
      assert(await coin.isDisabled(), "coin must disable during animation");
      await page.waitForTimeout(1050);
      assert(await coin.isEnabled(), "coin never reenabled");
      await dice.click();
      assert(await dice.isDisabled(), "die must disable during animation");
      await page.waitForTimeout(1350);
      assert(await dice.isEnabled(), "die never reenabled");
      if (narrow) {
        await dice.scrollIntoViewIfNeeded();
        const position = await page.evaluate(() => ({
          buttonBottom: document.querySelector("section[aria-label='Quick randomizers'] article:nth-child(2) button").getBoundingClientRect().bottom,
          navTop: document.querySelector(".bottom-nav").getBoundingClientRect().top
        }));
        assert(position.buttonBottom <= position.navTop + 1, "dice button hidden by sticky navigation: " + JSON.stringify(position));
      }

      await page.goto(base + "/#fortune", { waitUntil: "networkidle" });
      const omens = (await page.locator(".omen-grid strong").allTextContents()).map(x => x.trim());
      assert.equal(omens.length, 3);
      for (const s of [omens[0], omens[2]]) assert(s.length > 0 && s[0] === s[0].toUpperCase(), "omen not sentence-cased: " + s);
      assert(omens[1].length > 0, "auspicious hour not displayed");
      await page.screenshot({ path: output + "/" + title + "-omens.png" });

      await page.goto(base + "/#cheese", { waitUntil: "networkidle" });
      await page.locator("button.cheese-card").first().waitFor();
      const pairIndices = await page.locator("button.cheese-card").evaluateAll(cards => {
        const groups = new Map();
        cards.forEach((card, index) => {
          const name = card.querySelector(".cheese-card-front strong")?.textContent?.trim();
          if (!groups.has(name)) groups.set(name, []);
          groups.get(name).push(index);
        });
        return [...groups.values()];
      });
      assert.equal(pairIndices.length, 8, "expected eight cheese pairs");
      assert(pairIndices.every(indices => indices.length === 2), "invalid cheese pair");
      for (const [first, second] of pairIndices) {
        await page.locator("button.cheese-card").nth(first).click();
        await page.locator("button.cheese-card").nth(second).click();
        await page.waitForTimeout(480);
      }
      await page.locator(".barkbridge-diploma").first().waitFor({ timeout: 6000 });
      const diploma = page.locator(".graduation-stage .barkbridge-diploma").first();
      const certificateText = await diploma.innerText();
      for (const required of [
        "UNIVERSITY OF BARKBRIDGE", "FACULTY OF GASTRONOMIC SCIENCES",
        "Rosie the Shiba", "Doctor of Cheese (Che.D.)", "Fetch the Fromage",
        "May 2025", "Prof. Manchego P. Curdwell", "Dr. Brie de Bloom"
      ]) assert(certificateText.includes(required), "diploma missing: " + required);
      const bounds = await diploma.boundingBox();
      assert(bounds && bounds.width <= width + 1, "diploma wider than viewport: " + JSON.stringify(bounds));
      assert(bounds.width > bounds.height * 1.15, "diploma is not landscape");
      const performance = await page.locator(".diploma-results-strip").innerText();
      assert(performance.includes("MOVES") && performance.includes("TIME") && performance.includes("MATCH EFFICIENCY"));
      assert(performance.includes("8") && performance.includes("100%"), "expected perfect 8-move completion: " + performance);
      assert(await page.locator(".graduate-rosie img").isVisible(), "Graduate Rosie missing");
      assert.equal(await page.locator(".barkbridge-confetti i").count(), 34, "confetti changed");
      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert(pageWidth <= width + 3, "horizontal overflow: viewport " + width + " document " + pageWidth);
      await page.screenshot({ path: output + "/" + title + "-diploma.png", fullPage: true });
      await page.getByRole("button", { name: /View diploma at full size/i }).click();
      assert(await page.locator("dialog.barkbridge-zoom-dialog").evaluate(dialog => dialog.open), "enlargement dialog not open");
      await page.screenshot({ path: output + "/" + title + "-diploma-enlarged.png" });
      await page.getByRole("button", { name: /Close ×/i }).click();
      await page.getByRole("button", { name: /EXAMINE AGAIN/i }).click();
      assert.equal(await page.locator("button.cheese-card").count(), 16, "replay did not reset game");
      assert.equal(errors.length, 0, "browser errors: " + errors.join(" | "));
      summary.push({ browserName, width, height, panels, bounds: { width: Math.round(bounds.width), height: Math.round(bounds.height) }, performance: performance.replace(/\\s+/g," ").slice(0,100), errors: [] });
      await context.close();
      console.log("PASS", title, JSON.stringify(summary.at(-1)));
    }
  } finally {
    await browser.close();
  }
}
await fs.writeFile(output + "/metrics.json", JSON.stringify(summary, null, 2));
console.log("All 10 viewport/engine combinations passed");
