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
  secScaleMin: 25, // Max kommt aus SEC_MAX
};

// Startwerte.
export const DEFAULTS = {
  mainSize: 0.11,
  stdScale: 1,
  claimY: 0.62,
  imgStrength: 50, // Standard CI-Look-Regler (0..100)
  gradeFactor: 0.5, // Advanced-Grade initial = GRADE_BASE × 0.5
};
