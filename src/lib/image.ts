// Bild-Upload: Validierung und Dekodierung in zwei Auflösungen — voll (für den
// Export) und klein (für die Live-Filtervorschau). Alles clientseitig.

export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const FULL_EDGE = 2160; // längste Kante für den Export (groß genug für 1:1-Zoom)
const PREVIEW_EDGE = 760; // längste Kante für die Live-Vorschau

export type ImageError = "type" | "size" | "decode";

export type LoadedImage = {
  full: ImageData;
  preview: ImageData;
};

function toImageData(bitmap: ImageBitmap, maxEdge: number): ImageData {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw "decode" satisfies ImageError;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

export async function loadBackgroundImage(file: File): Promise<LoadedImage> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw "type" satisfies ImageError;
  if (file.size > MAX_FILE_BYTES) throw "size" satisfies ImageError;

  const bitmap = await createImageBitmap(file).catch(() => {
    throw "decode" satisfies ImageError;
  });
  try {
    return {
      full: toImageData(bitmap, FULL_EDGE),
      preview: toImageData(bitmap, PREVIEW_EDGE),
    };
  } finally {
    bitmap.close();
  }
}

export const IMAGE_ERROR_TEXT: Record<ImageError, string> = {
  type: "Dateiformat nicht unterstützt. Erlaubt: JPG, PNG, WebP, AVIF.",
  size: "Datei zu groß (max. 15 MB).",
  decode: "Bild konnte nicht gelesen werden.",
};
