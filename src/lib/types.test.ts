import { describe, it, expect } from "vitest";
import { boundaryOk, secondaryStyle } from "./types";

describe("boundaryOk", () => {
  it("lehnt identische Farben ab", () => {
    expect(boundaryOk("rose", "rose")).toBe(false);
  });
  it("lehnt rose↔wind in beiden Richtungen ab", () => {
    expect(boundaryOk("rose", "wind")).toBe(false);
    expect(boundaryOk("wind", "rose")).toBe(false);
  });
  it("erlaubt unterschiedliche, nicht-kollidierende Farben", () => {
    expect(boundaryOk("rose", "white")).toBe(true);
    expect(boundaryOk("white", "river")).toBe(true);
    expect(boundaryOk("wind", "riverMid")).toBe(true);
  });
});

describe("secondaryStyle", () => {
  it("ist Weiß außer bei weißem Main (dann River)", () => {
    expect(secondaryStyle("rose")).toBe("white");
    expect(secondaryStyle("river")).toBe("white");
    expect(secondaryStyle("white")).toBe("river");
  });
  it("ergibt immer eine gültige Grenzfarbe", () => {
    for (const m of ["rose", "wind", "white", "river", "riverMid", "riverSoft"] as const) {
      expect(boundaryOk(secondaryStyle(m), m)).toBe(true);
    }
  });
});
