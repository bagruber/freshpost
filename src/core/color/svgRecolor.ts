// Faerbt alle Farbwerte in einem SVG-Text um — rein ueber Regex auf dem
// Quelltext (deckt fill/stroke/stop-color, inline-style und <style>-Bloecke ab,
// ohne DOM). Hex und rgb()/rgba() werden erkannt; benannte Farben bleiben.
//
// WIE umgefaerbt wird, entscheidet die uebergebene Abbildung — der Kern kennt
// keinen Ziel-Farbraum.

import type { RGB } from "./hsv";

export type ColorMap = (rgb: RGB) => RGB;

function clampByte(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function toHex2(n: number): string {
  return clampByte(n).toString(16).padStart(2, "0");
}

function parseChannel(s: string): number {
  s = s.trim();
  return s.endsWith("%") ? (parseFloat(s) / 100) * 255 : parseFloat(s);
}

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_RE = /rgba?\(([^)]*)\)/gi;

export function recolorSvg(svg: string, map: ColorMap): string {
  const mapHex = (match: string): string => {
    let hex = match.slice(1);
    let alpha = "";
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    } else if (hex.length === 4) {
      alpha = hex[3] + hex[3];
      hex = hex.slice(0, 3).split("").map((c) => c + c).join("");
    } else if (hex.length === 8) {
      alpha = hex.slice(6);
      hex = hex.slice(0, 6);
    } else if (hex.length !== 6) {
      return match; // unbekanntes Format
    }
    const m = map({
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    });
    return `#${toHex2(m.r)}${toHex2(m.g)}${toHex2(m.b)}${alpha}`;
  };

  const mapRgb = (match: string, inner: string): string => {
    const parts = inner.split(",");
    if (parts.length < 3) return match;
    const m = map({
      r: parseChannel(parts[0]),
      g: parseChannel(parts[1]),
      b: parseChannel(parts[2]),
    });
    const alpha = parts.length > 3 ? `, ${parts[3].trim()}` : "";
    const fn = parts.length > 3 ? "rgba" : "rgb";
    return `${fn}(${m.r}, ${m.g}, ${m.b}${alpha})`;
  };

  return svg.replace(HEX_RE, mapHex).replace(RGB_RE, mapRgb);
}
