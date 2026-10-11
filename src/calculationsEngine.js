// Pure, side-effect-free calculator logic so the keypad and keyboard behave identically.
export const initialCalculator = Object.freeze({
  entry: "0", operand: null, operation: null, waiting: false,
  memory: 0, hasMemory: false, repeatOperation: null, repeatOperand: null,
  expression: "", error: false
});

const operations = new Set(["+", "−", "×", "÷"]);
const finite = (n) => Number.isFinite(n) ? String(Number(n.toPrecision(12))) : "Error";
const resultOf = (left, right, op) => {
  if (op === "+" ) return finite(left + right);
  if (op === "−" ) return finite(left - right);
  if (op === "×" ) return finite(left * right);
  if (op === "÷" ) return right === 0 ? "Error" : finite(left / right);
  return finite(right);
};
const label = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 12 });

export function formatCalculatorEntry(entry) {
  if (entry === "Error") return entry;
  if (!entry || entry === "-") return entry || "0";
  const sign = entry.startsWith("-") ? "-" : "";
  const unsigned = sign ? entry.slice(1) : entry;
  const [whole, decimal] = unsigned.split(".");
  const number = Number(whole);
  if (!Number.isFinite(number)) return entry;
  const digits = number.toLocaleString("en-US");
  return sign + digits + (decimal !== undefined ? "." + decimal : "");
}

export function calculatorReducer(state, key) {
  if (key === "AC") return { ...initialCalculator, memory: state.memory, hasMemory: state.hasMemory };
  if (key === "MC") return { ...state, memory: 0, hasMemory: false };
  if (key === "MR") return { ...state, entry: finite(state.memory), waiting: false, error: false, repeatOperation: null };
  if (key === "M+" || key === "M−") {
    if (state.error) return state;
    const next = state.memory + (key === "M+" ? 1 : -1) * Number(state.entry);
    return Number.isFinite(next) ? { ...state, memory: next, hasMemory: true } : state;
  }
  if (key === "C") return { ...state, entry: "0", waiting: false, error: false, expression: "", operand: null, operation: null };
  if (key === "DEL") {
    if (state.error || state.waiting) return { ...state, entry: "0", waiting: false, error: false };
    const entry = state.entry.slice(0, -1);
    return { ...state, entry: entry && entry !== "-" ? entry : "0" };
  }
  if (/^[0-9]$/.test(key) || key === ".") {
    const start = state.waiting || state.error;
    const current = start ? "0" : state.entry;
    if (key === ".") {
      if (current.includes(".")) return state;
      return { ...state, entry: current + ".", waiting: false, error: false, expression: start ? "" : state.expression };
    }
    if (current.replace(/[^0-9]/g, "").length >= 14 && !start) return state;
    const next = current === "0" ? key : current === "-0" ? "-" + key : current + key;
    return { ...state, entry: next, waiting: false, error: false, expression: start && !state.operation ? "" : state.expression };
  }
  if (state.error) return state;
  if (key === "±") return { ...state, entry: state.entry.startsWith("-") ? state.entry.slice(1) : (Number(state.entry) === 0 ? state.entry : "-" + state.entry) };
  if (key === "%") return { ...state, entry: finite(Number(state.entry) / 100), waiting: false };

  if (operations.has(key)) {
    if (state.operation && !state.waiting) {
      const output = resultOf(Number(state.operand), Number(state.entry), state.operation);
      if (output === "Error") return { ...state, entry: output, error: true, operation: null, operand: null };
      return { ...state, entry: output, operand: output, operation: key, expression: label(output) + " " + key, waiting: true, repeatOperation: null, repeatOperand: null };
    }
    return { ...state, operand: state.entry, operation: key, waiting: true, expression: label(state.entry) + " " + key, repeatOperation: null, repeatOperand: null };
  }
  if (key === "=") {
    const op = state.operation || state.repeatOperation;
    if (!op) return state;
    const left = state.operation ? Number(state.operand) : Number(state.entry);
    const right = state.operation
      ? (state.waiting ? Number(state.operand) : Number(state.entry))
      : Number(state.repeatOperand);
    const output = resultOf(left, right, op);
    return {
      ...state, entry: output, error: output === "Error",
      expression: label(left) + " " + op + " " + label(right) + " =",
      operand: null, operation: null, waiting: true,
      repeatOperation: op, repeatOperand: right
    };
  }
  return state;
}

export function keyFromKeyboard(event) {
  if (/^[0-9]$/.test(event.key)) return event.key;
  return ({ ".": ".", "+": "+", "-": "−", "*": "×", "/": "÷",
    Enter: "=", "=": "=", Backspace: "DEL", Delete: "C", Escape: "AC", "%": "%" })[event.key] || null;
}
