import React, { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { calculatorReducer, initialCalculator, keyFromKeyboard } from "./calculationsEngine.js";
import AssetCalculator from "./AssetCalculator.jsx";
import "./RosieCalculations.css";
import "./RosieCalculationsDevice.css";

const TOOLS = [
  { id: "tip", title: "Tip Calculator", detail: "Tips, totals and per-person shares", mark: "♜" },
  { id: "units", title: "Unit Conversions", detail: "Length, weight, volume and more", mark: "↔" },
  { id: "date", title: "Date Calculator", detail: "Count days or move a date", mark: "▦" },
  { id: "split", title: "Split Bill", detail: "Divide a check fairly", mark: "♧" },
  { id: "percent", title: "Percentages & Discounts", detail: "Savings, increases and portions", mark: "%" },
  { id: "loan", title: "Loan & Interest", detail: "Payments and total interest", mark: "◈" },
  { id: "currency", title: "Currency Converter", detail: "Automatically updated reference rates", mark: "¤" }
];
const UNIT_DISPLAY = {
  m:"M",km:"Km",mi:"Mi",ft:"Ft",in:"In",cm:"Cm",yd:"Yd",
  kg:"Kg",g:"G",lb:"Lb",oz:"Oz",L:"L",mL:"mL",
  "US gal":"US Gal","US fl oz":"US Fl Oz","US cup":"US Cup",
  "sq m":"Sq M","sq ft":"Sq Ft",acre:"Acre",hectare:"Hectare",
  sec:"Sec",min:"Min",hr:"Hr",day:"Day",
  "°C":"°C","°F":"°F",K:"K"
};
const unitLabel = (key) => UNIT_DISPLAY[key] || key;
const UNIT_SETS = {
  Length: { m: 1, km: 1000, mi: 1609.344, ft: .3048, in: .0254, cm: .01, yd: .9144 },
  Weight: { kg: 1, g: .001, lb: .45359237, oz: .028349523125 },
  Volume: { L: 1, mL: .001, "US gal": 3.785411784, "US fl oz": .0295735295625, "US cup": .2365882365 },
  Area: { "sq m": 1, "sq ft": .09290304, acre: 4046.8564224, hectare: 10000 },
  Time: { sec: 1, min: 60, hr: 3600, day: 86400 },
  Temperature: { "°C": 1, "°F": 1, K: 1 }
};
const DEFAULTS = {
  bill: "100", tip: "18", people: "2", splitAmount: "100", tax: "0",
  amount: "1", unitCategory: "Length", unitFrom: "m", unitTo: "ft",
  start: new Date().toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10), shift: "30",
  base: "200", percent: "15", percentMode: "discount",
  principal: "10000", annual: "6", months: "36",
  currencyAmount: "100", source: "USD", target: "EUR"
};
const n = (x) => Number(x);
const valid = (...values) => values.every((x) => x !== "" && Number.isFinite(Number(x)));
const fmt = (value, digits = 4) => Number.isFinite(value)
  ? new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(Number(value.toPrecision(12))) : "Invalid result";
const money = (value) => Number.isFinite(value)
  ? new Intl.NumberFormat("en-US", { style:"currency", currency:"USD",
      minimumFractionDigits:2, maximumFractionDigits:2 }).format(value)
  : "Invalid result";
const dateUTC = (s) => Date.parse(s + "T00:00:00Z");
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

/* Frankfurter v2 blends current published central-bank reference rates.
   These are dated reference rates, not guaranteed real-time bank quotes. */
const FX_API = "https://api.frankfurter.dev/v2";
const FX_REFRESH_MS = 4 * 60 * 60 * 1000;
const FX_FALLBACK_CURRENCIES = [
  ["AUD","Australian Dollar"],["CAD","Canadian Dollar"],["CHF","Swiss Franc"],
  ["CNY","Chinese Yuan"],["EUR","Euro"],["GBP","British Pound"],
  ["HKD","Hong Kong Dollar"],["INR","Indian Rupee"],["JPY","Japanese Yen"],
  ["MXN","Mexican Peso"],["NZD","New Zealand Dollar"],["SGD","Singapore Dollar"],
  ["USD","United States Dollar"],["ZAR","South African Rand"]
].map(([value,name]) => ({value, label: value === "USD" ? "United States $" : value + " · " + name}))
  .sort((a,b)=>a.value==="USD" ? -1 : b.value==="USD" ? 1 : a.label.localeCompare(b.label));
