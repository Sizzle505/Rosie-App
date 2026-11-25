/* Explicit Tesla launcher and optional in-app controls. No automatic redirects. */
(function (global) {
  "use strict";
  function appURL(origin) {
    const url = new URL("/", origin);
    url.searchParams.set("tesla", "1");
    url.searchParams.set("teslaMode", "1");
    return url.href;
  }
  function theaterURL(origin) {
    const url = new URL("https://www.youtube.com/redirect");
    url.searchParams.set("q", appURL(origin));
    return url.href;
  }
  function enabled(search, topLevel) {
    const p = new URLSearchParams(search);
    return topLevel && p.get("tesla") === "1" && p.get("teslaMode") === "1" && !p.has("rosieTeslaInternal") && !p.has("layout") && !p.has("layoutPreview");
  }
  function controllerStatus(nav) {
    if (typeof nav.getGamepads !== "function") return "This browser does not expose the Gamepad API.";
    try {
      const pads = Array.from(nav.getGamepads() || []).filter(p => p && p.connected);
      if (pads.some(p => p.mapping === "standard")) return "Standard controller detected. Open a game and press, then release, a button.";
      if (pads.length) return "Controller detected, but its mapping is not standard.";
      return "No controller detected. Pair it with the car, then press a button and check again.";
    } catch { return "Controller access is unavailable in this browser."; }
  }
  global.RosieTeslaMode = { appURL, theaterURL, enabled, controllerStatus };
  const doc = global.document;
  if (!doc) return;
  const origin = global.location.origin;
  const launcher = doc.getElementById("tesla-launcher");
  if (launcher) {
    doc.getElementById("tesla-theater-link").href = theaterURL(origin);
    doc.getElementById("tesla-browser-link").href = appURL(origin);
    const status = doc.getElementById("tesla-controller-status");
    const refresh = () => { status.textContent = controllerStatus(global.navigator); };
    doc.getElementById("tesla-check-controller").addEventListener("click", refresh);
    global.addEventListener("gamepadconnected", refresh);
    global.addEventListener("gamepaddisconnected", refresh);
    refresh();
    return;
  }
  if (!enabled(global.location.search, global.top === global.self)) return;
  const style = doc.createElement("link");
  style.rel = "stylesheet"; style.href = "/tesla-mode.css";
  doc.head.appendChild(style);
  const widget = doc.createElement("aside");
  widget.id = "rosie-tesla-controls";
  widget.innerHTML = '<button type="button" class="tesla-mode-trigger" aria-label="Tesla display options" aria-expanded="false" title="Tesla display options"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V4h4m8 0h4v4m0 8v4h-4m-8 0H4v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><section class="tesla-mode-panel" hidden aria-label="Tesla display options"><strong>RosieVerse · Tesla</strong><button type="button" data-native>Enter browser fullscreen</button><a data-theater>Open Theater fullscreen</a><a href="/tesla.html">Back to launcher</a><button type="button" data-check>Check controller</button><p data-status role="status"></p><p data-note role="status">Parked use only. To leave Theater, use Tesla’s own close control.</p></section>';
  doc.body.appendChild(widget);
  const trigger = widget.querySelector(".tesla-mode-trigger"), panel = widget.querySelector(".tesla-mode-panel");
  const native = widget.querySelector("[data-native]"), status = widget.querySelector("[data-status]"), note = widget.querySelector("[data-note]");
  widget.querySelector("[data-theater]").href = theaterURL(origin);
  const refresh = () => { status.textContent = controllerStatus(global.navigator); };
  const close = () => { panel.hidden = true; trigger.setAttribute("aria-expanded", "false"); };
  const fullElement = () => doc.fullscreenElement || doc.webkitFullscreenElement;
  const syncFullscreen = () => {
    native.textContent = fullElement() ? "Exit browser fullscreen" : "Enter browser fullscreen";
    native.disabled = !fullElement() && !(doc.documentElement.requestFullscreen || doc.documentElement.webkitRequestFullscreen);
  };
  trigger.addEventListener("click", () => {
    panel.hidden = !panel.hidden; trigger.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) { refresh(); syncFullscreen(); }
  });
  widget.querySelector("[data-check]").addEventListener("click", refresh);
  native.addEventListener("click", async () => {
    try {
      if (fullElement()) {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
        if (!exit) throw new Error("Unsupported exit");
        await exit.call(doc);
      } else {
        const enter = doc.documentElement.requestFullscreen || doc.documentElement.webkitRequestFullscreen;
        if (!enter) throw new Error("Unsupported fullscreen");
        await enter.call(doc.documentElement);
      }
      close();
    } catch { note.textContent = "Browser fullscreen was blocked. Try Theater instead. To leave Theater, use Tesla’s own close control."; }
    syncFullscreen();
  });
  doc.addEventListener("fullscreenchange", syncFullscreen);
  doc.addEventListener("webkitfullscreenchange", syncFullscreen);
  doc.addEventListener("pointerdown", e => { if (!panel.hidden && !widget.contains(e.target)) close(); });
  widget.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) { e.stopPropagation(); close(); trigger.focus(); } });
  global.addEventListener("gamepadconnected", () => { if (!panel.hidden) refresh(); });
  global.addEventListener("gamepaddisconnected", () => { if (!panel.hidden) refresh(); });
  syncFullscreen();
})(globalThis);
