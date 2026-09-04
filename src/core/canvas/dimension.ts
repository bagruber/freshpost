// Export-Dimensionen und Safety-Zones. Der Typ und der Umrechner gehoeren dem
// Kern; WELCHE Formate es gibt und wie viel Rand sie freihalten, bestimmt die
// Marke (Brand.formats) — bei Instagram-Stories liegt unten am meisten Reserve,
// aber das ist eine Design-Entscheidung, keine technische.

export type Insets = { top: number; right: number; bottom: number; left: number };

export type Dimension = {
  key: string;
  label: string;
  width: number;
  height: number;
  safe: Insets; // Bruchteile 0..1
};

// Safety-Insets werden in absoluten Export-Pixeln angegeben und hier in
// Bruchteile umgerechnet — so bleiben sie beim Formatwechsel korrekt.
export function makeDimension(
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

export function getDimension(formats: Dimension[], key: string): Dimension {
  return formats.find((d) => d.key === key) ?? formats[0];
}
