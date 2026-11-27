/* Regression (round 10): the production build compiles JSX with the
 * CLASSIC runtime — there is no vite.config, so @vitejs/plugin-react
 * never runs and Vite's esbuild transform emits React.createElement
 * for every JSX element (the shipped bundle contains ~3,147 bound
 * createElement calls and zero jsx-runtime calls). Every JSX file
 * must therefore import the DEFAULT React binding, like all 34
 * component files do.
 *
 * src/KuroiFireworksCanvas.jsx was the one exception: it imported
 * only { useEffect, useRef }, so its <canvas> compiled to a FREE
 * `React.createElement` — a ReferenceError the moment the component
 * rendered with active=true, i.e. only at the eruption mount in the
 * Kuroi finale. That throw is what cut live play to black before
 * the round-6 error boundary existed (and what the boundary's snag
 * panel printed verbatim in round 9: "ReferenceError: React is not
 * defined"). The jsdom seam test could not see it: it bundles the
 * app with esbuild jsx:"automatic", a different transform from
 * production's.
 *
 * These pins close the gap at both levels:
 *  1. source scan — every src file that contains JSX or references
 *     the React namespace must import the default React binding;
 *  2. bundle scan — the built production bundle must contain no
 *     free (unbound) `React.createElement(` reference. Skipped when
 *     no dist bundle exists yet; run after `npm run build`. (It is
 *     deliberately NOT wired into the build's own test gate, which
 *     runs before vite build and would scan the previous bundle.)
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src", "..");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name === "node_modules") continue;
      walk(full, out);
    } else if (/\.(jsx|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const JSX_PATTERN = /return\s*\(?\s*<[A-Za-z>]|=>\s*\(?\s*<[A-Za-z>]|=\s*<[A-Za-z>]|\(\s*<[A-Za-z>]/;

function hasDefaultReactImport(source) {
  const m = /import\s+([^;]+?)\s+from\s+["']react["']/.exec(source);
  if (!m) return false;
  return /^\s*[A-Za-z_$][\w$]*\s*(,|$)/.test(m[1]);
}

// Comment prose mentions React ("independent of React. The…") in
// engine files; strip block comments and full-line comments before
// scanning so only code counts.
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trimStart();
      return !trimmed.startsWith("//") && !trimmed.startsWith("*");
    })
    .join("\n");
}

test("every JSX / React-namespace file under src imports the default React binding", () => {
  const offenders = [];
  for (const file of walk(path.join(root, "src"))) {
    const source = stripComments(fs.readFileSync(file, "utf8"));
    const needsReact = JSX_PATTERN.test(source) || /(?<![\w$.])React\./.test(source);
    if (needsReact && !hasDefaultReactImport(source)) {
      offenders.push(path.relative(root, file));
    }
  }
  assert.deepEqual(offenders, [],
    "files that would emit a free React reference under the classic JSX runtime");
});

test("KuroiFireworksCanvas imports React (the round-10 eruption crash)", () => {
  const source = fs.readFileSync(path.join(root, "src", "KuroiFireworksCanvas.jsx"), "utf8");
  assert.ok(hasDefaultReactImport(source),
    "KuroiFireworksCanvas.jsx does not import the default React binding");
  assert.ok(source.includes("yacht-arena-fireworks"),
    "the eruption canvas component changed shape; re-check the pin");
});

test("the production bundle contains no free React.createElement reference", (t) => {
  const assetsDir = path.join(root, "dist", "assets");
  if (!fs.existsSync(assetsDir)) {
    t.skip("no dist bundle yet — run npm run build first");
    return;
  }
  const bundles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  assert.ok(bundles.length > 0, "dist/assets has no JS bundle");
  for (const file of bundles) {
    const code = fs.readFileSync(path.join(assetsDir, file), "utf8");
    const free = [...code.matchAll(/(?<![\w$.])React\.createElement\(/g)];
    assert.equal(free.length, 0,
      `${file} contains ${free.length} free React.createElement reference(s) — ` +
      "a JSX file is missing its default React import (classic runtime)");
  }
});
