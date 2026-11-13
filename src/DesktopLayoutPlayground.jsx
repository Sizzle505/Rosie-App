import React, { useEffect, useRef, useState } from "react";
import "./DesktopLayoutPlayground.css";

const PRESETS = {
  "qr-atelier": [
    ["Atelier sign", ".qa-title"], ["QR frame and actions", ".qa-preview-stage"],
    ["Creation panel", ".qa-panel"], ["Finish choices", ".qa-finish-strip"],
    ["Collection", ".qa-collection"],
  ],
  recipes: [
    ["Kitchen panorama", ".recipes-top-scene"], ["Cookbook title", ".recipes-heading"],
    ["Cookbook panel", ".recipes-index"], ["Meal filters", ".recipes-meal-filters"],
    ["Recipe search", ".recipes-inline-search"], ["Recipe cards", ".recipes-grid"],
  ],
  timekeeper: [
    ["Clock stage", ".rtk-art-stage"], ["Rosie and levers", ".rtk-observatory-props"],
    ["Gears", ".rtk-exterior-gearwork"], ["Clock dial", ".rtk-dial"],
    ["Clock controls", ".rtk-action-deck"], ["Information cabinet", ".rtk-utility"],
    ["Mode switch", ".rtk-mode-switch"],
  ],
  resources: [
    ["Resources crest", ".rr-hub-header"], ["All resource plaques", ".rr-hub-buttons"],
    ...["Reminders", "QR", "Calculations", "Recipes", "Reviews", "Timekeeper"].map((name, index) =>
      [name + " plaque", `.rr-hub-button:nth-child(${index + 1})`]),
  ],
  reviews: [
    ["Cinema header", ".reviews-hero"], ["Movie search", ".reviews-search"],
    ["Diary tabs", ".reviews-tabs"], ["Marquee", ".reviews-rail"],
    ["Recommendation", ".reviews-recommends"], ["Movie collection", ".reviews-collection"],
  ],
  cheese: [
    ["Exam left rail", ".cheese-left-rail"], ["Cheese cards", ".cheese-board"],
    ["Rosie examiner", ".cheese-right-rail"],
  ],
  randomizers: [
    ["Randomizer header", "[class*='hero']"], ["Quick randomizers", "[class*='ivoryRow']"],
    ["Decision wheel", "[class*='wheelSalon']"],
  ],
};

const storageKey = page => `rosie-desktop-layout-playground-v1:${page}`;
const round = value => Math.round(value * 10) / 10;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

function readPositions(page) {
  try { return JSON.parse(localStorage.getItem(storageKey(page)) || "{}"); }
  catch { return {}; }
}

