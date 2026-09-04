import type { Brand, Layout, PaletteKey, Surface, TextRole } from "../../brand/contract";
import { makeDimension } from "../../core/canvas/dimension";

// Zweitmarke — existiert NUR fuer Tests und ist absichtlich so weit von fresh
// UND von SZ entfernt wie moeglich: andere Farbnamen, Serifen, keine Neigung,
// keine Logos, quadratisches Format, andere Nachbarschaftsregel.
//
// Sie ist der Mechanismus hinter der Regel "jede neue Faehigkeit an der
// Wurzel": wer etwas an einer konkreten Marke festnagelt — einen Farbnamen,
// eine Schrift, ein Format, eine Regel —, bekommt hier sofort ein rotes
// Testfeld. Ohne sie verrottet die Abstraktion still.
//
// Sie behaelt bewusst ALLE Faehigkeiten (colors, sticker, image, ground),
// waehrend SZ keine davon hat. So ist beides abgedeckt: eine Marke, die alles
// kann, und eine, die fast nichts davon kennt.
//
// Wird nie ausgeliefert — main.tsx importiert sie nicht.

const clashes = (a: PaletteKey, b: PaletteKey) =>
  (a === "sun" && b === "paper") || (a === "paper" && b === "sun");

const surfaces: Surface[] = [
  { key: "base", label: "Basis", bg: "#1d1a13", ink: "#f3efe4", muted: "rgba(243,239,228,0.6)" },
  { key: "sun", label: "Sonne", bg: "#e8b400", ink: "#14120e", muted: "rgba(20,18,14,0.6)" },
];

const roles: Record<string, TextRole> = {
  headline: {
    key: "headline", label: "Titel", font: "display", weight: 400,
    size: 0.05, lineHeight: 1.4, gapAfter: 0.04, multiline: true,
  },
  body: {
    key: "body", label: "Text", font: "body", weight: 400,
    size: 0.03, lineHeight: 1.6, gapAfter: 0, multiline: true,
    emphasis: [{ weight: 700 }],
  },
};

const layouts: Layout[] = [
  {
    key: "plain", label: "Schlicht",
    band: "full", bandSize: "auto", align: "top", textWidth: 0.8,
    slots: ["headline", "body"], media: 0,
  },
  {
    key: "halfTop", label: "Halb oben",
    // Feste Bandgroesse statt "auto" — der Renderer muss beides koennen.
    band: "top", bandSize: 0.45, align: "top", textWidth: 0.8,
    slots: ["headline"], media: 1,
  },
];

export const probe: Brand = {
  id: "probe",
  label: "Probe",

  tokens: {
    "probe-ink": "#14120e",
    "probe-sun": "#e8b400",
    "probe-paper": "#f3efe4",
    "color-bg-page": "var(--probe-ink)",
    "color-text-primary": "var(--probe-paper)",
    "illu-structure": "#f3efe4",
    "illu-tint": "#14120e",
  },

  type: {
    display: 'Georgia, "Times New Roman", serif',
    body: 'Georgia, "Times New Roman", serif',
    caps: false, // fresh setzt Versalien, diese Marke nicht
  },

  surfaces,
  roles,
  layouts,

  // Keine Logos — die Logo-UI muss dann verschwinden, nicht leer dastehen.
  logo: { options: [], placements: [{ key: "bl", label: "unten links" }], widths: { s: 0.08, m: 0.12 } },

  formats: [makeDimension("square", "Quadrat 1080×1080", 1080, 1080, { top: 60, right: 60, bottom: 60, left: 60 })],

  margin: 0.09,
  bandPadding: 0.09,
  creditLabel: { photo: "Bild:", illustration: "Zeichnung:" },
  exportBackground: "#14120e",

  // === Faehigkeiten ===
  colors: {
    palette: {
      ink: { label: "Tinte", bg: "var(--probe-ink)", on: "var(--probe-paper)", flush: "#8a8577" },
      sun: { label: "Sonne", bg: "var(--probe-sun)", on: "var(--probe-ink)", flush: "var(--probe-sun)" },
      paper: { label: "Papier", bg: "var(--probe-paper)", on: "var(--probe-ink)", flush: "var(--probe-paper)" },
    },
    order: ["ink", "sun", "paper"],
    // Andere Regel als fresh: gleiche Farbe erlaubt, aber sun neben paper nicht.
    adjacent: (a, b) => !clashes(a, b),
    secondaryFor: (main) => (main === "ink" ? "sun" : "ink"),
    markSlots: ["sun", "ink", "paper"],
  },

  sticker: {
    mainWeight: 400,
    secondaryWeight: 400,
    padX: 0.2,
    padY: 0.3,
    lineTight: 1.4,
    overlapWithin: 0, // keine Verschmelzung
    overlapBetween: 0,
    tiltRange: 0, // nichts wird gekippt
    offsetRange: 0,
    secondaryMax: 0.5,
    autoSize: { min: 0.03, max: 0.09 },
  },

  image: {
    grade: { cv: 0, wm: 0, ro: 0, wi: 0, rv: 0, bd: 0 },
    personGradeFactor: 0.5,
    colorSnap: {
      neutralBelowSaturation: 0.1,
      neutralLightAbove: 0.6,
      neutralDarkHue: 40,
      neutralDarkSaturation: 0.2,
      // Alles wird gelb — eine Zone ueber den ganzen Kreis.
      zones: [{ from: 0, to: 360, hue: 45, saturation: [0.5, 0.8] }],
    },
    personLookFilter: "grayscale(1)",
    frameColors: [{ key: "paper", label: "Papier", hex: "#f3efe4" }],
  },

  ground: {
    structure: "var(--illu-structure)",
    tint: "var(--illu-tint)",
    paperUrl: "",
    sheetUrl: "",
  },
};
