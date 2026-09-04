// Kleine Pruef-Kombinatoren fuer gespeicherte Entwuerfe. Alles, was aus
// localStorage kommt, ist fremd: aeltere Schema-Version, halb geschriebenes
// JSON, von Hand editiert. Jeder Wert bekommt daher einen Default statt eines
// Wurfs — ein kaputtes Feld darf nicht den ganzen Entwurf kosten.

export function obj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

export function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function bool(v: unknown, def: boolean): boolean {
  return typeof v === "boolean" ? v : def;
}

export function inSet<T extends string>(v: unknown, set: readonly T[], def: T): T {
  return typeof v === "string" && (set as readonly string[]).includes(v) ? (v as T) : def;
}

export function num(v: unknown, lo: number, hi: number, def: number): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
}

// Liest/schreibt einen Entwurf. Faellt still zurueck, wenn kein Speicher da
// ist (privater Modus, Kontingent voll) — Persistenz ist Komfort, kein Muss.
export function readStore<T>(key: string, parse: (raw: unknown) => T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function writeStore(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* kein Speicher → still ueberspringen */
  }
}