const fxCacheKey = (base, quote) => "rosie.fx.v2." + base + "." + quote;
function cachedFxRate(base, quote) {
  try {
    const record = JSON.parse(localStorage.getItem(fxCacheKey(base, quote)) || "null");
    if (record?.base === base && record?.quote === quote &&
        Number.isFinite(record.rate) && record.rate > 0 &&
        /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
        Number.isFinite(record.fetchedAt) &&
        Date.now() - record.fetchedAt < 7 * 86400000) return record;
  } catch { /* Storage can be disabled in private browsing. */ }
  return null;
}

function toolOutput(id, v, fxRate, fxState) {
  if (id === "tip" || id === "split") {
    const bill = id === "tip" ? n(v.bill) : n(v.splitAmount);
    if (!valid(id === "tip" ? v.bill : v.splitAmount, v.tip, v.people) || bill < 0 || n(v.tip) < 0 || n(v.people) < 1) return "Enter a nonnegative bill and at least one person.";
    const tax = id === "split" ? n(v.tax) : 0;
    if (!Number.isFinite(tax) || tax < 0) return "Enter a valid tax amount.";
    const tip = bill * n(v.tip) / 100;
    const total = bill + tax + tip;
    return { main: money(total / Math.floor(n(v.people))) + " per person", lines: ["Tip: " + money(tip), "Total: " + money(total), "People: " + Math.floor(n(v.people))] };
  }
  if (id === "units") {
    if (!valid(v.amount)) return "Enter a number.";
    const x = n(v.amount);
    let result;
    if (v.unitCategory === "Temperature") {
      const c = v.unitFrom === "°F" ? (x - 32) * 5 / 9 : v.unitFrom === "K" ? x - 273.15 : x;
      result = v.unitTo === "°F" ? c * 9 / 5 + 32 : v.unitTo === "K" ? c + 273.15 : c;
    } else {
      const group = UNIT_SETS[v.unitCategory];
      result = x * group[v.unitFrom] / group[v.unitTo];
    }
    return { main: fmt(result, 8) + " " + unitLabel(v.unitTo),
      lines: [fmt(x) + " " + unitLabel(v.unitFrom) + " equals"] };
  }
  if (id === "date") {
    const start = dateUTC(v.start);
    const end = dateUTC(v.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !valid(v.shift)) return "Choose dates and enter an offset.";
    const diff = Math.round((end - start) / 86400000);
    return { main: Math.abs(diff) + " days apart", lines: ["From " + v.start + " to " + v.end, "Start " + (n(v.shift) >= 0 ? "+" : "") + fmt(n(v.shift)) + " days → " + iso(start + Math.round(n(v.shift)) * 86400000)] };
  }
  if (id === "percent") {
    if (!valid(v.base, v.percent)) return "Enter an amount and a percentage.";
    const base = n(v.base), rate = n(v.percent) / 100;
    const amount = base * rate;
    const output = v.percentMode === "discount" ? base - amount : v.percentMode === "increase" ? base + amount : amount;
    return { main: fmt(output, 2), lines: [v.percentMode === "discount" ? "Savings: " + fmt(amount, 2) : v.percentMode === "increase" ? "Increase: " + fmt(amount, 2) : fmt(v.percent) + "% of " + fmt(base)] };
  }
  if (id === "loan") {
    if (!valid(v.principal, v.annual, v.months) || n(v.principal) < 0 || n(v.annual) < 0 || n(v.months) < 1) return "Enter a principal, nonnegative rate and term.";
    const periods = Math.floor(n(v.months));
    const rate = n(v.annual) / 1200;
    const monthly = rate === 0 ? n(v.principal) / periods : n(v.principal) * rate / (1 - Math.pow(1 + rate, -periods));
    return { main: money(monthly) + " / month", lines: ["Total interest: " + money(monthly * periods - n(v.principal)), "Total paid: " + money(monthly * periods)] };
  }
  if (id === "currency") {
    if (!valid(v.currencyAmount)) return "Enter a valid amount to convert.";
    const base = v.source.toUpperCase(), quote = v.target.toUpperCase();
    const currentPair = fxRate?.base === base && fxRate?.quote === quote &&
      Number.isFinite(fxRate.rate) && fxRate.rate > 0;
    if (!currentPair) return fxState === "error"
      ? "Exchange rate unavailable. Connect to the internet and reopen Currency Converter."
      : "Fetching the latest published exchange rate…";
    const note = fxState === "live" ? "Reference rate · " + fxRate.date + " · Frankfurter"
      : fxState === "same" ? "Same currency · 1:1 conversion"
      : fxState === "error" ? "Offline cached rate from " + fxRate.date + " · may be outdated"
      : "Cached rate from " + fxRate.date + " · checking for updates";
    return { main: fmt(n(v.currencyAmount) * fxRate.rate, 4) + " " + quote,
      lines: ["1 " + base + " = " + fmt(fxRate.rate, 8) + " " + quote, note] };
  }
  return "";
}

