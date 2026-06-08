import type { Claim } from "./types";
import type { Dimension } from "./dimensions";
import { unitWidth, splitLines } from "./measure";

// Box-Geometrie (relativ zur Schriftgröße). Padding und Zeilenhöhe skalieren
// mit der Schrift, damit die Auto-Größe linear lösbar bleibt.
export const PAD_X = 0.42; // je Seite
export const PAD_Y = 0.18; // oben/unten
export const LINE = 1.0; // Zeilenhöhe
export const SEC_RATIO = 2 / 3; // upper/lower = 2/3 der Main-Größe

const BOX_H = LINE + 2 * PAD_Y; // Höhe einer Box in font-Einheiten
const BOX_W_PAD = 2 * PAD_X; // horizontale Padding-Summe in font-Einheiten

const MAIN_WEIGHT = 800;
const SEC_WEIGHT = 700;

// Automatische Main-Schriftgröße (Bruchteil der Stage-Breite), sodass der
// gesamte Stack in die Safety-Zone passt. Simple-Mode nutzt das.
export function autoMainSize(claim: Claim, dim: Dimension): number {
  const main = splitLines(claim.main);
  if (main.length === 0) return 0.11;

  const sec = [...splitLines(claim.upper), ...splitLines(claim.lower)];
  const cap = (s: string) => (claim.caps ? s.toUpperCase() : s);
  const safeW = dim.width * (1 - dim.safe.left - dim.safe.right);
  const safeH = dim.height * (1 - dim.safe.top - dim.safe.bottom);

  let maxPx = Infinity;

  // Breiten-Constraint je Zeile: w*font + PAD ≤ safeW.
  for (const l of main) {
    const w = unitWidth(cap(l), MAIN_WEIGHT) + BOX_W_PAD;
    if (w > 0) maxPx = Math.min(maxPx, safeW / w);
  }
  for (const l of sec) {
    const w = unitWidth(cap(l), SEC_WEIGHT) + BOX_W_PAD;
    // Sekundär-Zeilen rendern mit SEC_RATIO * mainFont.
    if (w > 0) maxPx = Math.min(maxPx, safeW / (w * SEC_RATIO));
  }

  // Höhen-Constraint: Summe der Boxhöhen ≤ safeH.
  const unitH = BOX_H * (main.length + SEC_RATIO * sec.length);
  maxPx = Math.min(maxPx, safeH / unitH);

  const frac = maxPx / dim.width;
  return Math.max(0.05, Math.min(0.16, frac));
}
