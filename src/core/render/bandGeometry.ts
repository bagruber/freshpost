import type { Brand, Layout } from "../../brand/contract";

// Wo die Farbflaeche sitzt, wie hoch sie ist und wo der Satz beginnt.
//
// Reine Arithmetik, absichtlich aus FrameView herausgezogen: das ist die eine
// neue Mechanik dieses Umbaus (die inhaltsbemessene Flaeche), und im JSX waere
// sie nicht pruefbar. Der Test rechnet sie gegen gemessene Originale nach.

export type BandInput = {
  brand: Brand;
  layout: Layout;
  width: number;
  height: number;
  textHeight: number; // gemessene Hoehe des Satzes in Export-Pixeln
  logoAspect: number; // Breite/Hoehe des Logos, 0 = kein Logo
};

export type BandGeometry = {
  bandTop: number;
  bandHeight: number;
  textTop: number;
  mediaTop: number;
  mediaHeight: number;
  logoHeight: number;
};

export function bandGeometry(input: BandInput): BandGeometry {
  const { brand, layout, width, height, textHeight, logoAspect } = input;

  const pad = Math.round(width * brand.bandPadding);
  const fixed = brand.logo.fixed;
  const logoHeight = fixed && logoAspect > 0 ? Math.round((width * fixed.width) / logoAspect) : 0;
  const logoBottom = fixed ? Math.round(width * fixed.bottom) : 0;
  // Luft zwischen Satz und Logo, wenn beide in derselben Flaeche stehen.
  const logoGap = Math.round(width * 0.078);
  const logoBlock = logoHeight > 0 ? logoGap + logoHeight + logoBottom : pad;

  // Eine Flaeche unten (oder ganzflaechig) traegt das Logo mit, eine oben nicht.
  const carriesLogo = layout.band === "bottom" || layout.band === "full";
  const auto = pad + textHeight + (carriesLogo ? logoBlock : pad);

  const bandHeight =
    layout.band === "none" ? 0
    : layout.band === "full" ? height
    : layout.bandSize === "auto" ? Math.min(height, auto)
    : Math.round(height * layout.bandSize);

  const bandTop = layout.band === "bottom" ? height - bandHeight : 0;

  let textTop: number;
  if (layout.band === "top") textTop = pad;
  else if (layout.band === "bottom") textTop = bandTop + pad;
  else textTop = layout.align === "bottom" ? height - logoBlock - textHeight : pad;

  const mediaTop = layout.band === "top" ? bandHeight : 0;
  const mediaHeight =
    layout.band === "full" ? 0 : height - (layout.band === "none" ? 0 : bandHeight);

  return { bandTop, bandHeight, textTop, mediaTop, mediaHeight, logoHeight };
}
