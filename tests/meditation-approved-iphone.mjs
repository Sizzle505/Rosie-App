import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const base = process.env.HAIKU_QA_URL || "http://127.0.0.1:4173";
const choices = [
  ["lotus", "lotus-sunrise.avif"],
  ["sakura", "sakura-spring.avif"],
  ["tea", "misty-tea.avif"],
  ["twilight", "lantern-dusk.avif"],
  ["moonlit", "moonlit-retreat.avif"],
];
const browser = await chromium.launch({ headless: true });
mkdirSync("artifacts/meditation-iphone", { recursive: true });

try {
  for (const { width, height, label } of [
    { width: 390, height: 844, label: "iphone" },
    { width: 430, height: 932, label: "large-iphone" }
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    try {
      await page.goto(base + "/#haiku", {
        waitUntil: "domcontentloaded", timeout: 60000
      });
      await page.locator(".loading-screen").waitFor({ state: "hidden" });
      await page.locator(".haiku-workbench").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Meditate", exact: true }).click();
      await page.locator(".zen-begin").waitFor({ state: "visible" });
      await page.locator(".zen-begin").click();
      const room = page.getByRole("dialog", { name: "Breathe with Rosie" });
      await room.waitFor({ state: "visible" });

      for (const [view, basename] of choices) {
        for (let step = 0; step < 8; step++) {
          const current = await page.locator(".zen-immersive").getAttribute("data-zen-view");
          if (current === view) break;
          await room.getByRole("button", { name: "Next meditation background" }).click();
        }
        assert.equal(
          await page.locator(".zen-immersive").getAttribute("data-zen-view"), view,
          label + " must be able to select " + view
        );
        const scene = page.locator(".zen-scenery-phone");
        await scene.evaluate(async img => { await img.decode(); });
        const layout = await page.evaluate(() => {
          const image = document.querySelector(".zen-scenery-phone");
          const root = document.querySelector(".zen-immersive");
          const dialog = document.querySelector(".zen-immersive-dialog");
          const frame = document.querySelector(".zen-session-frame");
          const portrait = document.querySelector(".zen-breath-portrait");
          const guidance = document.querySelector(".zen-guidance");
          const rect = x => x.getBoundingClientRect().toJSON();
          return {
            image: image.currentSrc,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            imageFit: getComputedStyle(image).objectFit,
            imageTransform: getComputedStyle(image).transform,
            rootBackground: getComputedStyle(root).backgroundImage,
            duplicateBackdrop: getComputedStyle(portrait, "::before").content,
            dialog: rect(dialog), frame: rect(frame), guidance: rect(guidance),
            viewport: window.innerHeight,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            decorations: [...document.querySelectorAll(".zen-immersive-scenery .rosie-ambient img")]
              .filter(node => getComputedStyle(node).display !== "none")
              .map(node => {
                const box = node.getBoundingClientRect();
                return { kind: node.className, width: box.width, height: box.height };
              })
          };
        });
        assert.ok(layout.image.includes("/iphone/approved/" + basename),
          label + " must load approved scene " + basename + ": " + layout.image);
        assert.ok(layout.naturalWidth >= 900 && layout.naturalHeight >= 1600,
          label + " must decode the full-resolution iPhone painting");
        assert.equal(layout.imageFit, "cover", label + " must fit original composition to viewport");
        assert.equal(layout.imageTransform, "none", label + " must not zoom the garden");
        assert.equal(layout.rootBackground, "none", label + " must not paint a second background");
        assert.equal(layout.duplicateBackdrop, "none",
          label + " must not magnify a background behind Rosie");
        assert.ok(layout.frame.bottom >= height - 50,
          label + " must not leave empty area below the framed session: " +
          JSON.stringify({ bottom: layout.frame.bottom, height }));
        assert.ok(layout.guidance.bottom <= height + 1,
          label + " guidance must remain inside the viewport");
        assert.ok(layout.overflow <= 2,
          label + " must not scroll horizontally: " + layout.overflow);
        assert.ok(layout.decorations.length >= 3,
          label + " " + view + " must retain small ambient decorations");
        assert.ok(layout.decorations.every(item => item.width <= 90 && item.height <= 110),
          label + " " + view + " must never scale a butterfly, petal or lantern " +
          "to screen size: " + JSON.stringify(layout.decorations));
        await page.screenshot({
          path: "artifacts/meditation-iphone/" + label + "-" + view + ".png",
          animations: "disabled", fullPage: false
        });
        console.log("PASS " + label + " " + view + " " + basename);
      }

      await room.getByRole("button", { name: "Pause meditation" }).click();
      assert.equal(await page.locator(".zen-immersive").getAttribute("data-zen-status"),
        "paused");
      await room.getByRole("button", { name: "Resume meditation" }).click();
      assert.equal(await page.locator(".zen-immersive").getAttribute("data-zen-status"),
        "running");
      await room.getByRole("button", { name: "End meditation" }).click();
      await room.waitFor({ state: "hidden" });
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
