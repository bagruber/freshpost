import type { Claim, StickerStyle } from "./types";
import { splitLines } from "./measure";

// Gemeinsame Stack-Geometrie für Rendering (ClaimGroup) und Auto-Größe (layout).
// Jede Eingabezeile ist eine Box; Boxen überlappen leicht, damit kein
// gleichfarbiger Leerraum dazwischen steht.

export type Segment = "upper" | "main" | "lower";

export type BoxSpec = {
  text: string;
  segment: Segment;
  cap: boolean;
  style: StickerStyle;
  weight: number;
  ratio: number; // Schriftgröße relativ zu Main (1 oder secScale)
  overlap: number; // negativer Top-Margin relativ zur eigenen Schriftgröße
};

// Box-Geometrie (relativ zur Schriftgröße).
export const PAD_X = 0.42; // je Seite
export const PAD_Y = 0.18; // oben/unten
export const LINE = 1.0; // Zeilenhöhe
export const BOX_H = LINE + 2 * PAD_Y; // Boxhöhe in font-Einheiten
export const BOX_W_PAD = 2 * PAD_X; // horizontale Padding-Summe in font-Einheiten

const OVERLAP_WITHIN = 0.34; // gleiche Sektion → starke Überlappung
const OVERLAP_BETWEEN = 0.1; // Sektionsgrenze → leichte Annäherung

const MAIN_WEIGHT = 800;
const SEC_WEIGHT = 700;

export function buildBoxes(claim: Claim, secScale: number): BoxSpec[] {
  const main = splitLines(claim.main);
  if (main.length === 0) {
    return [
      {
        text: "Dein Claim",
        segment: "main",
        cap: claim.capMain,
        style: claim.mainStyle,
        weight: MAIN_WEIGHT,
        ratio: 1,
        overlap: 0,
      },
    ];
  }

  const out: BoxSpec[] = [];
  const push = (text: string, segment: Segment) => {
    const isMain = segment === "main";
    out.push({
      text,
      segment,
      cap: segment === "upper" ? claim.capUpper : segment === "lower" ? claim.capLower : claim.capMain,
      style: segment === "upper" ? claim.upperStyle : segment === "lower" ? claim.lowerStyle : claim.mainStyle,
      weight: isMain ? MAIN_WEIGHT : SEC_WEIGHT,
      ratio: isMain ? 1 : secScale,
      overlap: 0,
    });
  };

  splitLines(claim.upper).forEach((t) => push(t, "upper"));
  main.forEach((t) => push(t, "main"));
  splitLines(claim.lower).forEach((t) => push(t, "lower"));

  // Überlappung pro Box (ab der zweiten) je nach Sektionswechsel.
  for (let i = 1; i < out.length; i++) {
    out[i].overlap = out[i].segment === out[i - 1].segment ? OVERLAP_WITHIN : OVERLAP_BETWEEN;
  }
  return out;
}
