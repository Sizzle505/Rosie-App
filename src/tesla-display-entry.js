/*
 * RosieVerse in-car desktop composition. The Tesla browser reports roughly
 * 1256x706 CSS pixels despite a 1920px physical display, with Linux Chrome,
 * 16 touch points and a primary fine/hover pointer.
 *
 * Only Reviews, Recipes, Calculations and QR Atelier get the approved
 * 1920x1080 desktop canvas. The other pages, the normal desktop, and mobile
 * devices keep their existing layouts. Never use width alone for detection.
 */
const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1080;
const DESKTOP_ART_PAGES = new Set(["reviews", "recipes", "calculations", "qr-atelier"]);
const params = new URLSearchParams(window.location.search);
const root = document.getElementById("root");

function pageName() {
  return window.location.hash.replace(/^#/, "").split("?")[0].toLowerCase();
}

function looksLikeMeasuredTesla() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const ratio = window.devicePixelRatio || 1;
  return (
    width >= 1190 && width <= 1350 &&
    height >= 620 && height <= 780 &&
    Math.abs(width / height - 16 / 9) < .12 &&
    ratio >= 1.45 && ratio <= 1.63 &&
    navigator.maxTouchPoints >= 10 &&
    /Linux/i.test(navigator.userAgent) &&
    /Chrome\//i.test(navigator.userAgent) &&
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(hover: hover)").matches
  );
}

function subscribeHistory(onChange) {
  for (const name of ["pushState", "replaceState"]) {
    const original = window.history[name];
    window.history[name] = function (...args) {
      const result = original.apply(this, args);
      queueMicrotask(() => onChange(name));
      return result;
    };
  }
  window.addEventListener("hashchange", () => onChange("hashchange"));
  window.addEventListener("popstate", () => onChange("popstate"));
}

async function loadRegularApp() {
  const { mountRosieVerse } = await import("./main.jsx");
  return mountRosieVerse(root);
}

if (params.has("rosieTeslaInternal")) {
  // The child browser must see a real 1920x1080 CSS viewport so every
  // existing art-direction breakpoint uses its approved desktop geometry.
  subscribeHistory(() => {
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: "rosie-tesla-route", hash: window.location.hash },
        window.location.origin
      );
    }
  });
  loadRegularApp();
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: "rosie-tesla-route", hash: window.location.hash },
      window.location.origin
    );
  }
} else if (
  !params.has("layout") &&
  !params.has("layoutPreview") &&
  params.get("tesla") !== "0" &&
  (params.get("tesla") === "1" || looksLikeMeasuredTesla())
) {
  const normalBodyOverflow = document.body.style.overflow;
  let mounted = null;
  let host = null;
  let frame = null;
  let generation = 0;

  function fittedFrame() {
    if (!frame) return;
    const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
    const left = (window.innerWidth - STAGE_WIDTH * scale) / 2;
    const top = (window.innerHeight - STAGE_HEIGHT * scale) / 2;
    frame.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
  }

  function showFrame() {
    generation++;
    if (mounted) {
      mounted.unmount();
      mounted = null;
    }
    root.style.display = "none";
    document.body.style.overflow = "hidden";

    if (!host) {
      host = document.createElement("div");
      host.id = "rosie-tesla-stage";
      host.setAttribute("aria-label", "RosieVerse fitted desktop composition");
      host.style.cssText = "position:fixed;inset:0;overflow:hidden;z-index:2147483000;background:#151025;";
      frame = document.createElement("iframe");
      frame.title = "RosieVerse full desktop layout";
      frame.allow = "camera; microphone; clipboard-read; clipboard-write; gamepad; fullscreen";
      frame.setAttribute("allowfullscreen", "");
      frame.style.cssText =
        "position:absolute;top:0;left:0;width:1920px;height:1080px;border:0;transform-origin:top left;background:#151025;";
      const url = new URL(window.location.href);
      url.searchParams.delete("tesla");
      url.searchParams.set("rosieTeslaInternal", "1");
      frame.src = url.pathname + url.search + url.hash;
      host.appendChild(frame);
      document.body.appendChild(host);
    } else {
      try {
        if (frame.contentWindow.location.hash !== window.location.hash) {
          frame.contentWindow.location.hash = window.location.hash;
        }
      } catch { /* A subsequent frame load will synchronize its own route. */ }
    }
    fittedFrame();
  }

  async function showRegular() {
    const myGeneration = ++generation;
    if (host) {
      host.remove();
      host = null;
      frame = null;
    }
    root.style.display = "";
    document.body.style.overflow = normalBodyOverflow;
    if (!mounted) {
      const { mountRosieVerse } = await import("./main.jsx");
      if (myGeneration !== generation || DESKTOP_ART_PAGES.has(pageName())) return;
      mounted = mountRosieVerse(root);
    }
  }
  // The non-active mode has no background React tree or competing soundtrack.

  function syncMode() {
    if (DESKTOP_ART_PAGES.has(pageName())) showFrame();
    else if (host || !mounted) void showRegular();
  }

  window.addEventListener("message", (event) => {
    if (
      event.origin !== window.location.origin ||
      !frame ||
      event.source !== frame.contentWindow ||
      event.data?.type !== "rosie-tesla-route" ||
      typeof event.data.hash !== "string" ||
      !/^#[a-z0-9-]*$/i.test(event.data.hash)
    ) return;
    if (window.location.hash !== event.data.hash) {
      window.history.pushState(null, "", event.data.hash);
    }
  });

  subscribeHistory(syncMode);
  window.addEventListener("resize", () => {
    if (params.get("tesla") !== "1" && !looksLikeMeasuredTesla()) {
      // A resized window can leave the measured car dimensions; keep the
      // current page usable rather than throwing away navigation state.
      if (host) fittedFrame();
    } else {
      fittedFrame();
    }
  });
  syncMode();
} else {
  loadRegularApp();
}
