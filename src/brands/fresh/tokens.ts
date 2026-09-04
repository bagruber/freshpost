// fresh CI Tokens
// Quelle: fresh.design cheat sheet (uebernommen aus fresh-redesign/briefing).
//
// Das war frueher src/styles/tokens.css. Es steht jetzt hier, weil es zur
// Marke gehoert und nicht zum Werkzeug: der BrandProvider schreibt diese
// Eintraege beim Start als CSS Custom Properties auf :root. Damit gibt es
// genau eine Quelle, und die Regel "nie Hex direkt im Code" ist pruefbar.

export const FRESH_TOKENS: Record<string, string> = {
  // === Primaerfarben ===
  "fresh-rose": "#e50046",
  "fresh-wind": "#36c9c5",
  "fresh-river": "#1f4859",

  // Rose-Variationen
  "fresh-rose-light": "#ff005c",
  "fresh-rose-dark-a": "#bf0032",
  "fresh-rose-dark-b": "#9e002a",
  "fresh-rose-dark-c": "#7f0021",

  // Wind-Variationen
  "fresh-wind-light": "#00ddd2",
  "fresh-wind-dark-a": "#36b2ac",
  "fresh-wind-dark-b": "#34938a",
  "fresh-wind-dark-c": "#267f77",

  // Dark-Skala (Hintergruende, von tiefst nach hell)
  "fresh-dark-omega": "#0a1114",
  "fresh-dark-d": "#132026",
  "fresh-dark-c": "#172a33",
  "fresh-dark-b": "#19333f",
  "fresh-dark-a": "#1b3d4c",
  "fresh-river-mid": "#385866",
  "fresh-river-soft": "#466e7f",

  // Akzentfarben (sparsam einsetzen)
  "fresh-yellow": "#ffd400",
  "fresh-orange": "#f28519",
  "fresh-red": "#f22525",
  "fresh-green": "#6fb23f",
  "fresh-blue": "#0066a5",
  "fresh-purple": "#55318c",
  "fresh-pink": "#ff8dc9",
  "fresh-brown": "#996b3d",

  // === Semantische Tokens ===
  "color-bg-page": "var(--fresh-dark-d)",
  "color-bg-surface": "var(--fresh-dark-c)",
  "color-bg-elevated": "var(--fresh-dark-b)",
  "color-bg-sticker": "#ffffff",

  "color-text-primary": "#ffffff",
  "color-text-secondary": "rgba(255, 255, 255, 0.72)",
  "color-text-tertiary": "rgba(255, 255, 255, 0.48)",
  "color-text-on-rose": "#ffffff",
  "color-text-on-wind": "var(--fresh-dark-d)",
  "color-text-on-sticker": "var(--fresh-dark-d)",

  "color-accent-primary": "var(--fresh-rose)",
  "color-accent-secondary": "var(--fresh-wind)",

  "color-border-subtle": "rgba(255, 255, 255, 0.06)",
  "color-border-glass": "rgba(255, 255, 255, 0.28)",

  // === Typografie ===
  "font-display": '"Barlow Condensed", "Helvetica Neue", sans-serif',
  "font-body": '"Raleway", "Helvetica Neue", sans-serif',

  // === Hintergrund-Rezept (Illustrations-/Person-Mode) ===
  // Struktur in Grau, darueber --illu-tint als Multiply 100%.
  "illu-structure": "#ffffff",
  "illu-tint": "#0b1316",
  "paper-contrast": "1.3",
  "dots-opacity": "1",
  "lines-opacity": "1",
};
