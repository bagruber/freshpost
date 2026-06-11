// Zentrale Design-Stellschrauben, die wir beim Iterieren am häufigsten anfassen.

// Zufallsbereiche für „Look würfeln" — voller Neigungsbereich, kräftiger Versatz.
export const RANDOM = {
  tiltDeg: 9, // ±9°
  offset: 0.3, // ±0.30 der Main-Breite
};

// Auto-Größe (Standard-Mode): erlaubter Bruchteil der Stage-Breite.
export const AUTO_SIZE_CLAMP = { min: 0.05, max: 0.16 };

// Slider-Bereiche.
export const SLIDER = {
  stdSize: { min: 50, max: 110, step: 1 }, // Standard: % der Auto-Größe
  mainSize: { min: 4, max: 18, step: 0.5 }, // Advanced: in % der Breite (Wert ×100)
  tiltDeg: { min: -12, max: 12, step: 0.1 },
  offset: { min: -50, max: 50, step: 1 }, // in % der Main-Breite
  illuSize: { min: 15, max: 95, step: 1 }, // Illustrations-/Personenbreite in % der Stage
  frameThickness: { min: 2, max: 30, step: 1 }, // Rahmen-Dicke (Stage-px)
  frameRough: { min: 0, max: 32, step: 1 }, // Rahmen-Rauheit (Displacement)
  secScaleMin: 25, // Max kommt aus SEC_MAX
};

// Logo-Sticker: Breite als Bruchteil der Stage-Breite (bewusst nur zwei
// seriöse Stufen).
export const LOGO_WIDTH = { s: 0.14, m: 0.2 } as const;

// Startwerte.
export const DEFAULTS = {
  mainSize: 0.11,
  stdScale: 1,
  illuScale: 0.45,
  personScale: 0.55,
  frameThickness: 12,
  frameRough: 11,
  claimY: 0.62,
  imgStrength: 50, // Standard CI-Look-Regler (0..100)
  gradeFactor: 0.5, // Advanced-Grade initial = GRADE_BASE × 0.5
};
