// Der Vertrag zwischen dem markenfreien Kern und einem Marken-Paket.
// Hier stehen ausschliesslich Typen — kein einziger Wert.
//
// Aufbau in zwei Teilen:
//
//   PFLICHT   Was jede Marke hat: Schriften, Flaechen, Textrollen, Layouts,
//             Logo, Formate. Damit kann der Kern rendern und messen.
//
//   FAEHIGKEIT  Was manche Marken haben und andere nicht: frei waehlbare
//             Sticker-Farben, gekippte Sticker, eine Bildbehandlung, ein
//             texturierter Grund. Eine Marke, die das nicht kennt, laesst es
//             weg — und die Teile des Werkzeugs, die es brauchen, tauchen bei
//             ihr gar nicht erst auf.
//
// Der zweite Teil ist der Grund fuer diesen Umbau: fresh und SZ teilen fast
// nichts ausser dem Pflichtteil. Wuerde man SZ-Felder an den alten Vertrag
// anhaengen, waere er nach der dritten Marke unbrauchbar.

import type { Grade } from "../core/color/grade";
import type { Dimension } from "../core/canvas/dimension";
import type { LogoCorner, LogoSize } from "../core/doc/logo";

// ===========================================================================
// PFLICHT
// ===========================================================================

// --- Schrift ---------------------------------------------------------------
export type TypeSpec = {
  display: string; // CSS font-family
  body: string;
  caps: boolean; // Startwert: Versalien an?
  // true = die Familien sind nur Ersatz fuer nicht lizenzierte Hausschriften.
  substitute?: boolean;
};

export type FontRef = "display" | "body";

export type EmphasisStyle = { font?: FontRef; weight?: number; background?: string; color?: string };

// --- Flaeche ---------------------------------------------------------------
// Ein Grund, auf dem Text stehen kann. `bg` darf eine Farbe ODER ein Verlauf
// sein. `ink` ist die Textfarbe darauf — bei manchen Marken frei waehlbar,
// bei anderen (SZ) die einzige erlaubte.
export type Surface = {
  key: string;
  label: string;
  bg: string;
  ink: string;
  muted: string; // gedaempft: Bildnachweis, Logo, Trennstriche
};

// --- Textrolle -------------------------------------------------------------
// Eine benannte Rolle im Satz (Rubrik, Schlagzeile, Fliesstext, Zitat …) mit
// allem, was ihr Aussehen bestimmt. Groessen sind Bruchteile der Formatbreite,
// damit sie formatunabhaengig bleiben.
export type TextRole = {
  key: string;
  label: string;
  font: FontRef;
  weight: number;
  italic?: boolean;
  size: number; // Bruchteil der Breite
  lineHeight: number;
  tracking?: number; // em
  upper?: boolean;
  gapAfter: number; // Abstand zur naechsten Rolle, Bruchteil der Breite
  multiline: boolean; // Eingabefeld mehrzeilig?
  placeholder?: string;
  prefix?: string; // fest vorangestelltes Zeichen, z. B. "› "
  ruleAfter?: boolean; // kurzer Trennstrich darunter (Interview-Frage)
  // Inline-Auszeichnung im Fliesstext. Bei fresh eine farbige Box, bei SZ ein
  // Wechsel der Schrift — derselbe Marker, anderes Mittel. Die Liste bildet
  // die Marker-Slots ab: *wort* → [0], ~wort~ → [1], _wort_ → [2].
  emphasis?: EmphasisStyle[];
};

// --- Layout ----------------------------------------------------------------
// Wo die Farbflaeche sitzt und welche Rollen in welcher Reihenfolge hinein.
export type BandPlace = "top" | "bottom" | "full" | "none";

export type Layout = {
  key: string;
  label: string;
  hint?: string;
  band: BandPlace;
  // "auto" = die Flaeche waechst mit ihrem Inhalt (SZ). Eine Zahl = fester
  // Bruchteil der Hoehe.
  bandSize: "auto" | number;
  align: "top" | "bottom"; // Ausrichtung des Satzes in seiner Zone
  textWidth: number; // Bruchteil der Breite
  slots: string[]; // Rollenschluessel, in Satzreihenfolge
  media: number; // wie viele Bilder das Layout nutzt
  scrim?: boolean; // Abdunkelung unter Text, der auf dem Bild steht
};

// --- Logo ------------------------------------------------------------------
export type LogoOption = { key: string; label: string; url: string };
export type LogoPlacement = { key: LogoCorner; label: string };

export type LogoSpec = {
  options: LogoOption[];
  // Leer = das Logo sitzt fest und ist nicht verschiebbar (SZ). Sonst waehlbar.
  placements: LogoPlacement[];
  widths: Record<LogoSize, number>;
  // Feste Platzierung, wenn `placements` leer ist. Bruchteile des Formats.
  fixed?: { width: number; right: number; bottom: number; opacity: number };
};

