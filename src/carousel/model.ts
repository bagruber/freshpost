// Datenmodell des Langtext-/Karussell-Tools.
//
// Eine Folge aus 1..8 Slides mit gemeinsamem Thema (durchlaufender Verlauf +
// Struktur + Textur, Logo, Format). Jeder Slide hat einen Layout-Typ und wenig
// Inhalt.

import type { Dimension } from "../core/canvas/dimension";
import type { PaletteKey, Brand } from "../brand/contract";

export const MAX_SLIDES = 8;

// --- Layout-Vorlagen ---------------------------------------------------------
export const LAYOUTS = ["diagonal", "sidebar", "typo", "overlay"] as const;
export type LayoutType = (typeof LAYOUTS)[number];

export const LAYOUT_LABEL: Record<LayoutType, string> = {
  diagonal: "Diagonale",
  sidebar: "Randspalte",
  typo: "Vollfläche",
  overlay: "Bild-Overlay",
};

export const LAYOUT_HINT: Record<LayoutType, string> = {
  diagonal: "Bild oben, Text unten — getrennt durch den 45°-Schnitt.",
  sidebar: "Bild(er)/Person(en) seitlich, Text daneben (gut für Zitate).",
  typo: "Kein Bild — der Text ist die Gestaltung, mit Akzent-Wörtern.",
  overlay: "Bild tonal in den Hintergrund geblendet, Farbe kommt vom CI.",
};

// Wie viele Bilder ein Layout nutzt (Randspalte: bis zu drei Cutouts).
export function maxImages(layout: LayoutType): number {
  return layout === "typo" ? 0 : layout === "sidebar" ? 3 : 1;
}

// --- Sticker-/Textfarben -----------------------------------------------------
// Nur noch Schluessel in die Palette der Marke — die Werte stehen in
// brands/<marke>/. Frueher lag hier eine zweite, abweichende Farbtabelle.
export type StickerColor = PaletteKey;

// --- Bild --------------------------------------------------------------------
export type ImageMode = "normal" | "duotone";
export type SlideImage = { url: string; name: string; scale: number };

// --- Flaechen-Ton (Textflaechen; nie Weiss) ---------------------------------
// Schluessel in brand.surface.tones.
export type SurfaceTone = string;

// --- Durchlaufender Verlauf -------------------------------------------------
// Schluessel in brand.surface.gradients.
export type GradientKey = string;

// --- Textur (je Art getrennt für hinten/vorne regelbar) ----------------------
// Papier/Halbton laufen als „Blatt" über je TEXTURE_SPAN Slides; Körnung kachelt.
export const TEXTURES = ["paper", "halftone", "grain"] as const;
export type TextureMode = (typeof TEXTURES)[number];
export const TEXTURE_LABEL: Record<TextureMode, string> = { paper: "Papier", halftone: "Halbton", grain: "Körnung" };
export const TEXTURE_SPAN = 4;
export type TexLevels = Record<TextureMode, number>;
export const zeroTex = (): TexLevels => ({ paper: 0, halftone: 0, grain: 0 });

// --- Eine gerenderte Overlay-Ebene (Struktur ODER Textur) -------------------
// place "sheet": über `span` Slides geschnitten (durchlaufend);
// place "tile": gekachelt (Körnung).
export type Layer = { key: string; url: string; blend: string; opacity: number; place: "sheet" | "tile"; span: number };

export type LogoPos = "top" | "bottom";

// --- Slide -------------------------------------------------------------------
export type Slide = {
  id: string;
  layout: LayoutType;
  kicker: string;
  kickerColor: StickerColor;
  kickerSticker: boolean;
  heading: string;
  headingColor: StickerColor;
  headingSticker: boolean;
  tilt: number; // gemeinsame Neigung für die Sticker
  body: string; // Marker: *rose*, ~wind~, _weiß_
  attribution: string; // Zitat-Quelle (nur Randspalte)
  surface: SurfaceTone;
  images: SlideImage[];
  imageMode: ImageMode; // nur „overlay": tonal vs. vollfarbe
  imageRough: boolean; // „diagonal": Bild oben freigestellt/rauer Rand
  imgOffX: number; // Bild-/Gruppen-Versatz (Bruchteil), per Drag
  imgOffY: number;
};

export type CarouselDoc = {
  slides: Slide[];
  gradient: GradientKey;
  texBack: TexLevels; // Textur-Intensität hinter dem Inhalt, je Art
  texFront: TexLevels; // Textur-Intensität VOR dem Inhalt (auch über Text/Bild)
  logo: string | null;
  logoPos: LogoPos;
  dimensionKey: string;
  swipeBottom: boolean;
};

let seq = 0;
const genId = () => `s${Date.now().toString(36)}${(seq++).toString(36)}`;
export const randomTilt = () => Math.round((Math.random() * 2 - 1) * 5 * 10) / 10; // ±5°

export function makeSlide(layout: LayoutType, surface: string, main: PaletteKey, secondary: PaletteKey): Slide {
  return {
    id: genId(),
    layout,
    kicker: "",
    kickerColor: main,
    kickerSticker: false,
    heading: "",
    headingColor: secondary,
    headingSticker: false,
    tilt: randomTilt(),
    body: "",
    attribution: "",
    surface,
    images: [],
    imageMode: layout === "overlay" ? "duotone" : "normal",
    imageRough: false,
    imgOffX: 0,
    imgOffY: 0,
  };
}

// Startwerte fuer eine neue Folge. Verlauf und Flaechenton kommen aus dem
// Marken-Paket — eine andere Marke hat andere Schluessel.
export function defaultDoc(brand: Brand): CarouselDoc {
  const main = brand.colors.order[0];
  return {
    slides: [makeSlide("typo", brand.surface.tones[0].key, main, brand.colors.secondaryFor(main))],
    gradient: brand.surface.gradients[0].key,
    texBack: { paper: 24, halftone: 42, grain: 0 },
    texFront: zeroTex(),
    logo: null,
    logoPos: "bottom",
    dimensionKey: "post",
    swipeBottom: false,
  };
}

// --- Gemeinsame Typo-Skala (harmonisiert über ALLE Layouts) ------------------
export const TYPE = {
  kicker: 0.026,
  kickerTrack: 0.14,
  heading: 0.076,
  headingWeight: 800,
  body: 0.041,
  bodyLine: 1.42,
  bodyWeight: 500,
  quote: 0.06,
  attribution: 0.03,
} as const;

export function fs(dimension: Dimension, fraction: number): number {
  return Math.round(dimension.width * fraction);
}

// Breite der Textzone eines Layouts (px) — für die Vermessung der Kopf-Höhe,
// damit Absätze über Slides desselben Layouts einheitlich beginnen.
export function textZoneWidth(layout: LayoutType, width: number): number {
  return layout === "sidebar" ? width * 0.45 : width * 0.85;
}
