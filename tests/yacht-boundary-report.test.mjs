import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/* Round 8 (Defect 1) regression coverage for the CaptainGameBoundary
 * self-report. The live finale crash on the dodge -> barge-impact
 * path could not be diagnosed from outside the browser: the checker
 * has no DevTools, so a console.error is invisible where it matters.
 * The boundary now renders the caught error's name, message and
 * first stack lines as visible small print INSIDE the fallback
 * panel. This test drives the REAL boundary class from src/main.jsx
 * (bundled the same way as the eruption seam test) with a child that
 * throws during render, and asserts the panel's DOM text carries
 * the error — the exact property a future live catch depends on. */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let JSDOM = null;
let esbuild = null;
try { ({ JSDOM } = await import("jsdom")); } catch { /* skip below */ }
try { esbuild = await import("esbuild"); } catch { /* skip below */ }

const ready = Boolean(JSDOM && esbuild);

test("the boundary fallback panel renders the caught error's message and stack", { skip: !ready && "jsdom/esbuild not installed (npm i --no-save jsdom enables this test)" }, async () => {
  const cacheDir = path.join(root, "tests", ".cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  const entry = path.join(cacheDir, "boundary-entry.mjs");
  fs.writeFileSync(entry,
    `import React from "react";\n` +
    `import { createRoot } from "react-dom/client";\n` +
    `import { CaptainGameBoundary } from ${JSON.stringify(path.join(root, "src", "main.jsx"))};\n` +
    `export { React, createRoot, CaptainGameBoundary };\n`);
  const bundlePath = path.join(cacheDir, "boundary-bundle.mjs");
  const emptyModule = {
    name: "empty-assets",
    setup(build) {
      build.onLoad({ filter: /\.(css|png|jpe?g|webp|svg|gif|mp3|wav|ogg|m4a|mp4|webm)$/ },
        () => ({ contents: "export default '';", loader: "js" }));
    }
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, format: "esm", platform: "browser",
    outfile: bundlePath, logLevel: "silent", plugins: [emptyModule],
    loader: { ".js": "jsx", ".jsx": "jsx" }
  });

  const dom = new JSDOM("<!doctype html><html><body><div id=\"root\"></div><div id=\"probe\"></div></body></html>",
    { url: "http://localhost/#captain", pretendToBeVisual: true });
  const { window } = dom;
  const globals = ["window", "document", "navigator", "localStorage", "sessionStorage",
    "location", "history", "HTMLElement", "HTMLAnchorElement", "HTMLInputElement",
    "Element", "Node", "Event", "CustomEvent", "KeyboardEvent", "MouseEvent",
    "PointerEvent", "TouchEvent", "getComputedStyle", "requestAnimationFrame",
    "cancelAnimationFrame", "MutationObserver", "DOMParser", "XMLSerializer",
    "FileReader", "Blob", "URLSearchParams", "Image", "Audio", "matchMedia",
    "ResizeObserver", "IntersectionObserver", "scrollTo", "fetch"];
  for (const key of globals) {
    if (window[key] !== undefined) {
      try { Object.defineProperty(globalThis, key, { value: window[key], configurable: true, writable: true }); }
      catch { globalThis[key] = window[key]; }
    }
  }
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.self = window;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  globalThis.ResizeObserver = window.ResizeObserver;
  window.scrollTo = window.scrollTo || (() => {});
  window.HTMLMediaElement.prototype.play = function play() { return Promise.resolve(); };
  window.HTMLMediaElement.prototype.pause = function pause() {};
  window.HTMLMediaElement.prototype.load = function load() {};

  // React reports the throw through console.error; keep the log but
  // do not let it fail the run.
  const consoleErrors = [];
  const originalError = console.error;
  console.error = (...args) => { consoleErrors.push(args.map(String).join(" ")); };

  let reactRoot = null;
  try {
    const { React, createRoot, CaptainGameBoundary } = await import(pathToFileURL(bundlePath).href);
    const probeMessage = "finale seam probe: eruption mount exploded";
    function Thrower() { throw new Error(probeMessage); }
    reactRoot = createRoot(window.document.getElementById("probe"));
    reactRoot.render(React.createElement(CaptainGameBoundary, null, React.createElement(Thrower)));
    await sleep(300);

    const panel = window.document.querySelector(".yacht-game-error-panel");
    assert.ok(panel, "the fallback panel did not render after a child throw");
    assert.match(panel.textContent || "", /THE GAME HIT A SNAG/);
    const detail = window.document.querySelector(".captain-boundary-error");
    assert.ok(detail, "the panel carries no rendered error detail element");
    assert.ok((detail.textContent || "").includes(probeMessage),
      `the error message is not visible in the panel: ${detail.textContent}`);
    assert.ok((detail.textContent || "").includes("Error"),
      "the error name is not visible in the panel");
    assert.ok((detail.textContent || "").split("\n").length >= 2,
      "no stack lines rendered under the message");

    const stored = window.sessionStorage.getItem("captainBoundaryError");
    assert.ok(stored, "no sessionStorage copy of the catch");
    assert.ok(JSON.parse(stored).message.includes("finale seam probe"),
      "the sessionStorage copy names a different error");

    // Recovery: swap in a healthy child and press the panel's own
    // RESTART button — the boundary must reset and render it.
    reactRoot.render(React.createElement(CaptainGameBoundary, null,
      React.createElement("p", { className: "healthy-probe" }, "all calm")));
    await sleep(200);
    const restart = [...window.document.querySelectorAll(".yacht-game-error-panel button")]
      .find((b) => /RESTART/.test(b.textContent || ""));
    assert.ok(restart, "the panel offers no restart button");
    restart.click();
    await sleep(300);
    assert.ok(window.document.querySelector(".healthy-probe"), "healthy child did not render after restart");
    assert.equal(window.document.querySelector(".yacht-game-error-panel"), null,
      "the panel stayed up after the boundary reset");
  } finally {
    console.error = originalError;
    try { reactRoot?.unmount(); } catch { /* already gone */ }
    window.close();
  }
});