function pathFor(element) {
  const segments = [];
  let node = element;
  while (node && node !== document.querySelector(".app-shell")) {
    const parent = node.parentElement;
    if (!parent) break;
    const siblings = [...parent.children].filter(child => child.tagName === node.tagName);
    segments.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(node) + 1})`);
    node = parent;
  }
  return ".app-shell > " + segments.join(" > ");
}

export default function DesktopLayoutPlayground({ page }) {
  const [desktop, setDesktop] = useState(() => matchMedia("(min-width: 1200px)").matches);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(false);
  const [selected, setSelected] = useState("");
  const [positions, setPositions] = useState(() => readPositions(page));
  const [custom, setCustom] = useState([]);
  const [notice, setNotice] = useState("");
  const originals = useRef(new Map());
  const drag = useRef(null);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const presets = PRESETS[page] || [];
  const items = [...presets, ...custom, ...Object.keys(positions)
    .filter(selector => ![...presets, ...custom].some(([, key]) => key === selector))
    .map(selector => ["Picked element", selector])];

  useEffect(() => {
    const media = matchMedia("(min-width: 1200px)");
    const onChange = () => setDesktop(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setPositions(readPositions(page));
    setSelected(""); setCustom([]); setOpen(false); setPick(false);
  }, [page]);

  useEffect(() => {
    try { localStorage.setItem(storageKey(page), JSON.stringify(positions)); }
    catch { setNotice("This browser could not save layout positions."); }
  }, [page, positions]);

  useEffect(() => {
    const shell = document.querySelector(".app-shell");
    if (!shell) return;
    shell.classList.toggle("layout-playground-active", desktop && open);
    const apply = () => {
      for (const [element, original] of originals.current) {
        if (!element.isConnected || !desktop || !items.some(([, selector]) => shell.querySelector(selector) === element)) {
          element.style.setProperty("translate", original.translate, original.translatePriority);
          element.style.setProperty("scale", original.scale, original.scalePriority);
          element.removeAttribute("data-layout-playground-key");
          element.removeAttribute("data-layout-selected");
          originals.current.delete(element);
        }
      }
      if (!desktop) return;
      for (const [, selector] of items) {
        const element = shell.querySelector(selector);
        if (!element) continue;
        const value = positions[selector];
        if (open || value) element.dataset.layoutPlaygroundKey = selector;
        else element.removeAttribute("data-layout-playground-key");
        if (open && selected === selector) element.dataset.layoutSelected = "true";
        else element.removeAttribute("data-layout-selected");
        if (value && !originals.current.has(element)) originals.current.set(element, {
          translate: element.style.getPropertyValue("translate"),
          translatePriority: element.style.getPropertyPriority("translate"),
          scale: element.style.getPropertyValue("scale"),
          scalePriority: element.style.getPropertyPriority("scale"),
        });
        if (value) {
          element.style.setProperty("translate", `${value.x || 0}px ${value.y || 0}px`, "important");
          element.style.setProperty("scale", String(value.scale || 1), "important");
        } else if (originals.current.has(element)) {
          const original = originals.current.get(element);
          element.style.setProperty("translate", original.translate, original.translatePriority);
          element.style.setProperty("scale", original.scale, original.scalePriority);
          originals.current.delete(element);
        }
      }
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(shell, { childList: true, subtree: true });
    return () => { observer.disconnect(); shell.classList.remove("layout-playground-active"); };
  }, [desktop, open, page, selected, positions, custom]);

  useEffect(() => {
    if (!open || !desktop) return;
    const onDown = event => {
      if (event.target.closest(".layout-playground-ui")) return;
      const shell = document.querySelector(".app-shell");
      if (!shell?.contains(event.target)) return;
      let element = event.target.closest("[data-layout-playground-key]");
      let selector = element?.dataset.layoutPlaygroundKey;
      if (pick) {
        element = event.target.closest("img, button, header, section, aside, article, nav, div");
        if (!element || element === shell || element.classList.contains("app-shell")) return;
        selector = pathFor(element);
        setCustom(list => list.some(([, key]) => key === selector) ? list : [...list, [element.getAttribute("aria-label") || element.className?.split?.(" ")?.[0] || element.tagName.toLowerCase(), selector]]);
        setPick(false);
      }
      if (!element || !selector) return;
      event.preventDefault(); event.stopPropagation();
      setSelected(selector);
      const start = positionsRef.current[selector] || { x: 0, y: 0, scale: 1 };
      drag.current = { selector, x: event.clientX, y: event.clientY, start };
      document.body.style.userSelect = "none";
    };
    const onMove = event => {
      if (!drag.current) return;
      const { selector, x, y, start } = drag.current;
      setPositions(current => ({ ...current, [selector]: {
        ...start, x: round(start.x + event.clientX - x), y: round(start.y + event.clientY - y),
      } }));
    };
    const onUp = () => { drag.current = null; document.body.style.userSelect = ""; };
    const onClick = event => {
      if (!event.target.closest(".layout-playground-ui") && event.target.closest(".app-shell")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
    window.addEventListener("click", onClick, true);
    return () => {
      onUp();
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      window.removeEventListener("click", onClick, true);
    };
  }, [desktop, open, pick]);

  if (!desktop || page === "home") return null;
  const current = positions[selected] || { x: 0, y: 0, scale: 1 };
  const update = patch => setPositions(old => ({ ...old, [selected]: { ...current, ...patch } }));
  const resetSelected = () => setPositions(old => {
    const next = { ...old }; delete next[selected]; return next;
  });
  const copy = async () => {
    const output = { page, viewport: `${innerWidth}×${innerHeight}`, positions };
    try { await navigator.clipboard.writeText(JSON.stringify(output, null, 2)); setNotice("Layout values copied."); }
    catch { setNotice("Clipboard unavailable. Use the values shown above."); }
  };

  return <div className="layout-playground-ui">
    <button type="button" className="layout-playground-toggle" aria-expanded={open}
      onClick={() => { setOpen(value => !value); setPick(false); }}>
      {open ? "Close layout playground" : "Arrange desktop layout"}
    </button>
    {open && <aside className="layout-playground-panel" aria-label="Desktop layout playground">
      <h2>Desktop layout playground</h2>
      <p>Drag an outlined piece. Changes stay in this browser for this page and apply only on desktop.</p>
      <label>Piece
        <select value={selected} onChange={event => setSelected(event.target.value)}>
          <option value="">Choose a piece</option>
          {items.map(([label, selector]) => <option key={selector} value={selector}>{label}</option>)}
        </select>
      </label>
      <button type="button" className={pick ? "is-picking" : ""} onClick={() => setPick(value => !value)}>
        {pick ? "Click any page element…" : "Pick another element"}
      </button>
      {selected && <>
        <div className="layout-playground-values">
          <label>Left / right <input type="number" value={current.x || 0} onChange={event => update({ x: Number(event.target.value) })} /></label>
          <label>Up / down <input type="number" value={current.y || 0} onChange={event => update({ y: Number(event.target.value) })} /></label>
          <label>Size % <input type="number" min="25" max="250" value={Math.round((current.scale || 1) * 100)}
            onChange={event => update({ scale: clamp(Number(event.target.value) / 100, .25, 2.5) })} /></label>
        </div>
        <button type="button" onClick={resetSelected}>Reset selected piece</button>
      </>}
      <div className="layout-playground-actions">
        <button type="button" onClick={copy}>Copy layout values</button>
        <button type="button" onClick={() => { setPositions({}); setSelected(""); }}>Reset this page</button>
      </div>
      {notice && <p role="status">{notice}</p>}
    </aside>}
  </div>;
}
