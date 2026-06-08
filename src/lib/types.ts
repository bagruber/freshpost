export type StickerStyle = "rose" | "wind" | "white" | "text";

export type Claim = {
  text: string;
  caps: boolean;
  tilt: number; // Grad
  size: number; // Bruchteil der Stage-Breite (Schriftgröße)
  style: StickerStyle;
  x: number; // Mittelpunkt, Bruchteil 0..1
  y: number;
};

export const STICKER_STYLES: { value: StickerStyle; label: string }[] = [
  { value: "rose", label: "Rose" },
  { value: "wind", label: "Wind" },
  { value: "white", label: "Weiß" },
  { value: "text", label: "Nur Text" },
];
