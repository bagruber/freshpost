import { describe, it, expect } from "vitest";
import { recolorSvg } from "./svgRecolor";

describe("recolorSvg", () => {
  it("ersetzt fill-Hex (Rot → Rose)", () => {
    const out = recolorSvg('<rect fill="#dc1e1e"/>');
    const hex = out.match(/#[0-9a-f]{6}/i)![0];
    expect(hex.toLowerCase()).not.toBe("#dc1e1e");
    // Rose ist rot-magenta: R hoch, G niedrig.
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    expect(r).toBeGreaterThan(g + 80);
  });

  it("lässt Orange unverändert", () => {
    const out = recolorSvg('<path fill="#F28519"/>');
    expect(out.toLowerCase()).toContain("#f28519");
  });

  it("verarbeitet 3-stelliges Hex und behält Alpha bei", () => {
    expect(recolorSvg('<g fill="#0f0"/>')).toMatch(/#[0-9a-f]{6}/i); // grün → wind
    expect(recolorSvg('<g fill="#00ff00ff"/>')).toMatch(/#[0-9a-f]{6}ff/i);
  });

  it("ersetzt rgb() in inline-styles", () => {
    const out = recolorSvg('<rect style="fill:rgb(30,60,220)"/>'); // blau → river
    expect(out).toMatch(/rgb\(\d+, \d+, \d+\)/);
    expect(out).not.toContain("rgb(30,60,220)");
  });

  it("ersetzt Farben in <style>-Blöcken", () => {
    const out = recolorSvg("<style>.a{fill:#22cc22}</style>");
    expect(out).not.toContain("#22cc22");
  });
});
