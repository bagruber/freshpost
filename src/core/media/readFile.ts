// Datei-Einlesen und die Groessengrenze — eine Stelle statt dreier Kopien.

export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}
