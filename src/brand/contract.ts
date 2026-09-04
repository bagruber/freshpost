// Der Vertrag zwischen dem markenfreien Kern und einem Marken-Paket.
// Hier stehen ausschliesslich Typen — kein einziger Wert. Werte liegen unter
// src/brands/<name>/.
//
// Ein Marken-Paket liefert nicht nur Farben, sondern REGELN und GRENZEN. Das
// ist der Punkt des Werkzeugs: es setzt ein Corporate Design durch, statt es
// nur anzubieten. Der Kern besitzt den Durchsetzungs-Mechanismus, die Marke
// besitzt die Regel.

import type { Grade } from "../core/color/grade";
import type { Dimension } from "../core/canvas/dimension";
import type { LogoCorner, LogoSize } from "../core/doc/logo";

// Schluessel in die Palette der Marke. Bewusst `string` und nicht eine feste
// Union: verschiedene Marken haben verschieden viele Farben. Was gespeichert
// wurde, wird beim Laden gegen die Palette geprueft (siehe paletteKey).
export type PaletteKey = string;

export type PaletteEntry = {
  label: string;
  bg: string; // Flaeche eines Stickers
  on: string; // Text auf dieser Flaeche
  flush: string; // Textfarbe, wenn OHNE Sticker gesetzt (freistehend auf dunklem Grund)
};

// --- Farbregeln ------------------------------------------------------------
export type ColorRules = {
  // Reihenfolge der Auswahl (Chips), zugleich die erlaubten Schluessel.
  order: PaletteKey[];
  // Darf `a` unmittelbar an `b` grenzen? (fresh: nicht identisch, kein rose↔wind)
  adjacent: (a: PaletteKey, b: PaletteKey) => boolean;
  // Vorschlag fuer Oben/Unten, wenn Main auf `main` steht.
  secondaryFor: (main: PaletteKey) => PaletteKey;
  // Grundfarbe hinter dem Export (JPG hat kein Alpha, es muss etwas darunter).
  // Farben der drei Inline-Marker im Fliesstext (*wort*, ~wort~, _wort_).
  markSlots: PaletteKey[];
  // Grundfarbe hinter dem Export (JPG hat kein Alpha, es muss etwas darunter
  // liegen). Ausgeschrieben, nicht als Custom Property: html-to-image loest
  // keine CSS-Variablen auf.
  exportBackground: string;
};

// --- Schrift ---------------------------------------------------------------
export type TypeSpec = {
  display: string; // CSS font-family fuer Claims/Ueberschriften
  body: string;
  caps: boolean; // Startwert: Versalien an?
};

// --- Sticker-Rezept --------------------------------------------------------
// Die Geometrie, die den Look ausmacht. Alles in em der jeweiligen Schrift,
// damit es mit der Groesse mitwaechst.
export type StickerSpec = {
  mainWeight: number; // Schriftgewicht der Hauptzeile
  secondaryWeight: number; // Gewicht von Ober-/Unterzeile
  padX: number;
  padY: number;
  lineTight: number; // Zeilenhoehe je Box
  overlapWithin: number; // Zeilen einer Sektion verschmelzen
  overlapBetween: number; // leichte Annaeherung an Sektionsgrenzen
  tiltRange: number; // ± Grad beim Wuerfeln
  offsetRange: number; // ± Bruchteil der Main-Breite beim Wuerfeln
  secondaryMax: number; // Oben/Unten hoechstens dieser Anteil von Main
  autoSize: { min: number; max: number }; // erlaubter Anteil der Stage-Breite
};

// --- Bildbehandlung --------------------------------------------------------
// Ein Farbbereich, in den fremde Farben geschoben werden. `keep` heisst:
// dieser Bereich bleibt unangetastet (fresh laesst Haut-/Warmtoene stehen).
export type HueZone = {
  from: number; // Grad, einschliesslich
  to: number; // Grad, ausschliesslich
  keep?: boolean;
  hue?: number;
  minSaturation?: number;
  saturation?: [number, number]; // clamp
};

export type ColorSnap = {
  neutralBelowSaturation: number;
  neutralLightAbove: number; // darueber → entsaettigt, darunter → dunkelHue
  neutralDarkHue: number;
  neutralDarkSaturation: number;
  zones: HueZone[];
};

export type ImageSpec = {
  grade: Grade; // empfohlener Foto-Look
  personGradeFactor: number; // Staerke desselben Grades auf Personen
  colorSnap: ColorSnap; // harter Hue-Snap fuer SVG/Illustrationen
  personLookFilter: string; // CSS-Filter fuer den S/W-Look
  frameColors: { key: string; label: string; hex: string }[];
};

// --- Grund (Hintergrund-Rezept) -------------------------------------------
export type SurfaceSpec = {
  structure: string; // heller Grundton, auf dem die Struktur liegt
  tint: string; // Multiply-Ton darueber
  paperUrl: string; // Papierstruktur hinter einem Einzelpost
  sheetUrl: string; // geklebtes Papier, laeuft ueber mehrere Slides
  // Durchlaufende Verlaeufe (Karussell) und die Toene, die Textflaechen
  // annehmen duerfen. Beides sind Design-Entscheidungen der Marke.
  gradients: { key: string; label: string; css: string }[];
  tones: { key: string; label: string; hex: string }[];
};

// --- Logo ------------------------------------------------------------------
export type LogoOption = { key: string; label: string; url: string };
// Was eine Ecke bedeutet, weiss der Kern (unten links/mittig/rechts in der
// Safety-Zone). Die Marke waehlt aus, welche davon erlaubt sind — auch das
// ist eine CD-Regel und keine technische Grenze.
export type LogoPlacement = { key: LogoCorner; label: string };

export type LogoSpec = {
  options: LogoOption[];
  placements: LogoPlacement[];
  widths: Record<LogoSize, number>; // Bruchteil der Stage-Breite je Stufe
};

// --- Das Paket -------------------------------------------------------------
export type Brand = {
  id: string;
  label: string;
  tokens: Record<string, string>; // wird als CSS Custom Properties gesetzt
  palette: Record<PaletteKey, PaletteEntry>;
  colors: ColorRules;
  type: TypeSpec;
  sticker: StickerSpec;
  image: ImageSpec;
  surface: SurfaceSpec;
  logo: LogoSpec;
  formats: Dimension[];
};

// Gespeicherten Farbschluessel gegen die Palette pruefen. Marken haben
// verschiedene Paletten — ein Entwurf aus einer anderen Marke (oder aus einer
// aelteren Version) faellt hier auf den ersten erlaubten Wert zurueck.
export function paletteKey(brand: Brand, v: unknown, fallback?: PaletteKey): PaletteKey {
  if (typeof v === "string" && v in brand.palette) return v;
  return fallback && fallback in brand.palette ? fallback : brand.colors.order[0];
}
