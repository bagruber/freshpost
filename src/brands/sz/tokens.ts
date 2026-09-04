// SZ-Tokens. Alle Farbwerte sind aus den Beispielbildern gemessen
// (Histogramm ueber Flaechen- und Textbereiche), nicht aus einem Styleguide
// uebernommen — es gab keinen.

export const SZ_TOKENS: Record<string, string> = {
  // === Flaechen ===
  "sz-yellow": "#fff9a8",
  "sz-cream": "#faf3e1",
  "sz-blush": "#fff8f5",
  "sz-wine": "#85474c",
  "sz-navy": "#2a2939",
  "sz-charcoal": "#393534",

  // === Tinte ===
  // Dieselbe Farbe ist Text auf hellen Flaechen UND der Navy-Grund.
  "sz-ink": "#2a2939",
  "sz-light": "#fafafa",

  // === Semantische Tokens der Bedienoberflaeche ===
  // Neutral gehalten: die Huelle soll nicht mitgebrandet sein.
  "color-bg-page": "#1a1a1e",
  "color-bg-surface": "#232329",
  "color-bg-elevated": "#2c2c33",
  "color-bg-sticker": "#ffffff",

  "color-text-primary": "#f4f4f2",
  "color-text-secondary": "rgba(244,244,242,0.72)",
  "color-text-tertiary": "rgba(244,244,242,0.48)",
  "color-text-on-rose": "#ffffff",
  "color-text-on-wind": "#1a1a1e",
  "color-text-on-sticker": "#1a1a1e",

  "color-accent-primary": "#c8a23a",
  "color-accent-secondary": "#7d8fa8",

  "color-border-subtle": "rgba(255,255,255,0.07)",
  "color-border-glass": "rgba(255,255,255,0.26)",

  // === Typografie ===
  "font-display": '"Fira Sans", "Helvetica Neue", sans-serif',
  "font-body": '"Source Serif 4", Georgia, serif',
};
