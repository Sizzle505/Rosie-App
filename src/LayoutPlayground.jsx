import React, { useEffect, useRef, useState } from "react";
import "./LayoutPlayground.css";

/*
 * Layout Playground is intentionally a non-publishing design tool.
 * Preview mode is available only through ?layoutPreview=1, and all edits
 * stay inside the iframe until the user exports a layout specification.
 */
const STORAGE_KEY = "rosieverse.layout-playground.drafts.v1";
const PAGES = [
  { id: "qr-atelier", label: "QR Atelier" },
  { id: "calculations", label: "Calculations" },
  { id: "resources", label: "Resources Hub" },
  { id: "recipes", label: "Recipes" },
  { id: "timekeeper", label: "Timekeepers" },
  { id: "reminders", label: "Reminders" },
  { id: "reviews", label: "Reviews" },
  { id: "home", label: "Home" },
  { id: "captain", label: "Captain" },
  { id: "cheese", label: "Cheese" },
  { id: "fortune", label: "Fortune" },
  { id: "vault", label: "Card Vault" }
];
const TARGETS = {
  "qr-atelier": [
    ["hero", "Header", ".qa-hero"],
    ["title", "Title artwork", ".qa-title"],
    ["frame", "QR display frame", ".qa-preview-stage"],
    ["ring", "Frame ornament", ".qa-ring"],
    ["code", "QR code", ".qa-code-shell"],
    ["preview-actions", "Frame buttons", ".qa-preview-actions"],
    ["finishes", "Finishes row", ".qa-finish-strip"],
    ["palettes", "Style choices", ".qa-palettes"],
    ["panel", "Editor panel", ".qa-panel"],
    ["inputs", "Editor fields", ".qa-inputs"],
    ["controls", "Save controls", ".qa-finish-controls"],
    ["collection", "Saved collection", ".qa-collection"]
  ],
  calculations: [
    ["hero", "Main header", ".rc-hero"],
    ["header-copy", "Header title", ".rc-desktop-hero-copy"],
    ["stage", "Rosie desk scene", ".rc-calculator-stage"],
    ["workspace", "Calculator workspace", ".rc-workspace"],
    ["tool-grid", "Calculator choices", ".rc-tool-grid"]
  ],
  resources: [
    ["header", "Resources header", ".rr-hub-header"],
    ["content", "Hub composition", ".rr-hub-content"],
    ["buttons", "Resource buttons", ".rr-hub-buttons"]
  ],
  recipes: [
    ["scene", "Kitchen scene", ".recipes-top-scene"],
    ["body", "Recipe content", ".recipes-body"],
    ["heading", "Page heading", ".recipes-heading"],
    ["crest", "Header crest", ".recipes-crest"],
    ["index", "Recipe index", ".recipes-index"],
    ["filters", "Meal filters", ".recipes-meal-filters"],
    ["grid", "Recipe cards", ".recipes-grid"]
  ],
  timekeeper: [
    ["scene", "Observatory scene", ".rtk-scene"],
    ["art", "Clock art stage", ".rtk-art-stage"],
    ["props", "Scene props", ".rtk-observatory-props"],
    ["gears", "Clock gears", ".rtk-exterior-gearwork"],
    ["clock", "Clock face", ".rtk-dial"],
    ["caption", "Clock caption", ".rtk-caption"],
    ["actions", "Clock action area", ".rtk-action-deck"],
    ["controls", "Clock controls", ".rtk-controls"],
    ["utility", "Timers and tools", ".rtk-utility"]
  ],
  reminders: [
    ["page", "Reminders content", ".rr-page"],
    ["hero", "Reminders heading", ".rr-hero"],
    ["calendar", "Calendar", ".rr-calendar"],
    ["list", "Reminders panel", ".rr-paper"]
  ],
  reviews: [
    ["page", "Reviews content", ".rosie-reviews"],
    ["header", "Review header", ".reviews-hero"],
    ["content", "Review workspace", ".reviews-content"],
    ["rail", "Review filters", ".reviews-rail"],
    ["grid", "Movie grid", ".reviews-film-grid"]
  ],
  home: [
    ["page", "Home scene", "[data-layout-target='home-page']"],
    ["header", "Home banner", "[data-layout-target='home-banner']"],
    ["hero", "Rosie landscape", "[data-layout-target='home-hero']"],
    ["destinations", "World buttons", "[data-layout-target='home-worlds']"]
  ],
  captain: [
    ["hero", "Captain heading", ".captain-hero"],
    ["banner", "Captain banner", ".captain-hero-banner"],
    ["game", "Yacht game", ".yacht-game-shell"],
    ["tunnel", "Tunnel game", ".ember-suite"],
    ["odyssey", "Cosmic Odyssey", "#cosmic-odyssey-arcade"]
  ],
  cheese: [
    ["header", "Exam header", ".cheese-exam-header"],
    ["board", "Cheese game board", ".cheese-game-frame"],
    ["left", "Left side panel", ".cheese-left-rail"],
    ["right", "Rosie examiner", ".cheese-examiner-rail"]
  ],
  fortune: [
    ["machine", "Fortune machine", ".fortune-console"],
    ["question", "Question form", ".question-card"],
    ["ticket", "Fortune ticket", ".fortune-ticket"]
  ],
  vault: [
    ["page", "Card Vault", ".vault-collector-page"],
    ["header", "Vault heading", ".vault-collector-header"],
    ["plaque", "Gold plaque", ".vault-collector-plaque"],
    ["gallery", "Card gallery", ".vault-collector-gallery"]
  ]
};
const DEVICES = {
  desktop: { width: 1440, label: "Desktop" },
  tablet: { width: 820, label: "iPad" },
  mobile: { width: 390, label: "iPhone" }
};

