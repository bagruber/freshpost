// Textbreite messen über einen Offscreen-Canvas. Wird für die automatische
// Schriftgröße (Simple-Mode) gebraucht. Misst bei 100px und skaliert linear.

let ctx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  return ctx!;
}

// Breite einer Zeile pro 1px Schriftgröße (linear skalierbar).
export function unitWidth(text: string, weight: number): number {
  const c = getCtx();
  c.font = `${weight} 100px "Barlow Condensed", sans-serif`;
  return c.measureText(text).width / 100;
}

export function splitLines(s: string): string[] {
  return s.split("\n").map((t) => t.trim()).filter(Boolean);
}
