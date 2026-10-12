import test from "node:test";
import assert from "node:assert/strict";
import { CHEESE_PREVIEW_MS, CHEESE_SPRINT_MS, secondsUntilDeadline, beforeDeadline } from "../src/cheeseSprint.js";

test("preview always lasts 3 seconds; sprint lasts 30 seconds", () => {
  assert.equal(CHEESE_PREVIEW_MS, 3000);
  assert.equal(CHEESE_SPRINT_MS, 30000);
});
test("countdown rounds up partial seconds and hits zero at deadline", () => {
  assert.equal(secondsUntilDeadline(33000,30000),3);
  assert.equal(secondsUntilDeadline(33000,30001),3);
  assert.equal(secondsUntilDeadline(33000,31001),2);
  assert.equal(secondsUntilDeadline(33000,32999),1);
  assert.equal(secondsUntilDeadline(33000,33000),0);
  assert.equal(secondsUntilDeadline(33000,34000),0);
});
test("last matching click at deadline is too late, just before is legal", () => {
  assert.equal(beforeDeadline(60000,59999),true);
  assert.equal(beforeDeadline(60000,60000),false);
  assert.equal(beforeDeadline(60000,60001),false);
  assert.equal(beforeDeadline(0,0),false);
});
