// Schiebt eine beliebige Farbe in den fresh-CI-Farbraum. Jede Farbe fällt in
// genau eine von fünf Gruppen:
//   1. Rose   – rötlich/magenta  → Hue 342°, Sättigung sehr hoch (≥0.90)
//   2. Wind   – grün/teal/cyan   → Hue 178°, recht gesättigt (≥0.70)
//   3. River  – blau/violett + dunkle Neutraltöne → Hue 198°, moderat
//   4. Weiß/Hellgrau – helle Neutraltöne → entsättigt
//   5. Rest   – gelb/orange/braun/Hauttöne → bleibt unverändert
// Hue wird voll gesnappt (Akzente sollen sichtbar werden), Helligkeit bleibt.

import { rgbToHsv, hsvToRgb, clamp, type RGB } from "../core/color/hsv";

export type { RGB };

const ROSE_H = 342;
const WIND_H = 178;
const RIVER_H = 198;

const NEUTRAL_S = 0.16; // darunter = Neutralton
const NEUTRAL_LIGHT_V = 0.45; // hell→weiß/grau, dunkel→river

// Die Kernfunktion rundet bewusst nicht; hier ist die Grenze nach draußen.
function toRgb(h: number, s: number, v: number): RGB {
  const [r, g, b] = hsvToRgb(h, s, v);
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

export function mapColorToCI(rgb: RGB): RGB {
  const [h, s, v] = rgbToHsv(rgb.r, rgb.g, rgb.b);

  // Neutraltöne: hell → Grau/Weiß, dunkel → River.
  if (s < NEUTRAL_S) {
    if (v > NEUTRAL_LIGHT_V) return toRgb(0, 0, v);
    return toRgb(RIVER_H, 0.5, v);
  }

  // Rest (warm): gelb/orange/braun/Haut bleibt unverändert.
  if (h >= 18 && h < 70) return rgb;

  // Grün/Teal/Cyan → Wind.
  if (h >= 70 && h < 195) return toRgb(WIND_H, Math.max(0.7, s), v);

  // Blau/Violett → River (moderat gesättigt).
  if (h >= 195 && h < 290) return toRgb(RIVER_H, clamp(s, 0.4, 0.66), v);

  // Rest des Kreises (Magenta/Pink/Rot) → Rose, sehr gesättigt.
  return toRgb(ROSE_H, Math.max(0.9, s), v);
}
