// Das gemeinsame Dokumentmodell. Ein Beitrag ist eine Folge aus 1..n Frames:
// einer davon ist ein Einzelpost, mehrere sind ein Karussell. Damit gibt es
// eine Datenstruktur statt zweier, und eine neue Faehigkeit wird einmal gebaut.
//
// Die Bausteine selbst kennt der Kern NICHT im Detail: `layoutId` und die
// Schluessel in `text` verweisen auf Rollen und Layouts, die das Marken-Paket
// deklariert. Der Kern misst, ordnet an und exportiert — was es zu ordnen
// gibt, sagt die Marke.

import type { LogoCorner, LogoSize } from "./logo";

export type MediaKind = "photo" | "illustration";

export type MediaItem = {
  url: string;
  name: string;
  kind: MediaKind;
  credit: string; // Bildnachweis ohne Praefix ("Florian Ullmann")
  scale: number; // Zoom
};

// Wie eine einzelne Rolle in DIESEM Frame gesetzt ist. Was hier erlaubt ist,
// sagt die Rolle: `tint` gibt die Farbe frei, `sticker` die Box.
export type RoleStyle = { colorKey?: string; sticker?: boolean };

export type Frame = {
  id: string;
  layoutId: string;
  surfaceKey: string | null; // null = Layout ohne Flaeche
  text: Record<string, string>; // Rollenschluessel → Inhalt
  roleStyle: Record<string, RoleStyle>;
  // Neigung der Sticker-Gruppe in Grad. Gilt fuer alle Rollen des Frames
  // gemeinsam — einzeln gekippt zerfaellt der Satz.
  tilt: number;
  media: MediaItem[];
  // Ausschnitt-Versatz der ganzen Bildgruppe, Bruchteile des Formats.
  mediaOffX: number;
  mediaOffY: number;
  tone: boolean; // tonal eingefaerbt statt vollfarbig
  roughFrame: boolean; // raue Sticker-Kante um die Bildgruppe
};

// Textur-Intensitaeten, 0..100 je Verfahren (siehe core/render/ground).
export type TextureLevels = Record<string, number>;

export type Composition = {
  brandId: string;
  formatKey: string;
  // Durchlaufender Grund: EINE Flaeche, die sich ueber alle Frames erstreckt,
  // sodass ein Verlauf beim Wischen weiterlaeuft. null = jeder Frame malt
  // seine eigene Flaeche.
  groundKey: string | null;
  texBack: TextureLevels; // Textur hinter dem Inhalt
  texFront: TextureLevels; // Textur davor, auch ueber Text und Bild
  progress: "none" | "top" | "bottom";
  logoKey: string | null;
  logoCorner: LogoCorner;
  logoSize: LogoSize;
  frames: Frame[];
};

export const MAX_FRAMES = 10;

let seq = 0;
export const frameId = () => `f${Date.now().toString(36)}${(seq++).toString(36)}`;

export const noTexture = (): TextureLevels => ({ paper: 0, halftone: 0, grain: 0 });

export function emptyMedia(url: string, name: string, kind: MediaKind = "photo"): MediaItem {
  return { url, name, kind, credit: "", scale: 1 };
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

export function setRoleStyle(frame: Frame, role: string, patch: RoleStyle): Frame {
  return { ...frame, roleStyle: { ...frame.roleStyle, [role]: { ...frame.roleStyle[role], ...patch } } };
}
