import { describe, it, expect } from "vitest";
import { fresh } from "./fresh";
import { sz } from "./sz";
import { probe } from "./_probe";
import { getLayout, getSurface, paletteKey, type Brand } from "../brand/contract";
import { buildSegments, segUnitHeight } from "../core/text/boxes";
import { snapColor } from "../core/color/snap";
import { rgbToHsv } from "../core/color/hsv";
import type { Claim } from "../core/doc/claim";

// Jede Marke muss den PFLICHTTEIL des Vertrags erfuellen — und der Kern muss
// mit jeder funktionieren. Fuer die FAEHIGKEITEN gilt: wer eine deklariert,
// muss sie vollstaendig deklarieren; wer sie weglaesst, ist in Ordnung.
//
// `_probe` ist absichtlich fresh- und SZ-fremd und hat alle Faehigkeiten,
// SZ hat keine einzige. Damit sind beide Enden abgedeckt.

const brands: [string, Brand][] = [
  ["fresh", fresh],
  ["sz", sz],
  ["probe", probe],
];

// ===========================================================================
describe.each(brands)("Pflichtteil: %s", (_name, brand) => {
  it("hat Flaechen, und jede bringt ihre eigene Textfarbe mit", () => {
    expect(brand.surfaces.length).toBeGreaterThan(0);
    for (const s of brand.surfaces) {
      expect(s.key).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.bg).toBeTruthy();
      expect(s.ink).toBeTruthy();
      expect(s.muted).toBeTruthy();
    }
  });

  it("hat Textrollen, deren Schluessel zum Eintrag passen", () => {
    const keys = Object.keys(brand.roles);
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      expect(brand.roles[k].key, `roles.${k}.key`).toBe(k);
      expect(brand.roles[k].size).toBeGreaterThan(0);
      expect(brand.roles[k].lineHeight).toBeGreaterThan(0);
      expect(["display", "body"]).toContain(brand.roles[k].font);
    }
  });

  it("hat Layouts, die nur vorhandene Rollen belegen", () => {
    expect(brand.layouts.length).toBeGreaterThan(0);
    for (const l of brand.layouts) {
      expect(l.slots.length, `${l.key} ohne Rollen`).toBeGreaterThan(0);
      for (const slot of l.slots) {
        expect(brand.roles[slot], `Layout ${l.key} verweist auf unbekannte Rolle "${slot}"`).toBeDefined();
      }
      expect(l.textWidth).toBeGreaterThan(0);
      expect(l.textWidth).toBeLessThanOrEqual(1);
    }
  });

  it("laesst Platz: Satzkante und Flaechen-Innenabstand sind gesetzt", () => {
    expect(brand.margin).toBeGreaterThan(0);
    expect(brand.margin).toBeLessThan(0.3);
    expect(brand.bandPadding).toBeGreaterThan(0);
  });

  it("hat mindestens ein Format mit brauchbarer Safety-Zone", () => {
    expect(brand.formats.length).toBeGreaterThan(0);
    for (const f of brand.formats) {
      expect(f.width).toBeGreaterThan(0);
      expect(f.safe.left + f.safe.right).toBeLessThan(1);
      expect(f.safe.top + f.safe.bottom).toBeLessThan(1);
    }
  });

  it("nennt eine ausgeschriebene Export-Hintergrundfarbe", () => {
    // html-to-image loest keine Custom Properties auf — hier muss ein Wert stehen.
    expect(brand.exportBackground).toMatch(/^#|^rgb/);
  });

  it("faellt bei unbekannten Schluesseln auf etwas Gueltiges zurueck", () => {
    expect(brand.surfaces).toContain(getSurface(brand, "gibtesnicht"));
    expect(brand.layouts).toContain(getLayout(brand, "gibtesnicht"));
  });
});

