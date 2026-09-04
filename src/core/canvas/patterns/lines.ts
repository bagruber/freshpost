// Erzeugt fließende, gestapelte Konturlinien (river-ähnlich) als PNG-Data-URL.
// Bewusst extrem dezent und Ton-in-Ton (nur River-Töne) — mehrere Lagen mit
// leicht unterschiedlicher Frequenz/Phase ergeben den „gestackten" Look.

// === River-Linien — hier schnell justieren ===
// Grau gezeichnet (Struktur); der dunkle Ton kommt über den Tint der Marke (multiply).
const LINES = {
  layers: 3, // gestapelte Lagen
  spacing: 0.08, // Zeilenabstand als Bruchteil der Höhe
  amp: 0.5, // Wellenamplitude als Bruchteil des Abstands
  width: 1.4, // Strichstärke (px)
  baseAlpha: 0.16, // Grund-Deckkraft
  color: "92, 100, 108", // neutrales Grau
};

export function generateLinePattern(width: number, height: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.lineWidth = LINES.width;

  const spacing = height * LINES.spacing;
  const amp = spacing * LINES.amp;

  for (let layer = 0; layer < LINES.layers; layer++) {
    const phase = layer * 1.7;
    const f1 = ((2 + layer * 0.6) * Math.PI * 2) / width;
    const f2 = ((3.3 + layer * 0.9) * Math.PI * 2) / width;
    const yShift = (layer * spacing) / LINES.layers;
    ctx.strokeStyle = `rgba(${LINES.color}, ${LINES.baseAlpha * (1 - layer * 0.18)})`;

    for (let y0 = -spacing; y0 < height + spacing; y0 += spacing) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = y0 + yShift + amp * Math.sin(x * f1 + phase) + amp * 0.5 * Math.sin(x * f2 + phase * 1.3);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  return canvas.toDataURL("image/png");
}
