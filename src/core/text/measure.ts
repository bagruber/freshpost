// Textbreite messen ueber einen Offscreen-Canvas. Wird fuer die automatische
// Schriftgroesse gebraucht. Misst bei 100px und skaliert linear — die Breite
// einer Zeile ist in der Schriftgroesse linear, solange kein Kerning-Hinting
// dazwischenfunkt.
//
// Die Schriftfamilie kommt von aussen: sie gehoert der Marke, und eine falsche
// Familie hier verfaelscht jede Auto-Groesse, ohne dass es auffaellt.

let ctx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  return ctx!;
}

// Breite einer Zeile pro 1px Schriftgroesse.
export function unitWidth(text: string, weight: number, fontFamily: string): number {
  const c = getCtx();
  c.font = `${weight} 100px ${fontFamily}`;
  return c.measureText(text).width / 100;
}

export function splitLines(s: string): string[] {
  return s.split("\n").map((t) => t.trim()).filter(Boolean);
}
