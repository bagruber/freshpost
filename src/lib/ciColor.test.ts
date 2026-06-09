import { describe, it, expect } from "vitest";
import { mapColorToCI, type RGB } from "./ciColor";

function hsv({ r, g, b }: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (mx === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return [h, mx === 0 ? 0 : d / mx, mx];
}

describe("mapColorToCI", () => {
  it("Rot → Rose-Hue (~342) mit sehr hoher Sättigung", () => {
    const [h, s] = hsv(mapColorToCI({ r: 220, g: 30, b: 30 }));
    expect(h).toBeGreaterThan(330);
    expect(h).toBeLessThan(352);
    expect(s).toBeGreaterThanOrEqual(0.9);
  });

  it("Grün → Wind-Hue (~178), kein Grün mehr", () => {
    const [h, s] = hsv(mapColorToCI({ r: 40, g: 200, b: 60 }));
    expect(h).toBeGreaterThan(168);
    expect(h).toBeLessThan(190);
    expect(s).toBeGreaterThanOrEqual(0.7);
  });

  it("Blau → River-Hue (~198), kein klassisches Blau mehr", () => {
    const [h, s] = hsv(mapColorToCI({ r: 30, g: 60, b: 220 }));
    expect(h).toBeGreaterThan(190);
    expect(h).toBeLessThan(206);
    expect(s).toBeLessThanOrEqual(0.66);
  });

  it("Cyan/Teal → Wind, nicht River", () => {
    const [h] = hsv(mapColorToCI({ r: 20, g: 200, b: 200 })); // hue 180
    expect(h).toBeGreaterThan(168);
    expect(h).toBeLessThan(190);
  });

  it("Orange/Gelb/Braun bleibt unverändert", () => {
    const orange = { r: 242, g: 133, b: 25 };
    expect(mapColorToCI(orange)).toEqual(orange);
  });

  it("helles Neutral → entsättigtes Grau/Weiß", () => {
    const [, s] = hsv(mapColorToCI({ r: 230, g: 232, b: 235 }));
    expect(s).toBeCloseTo(0, 2);
  });

  it("dunkles Neutral → River-Hue", () => {
    const [h, s] = hsv(mapColorToCI({ r: 40, g: 42, b: 45 }));
    expect(h).toBeGreaterThan(190);
    expect(h).toBeLessThan(206);
    expect(s).toBeGreaterThan(0.2);
  });
});
