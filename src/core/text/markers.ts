// Leichtgewichtige Auszeichnung im Fließtext, damit einzelne Wörter einen
// Marker (farbige Box hinter dem Text) bekommen — ohne Rich-Text-Editor:
//   *Wort*  → Marker-Slot 0
//   ~Wort~  → Marker-Slot 1
//   _Wort_  → Marker-Slot 2
// Zeilenumbrüche trennen Absätze.
//
// Der Parser kennt keine Farben, nur Slots. Welche Farbe ein Slot bekommt,
// sagt die Marke (brand.colors.markSlots) — sonst stecken drei Markennamen
// in einem Textparser.

export type Run = { text: string; slot: number | null };
export type Paragraph = Run[];

const TOKEN = /(\*[^*\n]+\*|~[^~\n]+~|_[^_\n]+_)/g;

const SLOT: Record<string, number> = { "*": 0, "~": 1, _: 2 };

function parseLine(line: string): Run[] {
  const runs: Run[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) runs.push({ text: line.slice(last, idx), slot: null });
    const tok = m[0];
    const inner = tok.slice(1, -1);
    runs.push({ text: inner, slot: SLOT[tok[0]] });
    last = idx + tok.length;
  }
  if (last < line.length) runs.push({ text: line.slice(last), slot: null });
  return runs;
}

// Text → Absätze (je eine nicht-leere Zeile) aus Runs. Whitespace/Tabs INNERHALB
// einer Zeile bleiben erhalten (Rendering mit white-space: pre-wrap), damit man
// Umbrüche/Einrückung mitgestalten kann; eine leere Zeile trennt Absätze.
export function parseMarkers(text: string): Paragraph[] {
  return text
    .split(/\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseLine);
}