function normalizeTransform(raw) {
  const value = raw && typeof raw === "object" ? raw : {};
  const valid = (number, fallback, min, max) => {
    const n = Number(number);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  };
  return {
    x: valid(value.x, 0, -2500, 2500),
    y: valid(value.y, 0, -2500, 2500),
    scale: valid(value.scale, 1, 0.3, 3)
  };
}
function readDrafts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}
const keyFor = (page, device) => page + "/" + device;
const send = (target, kind, fields = {}) =>
  target?.postMessage({ source: "rosie-layout", kind, ...fields }, window.location.origin);

export default function LayoutPlayground() {
  const startPage = window.location.hash.slice(1);
  const [page, setPage] = useState(PAGES.some(item => item.id === startPage) ? startPage : "qr-atelier");
  const [device, setDevice] = useState("desktop");
  const [desktopWidth, setDesktopWidth] = useState(1440);
  const [drafts, setDrafts] = useState(readDrafts);
  const [selected, setSelected] = useState("");
  const [frameReady, setFrameReady] = useState(false);
  const [availableWidth, setAvailableWidth] = useState(900);
  const [notice, setNotice] = useState("");
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const uploadRef = useRef(null);
  const undoRef = useRef(null);
  const draftsRef = useRef(drafts);
  const currentKey = keyFor(page, device);
  const currentDraft = drafts[currentKey] || {};
  const parts = TARGETS[page] || [];
  const currentPart = normalizeTransform(currentDraft[selected]);
  const width = device === "desktop" ? desktopWidth : DEVICES[device].width;
  const zoom = Math.max(0.18, Math.min(1, (availableWidth - 28) / width));
  const height = Math.max(780, Math.round((window.innerHeight - 110) / zoom));

  useEffect(() => {
    draftsRef.current = drafts;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts)); }
    catch { setNotice("Local storage is unavailable. Export before leaving."); }
  }, [drafts]);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => setAvailableWidth(entries[0]?.contentRect.width || 900));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const configure = (values, id) => send(frameRef.current?.contentWindow, "configure", {
    values, selected: id
  });
  useEffect(() => {
    if (frameReady) configure(currentDraft, selected);
  }, [drafts, selected, frameReady, page, device]);

  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      const message = event.data;
      if (message?.source !== "rosie-layout") return;
      if (message.kind === "ready") {
        setFrameReady(true);
        configure(draftsRef.current[keyFor(page, device)] || {}, selected);
      } else if (message.kind === "select") {
        if (parts.some(part => part[0] === message.id)) setSelected(message.id);
      } else if (message.kind === "start") {
        undoRef.current = structuredClone(draftsRef.current);
      } else if (message.kind === "move" && parts.some(part => part[0] === message.id)) {
        setDrafts(previous => ({
          ...previous,
          [keyFor(page, device)]: {
            ...(previous[keyFor(page, device)] || {}),
            [message.id]: normalizeTransform(message.value)
          }
        }));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [page, device, selected]);

  useEffect(() => {
    function onKeyboard(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        if (document.activeElement?.matches("input, textarea")) return;
        event.preventDefault();
        undo();
      } else if (selected && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        if (document.activeElement?.matches("input, textarea, select")) return;
        event.preventDefault();
        const n = event.shiftKey ? 10 : 1;
        nudge(event.key === "ArrowLeft" ? -n : event.key === "ArrowRight" ? n : 0,
          event.key === "ArrowUp" ? -n : event.key === "ArrowDown" ? n : 0);
      }
    }
    window.addEventListener("keydown", onKeyboard);
    return () => window.removeEventListener("keydown", onKeyboard);
  });

  function switchPage(next) {
    if (!PAGES.some(item => item.id === next)) return;
    setPage(next);
    setSelected("");
    setFrameReady(false);
    window.history.replaceState(null, "", "?layout=1#" + next);
  }
  function switchDevice(next) {
    setDevice(next);
    setSelected("");
    setFrameReady(false);
  }
  function updatePart(patch) {
    if (!selected) return;
    undoRef.current = structuredClone(draftsRef.current);
    setDrafts(previous => ({
      ...previous,
      [currentKey]: {
        ...(previous[currentKey] || {}),
        [selected]: normalizeTransform({ ...currentPart, ...patch })
      }
    }));
  }
  function nudge(dx, dy) { updatePart({ x: currentPart.x + dx, y: currentPart.y + dy }); }
  function resetSelected() {
    if (!selected) return;
    undoRef.current = structuredClone(draftsRef.current);
    setDrafts(previous => {
      const revised = { ...(previous[currentKey] || {}) };
      delete revised[selected];
      return { ...previous, [currentKey]: revised };
    });
  }
  function resetDevice() {
    if (!window.confirm("Clear every adjustment for this page and device?")) return;
    undoRef.current = structuredClone(draftsRef.current);
    setDrafts(previous => {
      const revised = { ...previous };
      delete revised[currentKey];
      return revised;
    });
    setNotice("Draft adjustments cleared for this page and device.");
  }
  function undo() {
    if (!undoRef.current) return;
    const previous = undoRef.current;
    undoRef.current = null;
    setDrafts(previous);
    setNotice("Last change undone.");
  }
  function exportLayout() {
    const payload = {
      tool: "RosieVerse Layout Playground",
      version: 1,
      exportedAt: new Date().toISOString(),
      referenceWidths: { desktop: desktopWidth, tablet: 820, mobile: 390 },
      layouts: drafts
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "rosie-layout-playground.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    setNotice("Layout specification exported. Share the JSON file to apply the designs in code.");
  }
  async function importLayout(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.tool !== "RosieVerse Layout Playground" || parsed.version !== 1 || !parsed.layouts || typeof parsed.layouts !== "object") {
        throw Error("Not a RosieVerse layout export.");
      }
      const safe = {};
      for (const [key, values] of Object.entries(parsed.layouts)) {
        const [pageId, deviceId] = key.split("/");
        if (!PAGES.some(p => p.id === pageId) || !DEVICES[deviceId] || !values || typeof values !== "object") continue;
        safe[key] = {};
        for (const [id, value] of Object.entries(values)) {
          if ((TARGETS[pageId] || []).some(part => part[0] === id)) safe[key][id] = normalizeTransform(value);
        }
      }
      undoRef.current = structuredClone(draftsRef.current);
      setDrafts(safe);
      setNotice("Imported layouts into the draft editor.");
    } catch (error) { setNotice(error.message || "Could not import that file."); }
    if (uploadRef.current) uploadRef.current.value = "";
  }
  const showStatus = message => { setNotice(message); };

  return (
    <div className="lp-root">
      <header className="lp-topbar">
        <div>
          <b>ROSIEVERSE <span>LAYOUT PLAYGROUND</span></b>
          <small>Live page composition studio - edits are drafts, not published changes</small>
        </div>
        <div className="lp-top-actions">
          <button type="button" onClick={undo} disabled={!undoRef.current}>Undo</button>
          <button type="button" onClick={() => uploadRef.current?.click()}>Import</button>
          <button type="button" className="lp-gold" onClick={exportLayout}>Export layout</button>
          <a href="/#resources">Exit studio</a>
          <input ref={uploadRef} type="file" accept=".json,application/json" hidden onChange={event => importLayout(event.target.files?.[0])} />
        </div>
      </header>
      <div className="lp-workbench">
        <aside className="lp-sidebar">
          <label className="lp-label" htmlFor="lp-page">Page</label>
          <select id="lp-page" value={page} onChange={event => switchPage(event.target.value)}>
            {PAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <div className="lp-label">Preview size</div>
          <div className="lp-devices">
            {Object.entries(DEVICES).map(([id, item]) =>
              <button key={id} type="button" className={device === id ? "active" : ""} onClick={() => switchDevice(id)}>{item.label}</button>)}
          </div>
          {device === "desktop" && <label className="lp-width-label">Canvas width
            <input type="number" min="1024" max="1920" step="10" value={desktopWidth}
              onChange={event => setDesktopWidth(Math.max(1024, Math.min(1920, Number(event.target.value) || 1440)))} />
            <span>px</span>
          </label>}
          <div className="lp-section-head"><b>Movable elements</b><small>{parts.length} groups</small></div>
          <div className="lp-target-list">
            {parts.map(([id, label]) => {
              const part = currentDraft[id];
              return <button key={id} type="button" className={selected === id ? "lp-selected" : ""}
                onClick={() => setSelected(id)}><span>{label}</span>{part && <i aria-label="Adjusted element" />}</button>;
            })}
          </div>
          <div className="lp-inspector">
            <div className="lp-section-head"><b>{selected ? parts.find(item => item[0] === selected)?.[1] : "Select an element"}</b></div>
            {selected ? <>
              <p>Drag the highlighted element in the preview, or enter precise adjustments here.</p>
              <div className="lp-coordinates">
                {["x", "y"].map(axis => <label key={axis}>{axis.toUpperCase()} offset (px)
                  <input type="number" value={Math.round(currentPart[axis])} step="1"
                    onChange={event => updatePart({ [axis]: Number(event.target.value) || 0 })} />
                </label>)}
              </div>
              <label className="lp-scale">Size ({Math.round(currentPart.scale * 100)}%)
                <input type="range" min="50" max="160" step="1" value={Math.round(currentPart.scale * 100)}
                  onChange={event => updatePart({ scale: Number(event.target.value) / 100 })} />
              </label>
              <div className="lp-nudge">
                <button onClick={() => nudge(-1, 0)} title="Move 1 pixel left">←</button>
                <button onClick={() => nudge(0, -1)} title="Move 1 pixel up">↑</button>
                <button onClick={() => nudge(0, 1)} title="Move 1 pixel down">↓</button>
                <button onClick={() => nudge(1, 0)} title="Move 1 pixel right">→</button>
              </div>
              <button type="button" className="lp-reset" onClick={resetSelected}>Reset this element</button>
            </> : <p>Click an element in the page to grab it, or choose one from the list.</p>}
          </div>
          <button type="button" className="lp-reset-all" onClick={resetDevice}>Reset current page / device</button>
        </aside>
        <section className="lp-canvas-area" ref={canvasRef} aria-label="Live editable RosieVerse preview">
          <div className="lp-canvas-caption">
            <span className="lp-live-dot" /> {frameReady ? "Live preview" : "Loading preview"}
            <span>{width}px canvas · {Math.round(zoom * 100)}% viewing scale</span>
            <button type="button" onClick={() => frameRef.current?.contentWindow?.location.reload()}>Reload page</button>
          </div>
          <div className="lp-preview-viewport">
            <iframe
              ref={frameRef}
              key={page + "/" + device}
              title={"Editable " + page + " preview"}
              src={"/?layoutPreview=1#" + page}
              style={{ width: width + "px", height: height + "px", transform: "scale(" + zoom + ")" }}
              onLoad={() => configure(draftsRef.current[keyFor(page, device)] || {}, selected)}
            />
          </div>
        </section>
      </div>
      {notice && <div className="lp-notice" role="status" onClick={() => showStatus("")}>{notice} <span>×</span></div>}
    </div>
  );
}

