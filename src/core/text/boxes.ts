import type { Claim } from "../doc/claim";
import type { PaletteKey, StickerSpec } from "../../brand/contract";
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
  style: PaletteKey;
  weight: number;
  ratio: number; // Schriftgröße relativ zu Main
  offset: number; // horizontaler Versatz (Bruchteil der Main-Breite)
  overlapTop: number; // negativer Top-Margin relativ zur eigenen Schrift (Sektionsgrenze)
};

// Box-Geometrie (relativ zur Schriftgröße / em). Da Hintergründe und Text in
// getrennten z-Ebenen liegen (siehe ClaimGroup), darf die Within-Überlappung
// beliebig groß sein, ohne Text zu verdecken. Die Werte selbst sind das
// Sticker-Rezept der Marke.

export const boxWidthPad = (st: StickerSpec) => 2 * st.padX;

// Höhe einer Zeilen-Box in font-Einheiten.
const boxHeight = (st: StickerSpec) => st.lineTight + 2 * st.padY;

export function buildSegments(claim: Claim, secScale: number, st: StickerSpec): SegBox[] {
  const main = splitLines(claim.main);
  if (main.length === 0) {
    return [
      {
        segment: "main",
        lines: ["Dein Claim"],
        cap: claim.capMain,
        style: claim.mainStyle,
        weight: st.mainWeight,
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
      weight: st.secondaryWeight, ratio: secScale, offset: claim.upperOffset, overlapTop: 0,
    });
  }
  segs.push({
    segment: "main", lines: main, cap: claim.capMain, style: claim.mainStyle,
    weight: st.mainWeight, ratio: 1, offset: 0, overlapTop: 0,
  });
  if (lower.length) {
    segs.push({
      segment: "lower", lines: lower, cap: claim.capLower, style: claim.lowerStyle,
      weight: st.secondaryWeight, ratio: secScale, offset: claim.lowerOffset, overlapTop: 0,
    });
  }

  for (let i = 1; i < segs.length; i++) segs[i].overlapTop = st.overlapBetween;
  return segs;
}

// Höhe einer Sektion in font-Einheiten (eigene Schrift): erste Zeilen-Box voll,
// jede weitere abzüglich der Within-Überlappung.
export function segUnitHeight(lines: number, st: StickerSpec): number {
  const h = boxHeight(st);
  return h + (lines - 1) * (h - st.overlapWithin);
}
