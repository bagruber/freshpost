import { describe, it, expect } from "vitest";
import { snapColor } from "./snap";
import { rgbToHsv } from "./hsv";
import type { ColorSnap } from "../../brand/contract";

// Prueft die MECHANIK des Snaps mit einer erfundenen Regel — nicht die von
// fresh. Was fresh daraus macht, steht in brands/fresh/fresh.test.ts.

const rule: ColorSnap = {
  neutralBelowSaturation: 0.2,
  neutralLightAbove: 0.5,
  neutralDarkHue: 240,
  neutralDarkSaturation: 0.4,
  zones: [
    { from: 30, to: 90, keep: true }, // Gelbbereich bleibt
    { from: 90, to: 200, hue: 120, minSaturation: 0.8 }, // Mindest-Saettigung
    { from: 200, to: 300, hue: 210, saturation: [0.3, 0.5] }, // Clamp
    { from: 300, to: 30, hue: 0, minSaturation: 0.9 }, // laeuft ueber 0° hinweg
  ],
};

const hsv = (rgb: { r: number; g: number; b: number }) => rgbToHsv(rgb.r, rgb.g, rgb.b);

describe("snapColor", () => {
  it("laesst eine keep-Zone unveraendert", () => {
    const gelb = { r: 220, g: 200, b: 30 }; // Hue ~54, in der keep-Zone
    expect(snapColor(gelb, rule)).toEqual(gelb);
  });

  it("hebt die Saettigung auf das Minimum der Zone", () => {
    const [, s] = hsv(snapColor({ r: 120, g: 160, b: 130 }, rule)); // blasses Gruen
    expect(s).toBeGreaterThanOrEqual(0.8);
  });

  it("begrenzt die Saettigung, wenn die Zone einen Bereich vorgibt", () => {
    const [h, s] = hsv(snapColor({ r: 10, g: 60, b: 240 }, rule)); // kraeftiges Blau
    expect(h).toBeGreaterThan(205);
    expect(h).toBeLessThan(215);
    expect(s).toBeLessThanOrEqual(0.5);
  });

  it("trifft auch Zonen, die ueber 0° hinweglaufen", () => {
    const magenta = hsv(snapColor({ r: 200, g: 20, b: 180 }, rule)); // Hue ~310
    const rot = hsv(snapColor({ r: 220, g: 20, b: 20 }, rule)); // Hue ~0
    expect(magenta[0]).toBeCloseTo(0, 0);
    expect(rot[0]).toBeCloseTo(0, 0);
  });

  it("behandelt Neutraltoene nach Helligkeit: hell entsaettigt, dunkel eingefaerbt", () => {
    const [, hellS] = hsv(snapColor({ r: 230, g: 232, b: 235 }, rule));
    expect(hellS).toBeCloseTo(0, 2);
    const [dunkelH, dunkelS] = hsv(snapColor({ r: 40, g: 42, b: 45 }, rule));
    expect(dunkelH).toBeCloseTo(240, 0);
    expect(dunkelS).toBeCloseTo(0.4, 1);
  });

  it("behaelt die Helligkeit — nur der Farbwinkel wird gesnappt", () => {
    const src = { r: 10, g: 60, b: 240 };
    expect(hsv(snapColor(src, rule))[2]).toBeCloseTo(hsv(src)[2], 5);
  });
});
