import React, { useEffect, useReducer, useState } from "react";
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
  { id: "currency", title: "Currency Converter", detail: "Use your own exchange rate", mark: "¤" }
];
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
  currencyAmount: "100", currencyRate: "1", source: "USD", target: "EUR"
};
const n = (x) => Number(x);
const valid = (...values) => values.every((x) => x !== "" && Number.isFinite(Number(x)));
const fmt = (value, digits = 4) => Number.isFinite(value)
  ? new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(Number(value.toPrecision(12))) : "Invalid result";
const money = (value) => Number.isFinite(value) ? "$" + fmt(value, 2) : "Invalid result";
const dateUTC = (s) => Date.parse(s + "T00:00:00Z");
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

function toolOutput(id, v) {
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
    return { main: fmt(result, 8) + " " + v.unitTo, lines: [fmt(x) + " " + v.unitFrom + " equals"] };
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
    if (!valid(v.currencyAmount, v.currencyRate) || n(v.currencyRate) <= 0) return "Enter an amount and a positive exchange rate.";
    return { main: fmt(n(v.currencyAmount) * n(v.currencyRate), 4) + " " + v.target.toUpperCase(), lines: ["1 " + v.source.toUpperCase() + " = " + fmt(n(v.currencyRate), 6) + " " + v.target.toUpperCase(), "Manually supplied rate - not a live quote"] };
  }
  return "";
}

function NumberField({ label, value, onChange, min, step = "any", type = "number", size = "standard" }) {
  return <label className={"rc-field rc-field--" + (type === "date" ? "wide" : size)}><span>{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} min={min} step={type === "number" ? step : undefined} inputMode={type === "number" ? "decimal" : undefined} /></label>;
}
function Selection({ label, value, options, onChange, size = "wide" }) {
  return <label className={"rc-field rc-field--" + size}><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map(x => <option key={x.value || x} value={x.value || x}>{x.label || x}</option>)}</select></label>;
}

function ToolPanel({ active, values, update }) {
  const changed = (field) => (next) => update(field, next);
  const fields = {
    tip: <><NumberField label="Bill before tip ($)" value={values.bill} onChange={changed("bill")} min="0"/><NumberField label="Tip (%)" size="compact" value={values.tip} onChange={changed("tip")} min="0"/><NumberField label="People" size="compact" value={values.people} onChange={changed("people")} min="1" step="1"/></>,
    split: <><NumberField label="Subtotal ($)" value={values.splitAmount} onChange={changed("splitAmount")} min="0"/><NumberField label="Tax ($)" value={values.tax} onChange={changed("tax")} min="0"/><NumberField label="Tip on subtotal (%)" size="compact" value={values.tip} onChange={changed("tip")} min="0"/><NumberField label="People" size="compact" value={values.people} onChange={changed("people")} min="1" step="1"/></>,
    units: <><NumberField label="Amount" value={values.amount} onChange={changed("amount")}/><Selection label="Measurement" value={values.unitCategory} options={Object.keys(UNIT_SETS)} onChange={(v) => { const names=Object.keys(UNIT_SETS[v]);update("unitCategory",v);update("unitFrom",names[0]);update("unitTo",names[1]); }}/><Selection label="From" value={values.unitFrom} options={Object.keys(UNIT_SETS[values.unitCategory])} onChange={changed("unitFrom")}/><Selection label="To" value={values.unitTo} options={Object.keys(UNIT_SETS[values.unitCategory])} onChange={changed("unitTo")}/></>,
    date: <><NumberField label="Start date" type="date" value={values.start} onChange={changed("start")}/><NumberField label="End date" type="date" value={values.end} onChange={changed("end")}/><NumberField label="Days to add / subtract" size="compact" value={values.shift} onChange={changed("shift")} step="1"/></>,
    percent: <><NumberField label="Starting amount" value={values.base} onChange={changed("base")}/><NumberField label="Percent (%)" size="compact" value={values.percent} onChange={changed("percent")}/><Selection label="Calculation" value={values.percentMode} onChange={changed("percentMode")} options={[{value:"discount",label:"After discount"},{value:"increase",label:"After increase"},{value:"of",label:"Percent of amount"}]}/></>,
    loan: <><NumberField label="Principal ($)" value={values.principal} onChange={changed("principal")} min="0"/><NumberField label="Annual interest (%)" size="compact" value={values.annual} onChange={changed("annual")} min="0"/><NumberField label="Term (months)" size="compact" value={values.months} onChange={changed("months")} min="1" step="1"/></>,
    currency: <><NumberField label="Amount" value={values.currencyAmount} onChange={changed("currencyAmount")}/><NumberField label="Rate (units of target per 1 source)" size="wide" value={values.currencyRate} onChange={changed("currencyRate")} min="0"/><label className="rc-field"><span>From currency</span><input maxLength="8" value={values.source} onChange={e=>update("source",e.target.value)}/></label><label className="rc-field"><span>To currency</span><input maxLength="8" value={values.target} onChange={e=>update("target",e.target.value)}/></label></>
  };
  const output = toolOutput(active, values);
  return <section className={"rc-tool-panel rc-device rc-device--" + active} aria-label={TOOLS.find(t=>t.id===active)?.title}>
    <div className="rc-device-housing" aria-hidden="true"><img className="rc-device-original-art" src="/rosieverse/calculations/toolkit/gold-device.webp" alt="" decoding="async" draggable="false" /></div>
    <div className="rc-device-surface">
      <h2 className="rc-device-heading">{TOOLS.find(t=>t.id===active)?.title}</h2>
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
  const [values, setValues] = useState(DEFAULTS);
  const update = (field, value) => setValues(previous => ({ ...previous, [field]: value }));
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
  return <main className="rc-page">
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
      {tool && <ToolPanel active={tool} values={values} update={update}/>}
      <p className="rc-footer-note">Crafted in Rosie’s study · Numbers with a little extra charm</p>
    </div>
  </main>;
}
