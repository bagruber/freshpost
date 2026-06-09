import { recolorSvg } from "./svgRecolor";
import { MAX_FILE_BYTES } from "./image";

// Illustration laden (SVG oder PNG). SVG wird als Text gehalten, damit das
// CI-Recoloring umschaltbar bleibt; PNG als Data-URL.

export const ILLU_TYPES = ["image/svg+xml", "image/png"];

export type Illu = {
  isSvg: boolean;
  svgText?: string; // Rohtext (SVG) für umschaltbares Recoloring
  pngUrl?: string; // Data-URL (PNG)
  x: number; // Mittelpunkt 0..1
  y: number;
  scale: number; // Breite als Bruchteil der Stage-Breite
};

export type IlluError = "type" | "size";

export const ILLU_ERROR_TEXT: Record<IlluError, string> = {
  type: "Nur SVG oder PNG.",
  size: "Datei zu groß (max. 15 MB).",
};

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

export async function loadIllustration(file: File): Promise<Omit<Illu, "x" | "y" | "scale">> {
  if (!ILLU_TYPES.includes(file.type)) throw "type" satisfies IlluError;
  if (file.size > MAX_FILE_BYTES) throw "size" satisfies IlluError;
  if (file.type === "image/svg+xml") {
    return { isSvg: true, svgText: await file.text() };
  }
  return { isSvg: false, pngUrl: await readDataUrl(file) };
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Quelle fürs <img>: SVG ggf. CI-umgefärbt, PNG unverändert.
export function illuSrc(illu: Illu, recolor: boolean): string {
  if (illu.isSvg) return svgDataUrl(recolor ? recolorSvg(illu.svgText!) : illu.svgText!);
  return illu.pngUrl!;
}
