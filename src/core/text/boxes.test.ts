import { describe, it, expect } from "vitest";
import { buildSegments, segUnitHeight } from "./boxes";
import type { Claim } from "../doc/claim";
import type { StickerCapability } from "../../brand/contract";

// Erfundenes Rezept — der Kern soll mit jedem funktionieren, nicht nur mit dem
// von fresh.
const st: StickerCapability = {
  padX: 0.5, padY: 0.2, lineTight: 1, overlapWithin: 0.25, overlapBetween: 0.2,
  tiltRange: 4, offsetRange: 0.1, secondaryMax: 0.5,
  autoSize: { min: 0.04, max: 0.2 },
  mainWeight: 900, secondaryWeight: 600,
};

const base: Claim = {
  upper: "", main: "", lower: "",
  capUpper: true, capMain: true, capLower: true,
  upperStyle: "white", mainStyle: "rose", lowerStyle: "white",
  tilt: 0, mainSize: 0.11, stdScale: 1, secScale: 2 / 3,
  upperOffset: 0, lowerOffset: 0, x: 0.5, y: 0.5,
};

describe("buildSegments", () => {
  it("liefert einen Platzhalter ohne Claim", () => {
    const segs = buildSegments(base, 2 / 3, st);
    expect(segs).toHaveLength(1);
    expect(segs[0].segment).toBe("main");
    expect(segs[0].lines).toEqual(["Dein Claim"]);
  });

  it("ignoriert Oben/Unten ohne Main", () => {
    const segs = buildSegments({ ...base, upper: "x", lower: "y" }, 2 / 3, st);
    expect(segs).toHaveLength(1);
    expect(segs[0].segment).toBe("main");
  });

  it("teilt mehrzeilige Eingaben in Zeilen", () => {
    const segs = buildSegments({ ...base, upper: "a", main: "b\nc", lower: "d" }, 2 / 3, st);
    expect(segs.map((s) => s.segment)).toEqual(["upper", "main", "lower"]);
    expect(segs[1].lines).toEqual(["b", "c"]);
  });

  it("setzt Überlappung nur an Sektionsgrenzen (nicht bei der ersten)", () => {
    const segs = buildSegments({ ...base, upper: "a", main: "b" }, 2 / 3, st);
    expect(segs[0].overlapTop).toBe(0);
    expect(segs[1].overlapTop).toBeGreaterThan(0);
  });
});

describe("segUnitHeight", () => {
  it("wächst mit jeder Zeile, aber unterproportional (Within-Overlap)", () => {
    const one = segUnitHeight(1, st);
    const two = segUnitHeight(2, st);
    expect(two).toBeGreaterThan(one);
    expect(two).toBeLessThan(2 * one); // Überlappung spart Höhe
  });
});
