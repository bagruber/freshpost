import { toCanvas } from "html-to-image";

// Rendert das Stage-Element (das in echten Export-Pixeln dimensioniert ist)
// vor `background` — JPEG hat keinen Alpha-Kanal, es muss also etwas darunter
// liegen; welche Farbe, sagt die Marke.
// zu einem JPG-Blob. Der Browser-Canvas ist sRGB, JPEG hat keinen
// Alpha-Kanal — damit ist der Export farbtreu und ohne Transparenz.
// Abgabe wahlweise als Download oder über das native Share-Sheet (mobil).

export async function renderStageToJpg(
  stage: HTMLElement,
  width: number,
  height: number,
  background: string,
): Promise<Blob> {
  // Fonts müssen geladen sein, sonst rendert html-to-image Fallback-Schriften.
  await document.fonts.ready;

  const canvas = await toCanvas(stage, {
    width,
    height,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: background,
    // Die Stage ist für die Vorschau herunterskaliert (transform: scale).
    // Für den Export auf die volle Größe zurücksetzen, sonst landet der Inhalt
    // skaliert oben links und der Rest füllt sich mit der Hintergrundfarbe.
    style: { transform: "none", transformOrigin: "top left" },
  });

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob fehlgeschlagen"))),
      "image/jpeg",
      0.95,
    ),
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Kann dieser Browser JPG-Dateien über das native Share-Sheet teilen?
// (iOS/Android: ja; Desktop-Browser meist nein → Download-Fallback.)
export function canShareJpg(): boolean {
  if (typeof navigator.canShare !== "function" || typeof navigator.share !== "function") return false;
  const probe = new File([new Uint8Array(1)], "probe.jpg", { type: "image/jpeg" });
  try {
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

// Teilt ein oder mehrere Bilder ueber das Share-Sheet. true = geteilt oder
// vom User abgebrochen; false = Teilen nicht moeglich (Aufrufer laedt dann
// herunter).
//
// Mehrere Dateien auf einmal sind der einzig brauchbare Weg fuer ein
// Karussell: mobile Browser blockieren mehrfache automatische Downloads nach
// dem ersten.
export async function shareBlob(blob: Blob | Blob[], filename: string | string[]): Promise<boolean> {
  const blobs = Array.isArray(blob) ? blob : [blob];
  const names = Array.isArray(filename) ? filename : [filename];
  if (blobs.length === 0) return false;
  const files = blobs.map((b, i) => new File([b], names[i] ?? `bild-${i + 1}.jpg`, { type: "image/jpeg" }));

  if (typeof navigator.canShare !== "function" || !navigator.canShare({ files })) return false;
  try {
    await navigator.share({ files });
    return true;
  } catch (e) {
    // Abbruch durch den User ist kein Fehler — nicht zusaetzlich downloaden.
    if (e instanceof DOMException && e.name === "AbortError") return true;
    return false;
  }
}
