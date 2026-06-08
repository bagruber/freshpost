// Export-Dimensionen und Safety-Zones.
// Safety-Insets werden in absoluten Export-Pixeln definiert und hier in
// Bruchteile (0..1) umgerechnet. Wichtige Elemente (Claim) bleiben in der Zone;
// bei Stories ist unten am meisten reserviert (Instagram-UI).

export type Insets = { top: number; right: number; bottom: number; left: number };

export type Dimension = {
  key: string;
  label: string;
  width: number;
  height: number;
  safe: Insets; // Bruchteile
};

function make(
  key: string,
  label: string,
  width: number,
  height: number,
  px: Insets,
): Dimension {
  return {
    key,
    label,
    width,
    height,
    safe: {
      top: px.top / height,
      right: px.right / width,
      bottom: px.bottom / height,
      left: px.left / width,
    },
  };
}

export const DIMENSIONS: Dimension[] = [
  make("story", "Story 1080×1920", 1080, 1920, { top: 216, right: 54, bottom: 432, left: 54 }),
  make("post", "Post 1080×1350", 1080, 1350, { top: 216, right: 54, bottom: 216, left: 54 }),
];

export const DEFAULT_DIMENSION = DIMENSIONS[0];

export function getDimension(key: string): Dimension {
  return DIMENSIONS.find((d) => d.key === key) ?? DEFAULT_DIMENSION;
}