// ===========================================================================
describe.each(brands)("Faehigkeiten, wenn deklariert: %s", (_name, brand) => {
  it("Farbpalette: `order` und `markSlots` zeigen nur auf vorhandene Farben", () => {
    const c = brand.colors;
    if (!c) return; // SZ hat keine — das ist erlaubt
    expect(c.order.length).toBeGreaterThan(0);
    for (const key of [...c.order, ...c.markSlots]) expect(c.palette[key]).toBeDefined();
  });

  it("Farbpalette: jede Hauptfarbe hat eine erlaubte Sekundaerfarbe", () => {
    const c = brand.colors;
    if (!c) return;
    for (const main of c.order) {
      const sec = c.secondaryFor(main);
      expect(c.palette[sec], `secondaryFor(${main}) → ${sec}`).toBeDefined();
      expect(c.adjacent(sec, main)).toBe(true);
    }
    expect(brand.colors && paletteKey(brand, "gibtesnicht")).toBeTruthy();
  });

  it("Bildbehandlung: die Snap-Zonen decken den ganzen Farbkreis ab", () => {
    const img = brand.image;
    if (!img) return;
    for (let h = 0; h < 360; h += 15) {
      const hit = img.colorSnap.zones.some((z) =>
        z.from <= z.to ? h >= z.from && h < z.to : h >= z.from || h < z.to,
      );
      expect(hit, `Hue ${h}° faellt in keine Zone`).toBe(true);
    }
    expect(img.frameColors.length).toBeGreaterThan(0);
  });

  it("Sticker: der Kern kann damit einen Stapel bauen", () => {
    const st = brand.sticker;
    const c = brand.colors;
    if (!st || !c) return;
    const main = c.order[0];
    const secondary = c.secondaryFor(main);
    const claim: Claim = {
      upper: "oben", main: "Hauptzeile", lower: "unten",
      capUpper: brand.type.caps, capMain: brand.type.caps, capLower: brand.type.caps,
      upperStyle: secondary, mainStyle: main, lowerStyle: secondary,
      tilt: 0, mainSize: 0.11, stdScale: 1, secScale: st.secondaryMax,
      upperOffset: 0, lowerOffset: 0, x: 0.5, y: 0.5,
    };
    const segs = buildSegments(claim, st.secondaryMax, st);
    expect(segs.map((s) => s.segment)).toEqual(["upper", "main", "lower"]);
    expect(segs[1].weight).toBe(st.mainWeight);
  });
});

// ===========================================================================
describe("Die Marken unterscheiden sich weit genug, um etwas zu beweisen", () => {
  it("SZ hat keine der vier Faehigkeiten, probe hat alle", () => {
    expect(sz.colors).toBeUndefined();
    expect(sz.sticker).toBeUndefined();
    expect(sz.image).toBeUndefined();
    expect(sz.ground).toBeUndefined();

    expect(probe.colors).toBeDefined();
    expect(probe.sticker).toBeDefined();
    expect(probe.image).toBeDefined();
    expect(probe.ground).toBeDefined();
  });

  it("haben verschiedene Schriften, Formate und Rollen", () => {
    expect(fresh.type.display).not.toBe(sz.type.display);
    expect(fresh.type.display).not.toBe(probe.type.display);
    expect(fresh.formats[0].height).not.toBe(probe.formats[0].height);
    expect(fresh.type.caps).not.toBe(sz.type.caps);
    expect(Object.keys(sz.roles)).toContain("question"); // Interview-Frage: nur SZ
    expect(Object.keys(fresh.roles)).not.toContain("question");
  });

  it("SZ kennt eine inhaltsbemessene Flaeche, probe auch eine feste", () => {
    expect(sz.layouts.every((l) => l.bandSize === "auto")).toBe(true);
    expect(probe.layouts.some((l) => typeof l.bandSize === "number")).toBe(true);
  });

  it("zeichnen im Fliesstext unterschiedlich aus: Schrift gegen Farbe", () => {
    const szEm = sz.roles.body.emphasis![0];
    const freshEm = fresh.roles.body.emphasis![0];
    expect(szEm.font).toBe("display"); // SZ wechselt die Schrift
    expect(szEm.background).toBeUndefined();
    expect(freshEm.background).toBeTruthy(); // fresh setzt eine farbige Box
  });

  it("platzieren das Logo unterschiedlich: fest gegen waehlbar", () => {
    expect(sz.logo.placements).toHaveLength(0); // fest
    expect(fresh.logo.placements.length).toBeGreaterThan(1); // waehlbar
  });

  it("stapeln Sektionen unterschiedlich hoch (Sticker-Rezept wirkt)", () => {
    const h1 = segUnitHeight(2, fresh.sticker!);
    const h2 = segUnitHeight(2, probe.sticker!);
    expect(h1).not.toBeCloseTo(h2, 3);
  });

  it("snappen dieselbe Farbe in verschiedene Richtungen", () => {
    const src = { r: 40, g: 200, b: 60 }; // Gruen
    const a = snapColor(src, fresh.image!.colorSnap);
    const b = snapColor(src, probe.image!.colorSnap);
    expect(rgbToHsv(a.r, a.g, a.b)[0]).not.toBeCloseTo(rgbToHsv(b.r, b.g, b.b)[0], 0);
  });

  it("haben verschiedene Nachbarschaftsregeln", () => {
    expect(fresh.colors!.adjacent("rose", "rose")).toBe(false); // gleiche Farbe verboten
    expect(probe.colors!.adjacent("ink", "ink")).toBe(true); // hier erlaubt
  });
});
