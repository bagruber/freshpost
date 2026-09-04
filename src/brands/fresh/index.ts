import type { Brand, Layout, PaletteKey, Surface, TextRole } from "../../brand/contract";
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

const logos = Object.entries(logoFiles)
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

// --- Flaechen ---------------------------------------------------------------
// Die durchlaufenden Verlaeufe und die River-Toene aus dem Karussell, jetzt in
// einer Liste: beides sind Gruende, auf denen Text stehen kann.
const surfaces: Surface[] = [
  { key: "night", label: "Nacht", bg: "linear-gradient(104deg, #030506 0%, #0b1c23 50%, #04080a 100%)", ink: "#ffffff", muted: "rgba(255,255,255,0.7)" },
  { key: "deep", label: "Tiefsee", bg: "linear-gradient(104deg, #020506 0%, #0a1e26 46%, #0a222a 76%, #020405 100%)", ink: "#ffffff", muted: "rgba(255,255,255,0.7)" },
  { key: "ember", label: "Rose-Hauch", bg: "linear-gradient(104deg, #040607 0%, #16070f 48%, #071319 100%)", ink: "#ffffff", muted: "rgba(255,255,255,0.7)" },
  { key: "riverDeep", label: "River dunkel", bg: "#0c1c23", ink: "#ffffff", muted: "rgba(255,255,255,0.7)" },
  { key: "riverMid", label: "River", bg: "#173743", ink: "#ffffff", muted: "rgba(255,255,255,0.7)" },
  { key: "riverSoft", label: "River hell", bg: "#295260", ink: "#ffffff", muted: "rgba(255,255,255,0.7)" },
];

// --- Textrollen -------------------------------------------------------------
// Barlow Condensed traegt die Aussage, Raleway den Fliesstext — die Verteilung
// aus dem Langtext-Werkzeug, jetzt im gemeinsamen Vokabular.
const roles: Record<string, TextRole> = {
  kicker: {
    key: "kicker", label: "Überzeile", font: "display", weight: 700,
    size: 0.026, lineHeight: 1.3, tracking: 0.14, upper: true,
    gapAfter: 0.02, multiline: false, placeholder: "z. B. Kapitel 01",
  },
  headline: {
    key: "headline", label: "Überschrift", font: "display", weight: 800,
    size: 0.076, lineHeight: 1.04, gapAfter: 0.038, multiline: true,
    placeholder: "Die Überschrift",
  },
  body: {
    key: "body", label: "Fließtext", font: "body", weight: 500,
    size: 0.041, lineHeight: 1.42, gapAfter: 0.03, multiline: true,
    placeholder: "Fließtext. *Rose*, ~Wind~, _Weiß_ zeichnen aus.",
    // Bei fresh ist die Auszeichnung eine farbige Box, kein Schriftwechsel.
    emphasis: [
      { background: "var(--fresh-rose)", color: "#ffffff" },
      { background: "var(--fresh-wind)", color: "var(--fresh-dark-d)" },
      { background: "#ffffff", color: "var(--fresh-dark-d)" },
    ],
  },
  quote: {
    key: "quote", label: "Zitat", font: "body", weight: 500, italic: true,
    size: 0.06, lineHeight: 1.3, gapAfter: 0.028, multiline: true,
    placeholder: "„Ein Zitat“",
  },
  attribution: {
    key: "attribution", label: "Quelle", font: "body", weight: 600,
    size: 0.03, lineHeight: 1.35, gapAfter: 0, multiline: true,
    placeholder: "Name\nRolle",
  },
};

