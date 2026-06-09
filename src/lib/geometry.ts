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

// === Hintergrund Pan/Zoom ===

export type CoverGeom = {
  imgW: number; // Cover-Breite (zoom=1) in Stage-Pixeln
  imgH: number;
  zoomMax: number; // bis 1:1 Quelle→Canvas (kein Upscaling über 100%)
};

// Cover-Geometrie: kleinste Skalierung, bei der die Quelle das Canvas füllt,
// plus der maximale Zoom, bevor die Quelle über ihre native Auflösung skaliert.
export function coverGeom(srcW: number, srcH: number, dim: Dimension): CoverGeom {
  const coverScale = Math.max(dim.width / srcW, dim.height / srcH);
  return {
    imgW: srcW * coverScale,
    imgH: srcH * coverScale,
    zoomMax: Math.max(1, 1 / coverScale),
  };
}

// Begrenzt Zoom auf [1, zoomMax] und Pan so, dass nie ein Rand sichtbar wird.
export function clampView(zoom: number, pan: Pos, g: CoverGeom, dim: Dimension): { zoom: number; pan: Pos } {
  const z = Math.min(g.zoomMax, Math.max(1, zoom));
  const maxX = Math.max(0, (g.imgW * z - dim.width) / 2);
  const maxY = Math.max(0, (g.imgH * z - dim.height) / 2);
  return {
    zoom: z,
    pan: {
      x: Math.min(maxX, Math.max(-maxX, pan.x)),
      y: Math.min(maxY, Math.max(-maxY, pan.y)),
    },
  };
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
