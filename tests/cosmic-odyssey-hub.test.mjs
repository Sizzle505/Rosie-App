import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

// Source assertions pinning the merged games behavior (Yacht + Tunnel).
// Cosmic and Captain-hub tests from the games branch were removed with
// their excluded features during the live integration.
const mainJsx=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");
const emberJsx=readFileSync(new URL("../src/EmberTunnelDrill.jsx",import.meta.url),"utf8");

test("Yacht: keys step aside when another game is in view; Space cannot resume it from Tunnel",()=>{
  // When the player has scrolled to Tunnel or Cosmic, Yacht's global keys
  // step aside even though focus sits on the page body (a click on
  // Tunnel's canvas does not move focus into the Tunnel frame).
  assert.ok(mainJsx.includes('if (focusedGame === "tunnel" || focusedGame === "cosmic") return;'));
  // Space/Enter resume and Space boost require focus inside the Yacht frame.
  assert.ok(mainJsx.includes('if ((event.key === " " || event.key === "Enter") && inYachtFrame &&'));
  assert.ok(mainJsx.includes('if ((event.key === " " || event.code === "Space") && running && inYachtFrame) {'));
  // Pausing leaves focus on RESUME VOYAGE; pressing outside the frame
  // blurs it so Space cannot natively click it while playing Tunnel.
  assert.ok(mainJsx.includes("if (active && yachtFrame.contains(active)) active.blur();"));
});

test("Tunnel: report shows the best for this world; Ruby copy fixed; stats sit above the fold",()=>{
  assert.ok(!emberJsx.includes("amount of park"));
  assert.ok(emberJsx.includes("amount of treasure"));
  assert.ok(emberJsx.includes("rosieEmberDrillBestByWorld"));
  assert.ok(emberJsx.includes("displayBest"));
  assert.ok(emberJsx.includes("<b>{displayBest.toLocaleString()}</b> BEST"));
  // The results block now precedes the action buttons and world picker.
  assert.ok(emberJsx.indexOf("ember-results") < emberJsx.indexOf("ember-watch-opening"));
  assert.ok(emberJsx.indexOf("ember-results") < emberJsx.indexOf("ember-expedition-pick"));
  // The opening-film dialog fits without scrolling on desktop.
  const tunnelCss=readFileSync(new URL("../src/ember-tunnel-drill.css",import.meta.url),"utf8");
  assert.ok(tunnelCss.includes("max-height:min(50vh,420px)"));
});

test("Yacht: arrows steer without focus inside the frame; auto-fullscreen on CAST OFF",()=>{
  // The focus gate no longer requires the event target inside .captain-fs-yacht.
  assert.ok(!mainJsx.includes("if (!yachtFrame?.contains(event.target)) return;"));
  // Only another game or an editable control steps aside now.
  assert.ok(mainJsx.includes('.captain-fs-tunnel, #cosmic-odyssey-arcade, .captain-fs-captain2'));
  // Launch focus is restored on every device (no coarse-pointer carve-out).
  assert.ok(!mainJsx.includes('if (window.matchMedia?.("(pointer: coarse)").matches) return undefined;'));
  // Mitchell's rule (2026-11-25, superseding the no-auto-fullscreen design):
  // every game goes fullscreen when played — startGame requests it on CAST OFF.
  const startGame=mainJsx.slice(mainJsx.indexOf("function startGame"));
  assert.ok(startGame.slice(0,400).includes("requestGameFullscreen?.()"));
  // Victory art no longer auto-opens and hides CHOOSE LEVEL.
  const finishGame=mainJsx.slice(mainJsx.indexOf("function finishGame"));
  assert.ok(!finishGame.slice(0,400).includes("setShowVictoryArt(success)"));
});

test("Yacht: level select resets the run and is surfaced above the course",()=>{
  assert.ok(mainJsx.includes("function selectChapter(index)"));
  assert.ok(mainJsx.includes("setTimeLeft(yachtRunSeconds(chosen))"));
  assert.ok(mainJsx.includes('<section className="yacht-level-select"'));
  assert.ok(mainJsx.includes("onClick={() => selectChapter(index)}"));
  assert.ok(!mainJsx.includes("READY TO TEST"),"dev wording must not remain");
});

test("Tunnel: end screen and labels are consistent; no dev wording",()=>{
  assert.ok(emberJsx.includes('hud.result==="hull"?"THE DRILL IS DOWN"'));
  assert.ok(emberJsx.includes("The hull is gone"));
  assert.ok(emberJsx.includes('ember-hull-segments'));
  assert.ok(emberJsx.includes("REPLAY THIS WORLD"));
  assert.ok(!emberJsx.includes("playtest")&&!emberJsx.includes("PLAYTESTING"));
  assert.ok(!emberJsx.includes("remains in review"));
});
