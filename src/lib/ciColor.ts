// Schiebt eine beliebige Farbe in den fresh-CI-Farbraum. Jede Farbe fällt in
// genau eine von fünf Gruppen:
//   1. Rose   – rötlich/magenta  → Hue 342°, Sättigung sehr hoch (≥0.90)
//   2. Wind   – grün/teal/cyan   → Hue 178°, recht gesättigt (≥0.70)
//   3. River  – blau/violett + dunkle Neutraltöne → Hue 198°, moderat
//   4. Weiß/Hellgrau – helle Neutraltöne → entsättigt
//   5. Rest   – gelb/orange/braun/Hauttöne → bleibt unverändert
// Hue wird voll gesnappt (Akzente sollen sichtbar werden), Helligkeit bleibt.

export type RGB = { r: number; g: number; b: number };

const ROSE_H = 342;
const WIND_H = 178;
const RIVER_H = 198;

const NEUTRAL_S = 0.16; // darunter = Neutralton
const NEUTRAL_LIGHT_V = 0.45; // hell→weiß/grau, dunkel→river

function rgbToHsv({ r, g, b }: RGB): [number, number, number] {
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

function hsvToRgb(h: number, s: number, v: number): RGB {
  h = ((h % 360) + 360) % 360;
  const i = Math.floor(h / 60) % 6, f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const tbl: [number, number, number][] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]];
  const c = tbl[i];
  return { r: Math.round(c[0] * 255), g: Math.round(c[1] * 255), b: Math.round(c[2] * 255) };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function mapColorToCI(rgb: RGB): RGB {
  const [h, s, v] = rgbToHsv(rgb);

  // Neutraltöne: hell → Grau/Weiß, dunkel → River.
  if (s < NEUTRAL_S) {
    if (v > NEUTRAL_LIGHT_V) return hsvToRgb(0, 0, v);
    return hsvToRgb(RIVER_H, 0.5, v);
  }

  // Rest (warm): gelb/orange/braun/Haut bleibt unverändert.
  if (h >= 18 && h < 70) return rgb;

  // Grün/Teal/Cyan → Wind.
  if (h >= 70 && h < 195) return hsvToRgb(WIND_H, Math.max(0.7, s), v);

  // Blau/Violett → River (moderat gesättigt).
  if (h >= 195 && h < 290) return hsvToRgb(RIVER_H, clamp(s, 0.4, 0.66), v);

  // Rest des Kreises (Magenta/Pink/Rot) → Rose, sehr gesättigt.
  return hsvToRgb(ROSE_H, Math.max(0.9, s), v);
}
