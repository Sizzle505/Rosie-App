import test from "node:test";
import assert from "node:assert/strict";
import { initialCalculator, calculatorReducer, formatCalculatorEntry, keyFromKeyboard } from "../src/calculationsEngine.js";

function press(...keys) { return keys.reduce(calculatorReducer, initialCalculator); }

test("arithmetic follows decimal precision", () => {
  assert.equal(press("0",".","1","+","0",".","2","=").entry, "0.3");
  assert.equal(press("7","×","8","=").entry, "56");
  assert.equal(press("1","0","÷","2","=").entry, "5");
  assert.equal(press("8","−","3","=").entry, "5");
});
test("repeated equals and chaining are meaningful", () => {
  assert.equal(press("5","+","2","=","=").entry, "9");
  assert.equal(press("5","+","2","×","3","=").entry, "21");
});
test("dividing by zero yields Error and reset works", () => {
  const problem = press("1","÷","0","=");
  assert.equal(problem.entry, "Error");
  assert.equal(calculatorReducer(problem,"AC").entry, "0");
  assert.equal(calculatorReducer(problem,"4").entry,"4");
});
test("percentage, sign, decimal, clear and delete work", () => {
  assert.equal(press("2","0","%").entry, "0.2");
  assert.equal(press("5","±").entry, "-5");
  assert.equal(press("9","DEL").entry, "0");
  assert.equal(press("7","C").entry, "0");
  assert.equal(press("7",".",".","5").entry, "7.5");
});
test("memory stores and recalls values independently of clear all", () => {
  const state=press("8","M+","AC","MR");
  assert.equal(state.entry,"8");
  assert.equal(state.hasMemory,true);
  assert.equal(calculatorReducer(state,"MC").hasMemory,false);
});
test("formatting preserves trailing decimal and grouped digits", () => {
  assert.equal(formatCalculatorEntry("3141.59"),"3,141.59");
  assert.equal(formatCalculatorEntry("1."),"1.");
  assert.equal(formatCalculatorEntry("-1234.5"),"-1,234.5");
});
test("keyboard mapping is predictable", () => {
  assert.equal(keyFromKeyboard({key:"Enter"}),"=");
  assert.equal(keyFromKeyboard({key:"Backspace"}),"DEL");
  assert.equal(keyFromKeyboard({key:"*"}),"×");
});