function NumberField({ label, value, onChange, min, step = "any", type = "number", size = "standard", dollars = false }) {
  const [editingMoney, setEditingMoney] = useState(false);
  const formatted = dollars && !editingMoney && value !== "" && Number.isFinite(Number(value))
    ? money(Number(value)) : value;
  return <label className={"rc-field rc-field--" + (type === "date" ? "wide" : size)}>
    <span>{label}</span>
    <input type={dollars ? "text" : type} value={formatted}
      onFocus={dollars ? e => e.currentTarget.select() : undefined}
      onChange={e => {
        if (dollars) setEditingMoney(true);
        onChange(dollars ? e.target.value.replace(/[$,\s]/g, "").replace(/,/g, "") : e.target.value);
      }}
      onBlur={dollars ? e => {
        const raw = e.target.value.replace(/[$,\s]/g, "").replace(/,/g, "");
        if (raw !== "" && Number.isFinite(Number(raw))) onChange(Number(raw).toFixed(2));
        setEditingMoney(false);
      } : undefined}
      min={dollars ? undefined : min}
      step={!dollars && type === "number" ? step : undefined}
      inputMode={dollars || type === "number" ? "decimal" : undefined}
      autoComplete="off"
    />
  </label>;
}
function Selection({ label, value, options, onChange, size = "wide" }) {
  return <label className={"rc-field rc-field--" + size}><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map(x => <option key={x.value || x} value={x.value || x}>{x.label || x}</option>)}</select></label>;
}