export function LayoutPreviewBridge() {
  useEffect(() => {
    if (window.parent === window) return undefined;
    const page = window.location.hash.replace("#", "") || "home";
    const parts = TARGETS[page] || [];
    const active = {};
    let selected = "";
    let dragged = null;
    let raf = 0;
    const highlight = document.createElement("div");
    highlight.className = "lp-preview-highlight";
    const label = document.createElement("span");
    label.className = "lp-preview-label";
    highlight.appendChild(label);
    const style = document.createElement("style");
    style.textContent = ".lp-preview-highlight{position:fixed;z-index:2147483000;border:2px dashed #e0b35e;outline:1px solid #111;box-shadow:0 0 0 5000px transparent;pointer-events:none;display:none;box-sizing:border-box}.lp-preview-label{position:absolute;left:-2px;top:-27px;background:#11252a;color:#ffe5aa;font:600 12px system-ui,sans-serif;padding:5px 9px;white-space:nowrap;border-radius:5px}";
    document.head.appendChild(style);
    document.body.appendChild(highlight);
    const lookup = spec => document.querySelector(spec[2]);
    function drawHighlight() {
      const spec = parts.find(item => item[0] === selected);
      const element = spec && lookup(spec);
      if (!element) { highlight.style.display = "none"; return; }
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) { highlight.style.display = "none"; return; }
      highlight.style.display = "block";
      highlight.style.left = rect.left + "px";
      highlight.style.top = rect.top + "px";
      highlight.style.width = rect.width + "px";
      highlight.style.height = rect.height + "px";
      label.textContent = spec[1] + " · drag to move";
      label.style.top = rect.top < 29 ? "0" : "-27px";
    }
    function refresh() {
      for (const spec of parts) {
        const node = lookup(spec);
        if (!node) continue;
        const value = normalizeTransform(active[spec[0]]);
        node.style.translate = value.x + "px " + value.y + "px";
        node.style.scale = String(value.scale);
      }
      drawHighlight();
    }
    function scheduleRefresh() {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; refresh(); });
    }
    function partAt(target) {
      if (!(target instanceof Element)) return null;
      const choices = parts.map(spec => {
        const node = lookup(spec);
        return node && node.contains(target) ? { spec, node } : null;
      }).filter(Boolean);
      if (!choices.length) return null;
      choices.sort((a, b) => a.node.contains(b.node) ? 1 : b.node.contains(a.node) ? -1 : 0);
      return choices[0].spec;
    }
    function pointerDown(event) {
      if (event.button !== 0) return;
      const spec = partAt(event.target);
      if (!spec) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      selected = spec[0];
      const start = normalizeTransform(active[selected]);
      dragged = { id: selected, pointerId: event.pointerId, x: event.clientX, y: event.clientY, start };
      send(window.parent, "start");
      send(window.parent, "select", { id: selected });
      drawHighlight();
    }
    function pointerMove(event) {
      if (!dragged || event.pointerId !== dragged.pointerId) return;
      event.preventDefault();
      const value = normalizeTransform({
        ...dragged.start,
        x: Math.round(dragged.start.x + event.clientX - dragged.x),
        y: Math.round(dragged.start.y + event.clientY - dragged.y)
      });
      active[dragged.id] = value;
      refresh();
      send(window.parent, "move", { id: dragged.id, value });
    }
    function pointerUp(event) {
      if (!dragged || event.pointerId !== dragged.pointerId) return;
      dragged = null;
      send(window.parent, "complete");
    }
    function onMessage(event) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const message = event.data;
      if (message?.source !== "rosie-layout" || message.kind !== "configure") return;
      const values = message.values && typeof message.values === "object" ? message.values : {};
      for (const key of Object.keys(active)) delete active[key];
      for (const spec of parts) if (values[spec[0]]) active[spec[0]] = normalizeTransform(values[spec[0]]);
      selected = parts.some(spec => spec[0] === message.selected) ? message.selected : "";
      scheduleRefresh();
    }
    function onKeyboard(event) {
      if (!selected || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
      if (event.target?.matches?.("input, textarea, select")) return;
      event.preventDefault();
      const n = event.shiftKey ? 10 : 1;
      const current = normalizeTransform(active[selected]);
      send(window.parent, "start");
      const value = normalizeTransform({ ...current,
        x: current.x + (event.key === "ArrowLeft" ? -n : event.key === "ArrowRight" ? n : 0),
        y: current.y + (event.key === "ArrowUp" ? -n : event.key === "ArrowDown" ? n : 0)
      });
      active[selected] = value;
      refresh();
      send(window.parent, "move", { id: selected, value });
      send(window.parent, "complete");
    }
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.getElementById("root") || document.body, { subtree: true, childList: true });
    document.addEventListener("pointerdown", pointerDown, true);
    document.addEventListener("pointermove", pointerMove, true);
    document.addEventListener("pointerup", pointerUp, true);
    document.addEventListener("pointercancel", pointerUp, true);
    document.addEventListener("keydown", onKeyboard, true);
    window.addEventListener("message", onMessage);
    window.addEventListener("scroll", scheduleRefresh, true);
    window.addEventListener("resize", scheduleRefresh);
    scheduleRefresh();
    send(window.parent, "ready");
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", pointerDown, true);
      document.removeEventListener("pointermove", pointerMove, true);
      document.removeEventListener("pointerup", pointerUp, true);
      document.removeEventListener("pointercancel", pointerUp, true);
      document.removeEventListener("keydown", onKeyboard, true);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("scroll", scheduleRefresh, true);
      window.removeEventListener("resize", scheduleRefresh);
      highlight.remove();
      style.remove();
    };
  }, []);
  return null;
}
