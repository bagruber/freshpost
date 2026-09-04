import { describe, it, expect } from "vitest";
import { fresh } from ".";
import { snapColor } from "../../core/color/snap";
import { rgbToHsv } from "../../core/color/hsv";

// Die Erwartungen an das fresh-CI selbst. Der Kern wird davon nicht beruehrt —
// er kennt weder Rose noch Wind noch River.

const snap = (rgb: { r: number; g: number; b: number }) => {
  const out = snapColor(rgb, fresh.image.colorSnap);
  return rgbToHsv(out.r, out.g, out.b);
};

describe("fresh: Farb-Snap", () => {
  it("Rot → Rose-Hue (~342) mit sehr hoher Saettigung", () => {
    const [h, s] = snap({ r: 220, g: 30, b: 30 });
    expect(h).toBeGreaterThan(330);
    expect(h).toBeLessThan(352);
    expect(s).toBeGreaterThanOrEqual(0.9);
  });

  it("Gruen → Wind-Hue (~178), kein Gruen mehr", () => {
    const [h, s] = snap({ r: 40, g: 200, b: 60 });
    expect(h).toBeGreaterThan(168);
    expect(h).toBeLessThan(190);
    expect(s).toBeGreaterThanOrEqual(0.7);
  });

  it("Blau → River-Hue (~198), kein klassisches Blau mehr", () => {
    const [h, s] = snap({ r: 30, g: 60, b: 220 });
    expect(h).toBeGreaterThan(190);
    expect(h).toBeLessThan(206);
    expect(s).toBeLessThanOrEqual(0.66);
  });

  it("Cyan/Teal → Wind, nicht River", () => {
    const [h] = snap({ r: 20, g: 200, b: 200 }); // Hue 180
    expect(h).toBeGreaterThan(168);
    expect(h).toBeLessThan(190);
  });

  it("Orange/Gelb/Braun bleibt unveraendert — Hauttoene sollen Hauttoene bleiben", () => {
    const orange = { r: 242, g: 133, b: 25 };
    expect(snapColor(orange, fresh.image.colorSnap)).toEqual(orange);
  });

  it("helles Neutral → entsaettigtes Grau/Weiss", () => {
    const [, s] = snap({ r: 230, g: 232, b: 235 });
    expect(s).toBeCloseTo(0, 2);
  });

  it("dunkles Neutral → River-Hue", () => {
    const [h, s] = snap({ r: 40, g: 42, b: 45 });
    expect(h).toBeGreaterThan(190);
    expect(h).toBeLessThan(206);
    expect(s).toBeGreaterThan(0.2);
  });
});

describe("fresh: Farbregeln", () => {
  it("lehnt identische Farben an einer Sektionsgrenze ab", () => {
    expect(fresh.colors.adjacent("rose", "rose")).toBe(false);
  });

  it("lehnt rose↔wind in beiden Richtungen ab", () => {
    expect(fresh.colors.adjacent("rose", "wind")).toBe(false);
    expect(fresh.colors.adjacent("wind", "rose")).toBe(false);
  });

  it("erlaubt unterschiedliche, nicht-kollidierende Farben", () => {
    expect(fresh.colors.adjacent("rose", "white")).toBe(true);
    expect(fresh.colors.adjacent("white", "river")).toBe(true);
    expect(fresh.colors.adjacent("wind", "riverMid")).toBe(true);
  });

  it("waehlt Weiss als Sekundaerfarbe, ausser bei weissem Main (dann River)", () => {
    expect(fresh.colors.secondaryFor("rose")).toBe("white");
    expect(fresh.colors.secondaryFor("river")).toBe("white");
    expect(fresh.colors.secondaryFor("white")).toBe("river");
  });
});

describe("fresh: Formate", () => {
  it("reserviert bei der Story unten am meisten (Instagram-UI)", () => {
    const story = fresh.formats.find((f) => f.key === "story")!;
    expect(story.safe.bottom).toBeGreaterThan(story.safe.top);
  });

  it("gibt Safety-Insets als Bruchteile zurueck, nicht als Pixel", () => {
    for (const f of fresh.formats) {
      expect(f.safe.top).toBeLessThan(1);
      expect(f.safe.left).toBeLessThan(1);
    }
  });
});
