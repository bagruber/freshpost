import type { PaletteKey } from "../../brand/contract";

// Das Dokumentmodell des Einzelposts. Farben stehen als Palettenschluessel
// drin, nicht als Werte — was ein Schluessel bedeutet, sagt die Marke.

export type Mode = "photo" | "illustration" | "person";

export type BgPattern = "paper" | "dots" | "lines" | "none";

export type PersonLook = "original" | "ci" | "bwriver";

export type Claim = {
  upper: string; // optional, nur mit main
  main: string;
  lower: string; // optional, nur mit main
  capUpper: boolean;
  capMain: boolean;
  capLower: boolean;
  upperStyle: PaletteKey;
  mainStyle: PaletteKey;
  lowerStyle: PaletteKey;
  tilt: number; // Grad, Gruppen-Neigung
  mainSize: number; // Bruchteil der Stage-Breite (Main-Schrift, Advanced)
  stdScale: number; // Standard-Mode: Faktor auf die Auto-Groesse
  secScale: number; // Verhaeltnis Oben/Unten zu Main
  upperOffset: number; // horizontaler Versatz Oben, Bruchteil der Main-Breite
  lowerOffset: number; // horizontaler Versatz Unten, Bruchteil der Main-Breite
  x: number; // Gruppen-Mittelpunkt, Bruchteil 0..1
  y: number;
};
