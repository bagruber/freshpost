// Leichtgewichtige Auszeichnung im Fließtext, damit einzelne Wörter einen
// Marker (farbige Box hinter dem Text) bekommen — ohne Rich-Text-Editor:
//   *Wort*  → Rose-Marker
//   ~Wort~  → Wind-Marker
//   _Wort_  → Weiß-Marker
// Zeilenumbrüche trennen Absätze.

export type MarkKind = "none" | "rose" | "wind" | "white";
export type Run = { text: string; mark: MarkKind };
export type Paragraph = Run[];

const TOKEN = /(\*[^*\n]+\*|~[^~\n]+~|_[^_\n]+_)/g;

const KIND: Record<string, MarkKind> = { "*": "rose", "~": "wind", _: "white" };

function parseLine(line: string): Run[] {
  const runs: Run[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) runs.push({ text: line.slice(last, idx), mark: "none" });
    const tok = m[0];
    const inner = tok.slice(1, -1);
    runs.push({ text: inner, mark: KIND[tok[0]] });
    last = idx + tok.length;
  }
  if (last < line.length) runs.push({ text: line.slice(last), mark: "none" });
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
