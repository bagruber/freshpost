import { mapColorToCI } from "./ciColor";
import { MAX_FILE_BYTES } from "./image";

// Personen-Bilder: freigestellte PNGs/WebPs werden direkt übernommen; normale
// Fotos (JPG oder PNG/WebP ohne Transparenz) werden im Browser freigestellt
// (siehe removeBg.ts). Laden als Data-URL; optional per-Pixel Richtung CI
// umfärben (Alpha bleibt erhalten).

export const PERSON_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type PersonError = "type" | "size" | "decode" | "removal";

export const PERSON_ERROR_TEXT: Record<PersonError, string> = {
  type: "Nur JPG, PNG oder WebP.",
  size: "Datei zu groß (max. 15 MB).",
  decode: "Bild konnte nicht gelesen werden.",
  removal: "Freistellen fehlgeschlagen — bitte anderes Bild versuchen.",
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

// Braucht das Bild Freistellung? JPG hat nie Alpha; PNG/WebP werden klein
// dekodiert und auf transparente Pixel geprüft (vorhandene Transparenz =
// schon freigestellt).
export async function needsCutout(file: File): Promise<boolean> {
  if (file.type === "image/jpeg") return true;
  const bitmap = await createImageBitmap(file).catch(() => {
    throw "decode" satisfies PersonError;
  });
  try {
    const scale = Math.min(1, 128 / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) throw "decode" satisfies PersonError;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] < 250) return false;
    }
    return true;
  } finally {
    bitmap.close();
  }
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
