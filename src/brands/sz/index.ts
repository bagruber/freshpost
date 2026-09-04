import type { Brand, Layout, Surface, TextRole } from "../../brand/contract";
import { makeDimension } from "../../core/canvas/dimension";
import { SZ_TOKENS } from "./tokens";

// Marken-Paket „Süddeutsche Zeitung".
//
// Alle Farben und Maße sind aus 22 Instagram-Beiträgen gemessen, nicht
// geschätzt: Flächenfarben per Histogramm, Ränder per Kantendetektion, die
// Logo-Deckkraft rechnerisch bestätigt (Tinte auf Gelb bei 70 % ergibt
// #6a675a, gemessen #69675b).
//
// SZ ist der Gegenpol zu fresh: keine Sticker, keine Neigung, keine
// Farbauswahl je Textabschnitt, kein Bildfilter. Dafür inhaltsbemessene
// Flächen und ein Wechsel zwischen zwei Schriften als Auszeichnung. Genau
// deshalb hat sie die Fähigkeiten `colors`, `sticker`, `image` und `ground`
// nicht — sie braucht sie nicht.

// --- Flächen ----------------------------------------------------------------
// Zwei Textfarben im ganzen Korpus, sonst nichts. Die Fläche bestimmt sie.
const INK = "var(--sz-ink)";
const LIGHT = "var(--sz-light)";

const surfaces: Surface[] = [
  { key: "yellow", label: "Gelb", bg: "var(--sz-yellow)", ink: INK, muted: "rgba(42,41,57,0.7)" },
  { key: "cream", label: "Creme", bg: "var(--sz-cream)", ink: INK, muted: "rgba(42,41,57,0.7)" },
  { key: "blush", label: "Blush", bg: "var(--sz-blush)", ink: INK, muted: "rgba(42,41,57,0.7)" },
  { key: "wine", label: "Weinrot", bg: "var(--sz-wine)", ink: LIGHT, muted: "rgba(250,250,250,0.7)" },
  { key: "navy", label: "Navy", bg: "var(--sz-navy)", ink: LIGHT, muted: "rgba(250,250,250,0.7)" },
  { key: "charcoal", label: "Anthrazit", bg: "var(--sz-charcoal)", ink: LIGHT, muted: "rgba(250,250,250,0.7)" },
];

// --- Textrollen -------------------------------------------------------------
// Sans trägt die Aussage, Serif trägt das Gesprochene und das Gelesene.
const roles: Record<string, TextRole> = {
  kicker: {
    key: "kicker", label: "Rubrik", font: "display", weight: 700,
    size: 0.032, lineHeight: 1.25, gapAfter: 0.022, multiline: false,
    placeholder: "z. B. Krankheiten",
  },
  headline: {
    key: "headline", label: "Schlagzeile", font: "display", weight: 700,
    size: 0.072, lineHeight: 1.12, gapAfter: 0.038, multiline: true,
    placeholder: "Die Schlagzeile",
  },
  quote: {
    key: "quote", label: "Schlagzeile als Zitat", font: "body", weight: 600, italic: true,
    size: 0.066, lineHeight: 1.18, gapAfter: 0.03, multiline: true,
    placeholder: "„Ein Zitat als Aufmacher“",
  },
  dek: {
    key: "dek", label: "Vorspann", font: "display", weight: 400,
    size: 0.038, lineHeight: 1.42, gapAfter: 0.03, multiline: true,
    placeholder: "Ein bis zwei Sätze, die einordnen.",
  },
  body: {
    key: "body", label: "Fließtext", font: "body", weight: 400,
    size: 0.042, lineHeight: 1.45, gapAfter: 0.03, multiline: true,
    placeholder: "Fließtext. *So* wird ausgezeichnet.",
    // Die Auszeichnung wechselt die Schrift statt die Farbe — SZ setzt einen
    // fetten Sans-Einschub mitten in den Serifensatz.
    emphasis: [{ font: "display", weight: 700 }],
  },
  question: {
    key: "question", label: "Interview-Frage", font: "display", weight: 700,
    size: 0.042, lineHeight: 1.3, gapAfter: 0.055, multiline: true,
    placeholder: "SZ: Ihre Frage?",
    ruleAfter: true,
  },
  cta: {
    key: "cta", label: "Handlungsaufruf", font: "body", weight: 400, italic: true,
    size: 0.036, lineHeight: 1.3, gapAfter: 0, multiline: false,
    placeholder: "Link in der Bio", prefix: "› ",
  },
};

// --- Layouts ----------------------------------------------------------------
// Vier Anordnungen decken den gesamten gesichteten Korpus ab.
const layouts: Layout[] = [
  {
    key: "photoTitle", label: "Titel über Foto",
    hint: "Bild randabfallend, Titel darauf. Abdunkelung hält den Text lesbar.",
    band: "none", bandSize: "auto", align: "top", textWidth: 0.86,
    slots: ["kicker", "headline", "quote", "dek"], media: 1, scrim: true,
  },
  {
    key: "bandBottom", label: "Fläche unten",
    hint: "Bild oben, Farbfläche unten — sie wächst mit ihrem Text.",
    band: "bottom", bandSize: "auto", align: "top", textWidth: 0.82,
    slots: ["kicker", "headline", "quote", "dek", "body", "cta"], media: 1,
  },
  {
    key: "bandTop", label: "Fläche oben",
    hint: "Farbfläche am Kopf, Bild darunter.",
    band: "top", bandSize: "auto", align: "top", textWidth: 0.86,
    slots: ["kicker", "headline", "body"], media: 1,
  },
  {
    key: "fullSurface", label: "Vollfläche",
    hint: "Kein Bild — nur Farbe und Satz. Auch die Interview-Seiten.",
    band: "full", bandSize: "auto", align: "top", textWidth: 0.86,
    slots: ["question", "headline", "body", "cta"], media: 0,
  },
];

// --- Logo -------------------------------------------------------------------
// In fünf unabhängig gemessenen Beiträgen pixelgleich: Breite 401 von 1080,
// rechter Rand 70, unterer Rand 60. Keine Stufen, keine Ecken zur Wahl.
const logoUrl = new URL("./assets/wortmarke.svg", import.meta.url).href;

export const sz: Brand = {
  id: "sz",
  label: "Süddeutsche Zeitung",
  tokens: SZ_TOKENS,

  type: {
    display: '"Fira Sans", "Helvetica Neue", sans-serif',
    body: '"Source Serif 4", Georgia, serif',
    caps: false,
    // Die Hausschriften (SZ Sans / SZ Serif) sind nicht lizenziert; das hier
    // sind die nächsten Verwandten aus Google Fonts.
    substitute: true,
  },

  surfaces,
  roles,
  layouts,

  logo: {
    options: [{ key: "wortmarke", label: "Wortmarke", url: logoUrl }],
    placements: [], // leer = fest, nicht verschiebbar
    widths: { s: 0.371, m: 0.371 },
    fixed: { width: 0.371, right: 0.065, bottom: 0.0556, opacity: 0.7 },
  },

  // Ein einziges Format im gesamten Korpus. Keine Safety-Zone: SZ nutzt die
  // Ränder selbst und stellt nichts in eine geschützte Zone.
  formats: [makeDimension("post", "Post 1080×1350", 1080, 1350, { top: 0, right: 0, bottom: 0, left: 0 })],

  margin: 0.065, // 70 px von 1080, links wie rechts
  bandPadding: 0.07, // Innenabstand einer inhaltsbemessenen Fläche
  creditLabel: { photo: "Foto:", illustration: "Illustration:" },
  exportBackground: "#2a2939", // Tinte — JPEG hat kein Alpha
};
