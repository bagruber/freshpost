import { describe, it, expect } from "vitest";
import { extents, clampToCanvas, violatesSafe, coverGeom, clampView } from "./geometry";
import type { Dimension } from "./dimension";

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

describe("coverGeom", () => {
  it("füllt das Canvas und erlaubt Zoom bis 1:1, wenn die Quelle groß genug ist", () => {
    // Quelle 1200×2400 deckt 1000×2000 ab; coverScale = max(0.833, 0.833).
    const g = coverGeom(1200, 2400, dim);
    expect(g.imgW).toBeCloseTo(1000);
    expect(g.imgH).toBeCloseTo(2000);
    expect(g.zoomMax).toBeCloseTo(1.2); // 1 / 0.8333
  });

  it("sperrt Zoom (zoomMax=1), wenn die Quelle kleiner als das Canvas ist", () => {
    const g = coverGeom(500, 1000, dim); // coverScale = 2 → Upscaling nötig
    expect(g.zoomMax).toBe(1);
  });
});

describe("clampView", () => {
  const g = coverGeom(1200, 2400, dim); // imgW 1000, imgH 2000, zoomMax 1.2

  it("begrenzt Zoom auf [1, zoomMax]", () => {
    expect(clampView(0.5, { x: 0, y: 0 }, g, dim).zoom).toBe(1);
    expect(clampView(5, { x: 0, y: 0 }, g, dim).zoom).toBeCloseTo(1.2);
  });

  it("verhindert sichtbare Ränder beim Pan", () => {
    // Bei zoom 1.2: imgW 1200, imgH 2400 → Überhang (100, 200).
    const v = clampView(1.2, { x: 9999, y: 9999 }, g, dim);
    expect(v.pan.x).toBeCloseTo(100);
    expect(v.pan.y).toBeCloseTo(200);
  });

  it("erlaubt keinen Pan bei exaktem Cover (kein Überhang)", () => {
    const v = clampView(1, { x: 50, y: 50 }, g, dim); // imgW 1000 = Canvas, imgH 2000 = Canvas
    expect(v.pan).toEqual({ x: 0, y: 0 });
  });
});
