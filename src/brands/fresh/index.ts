import type { Brand, LogoOption, PaletteKey } from "../../brand/contract";
import { makeDimension } from "../../core/canvas/dimension";
import { FRESH_TOKENS } from "./tokens";
import paperUrl from "./assets/paper.jpg";
import sheetUrl from "./assets/glued-paper.avif";

// Das Marken-Paket „fresh" (kommunalpolitische Waehlervereinigung,
// Moosburg/Langenbach). Alles, was diese Marke ausmacht, steht hier —
// der Kern unter src/core/ enthaelt davon nichts.

// Logos als Build-Zeit-Glob. Leerer Ordner → leere Liste → die Logo-UI bleibt
// ausgeblendet. Logos werden unveraendert gerendert; CI-konforme Farben
// muessen im SVG stecken.
const logoFiles = import.meta.glob("./assets/logos/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const logos: LogoOption[] = Object.entries(logoFiles)
  .map(([path, url]) => {
    const key = path.split("/").pop()!.replace(/\.svg$/i, "");
    return { key, label: key.replace(/[-_]+/g, " "), url };
  })
  .sort((a, b) => a.label.localeCompare(b.label, "de"));

// Verbotene Nachbarschaft an Sektionsgrenzen: rose↔wind. Die beiden
// Primaerfarben nebeneinander sind laut Cheat Sheet die eine Kombination,
// die nicht vorkommen darf.
const clashes = (a: PaletteKey, b: PaletteKey) =>
  (a === "rose" && b === "wind") || (a === "wind" && b === "rose");

export const fresh: Brand = {
  id: "fresh",
  label: "fresh",
  tokens: FRESH_TOKENS,

  palette: {
    rose: { label: "Rose", bg: "var(--fresh-rose)", on: "var(--color-text-on-rose)", flush: "var(--fresh-rose)" },
    wind: { label: "Wind", bg: "var(--fresh-wind)", on: "var(--color-text-on-wind)", flush: "var(--fresh-wind)" },
    white: { label: "Weiß", bg: "var(--color-bg-sticker)", on: "var(--color-text-on-sticker)", flush: "#eef3f4" },
    river: { label: "River dunkel", bg: "var(--fresh-river)", on: "var(--color-text-primary)", flush: "var(--fresh-river-soft)" },
    riverMid: { label: "River mittel", bg: "var(--fresh-river-mid)", on: "var(--color-text-primary)", flush: "var(--fresh-river-soft)" },
    riverSoft: { label: "River hell", bg: "var(--fresh-river-soft)", on: "var(--color-text-primary)", flush: "var(--fresh-river-soft)" },
  },

  colors: {
    order: ["rose", "wind", "white", "river", "riverMid", "riverSoft"],
    // Erlaubt an einer Sektionsgrenze: nicht identisch, kein rose↔wind.
    adjacent: (a, b) => a !== b && !clashes(a, b),
    // Weiß passt zu allem; nur bei weissem Main River, damit Oben/Unten
    // sichtbar bleibt (und die Grenzregel erfuellt ist).
    secondaryFor: (main) => (main === "white" ? "river" : "white"),
    markSlots: ["rose", "wind", "white"],
    exportBackground: "#132026", // --fresh-dark-d, ausgeschrieben: html-to-image
    // loest keine Custom Properties auf.
  },

  type: {
    display: '"Barlow Condensed", "Helvetica Neue", sans-serif',
    body: '"Raleway", "Helvetica Neue", sans-serif',
    caps: true,
  },

  sticker: {
    mainWeight: 800,
    secondaryWeight: 700,
    padX: 0.42,
    padY: 0.16,
    lineTight: 0.9,
    overlapWithin: 0.32,
    overlapBetween: 0.1,
    tiltRange: 9, // ±9°
    offsetRange: 0.3, // ±0.30 der Main-Breite
    secondaryMax: 2 / 3,
    autoSize: { min: 0.05, max: 0.16 },
  },

  image: {
    // Empfohlener Voll-Look (Reset-Defaults der Filter-Vorlage), 0..1.
    grade: { cv: 0.45, wm: 0.2, ro: 0.5, wi: 0.5, rv: 0.5, bd: 0.55 },
    // Personen bekommen denselben weichen Foto-Grade in voller Staerke —
    // bewusst nicht den harten Hue-Snap, der schob Gesichtspartien Richtung
    // Burgund.
    personGradeFactor: 1,
    colorSnap: {
      neutralBelowSaturation: 0.16,
      neutralLightAbove: 0.45,
      neutralDarkHue: 198, // River
      neutralDarkSaturation: 0.5,
      zones: [
        { from: 18, to: 70, keep: true }, // gelb/orange/braun/Haut bleibt
        { from: 70, to: 195, hue: 178, minSaturation: 0.7 }, // gruen/teal/cyan → Wind
        { from: 195, to: 290, hue: 198, saturation: [0.4, 0.66] }, // blau/violett → River
        { from: 290, to: 18, hue: 342, minSaturation: 0.9 }, // magenta/pink/rot → Rose
      ],
    },
    personLookFilter: "grayscale(1) brightness(1.05) sepia(1) hue-rotate(155deg) saturate(2.2)",
    frameColors: [
      { key: "white", label: "Weiß", hex: "#ffffff" },
      { key: "river", label: "River hell", hex: "#466e7f" },
    ],
  },

  surface: {
    structure: "var(--illu-structure)",
    tint: "var(--illu-tint)",
    paperUrl,
    sheetUrl,
    // Sehr dunkle River-Shades; laufen ueber alle Slides einer Folge durch.
    gradients: [
      { key: "night", label: "Nacht", css: "linear-gradient(104deg, #030506 0%, #0b1c23 50%, #04080a 100%)" },
      { key: "deep", label: "Tiefsee", css: "linear-gradient(104deg, #020506 0%, #0a1e26 46%, #0a222a 76%, #020405 100%)" },
      { key: "ember", label: "Rose-Hauch", css: "linear-gradient(104deg, #040607 0%, #16070f 48%, #071319 100%)" },
    ],
    // Textflaechen — nie Weiss, immer River.
    tones: [
      { key: "deep", label: "River dunkel", hex: "#0c1c23" },
      { key: "mid", label: "River", hex: "#173743" },
      { key: "soft", label: "River hell", hex: "#295260" },
    ],
  },

  logo: {
    options: logos,
    // Bewusst wenige, feste Positionen — unten in der Safety-Zone.
    placements: [
      { key: "bl", label: "↙" },
      { key: "bc", label: "↓" },
      { key: "br", label: "↘" },
    ],
    widths: { s: 0.11, m: 0.16 },
  },

  // Safety-Insets in Export-Pixeln. Bei Stories ist unten am meisten
  // reserviert (Instagram-UI liegt dort).
  formats: [
    makeDimension("story", "Story 1080×1920", 1080, 1920, { top: 216, right: 54, bottom: 432, left: 54 }),
    makeDimension("post", "Post 1080×1350", 1080, 1350, { top: 216, right: 54, bottom: 216, left: 54 }),
  ],
};
