// Bild-Upload: Validierung, Downscale auf eine vernünftige Maximalkante,
// Rückgabe als Data-URL für den Hintergrund. Alles clientseitig.

export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_EDGE = 2160; // längste Kante nach Downscale — reicht für 1080px-Export bei 2x

export type ImageError = "type" | "size" | "decode";

export async function loadBackgroundImage(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw "type" satisfies ImageError;
  if (file.size > MAX_FILE_BYTES) throw "size" satisfies ImageError;

  const bitmap = await createImageBitmap(file).catch(() => {
    throw "decode" satisfies ImageError;
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw "decode" satisfies ImageError;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  // JPEG hält die Data-URL klein; der Hintergrund braucht keine Transparenz.
  return canvas.toDataURL("image/jpeg", 0.92);
}

export const IMAGE_ERROR_TEXT: Record<ImageError, string> = {
  type: "Dateiformat nicht unterstützt. Erlaubt: JPG, PNG, WebP, AVIF.",
  size: "Datei zu groß (max. 15 MB).",
  decode: "Bild konnte nicht gelesen werden.",
};