function ToolPanel({ active, values, update, currencyOptions, fxRate, fxState, onSelectTool, panelRef }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const changed = (field) => (next) => update(field, next);
  useEffect(() => setMenuOpen(false), [active]);
  const fields = {
    tip: <><NumberField label="Bill before tip ($)" dollars value={values.bill} onChange={changed("bill")} min="0"/><NumberField label="Tip (%)" size="compact" value={values.tip} onChange={changed("tip")} min="0"/><NumberField label="People" size="compact" value={values.people} onChange={changed("people")} min="1" step="1"/></>,
    split: <><NumberField label="Subtotal ($)" dollars value={values.splitAmount} onChange={changed("splitAmount")} min="0"/><NumberField label="Tax ($)" dollars value={values.tax} onChange={changed("tax")} min="0"/><NumberField label="Tip on subtotal (%)" size="compact" value={values.tip} onChange={changed("tip")} min="0"/><NumberField label="People" size="compact" value={values.people} onChange={changed("people")} min="1" step="1"/></>,
    units: <><NumberField label="Amount" value={values.amount} onChange={changed("amount")}/><Selection label="Measurement" size="standard" value={values.unitCategory} options={Object.keys(UNIT_SETS)} onChange={(v) => { const names=Object.keys(UNIT_SETS[v]);update("unitCategory",v);update("unitFrom",names[0]);update("unitTo",names[1]); }}/><Selection label="From" value={values.unitFrom} options={Object.keys(UNIT_SETS[values.unitCategory]).map(value=>({value,label:unitLabel(value)}))} onChange={changed("unitFrom")}/><Selection label="To" value={values.unitTo} options={Object.keys(UNIT_SETS[values.unitCategory]).map(value=>({value,label:unitLabel(value)}))} onChange={changed("unitTo")}/></>,
    date: <><NumberField label="Start date" type="date" value={values.start} onChange={changed("start")}/><NumberField label="End date" type="date" value={values.end} onChange={changed("end")}/><NumberField label="Days to add / subtract" size="compact" value={values.shift} onChange={changed("shift")} step="1"/></>,
    percent: <><NumberField label="Starting amount" dollars value={values.base} onChange={changed("base")}/><NumberField label="Percent (%)" size="compact" value={values.percent} onChange={changed("percent")}/><Selection label="Calculation" size="standard" value={values.percentMode} onChange={changed("percentMode")} options={[{value:"discount",label:"After discount"},{value:"increase",label:"After increase"},{value:"of",label:"Percent of amount"}]}/></>,
    loan: <><NumberField label="Principal ($)" dollars value={values.principal} onChange={changed("principal")} min="0"/><NumberField label="Annual interest (%)" size="compact" value={values.annual} onChange={changed("annual")} min="0"/><NumberField label="Term (months)" size="compact" value={values.months} onChange={changed("months")} min="1" step="1"/></>,
    currency: <><NumberField label="Amount" dollars={values.source === "USD"} value={values.currencyAmount} onChange={changed("currencyAmount")}/><Selection label="From currency" value={values.source} onChange={changed("source")} options={currencyOptions}/><Selection label="To currency" value={values.target} onChange={changed("target")} options={currencyOptions}/></>
  };
  const output = toolOutput(active, values, fxRate, fxState);
  return <section ref={panelRef} className={"rc-tool-panel rc-device rc-device--" + active} aria-label={TOOLS.find(t=>t.id===active)?.title}>
    <div className="rc-device-housing" aria-hidden="true">
      <img className="rc-device-original-art" src="/rosieverse/calculations/toolkit/gold-device.webp" alt="" decoding="async" draggable="false" />
      <i className="rc-device-gleam rc-device-gleam--tl"/><i className="rc-device-gleam rc-device-gleam--tr"/>
      <i className="rc-device-gleam rc-device-gleam--br"/><i className="rc-device-gleam rc-device-gleam--bl"/>
    </div>
    <div className="rc-device-surface">
      <div className="rc-device-title-wrap" onKeyDown={event => { if (event.key === "Escape") setMenuOpen(false); }}>
        <h2 className="rc-device-heading">
          <button type="button" className="rc-device-title-trigger" aria-haspopup="menu" aria-expanded={menuOpen}
            aria-label={"Switch calculator tool: " + TOOLS.find(t=>t.id===active)?.title}
            onClick={() => setMenuOpen(previous => !previous)}>
            <span>{TOOLS.find(t=>t.id===active)?.title}</span>
            <span className={"rc-device-title-chevron" + (menuOpen ? " is-open" : "")} aria-hidden="true" />
          </button>
        </h2>
        {menuOpen && <div className="rc-device-tool-menu" role="menu" aria-label="Choose another calculator tool">
          {TOOLS.filter(item => item.id !== active).map(item =>
            <button type="button" role="menuitem" key={item.id}
              onClick={() => { setMenuOpen(false); onSelectTool(item.id); }}>{item.title}</button>)}
        </div>}
      </div>
      <div className="rc-form-grid">{fields[active]}</div>
      <div className="rc-tool-result" aria-live="polite">
        {typeof output === "string" ? <p>{output}</p> : <><strong>{output.main}</strong>{output.lines.map((line, i)=><span key={i}>{line}</span>)}</>}
      </div>
    </div>
  </section>;
}

