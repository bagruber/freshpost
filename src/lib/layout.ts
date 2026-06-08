import type { Claim } from "./types";
import { SEC_MAX } from "./types";
import type { Dimension } from "./dimensions";
import { unitWidth } from "./measure";
import { buildBoxes, BOX_H, BOX_W_PAD } from "./boxes";

// Automatische Main-Schriftgröße (Bruchteil der Stage-Breite), sodass der
// gesamte Stack in die Safety-Zone passt. Standard-Mode nutzt das mit der
// festen Sekundärgröße (2/3).
export function autoMainSize(claim: Claim, dim: Dimension): number {
  const boxes = buildBoxes(claim, SEC_MAX);
  const safeW = dim.width * (1 - dim.safe.left - dim.safe.right);
  const safeH = dim.height * (1 - dim.safe.top - dim.safe.bottom);

  let maxPx = Infinity;

  // Breiten-Constraint je Zeile: (w + Padding) * ratio * fontMain ≤ safeW.
  for (const b of boxes) {
    const t = b.cap ? b.text.toUpperCase() : b.text;
    const w = (unitWidth(t, b.weight) + BOX_W_PAD) * b.ratio;
    if (w > 0) maxPx = Math.min(maxPx, safeW / w);
  }

  // Höhen-Constraint: Summe der Boxhöhen minus Überlappungen ≤ safeH.
  let unitH = 0;
  for (const b of boxes) unitH += (BOX_H - b.overlap) * b.ratio;
  maxPx = Math.min(maxPx, safeH / unitH);

  const frac = maxPx / dim.width;
  return Math.max(0.05, Math.min(0.16, frac));
}
