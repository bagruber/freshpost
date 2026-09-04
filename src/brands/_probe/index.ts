import type { Brand, PaletteKey } from "../../brand/contract";
import { makeDimension } from "../../core/canvas/dimension";

// Zweitmarke — existiert NUR fuer Tests und ist absichtlich so weit von fresh
// entfernt wie moeglich: andere Farbnamen, drei statt sechs Farben, Serifen
// statt Barlow Condensed, keine Neigung, keine Logos, quadratisches Format,
// andere Nachbarschaftsregel, anderer Farb-Snap.
//
// Sie ist der Mechanismus hinter der Regel "jede neue Faehigkeit an der
// Wurzel": wer etwas an fresh festnagelt — einen Farbnamen, eine Schrift, ein
// Format, eine Regel —, bekommt hier sofort ein rotes Testfeld. Ohne sie
// verrottet die Abstraktion still, bis eine echte zweite Marke kommt.
//
// Wird nie ausgeliefert. Sie taucht in keinem Bundle auf, weil main.tsx sie
// nicht importiert.

const clashes = (a: PaletteKey, b: PaletteKey) =>
  (a === "sun" && b === "paper") || (a === "paper" && b === "sun");

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

  palette: {
    ink: { label: "Tinte", bg: "var(--probe-ink)", on: "var(--probe-paper)", flush: "#8a8577" },
    sun: { label: "Sonne", bg: "var(--probe-sun)", on: "var(--probe-ink)", flush: "var(--probe-sun)" },
    paper: { label: "Papier", bg: "var(--probe-paper)", on: "var(--probe-ink)", flush: "var(--probe-paper)" },
  },

  colors: {
    order: ["ink", "sun", "paper"],
    // Andere Regel als fresh: gleiche Farbe erlaubt, aber sun neben paper nicht.
    adjacent: (a, b) => !clashes(a, b),
    secondaryFor: (main) => (main === "ink" ? "sun" : "ink"),
    markSlots: ["sun", "ink", "paper"],
    exportBackground: "#14120e",
  },

  type: {
    display: 'Georgia, "Times New Roman", serif',
    body: 'Georgia, "Times New Roman", serif',
    caps: false, // fresh setzt Versalien, diese Marke nicht
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

  surface: {
    structure: "var(--illu-structure)",
    tint: "var(--illu-tint)",
    paperUrl: "",
    sheetUrl: "",
    gradients: [{ key: "flat", label: "Flach", css: "linear-gradient(180deg, #14120e 0%, #1d1a13 100%)" }],
    tones: [{ key: "base", label: "Basis", hex: "#1d1a13" }],
  },

  // Keine Logos — die Logo-UI muss dann verschwinden, nicht leer dastehen.
  logo: { options: [], placements: [{ key: "bl", label: "unten links" }], widths: { s: 0.08, m: 0.12 } },

  formats: [makeDimension("square", "Quadrat 1080×1080", 1080, 1080, { top: 60, right: 60, bottom: 60, left: 60 })],
};
