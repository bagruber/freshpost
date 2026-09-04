import { describe, it, expect } from "vitest";
import { recolorSvg } from "./svgRecolor";
import type { RGB } from "./hsv";

// Prueft das Erkennen und Ersetzen von Farbwerten im SVG-Quelltext. Die
// Abbildung selbst ist hier trivial (alles wird schwarz) — WIE eine Marke
// umfaerbt, gehoert nicht in den Kern.
const toBlack = (): RGB => ({ r: 0, g: 0, b: 0 });
const keep = (rgb: RGB): RGB => rgb;

describe("recolorSvg", () => {
  it("ersetzt fill-Hex", () => {
    expect(recolorSvg('<rect fill="#dc1e1e"/>', toBlack)).toBe('<rect fill="#000000"/>');
  });

  it("expandiert 3-stelliges Hex", () => {
    expect(recolorSvg('<g fill="#0f0"/>', toBlack)).toBe('<g fill="#000000"/>');
  });

  it("behaelt den Alpha-Anteil bei 4- und 8-stelligem Hex", () => {
    expect(recolorSvg('<g fill="#0f0a"/>', toBlack)).toBe('<g fill="#000000aa"/>');
    expect(recolorSvg('<g fill="#00ff0080"/>', toBlack)).toBe('<g fill="#00000080"/>');
  });

  it("ersetzt rgb() in inline-styles", () => {
    expect(recolorSvg('<rect style="fill:rgb(30,60,220)"/>', toBlack))
      .toBe('<rect style="fill:rgb(0, 0, 0)"/>');
  });

  it("behaelt den Alpha-Kanal von rgba()", () => {
    expect(recolorSvg('<rect style="fill:rgba(30,60,220,0.5)"/>', toBlack))
      .toBe('<rect style="fill:rgba(0, 0, 0, 0.5)"/>');
  });

  it("ersetzt Farben in <style>-Bloecken", () => {
    expect(recolorSvg("<style>.a{fill:#22cc22}</style>", toBlack))
      .toBe("<style>.a{fill:#000000}</style>");
  });

  it("liest Prozent-Kanaele in rgb()", () => {
    expect(recolorSvg("<g fill='rgb(100%, 0%, 0%)'/>", keep)).toContain("rgb(255, 0, 0)");
  });

  it("laesst benannte Farben und unbekannte Hex-Laengen stehen", () => {
    expect(recolorSvg('<g fill="red"/>', toBlack)).toBe('<g fill="red"/>');
    expect(recolorSvg('<g fill="#12345"/>', toBlack)).toBe('<g fill="#12345"/>');
  });
});
