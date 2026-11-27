/* Round 6 regression: the barge-impact -> eruption -> victory seam in
 * the REAL app tree.
 *
 * Why this exists: in live play the finale "cut to black" at the barge
 * impact, and the round-4 automated check saw the page go completely
 * black (no DOM) three times. The app had no error boundary anywhere,
 * so any throw in that seam unmounts the entire React root onto the
 * near-black page background. The isolated-canvas harness used in
 * round 3 could not see that class of failure — it mounted one
 * component with a stub context, not the app.
 *
 * This test bundles the real src/main.jsx with esbuild (assets and CSS
 * stubbed), mounts the whole app in jsdom with a browser-faithful 2D
 * context (arc() throws on a negative radius, as in a real browser),
 * starts the boss chapter through the ?finale=1 hook, holds ArrowLeft
 * so Rosie clears the dot-charge line, and drives the seam for real:
 * Kuroi hits the barge, the eruption canvas mounts, 6.5s later the
 * victory results panel must mount — with the root never emptying and
 * the error boundary never tripping.
 *
 * It needs jsdom + esbuild in node_modules and takes ~15s of real
 * time, so it is NOT part of the test:yacht build gate; it skips
 * cleanly when jsdom is unavailable. Run it directly:
 *   node --test tests/yacht-kuroi-eruption-page.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let JSDOM = null;
let esbuild = null;
try { ({ JSDOM } = await import("jsdom")); } catch { /* skip below */ }
try { esbuild = await import("esbuild"); } catch { /* skip below */ }
const unavailable = !JSDOM || !esbuild;

const root = path.resolve("src", "..");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("impact -> eruption -> victory in the real app tree, root never unmounts", {
  skip: unavailable ? "jsdom/esbuild not installed (npm i --no-save jsdom enables this test)" : false,
  timeout: 120000
}, async () => {
  // --- Bundle the real app (assets/CSS stubbed; the tree is real). ---
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arena-seam-"));
  const entry = path.join(tmp, "entry.jsx");
  fs.writeFileSync(entry,
    `export { mountRosieVerse } from ${JSON.stringify(path.join(root, "src", "main.jsx"))};\n`);
  const bundlePath = path.join(tmp, "app-bundle.mjs");
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    jsx: "automatic",
    platform: "browser",
    outfile: bundlePath,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": "\"production\"" },
    plugins: [{
      name: "stub-assets",
      setup(b) {
        b.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "css" }));
        b.onLoad({ filter: /\.(webp|png|jpe?g|gif|svg|mp3|wav|ogg|woff2?|ttf)$/ },
          () => ({ contents: "export default '';", loader: "js" }));
      }
    }]
  });

  // --- jsdom with the browser APIs the app expects. ---
  const errors = [];
  const dom = new JSDOM(
    `<!doctype html><html><head></head><body><div id="root"></div></body></html>`,
    { url: "http://localhost/?finale=1#captain", pretendToBeVisual: true });
  const { window } = dom;
  window.matchMedia = (query) => ({
    matches: false, media: query,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}
  });
  window.Element.prototype.scrollIntoView = function () {};
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  window.HTMLMediaElement.prototype.pause = function () {};
  window.HTMLMediaElement.prototype.load = function () {};
  window.fetch = () => Promise.resolve(new window.Response(JSON.stringify({}), {
    status: 200, headers: { "Content-Type": "application/json" }
  }));
  // Browser-faithful 2D context: arc() throws on a negative radius.
  window.HTMLCanvasElement.prototype.getContext = function () {
    const gradient = { addColorStop() {} };
    return new Proxy({}, {
      get(target, prop) {
        if (prop === "arc") return (x, y, r) => {
          if (r < 0) throw new Error("IndexSizeError: arc radius negative");
        };
        if (prop === "createLinearGradient" || prop === "createRadialGradient") return () => gradient;
        if (prop === "measureText") return () => ({ width: 0 });
        if (prop === "getImageData") return () => ({ data: new Uint8ClampedArray(4) });
        if (prop === "canvas") return null;
        if (typeof prop === "string") return target[prop] ?? (() => {});
        return undefined;
      },
      set(target, prop, value) { target[prop] = value; return true; }
    });
  };
  window.addEventListener("error", (event) => {
    errors.push(String(event.error?.stack || event.message));
  });
  const originalConsoleError = console.error;
  console.error = (...args) => {
    errors.push(args.map(String).join(" "));
    originalConsoleError(...args);
  };

  for (const key of ["document", "navigator", "location", "history",
    "localStorage", "sessionStorage", "HTMLElement", "HTMLCanvasElement",
    "Element", "Node", "Event", "CustomEvent", "KeyboardEvent", "MouseEvent",
    "PointerEvent", "MutationObserver", "getComputedStyle", "Image",
    "requestAnimationFrame", "cancelAnimationFrame", "FileReader",
    "Audio", "HTMLAudioElement", "IntersectionObserver", "ResizeObserver"]) {
    if (window[key] !== undefined) {
      try { globalThis[key] = window[key]; }
      catch { Object.defineProperty(globalThis, key, { value: window[key], configurable: true }); }
    }
  }
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.self = window;

  let reactRoot = null;
  try {
    const { mountRosieVerse } = await import(bundlePath);
    reactRoot = mountRosieVerse(window.document.getElementById("root"));
    await sleep(600);
    const rootEl = window.document.getElementById("root");
    assert.ok(rootEl.innerHTML.length > 1000, "the app did not mount");

    // Chapter 5 in the picker, then CAST OFF.
    let chapterBtn = null;
    for (let i = 0; i < 20 && !chapterBtn; i++) {
      chapterBtn = [...window.document.querySelectorAll("button")]
        .find((b) => /kuroi/i.test(b.textContent || "") && /last charge/i.test(b.textContent || "")) || null;
      if (!chapterBtn) await sleep(300);
    }
    assert.ok(chapterBtn, "chapter 5 (Kuroi's Last Charge) not found in the picker");
    chapterBtn.click();
    await sleep(300);
    const castOff = [...window.document.querySelectorAll("button")]
      .find((b) => (b.textContent || "").trim() === "CAST OFF");
    assert.ok(castOff, "CAST OFF button not found");
    castOff.click();
    await sleep(200);
    assert.ok(window.document.querySelector(".yacht-arena"), "the arena did not mount");

    // Hold ArrowLeft: Rosie sails off the Kuroi<->barge line, so the
    // dot charge ends in the barge. (Dispatched on the body, as a real
    // key event targets the focused element; the app's global handler
    // calls contains(event.target), which throws for a Window target.)
    window.document.body.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));

    let sawCanvas = false;
    let resultsText = "";
    for (let i = 0; i < 100 && !resultsText; i++) {
      await sleep(250);
      assert.ok(rootEl.innerHTML.length > 200,
        "the React root emptied mid-seam — the black page (an uncaught throw unmounted the app)");
      assert.ok(!window.document.querySelector(".yacht-game-error-panel"),
        "the error boundary tripped during the seam");
      if (window.document.querySelector("canvas.yacht-arena-fireworks")) sawCanvas = true;
      const panel = window.document.querySelector(".captain-results-panel span");
      if (panel) resultsText = panel.textContent || "";
    }
    assert.ok(sawCanvas, "the eruption canvas never mounted after the barge impact");
    assert.ok(resultsText.includes("VOYAGE COMPLETE"),
      `the victory results never mounted (last seen: "${resultsText}")`);
    assert.deepEqual(errors, [],
      "errors reached the window/console during the seam");
  } finally {
    console.error = originalConsoleError;
    try { reactRoot?.unmount(); } catch { /* already gone */ }
    window.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