// --- Das Pflichtteil -------------------------------------------------------
export type BrandCore = {
  id: string;
  label: string;
  tokens: Record<string, string>;
  type: TypeSpec;
  surfaces: Surface[];
  roles: Record<string, TextRole>;
  layouts: Layout[];
  logo: LogoSpec;
  formats: Dimension[];
  // Satzkante: Bruchteil der Breite, gilt links wie rechts.
  margin: number;
  // Innenabstand einer inhaltsbemessenen Flaeche, Bruchteil der Breite.
  bandPadding: number;
  // Bildnachweis: Beschriftung je Bildart, "" = kein Nachweis.
  creditLabel: Record<string, string>;
  // Grund hinter dem Export. JPEG hat kein Alpha, es muss etwas darunter
  // liegen; ausgeschrieben, weil html-to-image keine Custom Properties aufloest.
  exportBackground: string;
};

// ===========================================================================
// FAEHIGKEITEN
// ===========================================================================

export type PaletteKey = string;

export type PaletteEntry = {
  label: string;
  bg: string;
  on: string;
  flush: string;
};

// Frei waehlbare Sticker-Farben samt ihren Kombinationsregeln. SZ hat das
// nicht: dort folgt die Textfarbe zwingend aus der Flaeche.
export type ColorCapability = {
  palette: Record<PaletteKey, PaletteEntry>;
  order: PaletteKey[];
  adjacent: (a: PaletteKey, b: PaletteKey) => boolean;
  secondaryFor: (main: PaletteKey) => PaletteKey;
  markSlots: PaletteKey[];
};

// Gekippte Sticker-Stapel (freshs Claim). Rein geometrisch.
export type StickerCapability = {
  mainWeight: number;
  secondaryWeight: number;
  padX: number;
  padY: number;
  lineTight: number;
  overlapWithin: number;
  overlapBetween: number;
  tiltRange: number;
  offsetRange: number;
  secondaryMax: number;
  autoSize: { min: number; max: number };
};

export type HueZone = {
  from: number;
  to: number;
  keep?: boolean;
  hue?: number;
  minSaturation?: number;
  saturation?: [number, number];
};

export type ColorSnap = {
  neutralBelowSaturation: number;
  neutralLightAbove: number;
  neutralDarkHue: number;
  neutralDarkSaturation: number;
  zones: HueZone[];
};

// Bildbehandlung: Farb-Grade, harter Hue-Snap, Personen-Looks. SZ zeigt Fotos
// unveraendert und hat davon nichts.
export type ImageCapability = {
  grade: Grade;
  personGradeFactor: number;
  colorSnap: ColorSnap;
  personLookFilter: string;
  frameColors: { key: string; label: string; hex: string }[];
};

// Texturierter Grund (Struktur in Grau + Tint als Multiply).
export type GroundCapability = {
  structure: string;
  tint: string;
  paperUrl: string;
  sheetUrl: string;
};

// ===========================================================================

export type Brand = BrandCore & {
  colors?: ColorCapability;
  sticker?: StickerCapability;
  image?: ImageCapability;
  ground?: GroundCapability;
};

// --- Zugriff auf Faehigkeiten ---------------------------------------------
// Wer eine Faehigkeit braucht, holt sie hierueber. Fehlt sie, ist das ein
// Programmierfehler und kein Laufzeitfall: die UI, die sie braucht, darf bei
// so einer Marke gar nicht erst gerendert werden.
function need<T>(v: T | undefined, brand: Brand, what: string): T {
  if (!v) throw new Error(`Marke "${brand.id}" hat keine ${what} — diese UI darf hier nicht laufen.`);
  return v;
}

export const requireColors = (b: Brand) => need(b.colors, b, "Farbpalette");
export const requireSticker = (b: Brand) => need(b.sticker, b, "Sticker-Geometrie");
export const requireImage = (b: Brand) => need(b.image, b, "Bildbehandlung");
export const requireGround = (b: Brand) => need(b.ground, b, "Grund-Textur");

// Gespeicherten Farbschluessel gegen die Palette pruefen — ein Entwurf kann aus
// einer anderen Marke oder einer aelteren Palette stammen.
export function paletteKey(brand: Brand, v: unknown, fallback?: PaletteKey): PaletteKey {
  const c = requireColors(brand);
  if (typeof v === "string" && v in c.palette) return v;
  return fallback && fallback in c.palette ? fallback : c.order[0];
}

export function getSurface(brand: Brand, key: string | null): Surface {
  return brand.surfaces.find((s) => s.key === key) ?? brand.surfaces[0];
}

export function getLayout(brand: Brand, key: string): Layout {
  return brand.layouts.find((l) => l.key === key) ?? brand.layouts[0];
}
