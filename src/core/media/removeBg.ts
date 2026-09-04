// Freistellen im Browser: @imgly/background-removal (AGPL-3.0 — Quellcode
// dieses Projekts ist öffentlich), lazy geladen. Das Modell (~einige 10 MB)
// kommt beim ersten Mal von der IMG.LY-CDN und läuft danach lokal im Browser —
// die Fotos verlassen das Gerät nie.

export async function removePersonBackground(src: string | Blob): Promise<string> {
  const { removeBackground } = await import("@imgly/background-removal");
  const blob = await removeBackground(src);
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(blob);
  });
}
