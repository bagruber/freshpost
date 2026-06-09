import type { Claim } from "./types";
import { SEC_MAX } from "./types";
import type { Dimension } from "./dimensions";
import { unitWidth } from "./measure";
import { buildSegments, segUnitHeight, BOX_W_PAD } from "./boxes";
import { AUTO_SIZE_CLAMP } from "./config";

// Automatische Main-Schriftgröße (Bruchteil der Stage-Breite), sodass der
// gesamte Stack in die Safety-Zone passt. Standard-Mode nutzt das mit der
// festen Sekundärgröße (2/3).
export function autoMainSize(claim: Claim, dim: Dimension): number {
  const segs = buildSegments(claim, SEC_MAX);
  const safeW = dim.width * (1 - dim.safe.left - dim.safe.right);
  const safeH = dim.height * (1 - dim.safe.top - dim.safe.bottom);

  let maxPx = Infinity;

  // Breiten-Constraint: breiteste Zeile je Sektion.
  for (const seg of segs) {
    for (const line of seg.lines) {
      const t = seg.cap ? line.toUpperCase() : line;
      const w = (unitWidth(t, seg.weight) + BOX_W_PAD) * seg.ratio;
      if (w > 0) maxPx = Math.min(maxPx, safeW / w);
    }
  }

  // Höhen-Constraint: Summe der Sektionshöhen minus Grenzüberlappungen.
  let unitH = 0;
  for (const seg of segs) {
    unitH += (segUnitHeight(seg.lines.length) - seg.overlapTop) * seg.ratio;
  }
  maxPx = Math.min(maxPx, safeH / unitH);

  const frac = maxPx / dim.width;
  return Math.max(AUTO_SIZE_CLAMP.min, Math.min(AUTO_SIZE_CLAMP.max, frac));
}
