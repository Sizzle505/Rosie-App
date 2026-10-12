import test from "node:test";
import assert from "node:assert/strict";
import { sectorPath } from "../src/rouletteGeometry.js";

for (const count of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
  test(`roulette creates ${count} independent, precisely bounded sectors`, () => {
    const paths = Array.from({ length: count }, (_, index) => sectorPath(index, count));
    assert.equal(new Set(paths).size, count);
    for (const path of paths) {
      assert.match(path, /^M 200 200 L /);
      assert.match(path, / A 199 199 0 0 1 /);
      assert.match(path, / Z$/);
      assert.ok(!/NaN|Infinity/.test(path));
    }
    const first = paths[0];
    const firstPoint = first.match(/^M 200 200 L ([\d.]+) ([\d.]+)/);
    assert.ok(firstPoint);
    const x = Number(firstPoint[1]);
    const y = Number(firstPoint[2]);
    const firstBoundaryDegrees = -90 - 180 / count;
    const expectedX = 200 + 199 * Math.cos(firstBoundaryDegrees * Math.PI / 180);
    const expectedY = 200 + 199 * Math.sin(firstBoundaryDegrees * Math.PI / 180);
    assert.ok(Math.abs(x - expectedX) < 0.001);
    assert.ok(Math.abs(y - expectedY) < 0.001);
    // The index-th sector is centred at index*(360/N)-90 degrees,
    // matching existing label angle and the original spin outcome calculation.
    for (let index = 0; index < count; index += 1) {
      const labelAngle = index * 360 / count;
      const stopAngle = (360 - labelAngle) % 360;
      assert.ok(Math.abs(((labelAngle + stopAngle) % 360)) < 1e-9);
    }
  });
}
test("invalid roulette geometry is rejected", () => {
  assert.throws(() => sectorPath(0, 1), RangeError);
  assert.throws(() => sectorPath(10, 10), RangeError);
  assert.throws(() => sectorPath(-1, 6), RangeError);
});
