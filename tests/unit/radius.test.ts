import { describe, it } from "node:test";
import assert from "node:assert/strict";

function miles(a, b) {
  const r = (d) => (d * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = r(b[0] - a[0]);
  const dLng = r(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

describe("radius", () => {
  it("zero at same point", () => {
    assert.ok(miles([39.96, -75.6], [39.96, -75.6]) < 0.01);
  });
});
