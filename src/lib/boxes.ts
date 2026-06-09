import type { Claim, StickerStyle } from "./types";
import { splitLines } from "./measure";

// Gemeinsame Stack-Geometrie für Rendering (ClaimGroup) und Auto-Größe (layout).
// Jede Zeile einer Sektion ist eine eigene Box mit eigener Breite (ragged).
// Innerhalb einer Sektion überlappen die Boxen nur im Padding-Bereich, sodass
// keine Box in fremden Text schneidet, sie aber gleichfarbig verschmelzen. Der
// Schatten liegt pro Sektion auf dem Wrapper (drop-shadow um die Silhouette),
// nicht auf einzelnen Boxen — also kein Schatten innerhalb einer Sektion.

export type Segment = "upper" | "main" | "lower";

export type SegBox = {
  segment: Segment;
  lines: string[];
  cap: boolean;
  style: StickerStyle;
  weight: number;
  ratio: number; // Schriftgröße relativ zu Main
  offset: number; // horizontaler Versatz (Bruchteil der Main-Breite)
  overlapTop: number; // negativer Top-Margin relativ zur eigenen Schrift (Sektionsgrenze)
};

// Box-Geometrie (relativ zur Schriftgröße / em).
// Da Hintergründe und Text in getrennten z-Ebenen liegen (siehe ClaimGroup),
// darf die Within-Überlappung beliebig groß sein, ohne Text zu verdecken.
export const PAD_X = 0.42; // je Seite
export const PAD_Y = 0.16; // oben/unten
export const LINE_TIGHT = 0.9; // Zeilenhöhe je Box
export const OVERLAP_WITHIN = 0.32; // Zeilen einer Sektion (dichtes Verschmelzen)
export const OVERLAP_BETWEEN = 0.1; // leichte Annäherung an Sektionsgrenzen
export const BOX_W_PAD = 2 * PAD_X;

const BOX_H = LINE_TIGHT + 2 * PAD_Y; // Höhe einer Zeilen-Box in font-Einheiten

const MAIN_WEIGHT = 800;
const SEC_WEIGHT = 700;

export function buildSegments(claim: Claim, secScale: number): SegBox[] {
  const main = splitLines(claim.main);
  if (main.length === 0) {
    return [
      {
        segment: "main",
        lines: ["Dein Claim"],
        cap: claim.capMain,
        style: claim.mainStyle,
        weight: MAIN_WEIGHT,
        ratio: 1,
        offset: 0,
        overlapTop: 0,
      },
    ];
  }

  const segs: SegBox[] = [];
  const upper = splitLines(claim.upper);
  const lower = splitLines(claim.lower);

  if (upper.length) {
    segs.push({
      segment: "upper", lines: upper, cap: claim.capUpper, style: claim.upperStyle,
      weight: SEC_WEIGHT, ratio: secScale, offset: claim.upperOffset, overlapTop: 0,
    });
  }
  segs.push({
    segment: "main", lines: main, cap: claim.capMain, style: claim.mainStyle,
    weight: MAIN_WEIGHT, ratio: 1, offset: 0, overlapTop: 0,
  });
  if (lower.length) {
    segs.push({
      segment: "lower", lines: lower, cap: claim.capLower, style: claim.lowerStyle,
      weight: SEC_WEIGHT, ratio: secScale, offset: claim.lowerOffset, overlapTop: 0,
    });
  }

  for (let i = 1; i < segs.length; i++) segs[i].overlapTop = OVERLAP_BETWEEN;
  return segs;
}

// Höhe einer Sektion in font-Einheiten (eigene Schrift): erste Zeilen-Box voll,
// jede weitere abzüglich der Within-Überlappung.
export function segUnitHeight(lines: number): number {
  return BOX_H + (lines - 1) * (BOX_H - OVERLAP_WITHIN);
}
