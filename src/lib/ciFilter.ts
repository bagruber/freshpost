// CI Color-Grade-Filter, portiert aus ci_filter.html (Stand mit den Curve-,
// Warmth-, Blue-Desat- und Blue-Contrast-Änderungen bereits eingebaut).
// Reiner Per-Pixel-Pass im HSV-Raum. Betrifft ausschließlich das Hintergrundbild.

export type Grade = {
  cv: number; // Curve / Kontrast
  wm: number; // Warmth
  ro: number; // Rose-Pull
  wi: number; // Wind-Pull
  rv: number; // River-Pull
  bd: number; // Blue Desat + Contrast
};

// Empfohlener Voll-Look (entspricht den Reset-Defaults der Vorlage), 0..1.
export const GRADE_BASE: Grade = { cv: 0.45, wm: 0.2, ro: 0.5, wi: 0.5, rv: 0.5, bd: 0.55 };

export const GRADE_KEYS: (keyof Grade)[] = ["cv", "wm", "ro", "wi", "rv", "bd"];

export function scaleGrade(base: Grade, factor: number): Grade {
  return {
    cv: base.cv * factor,
    wm: base.wm * factor,
    ro: base.ro * factor,
    wi: base.wi * factor,
    rv: base.rv * factor,
    bd: base.bd * factor,
  };
}

export function isNeutral(p: Grade): boolean {
  return GRADE_KEYS.every((k) => p[k] <= 0.0001);
}

const cl = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const gauss = (x: number, s: number) => Math.exp(-(x * x) / (2 * s * s));
const ss = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const soft = (lo: number, hi: number, v: number) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
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

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const i = Math.floor(h / 60) % 6, f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const tbl: [number, number, number][] = [
    [v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q],
  ];
  const c = tbl[i];
  return [c[0] * 255, c[1] * 255, c[2] * 255];
}

function hdiff(a: number, b: number): number {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}
const normH = (h: number) => ((Math.round(h) % 360) + 360) % 360;

function buildLUTs(p: Grade) {
  const curvLUT = new Float32Array(256);
  const A = p.cv * 0.6;
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    const sinCorr = Math.sin(2 * Math.PI * x) / (2 * Math.PI);
    const gaussSup = 0.96 * Math.exp(-75 * (x - 0.5) * (x - 0.5));
    curvLUT[i] = Math.max(0, Math.min(1, x + A * sinCorr * (1 - gaussSup)));
  }

  const roseW = new Float32Array(360);
  const windW = new Float32Array(360);
  const riverW = new Float32Array(360);
  const blueW = new Float32Array(360);

  for (let i = 0; i < 360; i++) {
    roseW[i] = gauss(Math.abs(hdiff(i, 340)), 20);
    const wd = hdiff(i, 175);
    if (wd < 0) {
      windW[i] = gauss(Math.abs(wd), 12) * ss(163, 176, i) * (1 - ss(183, 200, i));
    }
    riverW[i] = gauss(Math.abs(hdiff(i, 200)), 28) * ss(185, 198, i) * (1 - ss(245, 262, i));
    blueW[i] = gauss(Math.abs(hdiff(i, 212)), 36) * ss(168, 183, i) * (1 - ss(245, 262, i));
  }

  return { curvLUT, roseW, windW, riverW, blueW };
}

// Filtert eine ImageData-Quelle und schreibt in einen neuen Uint8ClampedArray.
export function filterImageData(src: ImageData, p: Grade): ImageData {
  const lut = buildLUTs(p);
  const s0 = src.data;
  const out = new Uint8ClampedArray(s0.length);

  for (let i = 0; i < s0.length; i += 4) {
    let [h, s, v] = rgbToHsv(s0[i], s0[i + 1], s0[i + 2]);

    v = lut.curvLUT[Math.min(255, Math.round(v * 255))];
    let hi = normH(h);

    if (p.ro > 0) {
      const act = soft(0.6, 0.76, s);
      const w = lut.roseW[hi] * p.ro * act;
      if (w > 0.002) {
        h += hdiff(h, 340) * w * 0.72;
        s = Math.min(1, s + (1 - s) * lut.roseW[hi] * p.ro * act * 0.35);
        hi = normH(h);
      }
    }
    if (p.wi > 0) {
      const act = soft(0.72, 0.86, v) * soft(0.52, 0.66, s);
      const w = lut.windW[hi] * p.wi * act;
      if (w > 0.002) {
        h += hdiff(h, 175) * w * 0.7;
        s = Math.min(1, s + (1 - s) * w * 0.3);
        hi = normH(h);
      }
    }
    if (p.rv > 0) {
      const act = soft(0.65, 0.5, v);
      const w = lut.riverW[hi] * p.rv * act;
      if (w > 0.002) {
        h += hdiff(h, 200) * w * 0.68;
        s = s + (0.5 - s) * w * 0.42;
        hi = normH(h);
      }
    }
    if (p.bd > 0) {
      const bw = lut.blueW[hi];
      const satProtect = 1 - soft(0.62, 0.9, s);
      const desatW = bw * p.bd * satProtect;
      if (desatW > 0.002) s = Math.max(0, s * (1 - desatW * 0.65));
      const contrastW = bw * p.bd * satProtect * 0.4;
      if (contrastW > 0.002) {
        const vc = v - 0.5;
        v = Math.max(0, Math.min(1, v + contrastW * vc * (1 - 4 * vc * vc) * 0.5));
      }
    }

    s = Math.max(0, Math.min(1, s));
    const [r, g, b] = hsvToRgb(h, s, v);

    out[i] = cl(r * (1 + p.wm * 0.06));
    out[i + 1] = cl(g * (1 + p.wm * 0.01));
    out[i + 2] = cl(b * (1 - p.wm * 0.05));
    out[i + 3] = s0[i + 3];
  }

  return new ImageData(out, src.width, src.height);
}

// Filtert und gibt eine JPEG-Data-URL zurück (für Anzeige/Export).
export function filterToDataUrl(src: ImageData, p: Grade): string {
  const filtered = filterImageData(src, p);
  const canvas = document.createElement("canvas");
  canvas.width = filtered.width;
  canvas.height = filtered.height;
  canvas.getContext("2d")!.putImageData(filtered, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}
