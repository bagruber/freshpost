import { describe, it, expect } from "vitest";
import { extents, clampToCanvas, violatesSafe } from "./geometry";
import type { Dimension } from "./dimensions";

const dim: Dimension = {
  key: "t", label: "t", width: 1000, height: 2000,
  safe: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 },
};

describe("extents", () => {
  it("ohne Neigung = halbe Größe relativ zur Stage", () => {
    const e = extents({ w: 200, h: 400 }, 0, dim);
    expect(e.hx).toBeCloseTo(0.1); // 100 / 1000
    expect(e.hy).toBeCloseTo(0.1); // 200 / 2000
  });

  it("Neigung vergrößert die Bounding-Box", () => {
    const e = extents({ w: 200, h: 400 }, 30, dim);
    expect(e.hx).toBeGreaterThan(0.1);
    expect(e.hy).toBeGreaterThan(0.1);
  });
});

describe("clampToCanvas", () => {
  const ext = { hx: 0.1, hy: 0.05 };
  it("hält die Gruppe vollständig im Canvas", () => {
    expect(clampToCanvas({ x: -1, y: 2 }, ext)).toEqual({ x: 0.1, y: 0.95 });
  });
  it("lässt Positionen innerhalb unverändert", () => {
    expect(clampToCanvas({ x: 0.5, y: 0.5 }, ext)).toEqual({ x: 0.5, y: 0.5 });
  });
  it("zentriert, wenn größer als der Canvas", () => {
    expect(clampToCanvas({ x: 0.2, y: 0.2 }, { hx: 0.6, hy: 0.6 })).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe("violatesSafe", () => {
  const ext = { hx: 0.05, hy: 0.05 };
  it("false in der Mitte", () => {
    expect(violatesSafe({ x: 0.5, y: 0.5 }, ext, dim.safe)).toBe(false);
  });
  it("true wenn über die Zone hinaus", () => {
    expect(violatesSafe({ x: 0.12, y: 0.5 }, ext, dim.safe)).toBe(true);
  });
});
