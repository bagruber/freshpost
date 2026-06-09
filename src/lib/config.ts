// Zentrale Design-Stellschrauben, die wir beim Iterieren am häufigsten anfassen.

// Zufallsbereiche für „Look würfeln".
export const RANDOM = {
  tiltDeg: 4, // ±4°
  offset: 0.22, // ±0.22 der Main-Breite
};

// Auto-Größe (Standard-Mode): erlaubter Bruchteil der Stage-Breite.
export const AUTO_SIZE_CLAMP = { min: 0.05, max: 0.16 };

// Slider-Bereiche im Advanced-Mode.
export const SLIDER = {
  mainSize: { min: 4, max: 18, step: 0.5 }, // in % der Breite (Wert ×100)
  tiltDeg: { min: -9, max: 9, step: 0.1 },
  offset: { min: -35, max: 35, step: 1 }, // in % der Main-Breite
  secScaleMin: 25, // Max kommt aus SEC_MAX
};

// Startwerte.
export const DEFAULTS = {
  mainSize: 0.11,
  claimY: 0.62,
  imgStrength: 50, // Standard CI-Look-Regler (0..100)
  gradeFactor: 0.5, // Advanced-Grade initial = GRADE_BASE × 0.5
};
