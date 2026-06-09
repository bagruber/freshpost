import type { Dimension, Insets } from "./dimensions";

// Reine Geometrie für die Claim-Gruppe auf der Stage. Positionen sind
// Bruchteile (0..1) der Stage; Größen in echten Pixeln.

export type Size = { w: number; h: number };
export type Pos = { x: number; y: number };
export type Extents = { hx: number; hy: number };

// Rotations-bewusste halbe Ausdehnung der Gruppe als Bruchteil der Stage.
export function extents(size: Size, tilt: number, dim: Dimension): Extents {
  const a = (tilt * Math.PI) / 180;
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  return {
    hx: (size.w * c + size.h * s) / 2 / dim.width,
    hy: (size.w * s + size.h * c) / 2 / dim.height,
  };
}

// Auf den Canvas begrenzen (nicht auf die Safety-Zone) — die Gruppe bleibt
// vollständig sichtbar.
export function clampToCanvas(pos: Pos, ext: Extents): Pos {
  const fit = (v: number, h: number) => (h > 0.5 ? 0.5 : Math.min(1 - h, Math.max(h, v)));
  return { x: fit(pos.x, ext.hx), y: fit(pos.y, ext.hy) };
}

// Ragt die (rotierte) Gruppe aus der Safety-Zone?
export function violatesSafe(pos: Pos, ext: Extents, safe: Insets): boolean {
  const eps = 0.002;
  return (
    pos.x - ext.hx < safe.left - eps ||
    pos.x + ext.hx > 1 - safe.right + eps ||
    pos.y - ext.hy < safe.top - eps ||
    pos.y + ext.hy > 1 - safe.bottom + eps
  );
}
