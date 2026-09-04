import { describe, it, expect } from "vitest";
import { fresh } from "./fresh";
import { probe } from "./_probe";
import { paletteKey, type Brand } from "../brand/contract";
import { buildSegments, segUnitHeight } from "../core/text/boxes";
import { snapColor } from "../core/color/snap";
import { rgbToHsv } from "../core/color/hsv";
import type { Claim } from "../core/doc/claim";

// Jede Marke muss denselben Vertrag erfuellen — und der Kern muss mit jeder
// funktionieren. `_probe` ist absichtlich fresh-fremd; wo ein Test hier nur
// mit fresh gruen wird, steckt eine Marke im Kern fest.

const brands: [string, Brand][] = [
  ["fresh", fresh],
  ["probe", probe],
];

const claimFor = (b: Brand): Claim => {
  const main = b.colors.order[0];
  const secondary = b.colors.secondaryFor(main);
  return {
    upper: "oben", main: "Hauptzeile", lower: "unten",
    capUpper: b.type.caps, capMain: b.type.caps, capLower: b.type.caps,
    upperStyle: secondary, mainStyle: main, lowerStyle: secondary,
    tilt: 0, mainSize: 0.11, stdScale: 1, secScale: b.sticker.secondaryMax,
    upperOffset: 0, lowerOffset: 0, x: 0.5, y: 0.5,
  };
};

describe.each(brands)("Marken-Vertrag: %s", (_name, brand) => {
  it("hat mindestens eine Farbe, und jede in `order` existiert in der Palette", () => {
    expect(brand.colors.order.length).toBeGreaterThan(0);
    for (const key of brand.colors.order) {
      expect(brand.palette[key]).toBeDefined();
      expect(brand.palette[key].label.length).toBeGreaterThan(0);
    }
  });

  it("liefert fuer jede Hauptfarbe eine gueltige, erlaubte Sekundaerfarbe", () => {
    for (const main of brand.colors.order) {
      const sec = brand.colors.secondaryFor(main);
      expect(brand.palette[sec], `secondaryFor(${main}) → ${sec}`).toBeDefined();
      expect(brand.colors.adjacent(sec, main)).toBe(true);
    }
  });

  it("verweist mit markSlots nur auf vorhandene Farben", () => {
    expect(brand.colors.markSlots.length).toBeGreaterThan(0);
    for (const key of brand.colors.markSlots) expect(brand.palette[key]).toBeDefined();
  });

  it("hat mindestens ein Format, und die Safety-Zone laesst Platz uebrig", () => {
    expect(brand.formats.length).toBeGreaterThan(0);
    for (const f of brand.formats) {
      expect(f.width).toBeGreaterThan(0);
      expect(f.safe.left + f.safe.right).toBeLessThan(1);
      expect(f.safe.top + f.safe.bottom).toBeLessThan(1);
    }
  });

  it("hat mindestens einen Verlauf, einen Flaechenton und eine Rahmenfarbe", () => {
    expect(brand.surface.gradients.length).toBeGreaterThan(0);
    expect(brand.surface.tones.length).toBeGreaterThan(0);
    expect(brand.image.frameColors.length).toBeGreaterThan(0);
  });

  it("deckt mit den Snap-Zonen den ganzen Farbkreis ab", () => {
    for (let h = 0; h < 360; h += 15) {
      const hit = brand.image.colorSnap.zones.some((z) =>
        z.from <= z.to ? h >= z.from && h < z.to : h >= z.from || h < z.to,
      );
      expect(hit, `Hue ${h}° faellt in keine Zone`).toBe(true);
    }
  });

  it("erlaubt jede Logo-Groesse, die der Kern kennt", () => {
    expect(brand.logo.widths.s).toBeGreaterThan(0);
    expect(brand.logo.widths.m).toBeGreaterThan(0);
    expect(brand.logo.placements.length).toBeGreaterThan(0);
  });
});

describe.each(brands)("Kern arbeitet mit %s", (_name, brand) => {
  it("baut aus einem Claim drei Sektionen nach dem Rezept der Marke", () => {
    const segs = buildSegments(claimFor(brand), brand.sticker.secondaryMax, brand.sticker);
    expect(segs.map((s) => s.segment)).toEqual(["upper", "main", "lower"]);
    expect(segs[1].weight).toBe(brand.sticker.mainWeight);
    expect(segs[0].weight).toBe(brand.sticker.secondaryWeight);
  });

  it("snappt Farben in den Raum der Marke", () => {
    const [, s, v] = rgbToHsv(200, 30, 90);
    const out = snapColor({ r: 200, g: 30, b: 90 }, brand.image.colorSnap);
    const [, outS, outV] = rgbToHsv(out.r, out.g, out.b);
    expect(outV).toBeCloseTo(v, 2); // Helligkeit bleibt immer
    expect(outS).toBeGreaterThan(0);
    expect(s).toBeGreaterThan(0);
  });

  it("faellt bei einem fremden Farbschluessel auf eine eigene Farbe zurueck", () => {
    expect(brand.colors.order).toContain(paletteKey(brand, "gibtesnicht"));
    expect(paletteKey(brand, brand.colors.order[0])).toBe(brand.colors.order[0]);
  });
});

// Die Marken muessen sich auch wirklich unterscheiden — sonst prueft der
// Vertrag oben nichts.
describe("fresh und probe sind verschieden genug, um etwas zu beweisen", () => {
  it("haben verschiedene Paletten, Schriften und Formate", () => {
    expect(fresh.colors.order).not.toEqual(probe.colors.order);
    expect(fresh.type.display).not.toBe(probe.type.display);
    expect(fresh.formats[0].height).not.toBe(probe.formats[0].height);
    expect(fresh.type.caps).not.toBe(probe.type.caps);
  });

  it("stapeln Sektionen unterschiedlich hoch (Sticker-Rezept wirkt)", () => {
    const h1 = segUnitHeight(2, fresh.sticker);
    const h2 = segUnitHeight(2, probe.sticker);
    expect(h1).not.toBeCloseTo(h2, 3);
  });

  it("snappen dieselbe Farbe in verschiedene Richtungen", () => {
    const src = { r: 40, g: 200, b: 60 }; // Gruen
    const a = snapColor(src, fresh.image.colorSnap);
    const b = snapColor(src, probe.image.colorSnap);
    expect(rgbToHsv(a.r, a.g, a.b)[0]).not.toBeCloseTo(rgbToHsv(b.r, b.g, b.b)[0], 0);
  });

  it("haben verschiedene Nachbarschaftsregeln", () => {
    expect(fresh.colors.adjacent("rose", "rose")).toBe(false); // gleiche Farbe verboten
    expect(probe.colors.adjacent("ink", "ink")).toBe(true); // hier erlaubt
  });
});
