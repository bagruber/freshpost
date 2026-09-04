// Textur-Overlays. Papier & Halbton werden als „Blatt" im Seitenverhältnis der
// Spannweite (span × Slide) erzeugt und in SlideView pro Slide ausgeschnitten →
// beim Wischen läuft die geklebte-Papier-Struktur durch. Zur Performance in
// gedeckelter Auflösung gezeichnet und per background-size UNIFORM wieder
// hochskaliert (gleiches Seitenverhältnis → Halbton-Punkte bleiben rund).

import paperRaw from "../assets/glued-paper-with-wet-transparent-wrinkled-effect-gray-background-white-wet-paper-poster-template-with-crumpled-texture-realistic-posters_119445-273.avif";

const MAX_W = 1800;

let imgPromise: Promise<HTMLImageElement> | null = null;
function loadPaper(): Promise<HTMLImageElement> {
  if (!imgPromise) {
    imgPromise = (async () => {
      const img = new Image();
      img.src = paperRaw;
      await img.decode();
      return img;
    })();
  }
  return imgPromise;
}

// Paper „cover" in eine w×h-Leinwand zeichnen (ohne Verzerrung, nur beschnitten).
function coverDraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, offsetX = 0) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2 + offsetX, (h - dh) / 2, dw, dh);
}

const paperCache = new Map<string, Promise<string>>();
const halftoneCache = new Map<string, Promise<string>>();

function workSize(spanW: number, height: number): { w: number; h: number } {
  const w = Math.min(spanW, MAX_W);
  const h = Math.max(1, Math.round((w * height) / spanW));
  return { w, h };
}

// Geklebtes Papier als Blatt (spanW × height).
export function makePaperSheet(spanW: number, height: number): Promise<string> {
  const key = `${spanW}x${height}`;
  const hit = paperCache.get(key);
  if (hit) return hit;
  const p = (async () => {
    const img = await loadPaper();
    const { w, h } = workSize(spanW, height);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    // Kontrast rauf, etwas dunkler → per MULTIPLY zeichnet sich die Struktur
    // als Abdunkelung ab, ohne den Grund aufzuhellen.
    ctx.filter = "contrast(1.35) brightness(0.9)";
    coverDraw(ctx, img, w, h);
    ctx.filter = "none";
    return canvas.toDataURL("image/jpeg", 0.9);
  })();
  paperCache.set(key, p);
  return p;
}

// Halbton des Papiers als Blatt: feines Raster, Punktradius ∝ Dunkelheit.
export function makeHalftoneSheet(spanW: number, height: number): Promise<string> {
  const key = `${spanW}x${height}`;
  const hit = halftoneCache.get(key);
  if (hit) return hit;
  const p = (async () => {
    const img = await loadPaper();
    const { w, h } = workSize(spanW, height);

    const sample = document.createElement("canvas");
    sample.width = w;
    sample.height = h;
    const sctx = sample.getContext("2d")!;
    coverDraw(sctx, img, w, h);
    const data = sctx.getImageData(0, 0, w, h).data;

    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d")!;
    const cell = 4; // fein → wirkt wie geklebtes Papier
    const maxR = cell * 0.66;
    ctx.fillStyle = "#565d64";
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const i = (y * w + x) * 4;
        const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        const r = maxR * (1 - lum);
        if (r < 0.35) continue;
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return out.toDataURL("image/png");
  })();
  halftoneCache.set(key, p);
  return p;
}

// Feine, monochrome Körnung (kachelbar, synchron).
let grainCache: string | null = null;
export function makeGrain(): string {
  if (grainCache) return grainCache;
  const S = 160;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 90 + Math.floor(Math.random() * 90);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainCache = canvas.toDataURL("image/png");
  return grainCache;
}
