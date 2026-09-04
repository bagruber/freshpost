// RGB↔HSV — eine Umrechnung fuer alle Farbpfade (Grade-Filter, Farb-Snap).
// Bewusst ohne Rundung: die Aufrufer runden oder clampen an ihrer Grenze,
// sonst summieren sich Rundungsfehler ueber mehrere Durchgaenge.
//
// r/g/b: 0..255 · h: 0..360 · s/v: 0..1

export type RGB = { r: number; g: number; b: number };

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (mx === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return [h, mx === 0 ? 0 : d / mx, mx];
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const i = Math.floor(h / 60) % 6, f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const tbl: [number, number, number][] = [
    [v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q],
  ];
  const c = tbl[i];
  return [c[0] * 255, c[1] * 255, c[2] * 255];
}

// Kuerzester Abstand zweier Farbwinkel (-180..180).
export function hueDiff(a: number, b: number): number {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export const normalizeHue = (h: number) => ((Math.round(h) % 360) + 360) % 360;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
