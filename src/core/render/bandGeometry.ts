import type { Brand, Layout } from "../../brand/contract";

// Wo die Farbflaeche sitzt, wie gross sie ist, wo der Satz beginnt und welchen
// Platz das Bild bekommt.
//
// Reine Arithmetik, absichtlich aus FrameView herausgezogen: hier stecken die
// beiden Mechaniken, die man im JSX nicht pruefen koennte — die
// inhaltsbemessene Flaeche und die schraege Flaechenkante. Der Test rechnet
// beide gegen gemessene Originale nach.

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
  bandLeft: number;
  bandWidth: number;
  bandHeight: number;
  // clip-path fuer eine schraege Kante, sonst null.
  bandClip: string | null;
  textTop: number;
  textLeft: number;
  textWidth: number;
  mediaTop: number;
  mediaLeft: number;
  mediaWidth: number;
  mediaHeight: number;
  logoHeight: number;
};

export function bandGeometry(input: BandInput): BandGeometry {
  const { brand, layout, width, height, textHeight, logoAspect } = input;

  const margin = Math.round(width * brand.margin);
  const pad = Math.round(width * brand.bandPadding);
  const padTop = layout.padTop === undefined ? pad : Math.round(width * layout.padTop);
  const padBottom = layout.padBottom === undefined ? pad : Math.round(width * layout.padBottom);

  // Nur ein FEST gesetztes Logo (Marke ohne waehlbare Positionen) haelt Platz
  // in der Flaeche frei. Wo das Logo frei platziert wird, sorgt padBottom
  // dafuer, dass der Satz ihm ausweicht.
  const fixed = brand.logo.placements.length === 0 ? brand.logo.fixed : undefined;
  const logoHeight = fixed && logoAspect > 0 ? Math.round((width * fixed.width) / logoAspect) : 0;
  const logoBottom = fixed ? Math.round(width * fixed.bottom) : 0;
  // Luft zwischen Satz und Logo, wenn beide in derselben Flaeche stehen.
  const logoGap = Math.round(width * 0.078);
  const logoBlock = logoHeight > 0 ? logoGap + logoHeight + logoBottom : padBottom;

  const side = layout.band === "side";
  const textWidth = Math.round(width * layout.textWidth);

  // --- Flaeche ------------------------------------------------------------
  // Eine Flaeche unten (oder ganzflaechig) traegt das feste Logo mit, eine
  // oben nicht.
  const carriesLogo = layout.band === "bottom" || layout.band === "full";
  const auto = padTop + textHeight + (carriesLogo ? logoBlock : padBottom);

  const bandCross =
    layout.bandSize === "auto" ? Math.min(height, auto) : Math.round(height * layout.bandSize);

  const bandHeight =
    layout.band === "none" ? 0
    : layout.band === "full" || side ? height
    : bandCross;

  const bandWidth =
    layout.band === "none" ? 0
    : side ? Math.round(width * (layout.bandSize === "auto" ? layout.textWidth : layout.bandSize))
    : width;

  const bandLeft = side && layout.sideAt === "right" ? width - bandWidth : 0;
  const bandTop = layout.band === "bottom" ? height - bandHeight : 0;

  // Schraege Kante: die Flaeche steigt von rechts nach links um `edgeCut`
  // ihrer eigenen Hoehe an. Als clip-path, damit darunter das Bild durchsieht.
  const cut = layout.edge === "diagonal" ? (layout.edgeCut ?? 0) : 0;
  const bandClip = cut > 0 ? `polygon(0 ${cut * 100}%, 100% 0, 100% 100%, 0 100%)` : null;

  // --- Satz ---------------------------------------------------------------
  const overhang = Math.round(height * (layout.textOverhang ?? 0));
  let textTop: number;
  if (side || layout.band === "top" || layout.band === "full") textTop = padTop;
  else if (layout.band === "bottom") textTop = bandTop + padTop - overhang;
  else textTop = layout.align === "bottom" ? height - logoBlock - textHeight : padTop;

  const textLeft = bandLeft + margin;

  // --- Bild ---------------------------------------------------------------
  // "fill" liegt randabfallend hinter allem, "float" in einem gesetzten
  // Kasten, "zone" in der Flaeche, die das Band uebrig laesst. Bei schraeger
  // Kante reicht die Bildzone bis zur HOECHSTEN Stelle der Kante, sonst
  // klaffte an der langen Ecke eine Luecke.
  let mediaTop = 0;
  let mediaLeft = 0;
  let mediaWidth = width;
  let mediaHeight = height;

  if (layout.media.place === "float" && layout.media.box) {
    const b = layout.media.box;
    mediaWidth = Math.round(width * b.width);
    mediaHeight = Math.round(height * b.height);
    mediaLeft = width - Math.round(width * b.right) - mediaWidth;
    mediaTop = height - Math.round(height * b.bottom) - mediaHeight;
  } else if (layout.media.place === "zone") {
    if (side) {
      mediaLeft = layout.sideAt === "right" ? 0 : bandWidth;
      mediaWidth = width - bandWidth;
    } else if (layout.band === "full") {
      mediaHeight = 0;
    } else if (layout.band === "top") {
      mediaTop = bandHeight;
      mediaHeight = height - bandHeight;
    } else if (layout.band === "bottom") {
      mediaHeight = bandTop + Math.round(bandHeight * cut);
    }
  }

  return {
    bandTop, bandLeft, bandWidth, bandHeight, bandClip,
    textTop, textLeft, textWidth,
    mediaTop, mediaLeft, mediaWidth, mediaHeight,
    logoHeight,
  };
}
