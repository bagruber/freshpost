import { mapColorToCI } from "./ciColor";
import { MAX_FILE_BYTES } from "./image";

// Freigestellte Personen-PNGs (transparenter Hintergrund). Laden als Data-URL;
// optional per-Pixel Richtung CI umfärben (Alpha bleibt erhalten).

export const PERSON_TYPES = ["image/png", "image/webp"];

export type PersonError = "type" | "size" | "decode";

export const PERSON_ERROR_TEXT: Record<PersonError, string> = {
  type: "Nur PNG oder WebP (freigestellt).",
  size: "Datei zu groß (max. 15 MB).",
  decode: "Bild konnte nicht gelesen werden.",
};

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

export async function loadPersonFile(file: File): Promise<string> {
  if (!PERSON_TYPES.includes(file.type)) throw "type" satisfies PersonError;
  if (file.size > MAX_FILE_BYTES) throw "size" satisfies PersonError;
  return readDataUrl(file);
}

// Per-Pixel CI-Recolor einer Data-URL → neue Data-URL (PNG, Alpha erhalten).
export function recolorPersonToCI(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("ctx"));
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, c.width, c.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 8) continue; // (fast) transparent → überspringen
        const m = mapColorToCI({ r: d[i], g: d[i + 1], b: d[i + 2] });
        d[i] = m.r; d[i + 1] = m.g; d[i + 2] = m.b;
      }
      ctx.putImageData(id, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("decode"));
    img.src = src;
  });
}
