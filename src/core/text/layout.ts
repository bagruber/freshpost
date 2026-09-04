import type { Claim } from "../doc/claim";
import type { Dimension } from "../canvas/dimension";
import type { Brand } from "../../brand/contract";
import { unitWidth } from "./measure";
import { buildSegments, segUnitHeight, boxWidthPad } from "./boxes";

// Automatische Main-Schriftgroesse (Bruchteil der Stage-Breite), sodass der
// gesamte Stack in die Safety-Zone passt. Zwei Grenzen zaehlen: die breiteste
// Zeile und die Gesamthoehe — die kleinere gewinnt.

export function autoMainSize(claim: Claim, dim: Dimension, brand: Brand): number {
  const st = brand.sticker;
  const segs = buildSegments(claim, st.secondaryMax, st);
  const safeW = dim.width * (1 - dim.safe.left - dim.safe.right);
  const safeH = dim.height * (1 - dim.safe.top - dim.safe.bottom);
  const pad = boxWidthPad(st);

  let maxPx = Infinity;

  // Breiten-Constraint: breiteste Zeile je Sektion.
  for (const seg of segs) {
    for (const line of seg.lines) {
      const t = seg.cap ? line.toUpperCase() : line;
      const w = (unitWidth(t, seg.weight, brand.type.display) + pad) * seg.ratio;
      if (w > 0) maxPx = Math.min(maxPx, safeW / w);
    }
  }

  // Hoehen-Constraint: Summe der Sektionshoehen minus Grenzueberlappungen.
  let unitH = 0;
  for (const seg of segs) {
    unitH += (segUnitHeight(seg.lines.length, st) - seg.overlapTop) * seg.ratio;
  }
  maxPx = Math.min(maxPx, safeH / unitH);

  const frac = maxPx / dim.width;
  return Math.max(st.autoSize.min, Math.min(st.autoSize.max, frac));
}
