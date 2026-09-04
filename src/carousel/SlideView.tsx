import type { CSSProperties } from "react";
import type { Dimension } from "../lib/dimensions";
import type { Slide, Layer, LogoPos, LayoutType } from "./model";
import { LayoutForeground } from "./Layouts";
import { SwipeBar } from "./SwipeBar";
import { useSlideDrag } from "./useSlideDrag";

// Geteiltes Thema aller Slides einer Folge.
export type RenderTheme = {
  gradientCss: string;
  back: Layer[]; // Struktur + Textur hinter dem Inhalt
  front: Layer[]; // Struktur + Textur VOR dem Inhalt
  logoUrl: string | null;
  logoPos: LogoPos;
  swipeBottom: boolean;
  headerMins: Record<LayoutType, number>;
};

type Props = {
  slide: Slide;
  index: number;
  total: number;
  dimension: Dimension;
  theme: RenderTheme;
  onImgMove?: (x: number, y: number) => void; // nur Vorschau (interaktiv)
};

export function SlideView({ slide, index, total, dimension, theme, onImgMove }: Props) {
  const { width, height } = dimension;
  const interactive = !!onImgMove;
  const startImgDrag = useSlideDrag(onImgMove ?? (() => {}));

  // Verlauf/Struktur/Papier laufen über mehrere Slides → pro Slide geschnitten.
  const sheetStyle = (l: Layer): CSSProperties => ({
    backgroundImage: `url(${l.url})`,
    backgroundSize: `${l.span * width}px ${height}px`,
    backgroundPosition: `${-(index % l.span) * width}px 0`,
    backgroundRepeat: "no-repeat",
    mixBlendMode: l.blend as CSSProperties["mixBlendMode"],
    opacity: l.opacity,
  });
  const tileStyle = (l: Layer): CSSProperties => ({
    backgroundImage: `url(${l.url})`,
    backgroundRepeat: "repeat",
    mixBlendMode: l.blend as CSSProperties["mixBlendMode"],
    opacity: l.opacity,
  });
  const layerStyle = (l: Layer): CSSProperties => (l.place === "tile" ? tileStyle(l) : sheetStyle(l));

  const gradStyle: CSSProperties = {
    backgroundImage: theme.gradientCss,
    backgroundSize: `${total * width}px ${height}px`,
    backgroundPosition: `${-index * width}px 0`,
    backgroundRepeat: "no-repeat",
  };

  const overlayImg = slide.layout === "overlay" ? slide.images[0] : undefined;
  const duoStyle: CSSProperties = {
    mixBlendMode: slide.imageMode === "duotone" ? "luminosity" : "normal",
    filter: slide.imageMode === "duotone" ? "grayscale(1) contrast(1.05)" : undefined,
    // Größe frei (auch < 100% → Bild schrumpft, Verlauf zeigt sich ringsum).
    transform: `translate(${slide.imgOffX * width}px, ${slide.imgOffY * height}px) scale(${overlayImg ? overlayImg.scale : 1})`,
  };

  return (
    <div className="cx-slide" style={{ width, height }}>
      <div className="cx-grad" style={gradStyle} />

      {overlayImg && (
        <img
          src={overlayImg.url}
          alt=""
          draggable={false}
          className={`cx-duo-img${interactive ? " cx-draggable" : ""}`}
          style={duoStyle}
          onPointerDown={interactive ? (e) => { e.stopPropagation(); startImgDrag(e, slide.imgOffX, slide.imgOffY); } : undefined}
        />
      )}

      {theme.back.map((l) => (
        <div key={l.key} className="cx-layer" style={layerStyle(l)} />
      ))}

      <LayoutForeground
        slide={slide}
        dimension={dimension}
        headerMin={theme.headerMins[slide.layout]}
        interactive={interactive}
        onImgDown={interactive ? startImgDrag : undefined}
      />

      {theme.front.map((l) => (
        <div key={l.key} className="cx-layer cx-layer-front" style={layerStyle(l)} />
      ))}

      {theme.logoUrl && (
        <img
          src={theme.logoUrl}
          alt=""
          draggable={false}
          className={`cx-logo cx-logo-${theme.logoPos}`}
          style={{ width: width * 0.055 }}
        />
      )}

      <SwipeBar index={index} total={total} bottom={theme.swipeBottom} dimension={dimension} />
    </div>
  );
}
