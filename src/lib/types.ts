export type StickerStyle = "rose" | "wind" | "white" | "river";

export type Claim = {
  upper: string; // optional, nur mit main
  main: string;
  lower: string; // optional, nur mit main
  caps: boolean;
  mainStyle: StickerStyle;
  tilt: number; // Grad, Gruppen-Neigung
  mainSize: number; // Bruchteil der Stage-Breite (Main-Schrift)
  x: number; // Gruppen-Mittelpunkt, Bruchteil 0..1
  y: number;
};

export const MAIN_STYLES: { value: StickerStyle; label: string }[] = [
  { value: "rose", label: "Rose" },
  { value: "wind", label: "Wind" },
  { value: "white", label: "Weiß" },
  { value: "river", label: "River" },
];

export const STYLE_BG: Record<StickerStyle, string> = {
  rose: "var(--fresh-rose)",
  wind: "var(--fresh-wind)",
  white: "var(--color-bg-sticker)",
  river: "var(--fresh-river)",
};

export const STYLE_FG: Record<StickerStyle, string> = {
  rose: "var(--color-text-on-rose)",
  wind: "var(--color-text-on-wind)",
  white: "var(--color-text-on-sticker)",
  river: "var(--color-text-primary)",
};

// Robustheit: upper/lower bekommen automatisch eine Kontrastfarbe, die nie
// rose↔wind kombiniert. Weiß passt zu allem; nur bei weißem Main nehmen wir
// River, damit Sekundärtext sichtbar bleibt.
export function secondaryStyle(main: StickerStyle): StickerStyle {
  return main === "white" ? "river" : "white";
}
