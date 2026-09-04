import { describe, it, expect } from "vitest";
import { bandGeometry } from "./bandGeometry";
import { getLayout } from "../../brand/contract";
import { sz } from "../../brands/sz";
import { probe } from "../../brands/_probe";

// Die inhaltsbemessene Flaeche ist die eine neue Mechanik dieses Umbaus.
// Der erste Test rechnet sie gegen ein GEMESSENES Original nach: in
// sz_beispiele/…(3).jpg reicht das gelbe Feld von y=713 bis zum unteren Rand,
// also 637 px von 1350 — bei einem Satz von rund 370 px Hoehe.

const SZ_LOGO_ASPECT = 457 / 53; // aus der viewBox der Wortmarke
const D = { width: 1080, height: 1350 };

describe("inhaltsbemessene Flaeche (SZ)", () => {
  const layout = getLayout(sz, "bandBottom");

  it("trifft die gemessene Flaechenhoehe eines echten Beitrags", () => {
    const g = bandGeometry({ brand: sz, layout, ...D, textHeight: 370, logoAspect: SZ_LOGO_ASPECT });
    // 637 gemessen; ein paar Pixel Toleranz fuer Rundung und Schriftmetrik.
    expect(g.bandHeight).toBeGreaterThan(620);
    expect(g.bandHeight).toBeLessThan(655);
    expect(g.bandTop).toBe(D.height - g.bandHeight);
  });

  it("waechst mit dem Satz und laesst dem Bild den Rest", () => {
    const small = bandGeometry({ brand: sz, layout, ...D, textHeight: 200, logoAspect: SZ_LOGO_ASPECT });
    const big = bandGeometry({ brand: sz, layout, ...D, textHeight: 500, logoAspect: SZ_LOGO_ASPECT });
    expect(big.bandHeight - small.bandHeight).toBe(300);
    expect(small.mediaHeight).toBeGreaterThan(big.mediaHeight);
    expect(small.bandHeight + small.mediaHeight).toBe(D.height);
  });

  it("laeuft nie ueber das Format hinaus", () => {
    const g = bandGeometry({ brand: sz, layout, ...D, textHeight: 9999, logoAspect: SZ_LOGO_ASPECT });
    expect(g.bandHeight).toBe(D.height);
    expect(g.bandTop).toBe(0);
  });

  it("setzt den Satz um den Innenabstand unter die Flaechenkante", () => {
    const g = bandGeometry({ brand: sz, layout, ...D, textHeight: 370, logoAspect: SZ_LOGO_ASPECT });
    expect(g.textTop - g.bandTop).toBe(Math.round(D.width * sz.bandPadding));
  });

  it("laesst bei einer Flaeche oben das Bild darunter beginnen", () => {
    const top = getLayout(sz, "bandTop");
    const g = bandGeometry({ brand: sz, layout: top, ...D, textHeight: 300, logoAspect: SZ_LOGO_ASPECT });
    expect(g.mediaTop).toBe(g.bandHeight);
    expect(g.textTop).toBe(Math.round(D.width * sz.bandPadding));
    // Oben traegt die Flaeche kein Logo, also ist sie schmaler als unten.
    const bottom = bandGeometry({ brand: sz, layout, ...D, textHeight: 300, logoAspect: SZ_LOGO_ASPECT });
    expect(g.bandHeight).toBeLessThan(bottom.bandHeight);
  });

  it("belegt bei Vollflaeche das ganze Format und laesst kein Bild uebrig", () => {
    const full = getLayout(sz, "fullSurface");
    const g = bandGeometry({ brand: sz, layout: full, ...D, textHeight: 300, logoAspect: SZ_LOGO_ASPECT });
    expect(g.bandHeight).toBe(D.height);
    expect(g.mediaHeight).toBe(0);
  });

  it("laesst bei einem Layout ohne Flaeche das Bild das Format fuellen", () => {
    const photo = getLayout(sz, "photoTitle");
    const g = bandGeometry({ brand: sz, layout: photo, ...D, textHeight: 300, logoAspect: SZ_LOGO_ASPECT });
    expect(g.bandHeight).toBe(0);
    expect(g.mediaHeight).toBe(D.height);
  });
});

describe("feste Flaechengroesse (probe)", () => {
  it("ignoriert die Satzhoehe, wenn bandSize eine Zahl ist", () => {
    const layout = getLayout(probe, "halfTop");
    expect(layout.bandSize).toBe(0.45);
    const a = bandGeometry({ brand: probe, layout, width: 1080, height: 1080, textHeight: 100, logoAspect: 0 });
    const b = bandGeometry({ brand: probe, layout, width: 1080, height: 1080, textHeight: 600, logoAspect: 0 });
    expect(a.bandHeight).toBe(b.bandHeight);
    expect(a.bandHeight).toBe(Math.round(1080 * 0.45));
  });
});
