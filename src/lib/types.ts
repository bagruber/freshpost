export type StickerStyle =
  | "rose"
  | "wind"
  | "white"
  | "river"
  | "riverMid"
  | "riverSoft";

export type Claim = {
  upper: string; // optional, nur mit main
  main: string;
  lower: string; // optional, nur mit main
  capUpper: boolean;
  capMain: boolean;
  capLower: boolean;
  upperStyle: StickerStyle;
  mainStyle: StickerStyle;
  lowerStyle: StickerStyle;
  tilt: number; // Grad, Gruppen-Neigung (-9..9)
  mainSize: number; // Bruchteil der Stage-Breite (Main-Schrift, Advanced)
  stdScale: number; // Standard-Mode: Faktor auf die Auto-Größe (overall Textgröße)
  secScale: number; // Verhältnis Oben/Unten zu Main, ≤ 2/3
  upperOffset: number; // horizontaler Versatz Oben, Bruchteil der Main-Breite
  lowerOffset: number; // horizontaler Versatz Unten, Bruchteil der Main-Breite
  x: number; // Gruppen-Mittelpunkt, Bruchteil 0..1
  y: number;
};

export const SEC_MAX = 2 / 3; // Oben/Unten max. 2/3 der Main-Größe

export const STYLES: { value: StickerStyle; label: string }[] = [
  { value: "rose", label: "Rose" },
  { value: "wind", label: "Wind" },
  { value: "white", label: "Weiß" },
  { value: "river", label: "River dunkel" },
  { value: "riverMid", label: "River mittel" },
  { value: "riverSoft", label: "River hell" },
];

export const STYLE_BG: Record<StickerStyle, string> = {
  rose: "var(--fresh-rose)",
  wind: "var(--fresh-wind)",
  white: "var(--color-bg-sticker)",
  river: "var(--fresh-river)",
  riverMid: "var(--fresh-river-mid)",
  riverSoft: "var(--fresh-river-soft)",
};

export const STYLE_FG: Record<StickerStyle, string> = {
  rose: "var(--color-text-on-rose)",
  wind: "var(--color-text-on-wind)",
  white: "var(--color-text-on-sticker)",
  river: "var(--color-text-primary)",
  riverMid: "var(--color-text-primary)",
  riverSoft: "var(--color-text-primary)",
};

// Standard-Sekundärfarbe: Weiß passt zu allem; nur bei weißem Main River,
// damit Oben/Unten sichtbar bleibt (und die Grenzregel erfüllt ist).
export function secondaryStyle(main: StickerStyle): StickerStyle {
  return main === "white" ? "river" : "white";
}

// Verbotene Nachbarschaft an Sektionsgrenzen: rose↔wind.
function clashes(a: StickerStyle, b: StickerStyle): boolean {
  return (a === "rose" && b === "wind") || (a === "wind" && b === "rose");
}

// Erlaubt an einer Sektionsgrenze: nicht identisch, kein rose↔wind.
export function boundaryOk(a: StickerStyle, b: StickerStyle): boolean {
  return a !== b && !clashes(a, b);
}
