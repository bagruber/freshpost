import type { Brand } from "../brand/contract";
import type { Composition } from "../core/doc/composition";
import { obj, str } from "../core/doc/validate";

// Einmalige Uebernahme der Entwuerfe aus dem alten Langtext-Werkzeug.
//
// Das Werkzeug ist im gemeinsamen Dokumentmodell aufgegangen; sein Modell gibt
// es nicht mehr. Wer einen Entwurf offen hatte, soll ihn trotzdem
// wiederfinden. Die Zuordnung ist eins zu eins, weil die vier Layouts unter
// denselben Schluesseln in den Marken-Layouts stehen.
//
// Diese Datei ist Wegwerf-Code: sobald niemand mehr einen v4-Entwurf im
// Browser liegen hat, kann sie weg.

const OLD_KEY = "freshpost.carousel.v4";

export function migrateCarousel(
  brand: Brand,
  parse: (raw: unknown) => Composition,
): Composition | null {
  // Nur fuer Marken, die die alten Layouts ueberhaupt kennen.
  const keys = new Set(brand.layouts.map((l) => l.key));
  if (!keys.has("typo") || !keys.has("sidebar")) return null;

  let raw: unknown;
  try {
    const text = localStorage.getItem(OLD_KEY);
    if (!text) return null;
    raw = JSON.parse(text);
  } catch {
    return null;
  }

  const d = obj(raw);
  const slides = Array.isArray(d.slides) ? d.slides : [];
  if (slides.length === 0) return null;

  const frames = slides.map((s) => {
    const o = obj(s);
    const layoutId = keys.has(str(o.layout)) ? str(o.layout) : "typo";
    // Im alten Modell wurde derselbe Text als Zitat gesetzt, sobald eine
    // Quelle dabeistand. Jetzt sind das zwei Rollen.
    const attribution = str(o.attribution);
    const [name, ...rest] = attribution.split(/\n/);
    const body = str(o.body);
    const asQuote = layoutId === "sidebar" && attribution.trim().length > 0;

    return {
      layoutId,
      surfaceKey: str(o.surface),
      text: {
        kicker: str(o.kicker),
        headline: str(o.heading),
        [asQuote ? "quote" : "body"]: body,
        source: name ?? "",
        sourceRole: rest.join(" "),
      },
      roleStyle: {
        kicker: { colorKey: str(o.kickerColor), sticker: o.kickerSticker === true },
        headline: { colorKey: str(o.headingColor), sticker: o.headingSticker === true },
      },
      tilt: o.tilt,
      media: [],
      mediaOffX: o.imgOffX,
      mediaOffY: o.imgOffY,
      tone: o.imageMode === "duotone",
      roughFrame: o.imageRough === true,
    };
  });

  return parse({
    formatKey: str(d.dimensionKey) || "post",
    groundKey: str(d.gradient),
    texBack: d.texBack,
    texFront: d.texFront,
    // Die Wischleiste war im alten Werkzeug immer sichtbar.
    progress: d.swipeBottom === true ? "bottom" : "top",
    logoKey: str(d.logo),
    logoCorner: str(d.logoPos) === "top" ? "tc" : "bc",
    logoSize: "s",
    frames,
  });
}
