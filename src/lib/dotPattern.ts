// Erzeugt ein organisches Punkt-Muster als PNG-Data-URL. Die Punktgröße folgt
// einem weichen Feld (mehrere überlagerte Sinuswellen) plus Jitter — also keine
// linear größer werdenden Punkte, sondern Inseln dichterer/größerer Punkte.

const fract = (v: number) => v - Math.floor(v);
const rand = (a: number, b: number) => fract(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453);

export function generateDotPattern(width: number, height: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const cell = width / 20; // Rasterabstand
  const maxR = cell * 0.46;

  // Weiches organisches Feld 0..1.
  const field = (x: number, y: number) => {
    const u = x / width, v = y / height;
    const n =
      Math.sin(u * 6.3 + 0.7) * Math.cos(v * 4.1 - 1.2) +
      Math.sin((u + v) * 5.0 + 2.0) * 0.7 +
      Math.sin(u * 11.0) * Math.sin(v * 9.0) * 0.4;
    return Math.min(1, Math.max(0, n / 2.1 / 2 + 0.5));
  };

  for (let gy = 0; gy * cell < height + cell; gy++) {
    for (let gx = 0; gx * cell < width + cell; gx++) {
      const cx = gx * cell + (gy % 2) * cell * 0.5 + (rand(gx, gy) - 0.5) * cell * 0.5;
      const cy = gy * cell + (rand(gx + 3.1, gy + 7.7) - 0.5) * cell * 0.5;
      const f = field(cx, cy);
      const r = maxR * (0.12 + f * f * 0.95); // quadratische Kurve → mehr Kontrast
      if (r < 0.4) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120, 210, 204, ${0.025 + f * 0.055})`; // sehr dezent, wind-ish
      ctx.fill();
    }
  }
  return canvas.toDataURL("image/png");
}