export default function RosieCalculations() {
  const [calc, send] = useReducer(calculatorReducer, initialCalculator);
  const [tool, setTool] = useState(null);
  const toolRef = useRef(null);
  const toolStageRef = useRef(null);
  const scrollToolkitBottomRef = useRef(false);
  const [toolScale, setToolScale] = useState(1);
  const [values, setValues] = useState(DEFAULTS);
  const [currencyOptions, setCurrencyOptions] = useState(FX_FALLBACK_CURRENCIES);
  const [fxRate, setFxRate] = useState(null);
  const [fxState, setFxState] = useState("loading");
  const update = (field, value) => setValues(previous => ({ ...previous, [field]: value }));
  useLayoutEffect(() => {
    if (tool || !scrollToolkitBottomRef.current) return undefined;
    scrollToolkitBottomRef.current = false;
    const scrollToBottom = () => {
      const root = document.scrollingElement || document.documentElement;
      window.scrollTo({top:Math.max(0, root.scrollHeight-window.innerHeight), behavior:"instant"});
    };
    const frame = requestAnimationFrame(scrollToBottom);
    const settle = window.setTimeout(scrollToBottom, 140);
    return () => {cancelAnimationFrame(frame);window.clearTimeout(settle);};
  }, [tool]);
  // A dedicated iPhone tool stage covers the page header. Scale the WHOLE
  // approved one-piece gold frame (not its contents independently) to fit
  // inside the actual phone viewport above the persistent bottom navigation.
  useLayoutEffect(() => {
    if (!tool) return undefined;
    let active = true;
    let pending = 0;
    const fitInstrument = () => {
      if (!active || !toolStageRef.current || !toolRef.current) return;
      if (window.matchMedia("(min-width: 740px)").matches) {
        setToolScale(1);
        return;
      }
      const stage = toolStageRef.current.getBoundingClientRect();
      const panel = toolRef.current;
      const naturalHeight = panel.offsetHeight;
      const naturalWidth = panel.offsetWidth;
      if (!naturalHeight || !naturalWidth) return;
      const scale = Math.max(.48, Math.min(1, (stage.height - 14) / naturalHeight,
        (stage.width - 14) / naturalWidth));
      setToolScale(prev => Math.abs(prev - scale) > .004 ? scale : prev);
    };
    const resize = new ResizeObserver(fitInstrument);
    if (toolRef.current) resize.observe(toolRef.current);
    if (toolStageRef.current) resize.observe(toolStageRef.current);
    pending = requestAnimationFrame(fitInstrument);
    const settle = window.setTimeout(fitInstrument, 160);
    const late = window.setTimeout(fitInstrument, 350);
    window.addEventListener("resize", fitInstrument);
    window.visualViewport?.addEventListener("resize", fitInstrument);
    return () => {
      active = false;
      cancelAnimationFrame(pending);
      clearTimeout(settle);
      clearTimeout(late);
      resize.disconnect();
      window.removeEventListener("resize", fitInstrument);
      window.visualViewport?.removeEventListener("resize", fitInstrument);
    };
  }, [tool]);
  // The dropdown list refreshes from the provider each time the tool opens.

  useEffect(() => {
    if (tool !== "currency") return undefined;
    const controller = new AbortController();
    fetch(FX_API + "/currencies", {signal:controller.signal})
      .then(response => {if(!response.ok) throw new Error("Currency list unavailable");return response.json();})
      .then(rows => {
        if(!Array.isArray(rows)) throw new Error("Invalid currency list");
        const options = rows.filter(row => /^[A-Z]{3}$/.test(row.iso_code || ""))
          .map(row => ({value:row.iso_code,
            label:row.iso_code === "USD" ? "United States $" :
              row.iso_code + " · " + (row.name || row.iso_code)}))
          .sort((a,b) => a.value==="USD" ? -1 : b.value==="USD" ? 1 :
            a.label.localeCompare(b.label));
        if(options.length) setCurrencyOptions(options);
      }).catch(() => { /* Keep accessible major-currency dropdowns offline. */ });
    return () => controller.abort();
  }, [tool]);
  // Refresh on opening, pair changes, four-hour intervals, and after the app
  // returns to the foreground. Never silently substitute yesterday's rate.
  useEffect(() => {
    if (tool !== "currency") return undefined;
    const base = values.source.toUpperCase(), quote = values.target.toUpperCase();
    if (base === quote) {
      setFxRate({base, quote, rate:1, date:iso(Date.now()), fetchedAt:Date.now()});
      setFxState("same");
      return undefined;
    }
    let alive = true, inFlight = null, lastAttempt = 0;
    const cached = cachedFxRate(base, quote);
    setFxRate(cached);
    setFxState("loading");
    const refresh = async () => {
      if(!alive) return;
      if(inFlight) inFlight.abort();
      const controller = new AbortController();
      inFlight = controller;
      lastAttempt = Date.now();
      try {
        const response = await fetch(FX_API + "/rate/" + encodeURIComponent(base.toLowerCase()) +
          "/" + encodeURIComponent(quote.toLowerCase()), {signal:controller.signal,cache:"no-store"});
        if(!response.ok) throw new Error("Rate provider returned " + response.status);
        const data = await response.json();
        const rate = Number(data.rate);
        if(!Number.isFinite(rate) || rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data.date))
          throw new Error("Invalid exchange-rate response");
        if(!alive || controller.signal.aborted) return;
        const current = {base, quote, rate, date:data.date, fetchedAt:Date.now()};
        setFxRate(current); setFxState("live");
        try {localStorage.setItem(fxCacheKey(base, quote), JSON.stringify(current));} catch {}
      } catch (error) {
        if(!alive || controller.signal.aborted) return;
        setFxState("error");
      } finally {
        if(inFlight === controller) inFlight = null;
      }
    };
    const foregroundRefresh = () => {
      if(document.visibilityState === "visible" &&
          Date.now() - lastAttempt > 30 * 60 * 1000) refresh();
    };
    refresh();
    const timer = window.setInterval(refresh, FX_REFRESH_MS);
    window.addEventListener("focus", foregroundRefresh);
    document.addEventListener("visibilitychange", foregroundRefresh);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", foregroundRefresh);
      document.removeEventListener("visibilitychange", foregroundRefresh);
      inFlight?.abort();
    };
  }, [tool, values.source, values.target]);
  useEffect(() => {
    const onKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey ||
          event.target?.closest?.("input,textarea,select,[contenteditable=true]")) return;
      const mapped = keyFromKeyboard(event);
      if (mapped) { event.preventDefault(); send(mapped); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool]);
  return <main className={"rc-page" + (tool ? " rc-page--tool-open" : "")}>
    <header className="rc-hero">
      <img
        className="rc-custom-hero"
        src="/rosieverse/calculations/hero/hero-full-resolution.webp"
        alt="Rosie at her mathematical desk in the library"
        decoding="async"
        fetchPriority="high"
      />
    </header>
    <div className="rc-calculator-stage">
      <AssetCalculator calc={calc} send={send} />
    </div>
    <div className="rc-workspace">
      <h2 className="rc-tools-heading"><span>✦</span> The Pocket Toolkit <span>✦</span></h2>
      <div className="rc-tool-grid">{TOOLS.map(item=><button type="button" key={item.id} className={"rc-tool-card rc-tool-card--"+item.id+(tool===item.id?" active":"")} aria-label={item.title} aria-pressed={tool===item.id} onClick={()=>setTool(previous=>previous===item.id?null:item.id)}><img className="rc-tool-art" src={"/rosieverse/calculations/toolkit/button-"+item.id+".webp"} alt="" loading="lazy" draggable="false"/></button>)}</div>
      {tool && <div className="rc-active-tool-overlay" aria-label="Gold calculator instrument">
        <div className="rc-active-tool-viewport" ref={toolStageRef}>
          <div className="rc-active-tool-fit" style={{ "--rc-tool-scale": toolScale }}>
            <ToolPanel active={tool} values={values} update={update} currencyOptions={currencyOptions} fxRate={fxRate} fxState={fxState} onSelectTool={setTool} panelRef={toolRef}/>
          </div>
        </div>
        <button type="button" className="rc-active-tool-close" onClick={() => { scrollToolkitBottomRef.current = true; setTool(null); setToolScale(1); }}
          aria-label="Close gold tool and return to calculator choices">
          <span aria-hidden="true">×</span><span>Tools</span>
        </button>
      </div>}
      <p className="rc-footer-note">Crafted in Rosie’s study · Numbers with a little extra charm</p>
    </div>
  </main>;
}
