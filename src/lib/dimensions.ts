// Export-Dimensionen und Safety-Zones.
// Safety-Insets sind Bruchteile (0..1) der jeweiligen Kante. Wichtige
// Elemente (Claim) bleiben innerhalb dieser Zone — bei Stories ist oben/unten
// mehr reserviert, weil dort die Instagram-UI überlagert.

export type Insets = { top: number; right: number; bottom: number; left: number };

export type Dimension = {
  key: string;
  label: string;
  width: number;
  height: number;
  safe: Insets;
};

export const DIMENSIONS: Dimension[] = [
  {
    key: "story",
    label: "Story 1080×1920",
    width: 1080,
    height: 1920,
    safe: { top: 0.14, right: 0.07, bottom: 0.16, left: 0.07 },
  },
  {
    key: "post",
    label: "Post 1080×1350",
    width: 1080,
    height: 1350,
    safe: { top: 0.06, right: 0.06, bottom: 0.06, left: 0.06 },
  },
];

export const DEFAULT_DIMENSION = DIMENSIONS[0];

export function getDimension(key: string): Dimension {
  return DIMENSIONS.find((d) => d.key === key) ?? DEFAULT_DIMENSION;
}
