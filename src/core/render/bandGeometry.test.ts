import { describe, it, expect } from "vitest";
import { bandGeometry } from "./bandGeometry";
import { getLayout } from "../../brand/contract";
import { sz } from "../../brands/sz";
import { fresh } from "../../brands/fresh";
import { probe } from "../../brands/_probe";

// Hier steckt die Arithmetik des Renderers. Der erste Block rechnet die
// inhaltsbemessene Flaeche gegen ein GEMESSENES Original nach: in
// sz_beispiele/…(3).jpg reicht das gelbe Feld von y=713 bis zum unteren Rand,
// also 637 px von 1350 — bei einem Satz von rund 370 px Hoehe.
//
// Die spaeteren Bloecke pruefen die Anordnungen, die aus dem Langtext-Werkzeug
// stammen (schraege Kante, stehende Spalte, frei gesetztes Bild) gegen die
// Werte, die dessen CSS erzeugt hat.

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

describe("schraege Flaechenkante (fresh, Diagonale)", () => {
  const layout = getLayout(fresh, "diagonal");
  const g = bandGeometry({ brand: fresh, layout, ...D, textHeight: 300, logoAspect: 0 });

  it("setzt die Flaeche auf 44 Prozent und schneidet sie schraeg", () => {
    expect(g.bandTop).toBe(594); // 0.44 × 1350, wie im alten CSS
    expect(g.bandHeight).toBe(756);
    expect(g.bandClip).toBe("polygon(0 12%, 100% 0, 100% 100%, 0 100%)");
  });

  it("zieht das Bild bis zur hoechsten Stelle der Kante", () => {
    // Sonst klafft an der langen Ecke eine Luecke: 594 + 12 % von 756.
    expect(g.mediaHeight).toBe(594 + Math.round(756 * 0.12));
    expect(g.mediaHeight).toBeGreaterThan(g.bandTop);
  });

  it("laesst den Satz ueber die Kante ins Bild ragen", () => {
    // textOverhang 0.04 × 1350 = 54 px oberhalb der Flaechenkante.
    expect(g.textTop).toBe(540);
    expect(g.textTop).toBeLessThan(g.bandTop);
  });
});

describe("stehende Spalte (fresh, Randspalte)", () => {
  const layout = getLayout(fresh, "sidebar");
  const g = bandGeometry({ brand: fresh, layout, ...D, textHeight: 400, logoAspect: 0 });

  it("stellt die Flaeche hochkant an den linken Rand", () => {
    expect(g.bandLeft).toBe(0);
    expect(g.bandWidth).toBe(Math.round(D.width * 0.6));
    expect(g.bandHeight).toBe(D.height);
  });

  it("setzt den Satz in die Spalte, nicht ans Format", () => {
    expect(g.textLeft).toBe(Math.round(D.width * fresh.margin));
    expect(g.textLeft + g.textWidth).toBeLessThan(g.bandWidth);
    expect(g.textTop).toBe(Math.round(D.width * 0.078));
  });

  it("laesst das frei gesetzte Bild in die Spalte hineinragen", () => {
    expect(g.mediaWidth).toBe(Math.round(D.width * 0.46));
    expect(g.mediaHeight).toBe(Math.round(D.height * 0.9));
    expect(g.mediaLeft + g.mediaWidth).toBe(D.width); // rechtsbuendig
    expect(g.mediaTop + g.mediaHeight).toBe(D.height); // steht auf dem Boden
    expect(g.mediaLeft).toBeLessThan(g.bandWidth);
  });

  it("spiegelt die Spalte, wenn die Marke sie rechts will", () => {
    const right = getLayout(probe, "sideRight");
    const p = bandGeometry({ brand: probe, layout: right, width: 1080, height: 1080, textHeight: 200, logoAspect: 0 });
    expect(p.bandLeft).toBe(1080 - Math.round(1080 * 0.55));
    expect(p.textLeft).toBeGreaterThan(p.bandLeft);
  });
});

describe("randabfallendes Bild (fresh, Bild-Overlay)", () => {
  const layout = getLayout(fresh, "overlay");

  it("laesst dem Bild das ganze Format und setzt den Satz unten", () => {
    const g = bandGeometry({ brand: fresh, layout, ...D, textHeight: 300, logoAspect: 0 });
    expect(g.bandHeight).toBe(0);
    expect(g.mediaHeight).toBe(D.height);
    // Unterkante des Satzes = Formathoehe minus padBottom (0.14 × Breite).
    expect(g.textTop + 300).toBe(D.height - Math.round(D.width * 0.14));
  });

  it("haelt bei fresh keinen Platz fuer ein festes Logo frei", () => {
    // fresh setzt das Logo frei in eine Ecke; nur eine Marke OHNE waehlbare
    // Positionen (SZ) reserviert Platz in der Flaeche.
    const a = bandGeometry({ brand: fresh, layout, ...D, textHeight: 300, logoAspect: 0 });
    const b = bandGeometry({ brand: fresh, layout, ...D, textHeight: 300, logoAspect: 8 });
    expect(a.textTop).toBe(b.textTop);
    expect(b.logoHeight).toBe(0);
  });
});
