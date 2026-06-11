import { toCanvas } from "html-to-image";

// Rendert das Stage-Element (das in echten Export-Pixeln dimensioniert ist)
// zu einer JPG-Datei. Der Browser-Canvas ist sRGB, JPEG hat keinen
// Alpha-Kanal — damit ist der Export farbtreu und ohne Transparenz.

export async function exportStageToJpg(
  stage: HTMLElement,
  width: number,
  height: number,
  filename: string,
): Promise<void> {
  // Fonts müssen geladen sein, sonst rendert html-to-image Fallback-Schriften.
  await document.fonts.ready;

  const canvas = await toCanvas(stage, {
    width,
    height,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: "#132026",
    // Die Stage ist für die Vorschau herunterskaliert (transform: scale).
    // Für den Export auf die volle Größe zurücksetzen, sonst landet der Inhalt
    // skaliert oben links und der Rest füllt sich mit der Hintergrundfarbe.
    style: { transform: "none", transformOrigin: "top left" },
  });

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob fehlgeschlagen"))),
      "image/jpeg",
      0.92,
    ),
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
