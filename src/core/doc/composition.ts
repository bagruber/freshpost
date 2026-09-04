// Das gemeinsame Dokumentmodell. Ein Beitrag ist eine Folge aus 1..n Frames:
// einer davon ist ein Einzelpost, mehrere sind ein Karussell. Damit gibt es
// eine Datenstruktur statt zweier, und eine neue Faehigkeit wird einmal gebaut.
//
// Die Bausteine selbst kennt der Kern NICHT im Detail: `layoutId` und die
// Schluessel in `text` verweisen auf Rollen und Layouts, die das Marken-Paket
// deklariert. Der Kern misst, ordnet an und exportiert — was es zu ordnen
// gibt, sagt die Marke.

export type MediaKind = "photo" | "illustration";

export type MediaItem = {
  url: string;
  name: string;
  kind: MediaKind;
  credit: string; // Bildnachweis ohne Praefix ("Florian Ullmann")
  // Ausschnitt: Versatz als Bruchteil des Formats, Zoom als Faktor.
  offX: number;
  offY: number;
  scale: number;
};

export type Frame = {
  id: string;
  layoutId: string;
  surfaceKey: string | null; // null = Layout ohne Flaeche
  text: Record<string, string>; // Rollenschluessel → Inhalt
  media: MediaItem[];
};

export type Composition = {
  brandId: string;
  formatKey: string;
  frames: Frame[];
};

export const MAX_FRAMES = 10;

let seq = 0;
export const frameId = () => `f${Date.now().toString(36)}${(seq++).toString(36)}`;

export function emptyMedia(url: string, name: string, kind: MediaKind = "photo"): MediaItem {
  return { url, name, kind, credit: "", offX: 0, offY: 0, scale: 1 };
}

// Nur die Rollen behalten, die das gewaehlte Layout auch anzeigt — sonst
// schleppt ein Frame nach dem Layoutwechsel unsichtbaren Text mit sich herum,
// der beim Zurueckwechseln ueberraschend wieder auftaucht.
export function pruneText(text: Record<string, string>, slots: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of slots) if (text[key]) out[key] = text[key];
  return out;
}

export function patchFrame(comp: Composition, id: string, patch: Partial<Frame>): Composition {
  return { ...comp, frames: comp.frames.map((f) => (f.id === id ? { ...f, ...patch } : f)) };
}

export function setText(frame: Frame, role: string, value: string): Frame {
  return { ...frame, text: { ...frame.text, [role]: value } };
}
