import React, { useEffect, useRef, useState } from "react";
import "./LayoutPlayground.css";

/*
 * Layout Playground is intentionally a non-publishing design tool.
 * Preview mode is available only through ?layoutPreview=1, and all edits
 * stay inside the iframe until the user exports a layout specification.
 */
const STORAGE_KEY = "rosieverse.layout-playground.drafts.v2";
const FOCUS_MODE = new URLSearchParams(window.location.search).get("focus") === "haiku-calculations";
const FOCUS_STORAGE_KEY = "rosieverse.layout-sandbox.haiku-calculations.v1";
const ACTIVE_STORAGE_KEY = FOCUS_MODE ? FOCUS_STORAGE_KEY : STORAGE_KEY;
const FOCUS_PAGE_IDS = new Set(["haiku", "calculations"]);
const FOCUS_QUERY = "?layout=1&focus=haiku-calculations";
const BASELINE_COMMIT = "05c69a2e585113496a96e09fd7ee3e733091b51a";
const DEVICE_HEIGHTS = { tablet: 1180, mobile: 844 };
const formatSize = (width, height) => Math.round(width) + " × " + Math.round(height);
const PAGES = [
  { id: "qr-atelier", label: "QR Atelier" },
  { id: "haiku", label: "Haiku Zen Garden" },
  { id: "calculations", label: "Calculations" },
  { id: "resources", label: "Resources Hub" },
  { id: "recipes", label: "Recipes" },
  { id: "timekeeper", label: "Timekeepers" },
  { id: "reminders", label: "Reminders" },
  { id: "reviews", label: "Reviews" },
  { id: "randomizers", label: "Randomizers" },
  { id: "home", label: "Home" },
  { id: "captain", label: "Captain" },
  { id: "cheese", label: "Cheese" },
  { id: "fortune", label: "Fortune" },
  { id: "vault", label: "Card Vault" }
];
const TARGETS = {
  haiku: [
    ["landscape", "Full-page garden background", ".haiku-page-landscape", "Scenery"],
    ["header", "Heading area", ".haiku-header", "Heading"],
    ["title", "Haiku Zen Garden title", ".haiku-heading h1", "Heading"],
    ["subtitle", "Page subtitle", ".haiku-heading p", "Heading"],
    ["back", "Back to RosieVerse", ".haiku-back", "Heading"],
    ["rosie", "Meditating Rosie", ".haiku-scene-rosie", "Rosie & garden"],
    ["scene-stage", "Rosie scene area", ".haiku-scene-image", "Rosie & garden"],
    ["scene-buttons", "Background button group", ".haiku-scene-selector", "Rosie & garden"],
    ["field", "Flower Field button", ".haiku-scene-selector button:nth-child(1)", "Rosie & garden"],
    ["zen-garden", "Zen Garden button", ".haiku-scene-selector button:nth-child(2)", "Rosie & garden"],
    ["temple", "Temple button", ".haiku-scene-selector button:nth-child(3)", "Rosie & garden"],
    ["scroll", "Poetry scroll artwork", ".haiku-scroll", "Poetry scroll"],
    ["verse", "Three-line haiku group", ".haiku-verse", "Poetry scroll"],
    ["line-one", "First haiku line", ".haiku-verse p:nth-child(1)", "Poetry scroll"],
    ["line-two", "Second haiku line", ".haiku-verse p:nth-child(2)", "Poetry scroll"],
    ["line-three", "Third haiku line", ".haiku-verse p:nth-child(3)", "Poetry scroll"],
    ["signature", "Rosie's signature", ".haiku-scroll-signature", "Poetry scroll"],
    ["meter", "5 · 7 · 5", ".haiku-metre", "Poetry scroll"],
    ["poem-actions", "Save, Share & Postcard", ".haiku-verse-actions", "Poetry controls"],
    ["save", "Save poem button", ".haiku-verse-actions button:nth-child(1)", "Poetry controls"],
    ["share", "Share verse button", ".haiku-verse-actions button:nth-child(2)", "Poetry controls"],
    ["postcard", "Postcard button", ".haiku-verse-actions button:nth-child(3)", "Poetry controls"],
    ["studio", "Daily / Compose / Meditate panel", ".haiku-workbench", "Activities"],
    ["tabs", "Activity tabs", ".haiku-tabs", "Activities"],
    ["panel", "Active activity content", ".haiku-workbench .haiku-panel, .haiku-workbench .zen-panel", "Activities"],
    ["panel-title", "Active activity heading", ".haiku-workbench .haiku-panel h2, .haiku-workbench .zen-panel h2", "Activities"],
    ["meditation-programs", "Meditation program buttons", ".zen-program-grid", "Meditation"],
    ["meditation-duration", "Session length controls", ".zen-options:nth-of-type(1)", "Meditation"],
    ["meditation-sound", "Garden sound controls", ".zen-options:nth-of-type(2)", "Meditation"],
    ["meditation-start", "Begin meditation button", ".zen-begin", "Meditation"],
    ["wisdom", "The Way of the Shiba section", ".haiku-shell > .haiku-scene-quote", "Wisdom footer"],
    ["wisdom-kicker", "The Way of the Shiba label", ".haiku-shell > .haiku-scene-quote .haiku-scene-quote-kicker", "Wisdom footer"],
    ["wisdom-quote", "Wisdom main line", ".haiku-shell > .haiku-scene-quote strong", "Wisdom footer"],
    ["wisdom-aside", "Wisdom smaller line", ".haiku-shell > .haiku-scene-quote small", "Wisdom footer"]
  ],
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
    ["hero", "Main header artwork", ".rc-hero", "Heading & desk"],
    ["header-copy", "Header title", ".rc-desktop-hero-copy", "Heading & desk"],
    ["stage", "Calculator stage", ".rc-calculator-stage", "Heading & desk"],
    ["calculator", "Calculator itself", ".rac-frame", "Heading & desk"],
    ["workspace", "Pocket Toolkit workspace", ".rc-workspace", "Pocket Toolkit"],
    ["toolkit-heading", "The Pocket Toolkit heading", ".rc-tools-heading", "Pocket Toolkit"],
    ["tool-grid", "All seven function buttons", ".rc-tool-grid", "Pocket Toolkit"],
    ["tip", "Tip Calculator button", ".rc-tool-card--tip", "Individual buttons"],
    ["units", "Unit Conversions button", ".rc-tool-card--units", "Individual buttons"],
    ["date", "Date Calculator button", ".rc-tool-card--date", "Individual buttons"],
    ["split", "Split Bill button", ".rc-tool-card--split", "Individual buttons"],
    ["percent", "Percentages & Discounts button", ".rc-tool-card--percent", "Individual buttons"],
    ["loan", "Loan & Interest button", ".rc-tool-card--loan", "Individual buttons"],
    ["currency", "Currency Converter button", ".rc-tool-card--currency", "Individual buttons"],
    ["tool-overlay", "Open gold instrument", ".rc-active-tool-overlay", "Active instrument"],
    ["tool-panel", "Instrument panel", ".rc-tool-panel.rc-device", "Active instrument"],
    ["tool-close", "Close instrument button", ".rc-active-tool-close", "Active instrument"],
    ["footer", "Calculator footer text", ".rc-footer-note", "Pocket Toolkit"]
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
  randomizers: [
    ["page", "Randomizers scene", "[data-layout-target='randomizers-page']"],
    ["header", "Velvet header", "[data-layout-target='randomizers-header']"],
    ["quick", "Coin & dice area", "[data-layout-target='randomizers-quick']"],
    ["coin", "Coin display", "[data-layout-target='randomizers-coin']"],
    ["dice", "Dice display", "[data-layout-target='randomizers-dice']"],
    ["wheel", "Roulette salon", "[data-layout-target='randomizers-wheel']"],
    ["wheel-stage", "Wheel stage", "[data-layout-target='randomizers-wheel-stage']"],
    ["editor", "Wheel options", "[data-layout-target='randomizers-editor']"],
    ["santa", "Secret Santa", "[data-layout-target='randomizers-santa']"]
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
    const saved = JSON.parse(localStorage.getItem(ACTIVE_STORAGE_KEY) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}
const keyFor = (page, device) => page + "/" + device;
const send = (target, kind, fields = {}) =>
  target?.postMessage({ source: "rosie-layout", kind, ...fields }, window.location.origin);

export default function LayoutPlayground() {
  const startPage = window.location.hash.slice(1);
  const pageOptions = FOCUS_MODE ? PAGES.filter(item => FOCUS_PAGE_IDS.has(item.id)) : PAGES;
  const [page, setPage] = useState(pageOptions.some(item => item.id === startPage) ? startPage : (FOCUS_MODE ? "haiku" : "qr-atelier"));
  const [device, setDevice] = useState("desktop");
  const [desktopWidth, setDesktopWidth] = useState(FOCUS_MODE ? 1792 : 1440);
  const [drafts, setDrafts] = useState(readDrafts);
  const [selected, setSelected] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [frameReady, setFrameReady] = useState(false);
  const [availableWidth, setAvailableWidth] = useState(900);
  const [notice, setNotice] = useState("");
  const [immersive, setImmersive] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [hudMinimized, setHudMinimized] = useState(false);
  const [editEnabled, setEditEnabled] = useState(true);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [screenSize, setScreenSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const rootRef = useRef(null);
  const fullscreenRef = useRef(false);
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const uploadRef = useRef(null);
  const undoRef = useRef(null);
  const draftsRef = useRef(drafts);
  const currentKey = keyFor(page, device);
  const currentDraft = drafts[currentKey] || {};
  const parts = TARGETS[page] || [];
  const filteredParts = parts.filter(part => (part[1]+" "+(part[3]||"")).toLowerCase().includes(targetFilter.toLowerCase()));
  const currentPart = normalizeTransform(currentDraft[selected]);
  // Immersive desktop mirrors the real browser fullscreen CSS viewport, not
  // a shrunken 1440px iframe. Tablet/phone maintain their native CSS widths.
  const width = immersive && device === "desktop" ? screenSize.width
    : device === "desktop" ? desktopWidth : DEVICES[device].width;
  const zoom = immersive && device === "desktop" ? 1
    : Math.max(0.18, Math.min(1, (availableWidth - (immersive ? 4 : 28)) / width));
  const height = immersive
    ? device === "desktop" ? screenSize.height : DEVICE_HEIGHTS[device]
    : Math.max(780, Math.round((screenSize.height - 110) / zoom));

  useEffect(() => {
    draftsRef.current = drafts;
    try { localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(drafts)); }
    catch { setNotice("Local storage is unavailable. Export before leaving."); }
  }, [drafts]);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => setAvailableWidth(entries[0]?.contentRect.width || 900));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    function onFullscreenChange() {
      update();
      if (document.fullscreenElement === rootRef.current) fullscreenRef.current = true;
      else if (fullscreenRef.current) {
        fullscreenRef.current = false;
        setImmersive(false);
        setInspectorOpen(false);
      }
    }
    window.addEventListener("resize", update);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const configure = (values, id) => send(frameRef.current?.contentWindow, "configure", {
    values, selected: id, editing: editEnabled
  });
  useEffect(() => {
    if (frameReady) configure(currentDraft, selected);
  }, [drafts, selected, frameReady, page, device, editEnabled]);

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
        setUndoAvailable(true);
      } else if (message.kind === "exit") {
        leaveImmersive();
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
    if (!pageOptions.some(item => item.id === next)) return;
    setPage(next);
    setSelected("");
    setTargetFilter("");
    setFrameReady(false);
    window.history.replaceState(null, "", (FOCUS_MODE ? FOCUS_QUERY : "?layout=1") + "#" + next);
  }
  function switchDevice(next) {
    setDevice(next);
    setSelected("");
    setFrameReady(false);
  }
  async function enterImmersive() {
    setImmersive(true);
    setInspectorOpen(false);
    setHudMinimized(false);
    setEditEnabled(true);
    try {
      if (rootRef.current?.requestFullscreen) await rootRef.current.requestFullscreen();
      else setNotice("Expanded editor is active. Your browser does not support native fullscreen here.");
    } catch {
      setNotice("Expanded editor is active. Browser fullscreen was blocked; the canvas still fills the tab.");
    }
    setScreenSize({ width: window.innerWidth, height: window.innerHeight });
  }
  async function leaveImmersive() {
    setImmersive(false);
    setInspectorOpen(false);
    setHudMinimized(false);
    if (document.fullscreenElement === rootRef.current) {
      try { await document.exitFullscreen(); } catch { /* fallback to tab-sized editing */ }
    }
    fullscreenRef.current = false;
    setScreenSize({ width: window.innerWidth, height: window.innerHeight });
  }
  function updatePart(patch) {
    if (!selected) return;
    undoRef.current = structuredClone(draftsRef.current);
    setUndoAvailable(true);
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
    setUndoAvailable(true);
    setDrafts(previous => {
      const revised = { ...(previous[currentKey] || {}) };
      delete revised[selected];
      return { ...previous, [currentKey]: revised };
    });
  }
  function resetDevice() {
    if (!window.confirm("Clear every adjustment for this page and device?")) return;
    undoRef.current = structuredClone(draftsRef.current);
    setUndoAvailable(true);
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
    setUndoAvailable(false);
    setDrafts(previous);
    setNotice("Last change undone.");
  }
  function exportLayout() {
    const payload = {
      tool: "RosieVerse Layout Playground",
      version: 2,
      exportedAt: new Date().toISOString(),
      referenceWidths: { desktop: immersive && device === "desktop" ? width : desktopWidth, tablet: 820, mobile: 390 },
      baselineCommit: FOCUS_MODE ? "c235fff601018443e1e465a7a7e6096cbb401560" : BASELINE_COMMIT,
      referenceViewport: { width, height, immersive, device },
      layouts: drafts
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = FOCUS_MODE ? "rosie-haiku-calculations-sandbox.json" : "rosie-layout-playground.json";
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
      if (parsed.tool !== "RosieVerse Layout Playground" || ![1, 2].includes(parsed.version) || !parsed.layouts || typeof parsed.layouts !== "object") {
        throw Error("Not a RosieVerse layout export.");
      }
      if (parsed.version === 1 && !window.confirm(
        "This was exported from an older Rosie App. Its offsets may duplicate layout changes already published. Import them anyway?"
      )) return;
      if (parsed.baselineCommit && parsed.baselineCommit !== (FOCUS_MODE ? "c235fff601018443e1e465a7a7e6096cbb401560" : BASELINE_COMMIT) &&
        !window.confirm("This layout was saved against a different version of Rosie App. Import anyway?")) return;
      const safe = {};
      for (const [key, values] of Object.entries(parsed.layouts)) {
        const [pageId, deviceId] = key.split("/");
        if (!pageOptions.some(p => p.id === pageId) || !DEVICES[deviceId] || !values || typeof values !== "object") continue;
        safe[key] = {};
        for (const [id, value] of Object.entries(values)) {
          if ((TARGETS[pageId] || []).some(part => part[0] === id)) safe[key][id] = normalizeTransform(value);
        }
      }
      undoRef.current = structuredClone(draftsRef.current);
      setUndoAvailable(true);
      setDrafts(safe);
      setNotice("Imported layouts into the draft editor.");
    } catch (error) { setNotice(error.message || "Could not import that file."); }
    if (uploadRef.current) uploadRef.current.value = "";
  }
  const showStatus = message => { setNotice(message); };

  return (
    <div className={"lp-root" + (immersive ? " lp-immersive" : "")} ref={rootRef}>
      <header className="lp-topbar">
        <div>
          <b>ROSIEVERSE <span>{FOCUS_MODE ? "HAIKU + CALCULATIONS SANDBOX" : "LAYOUT PLAYGROUND"}</span></b>
          <small>{FOCUS_MODE
            ? "Move, resize and fine-tune the live pages · automatically saved to this browser · never changes production"
            : "Current Rosie App · exact-screen preview · drafts only, never published automatically"}</small>
        </div>
        <div className="lp-top-actions">
          <button type="button" onClick={undo} disabled={!undoAvailable}>Undo</button>
          <button type="button" onClick={() => setEditEnabled(!editEnabled)}>
            {editEnabled ? "Interact with page" : "Arrange elements"}
          </button>
          <button type="button" className="lp-gold" onClick={enterImmersive} title="Edit on an actual fullscreen browser viewport">
            Fullscreen editing
          </button>
          <button type="button" onClick={() => uploadRef.current?.click()}>Import</button>
          <button type="button" className="lp-gold" onClick={exportLayout}>Export layout</button>
          <a href={FOCUS_MODE ? "/#haiku" : "/#resources"}>Exit studio</a>
          <input ref={uploadRef} type="file" accept=".json,application/json" hidden onChange={event => importLayout(event.target.files?.[0])} />
        </div>
      </header>
      <div className="lp-workbench">
        <aside className={"lp-sidebar" + (immersive ? " lp-floating-inspector" : "") + (immersive && !inspectorOpen ? " lp-inspector-hidden" : "")}>
          <label className="lp-label" htmlFor="lp-page">Page</label>
          {FOCUS_MODE && <div className="lp-sandbox-page-buttons" role="group" aria-label="Sandbox page">
            {pageOptions.map(item => <button type="button" key={item.id} aria-pressed={page === item.id}
              className={page === item.id ? "active" : ""} onClick={() => switchPage(item.id)}>{item.label}</button>)}
          </div>}
          <select id="lp-page" value={page} onChange={event => switchPage(event.target.value)}>
            {pageOptions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          {FOCUS_MODE && page === "haiku" && <div className="lp-activity-controls">
            <span className="lp-label">Preview a Haiku activity</span>
            <div role="group" aria-label="Haiku activity to preview">
              {["Daily", "Compose", "Meditate", "Journal"].map((name) =>
                <button type="button" key={name} onClick={() => send(frameRef.current?.contentWindow,
                  "activate", { target: name.toLowerCase() })}>{name}</button>)}
            </div>
          </div>}
          {FOCUS_MODE && page === "calculations" && <div className="lp-activity-controls">
            <span className="lp-label">Preview a calculator instrument</span>
            <select aria-label="Choose instrument to preview" defaultValue="tip"
              onChange={event => send(frameRef.current?.contentWindow, "activate", { target: event.target.value })}>
              {["tip", "units", "date", "split", "percent", "loan", "currency"].map(id =>
                <option key={id} value={id}>{({tip:"Tip Calculator",units:"Unit Conversions",date:"Date Calculator",
                  split:"Split Bill",percent:"Percentages & Discounts",loan:"Loan & Interest",
                  currency:"Currency Converter"})[id]}</option>)}
            </select>
          </div>}
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
          <div className="lp-section-head"><b>Movable elements</b><small>{parts.length} elements</small>{immersive &&
            <button type="button" className="lp-close-inspector" onClick={() => setInspectorOpen(false)}>Close ×</button>}</div>
          {FOCUS_MODE && <input className="lp-target-search" type="search" value={targetFilter}
            onChange={event => setTargetFilter(event.target.value)} placeholder="Find an element…" aria-label="Find an element" />}
          <div className="lp-target-list">
            {filteredParts.map(([id, label, selector, group], index) => {
              const part = currentDraft[id];
              return <React.Fragment key={id}>
                {FOCUS_MODE && group && filteredParts[index - 1]?.[3] !== group &&
                  <div className="lp-target-group">{group}</div>}
                <button type="button" className={selected === id ? "lp-selected" : ""}
                  onClick={() => setSelected(id)}><span>{label}</span>{part && <i aria-label="Adjusted element" />}</button>
              </React.Fragment>;
            })}
            {filteredParts.length === 0 && <p className="lp-no-targets">No elements match that search.</p>}
          </div>
          <div className="lp-inspector">
            <div className="lp-section-head"><b>{selected ? parts.find(item => item[0] === selected)?.[1] : "Select an element"}</b></div>
            {selected ? <>
              <p>Drag the highlighted element in the preview, or enter precise adjustments here.
                For elements on another activity, use the activity buttons above.</p>
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
          {FOCUS_MODE && <p className="lp-sandbox-help">Edits are private, autosaved and separated by page and device.
            Drag the highlighted box, use arrow keys to nudge 1px (Shift for 10px), and adjust the size slider.
            Export the JSON file to share the exact layout for implementation.</p>}
        </aside>
        <section className="lp-canvas-area" ref={canvasRef} aria-label="Live editable RosieVerse preview">
          <div className="lp-canvas-caption">
            <span className="lp-live-dot" /> {frameReady ? "Live preview" : "Loading preview"}
            <span>{formatSize(width, height)} CSS pixels · {Math.round(zoom * 100)}% viewing scale</span>
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
      {immersive && <div className={"lp-immersive-hud" + (hudMinimized ? " lp-hud-minimized" : "")}
        role="toolbar" aria-label="Fullscreen layout controls">
        {hudMinimized ? <button type="button" onClick={() => setHudMinimized(false)}>Show tools</button> : <>
        <strong>ROSIEVERSE <span>{FOCUS_MODE ? "HAIKU + CALCULATIONS" : "LAYOUT STUDIO"}</span></strong>
        <span className="lp-live-size">{formatSize(width, height)} · {Math.round(zoom * 100)}% view</span>
        <select aria-label="Page in fullscreen" value={page} onChange={event => switchPage(event.target.value)}>
          {pageOptions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select aria-label="Device in fullscreen" value={device} onChange={event => switchDevice(event.target.value)}>
          {Object.entries(DEVICES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
        </select>
        <button type="button" aria-pressed={editEnabled} onClick={() => setEditEnabled(value => !value)}>
          {editEnabled ? "Arrange: ON" : "Interact: ON"}
        </button>
        <button type="button" aria-expanded={inspectorOpen} onClick={() => setInspectorOpen(value => !value)}>
          {inspectorOpen ? "Hide controls" : "Elements & position"}
        </button>
        <button type="button" onClick={undo} disabled={!undoAvailable}>Undo</button>
        <button type="button" className="lp-gold" onClick={exportLayout}>Export JSON</button>
        <button type="button" onClick={() => { setInspectorOpen(false); setHudMinimized(true); }}>Hide tools</button>
        <button type="button" onClick={leaveImmersive}>Exit fullscreen</button>
        </>}
      </div>}
      {immersive && !hudMinimized && <p className="lp-immersive-tip">
        {editEnabled ? "Drag page elements directly. Use Elements & position for exact X/Y and scale." :
          "Live interaction mode: page controls work normally. Switch back to Arrange to move elements."}
      </p>}
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
    const originalStyles = new WeakMap();
    let selected = "";
    let editing = true;
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
      if (!editing) { highlight.style.display = "none"; return; }
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
    // Never overwrite existing CSS offsets with zero. The real app already
    // positions many objects via the translate/scale CSS longhands. The old
    // playground zeroed these out, so its supposed "baseline" was inaccurate.
    // Capture each element's actual computed geometry before editing, then
    // compose user movement on top; restore original inline styles on reset.
    function getOriginal(node) {
      let baseline = originalStyles.get(node);
      if (baseline) return baseline;
      const style = getComputedStyle(node);
      const movement = style.translate === "none" ? [] : style.translate.split(/\s+/);
      const size = style.scale === "none" ? [1] : style.scale.split(/\s+/).map(Number);
      baseline = {
        inlineTranslate: node.style.translate,
        inlineScale: node.style.scale,
        x: movement[0] || "0px",
        y: movement[1] || "0px",
        scales: size.every(Number.isFinite) ? size : [1]
      };
      originalStyles.set(node, baseline);
      return baseline;
    }
    const addOffset = (base, offset) => offset === 0 ? base
      : "calc(" + base + (offset > 0 ? " + " : " - ") + Math.abs(offset) + "px)";
    function refresh() {
      for (const spec of parts) {
        const node = lookup(spec);
        if (!node) continue;
        const baseline = getOriginal(node);
        const value = normalizeTransform(active[spec[0]]);
        const edited = active[spec[0]] &&
          (value.x !== 0 || value.y !== 0 || value.scale !== 1);
        if (!edited) {
          node.style.translate = baseline.inlineTranslate;
          node.style.scale = baseline.inlineScale;
        } else {
          node.style.translate = addOffset(baseline.x, value.x) + " " + addOffset(baseline.y, value.y);
          node.style.scale = baseline.scales.map(size => Number((size * value.scale).toFixed(6))).join(" ");
        }
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
      if (!editing || event.button !== 0) return;
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
      editing = message.editing !== false;
      if (!editing) dragged = null;
      scheduleRefresh();
    }
    function onKeyboard(event) {
      if (event.key === "Escape" && editing) {
        send(window.parent, "exit");
        return;
      }
      if (!editing || !selected || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
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