// --- Layouts ----------------------------------------------------------------
// Fuer den gemeinsamen Renderer. Die vier Sonder-Layouts des Langtext-
// Werkzeugs (Diagonale, Randspalte …) leben vorerst weiter in src/carousel/
// und ziehen erst nach, wenn sie migriert werden.
const layouts: Layout[] = [
  {
    key: "photoTitle", label: "Titel über Foto",
    hint: "Bild randabfallend, Text darauf.",
    band: "none", bandSize: "auto", align: "bottom", textWidth: 0.84,
    slots: ["kicker", "headline", "quote"], media: 1, scrim: true,
  },
  {
    key: "bandBottom", label: "Fläche unten",
    hint: "Bild oben, Farbfläche unten — sie wächst mit ihrem Text.",
    band: "bottom", bandSize: "auto", align: "top", textWidth: 0.84,
    slots: ["kicker", "headline", "body"], media: 1,
  },
  {
    key: "fullSurface", label: "Vollfläche",
    hint: "Kein Bild — Verlauf und Satz.",
    band: "full", bandSize: "auto", align: "top", textWidth: 0.86,
    slots: ["kicker", "headline", "body", "quote", "attribution"], media: 0,
  },
];

export const fresh: Brand = {
  id: "fresh",
  label: "fresh",
  tokens: FRESH_TOKENS,

  type: {
    display: '"Barlow Condensed", "Helvetica Neue", sans-serif',
    body: '"Raleway", "Helvetica Neue", sans-serif',
    caps: true,
  },

  surfaces,
  roles,
  layouts,

  logo: {
    options: logos,
    // Bewusst wenige, feste Positionen — unten in der Safety-Zone.
    placements: [
      { key: "bl", label: "↙" },
      { key: "bc", label: "↓" },
      { key: "br", label: "↘" },
    ],
    widths: { s: 0.11, m: 0.16 },
    fixed: { width: 0.11, right: 0.05, bottom: 0.05, opacity: 1 },
  },

  // Safety-Insets in Export-Pixeln. Bei Stories ist unten am meisten
  // reserviert (Instagram-UI liegt dort).
  formats: [
    makeDimension("story", "Story 1080×1920", 1080, 1920, { top: 216, right: 54, bottom: 432, left: 54 }),
    makeDimension("post", "Post 1080×1350", 1080, 1350, { top: 216, right: 54, bottom: 216, left: 54 }),
  ],

  margin: 0.075,
  bandPadding: 0.075,
  creditLabel: { photo: "", illustration: "" }, // fresh weist Bilder nicht aus
  exportBackground: "#132026", // --fresh-dark-d, ausgeschrieben

  // === Fähigkeiten ===
  colors: {
    palette: {
      rose: { label: "Rose", bg: "var(--fresh-rose)", on: "var(--color-text-on-rose)", flush: "var(--fresh-rose)" },
      wind: { label: "Wind", bg: "var(--fresh-wind)", on: "var(--color-text-on-wind)", flush: "var(--fresh-wind)" },
      white: { label: "Weiß", bg: "var(--color-bg-sticker)", on: "var(--color-text-on-sticker)", flush: "#eef3f4" },
      river: { label: "River dunkel", bg: "var(--fresh-river)", on: "var(--color-text-primary)", flush: "var(--fresh-river-soft)" },
      riverMid: { label: "River mittel", bg: "var(--fresh-river-mid)", on: "var(--color-text-primary)", flush: "var(--fresh-river-soft)" },
      riverSoft: { label: "River hell", bg: "var(--fresh-river-soft)", on: "var(--color-text-primary)", flush: "var(--fresh-river-soft)" },
    },
    order: ["rose", "wind", "white", "river", "riverMid", "riverSoft"],
    // Erlaubt an einer Sektionsgrenze: nicht identisch, kein rose↔wind.
    adjacent: (a, b) => a !== b && !clashes(a, b),
    // Weiß passt zu allem; nur bei weißem Main River, damit Oben/Unten
    // sichtbar bleibt (und die Grenzregel erfüllt ist).
    secondaryFor: (main) => (main === "white" ? "river" : "white"),
    markSlots: ["rose", "wind", "white"],
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
    // Personen bekommen denselben weichen Foto-Grade in voller Stärke —
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
        { from: 70, to: 195, hue: 178, minSaturation: 0.7 }, // grün/teal/cyan → Wind
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

  ground: {
    structure: "var(--illu-structure)",
    tint: "var(--illu-tint)",
    paperUrl,
    sheetUrl,
  },
};
