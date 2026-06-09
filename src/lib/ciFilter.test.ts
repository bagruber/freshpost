import { describe, it, expect } from "vitest";
import { buildCurveLUT } from "./ciFilter";

describe("buildCurveLUT", () => {
  const lut = buildCurveLUT(1); // maximale Stärke

  it("ist monoton steigend", () => {
    for (let i = 1; i < lut.length; i++) {
      expect(lut[i]).toBeGreaterThanOrEqual(lut[i - 1] - 1e-9);
    }
  });

  it("fixiert die Endpunkte", () => {
    expect(lut[0]).toBeCloseTo(0, 3);
    expect(lut[255]).toBeCloseTo(1, 3);
  });

  it("ist eine S-Kurve: Schatten dunkler, Lichter heller", () => {
    const at = (x: number) => lut[Math.round(x * 255)];
    expect(at(0.2)).toBeLessThan(0.2); // dunkler
    expect(at(0.8)).toBeGreaterThan(0.8); // heller
  });

  it("hat subtilen Mid-Decontrast (Punkte rücken Richtung 0.5)", () => {
    const at = (x: number) => lut[Math.round(x * 255)];
    // Bei reiner S-Kurve wäre 0.45 dunkler; hier minimal heller (Richtung Mitte).
    expect(at(0.45)).toBeGreaterThanOrEqual(0.45);
    expect(at(0.55)).toBeLessThanOrEqual(0.55);
  });

  it("Stärke 0 ist die Identität", () => {
    const id = buildCurveLUT(0);
    for (let i = 0; i < id.length; i++) {
      expect(id[i]).toBeCloseTo(i / 255, 5);
    }
  });
});
