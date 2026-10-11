import React from "react";
import { formatCalculatorEntry } from "./calculationsEngine.js";
import "./AssetCalculator.css";

/**
 * Fully clickable, asset-backed calculator skin.
 * Props use the EXISTING calculator reducer; never replace the arithmetic engine.
 * Place this file under src/ next to calculationsEngine.js.
 */
const MEMORY_KEYS = ["MC", "MR", "M+", "M−", "%", "±", "÷"];
const NUMERIC_ROWS = [
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="]
];

const OPERATOR_KEYS = new Set(["%", "±", "÷", "×", "−", "+"]);
const LABELS = {
  "MC": "Memory clear", "MR": "Memory recall", "M+": "Add to memory",
  "M−": "Subtract from memory", "%": "Percent", "±": "Change sign",
  "÷": "Divide", "×": "Multiply", "−": "Subtract", "+": "Add",
  ".": "Decimal point", "=": "Equals"
};

function Key({ value, send, small = false, wide = false, disabled = false }) {
  const variant = value === "=" ? "gold" : OPERATOR_KEYS.has(value) ? "crimson" : small ? "small" : "dark";
  return (
    <button
      type="button"
      className={`rac-key rac-key--${variant}${wide ? " rac-key--wide" : ""}${small ? " rac-key--memory" : ""}`}
      aria-label={LABELS[value] || value}
      onClick={() => send(value)}
      disabled={disabled}
    >
      <span>{value}</span>
    </button>
  );
}

export default function AssetCalculator({ calc, send }) {
  const entry = formatCalculatorEntry(calc.entry);
  const readoutClass = entry.length > 17 ? "rac-readout--long" : entry.length > 11 ? "rac-readout--medium" : "";
  return (
    <section className="rac-frame" aria-label="Rosie's calculator" role="group">
      <div className="rac-display" aria-label="Calculator display">
        <span className="rac-memory-indicator" aria-label={calc.hasMemory ? "Memory stored" : "Memory empty"}>
          {calc.hasMemory ? "M" : ""}
        </span>
        <div className={`rac-readout ${readoutClass}`}>
          <small aria-hidden="true">{calc.expression || "\u00a0"}</small>
          <output aria-live="polite" aria-atomic="true" title={entry}>{entry}</output>
        </div>
      </div>
      <div className="rac-command-keys" aria-label="Calculator clear controls">
        <button type="button" className="rac-backspace" aria-label="Backspace" aria-keyshortcuts="Backspace" onClick={() => send("DEL")}>
          <span className="rac-sr-only">Backspace</span>
        </button>
        <button type="button" className="rac-all-clear" aria-label="Clear all" onClick={() => send("AC")}>AC</button>
      </div>
      <div className="rac-memory-keys" aria-label="Memory and quick operations">
        {MEMORY_KEYS.map(value => <Key key={value} value={value} send={send} small disabled={(["MC", "MR"].includes(value) && !calc.hasMemory)} />)}
      </div>
      <div className="rac-digit-keys" aria-label="Digits and operations">
        {NUMERIC_ROWS.flat().map(value => <Key key={value} value={value} send={send} wide={value === "0"} />)}
      </div>
    </section>
  );
}
