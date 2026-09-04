// Schiebt eine beliebige Farbe in den Farbraum einer Marke — harter Hue-Snap,
// damit fremde Akzente sichtbar zur Marke werden statt nur getoent. Helligkeit
// bleibt immer erhalten.
//
// Die Regel selbst (welche Zonen, welche Ziel-Hues, was unangetastet bleibt)
// gehoert der Marke; hier steht nur die Mechanik.

import { rgbToHsv, hsvToRgb, clamp, type RGB } from "./hsv";
import type { ColorSnap, HueZone } from "../../brand/contract";

export type { RGB };

// Zonen duerfen ueber 0° hinweglaufen (z. B. 290 → 18).
function inZone(h: number, z: HueZone): boolean {
  return z.from <= z.to ? h >= z.from && h < z.to : h >= z.from || h < z.to;
}

function out(h: number, s: number, v: number): RGB {
  const [r, g, b] = hsvToRgb(h, s, v);
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

export function snapColor(rgb: RGB, rule: ColorSnap): RGB {
  const [h, s, v] = rgbToHsv(rgb.r, rgb.g, rgb.b);

  // Neutraltoene haben keinen brauchbaren Farbwinkel: hell wird entsaettigt,
  // dunkel bekommt den dunklen Marken-Hue (sonst wirken Schatten fremd).
  if (s < rule.neutralBelowSaturation) {
    if (v > rule.neutralLightAbove) return out(0, 0, v);
    return out(rule.neutralDarkHue, rule.neutralDarkSaturation, v);
  }

  for (const z of rule.zones) {
    if (!inZone(h, z)) continue;
    if (z.keep) return rgb;
    const hue = z.hue ?? h;
    let sat = s;
    if (z.minSaturation != null) sat = Math.max(z.minSaturation, s);
    if (z.saturation) sat = clamp(s, z.saturation[0], z.saturation[1]);
    return out(hue, sat, v);
  }

  return rgb;
}
