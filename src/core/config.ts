// Bedien-Stellschrauben des Werkzeugs: Regler-Bereiche und Startwerte.
// Was das Aussehen der Marke bestimmt (Neigungsbereich, Auto-Groessen-Grenzen,
// Logo-Breiten, Foto-Look), steht NICHT hier, sondern im Marken-Paket.

export const SLIDER = {
  stdSize: { min: 50, max: 110, step: 1 }, // Standard: % der Auto-Groesse
  mainSize: { min: 4, max: 18, step: 0.5 }, // Advanced: % der Breite (Wert ×100)
  tiltDeg: { min: -12, max: 12, step: 0.1 },
  offset: { min: -50, max: 50, step: 1 }, // in % der Main-Breite
  illuSize: { min: 15, max: 95, step: 1 }, // Illustrations-/Personenbreite in % der Stage
  frameThickness: { min: 2, max: 30, step: 1 }, // Rahmen-Dicke (Stage-px)
  frameRough: { min: 0, max: 32, step: 1 }, // Rahmen-Rauheit (Displacement)
  secScaleMin: 25, // Max kommt aus brand.sticker.secondaryMax
};

export const DEFAULTS = {
  mainSize: 0.11,
  stdScale: 1,
  illuScale: 0.45,
  personScale: 0.55,
  frameThickness: 12,
  frameRough: 11,
  claimY: 0.62,
  imgStrength: 50, // Standard-Look-Regler (0..100)
  gradeFactor: 0.5, // Advanced-Grade initial = brand.image.grade × 0.5
};
