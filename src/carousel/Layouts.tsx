import type { ReactNode } from "react";
import type { Dimension } from "../lib/dimensions";
import type { Slide } from "./model";
import { SURFACE_HEX, TYPE, fs } from "./model";
import { Header, BodyText, Attribution } from "./layouts/parts";
import { RoughImage } from "./RoughImage";

// Vordergrund je Layout-Vorlage. Hintergrund (Verlauf + Struktur + Textur) und
// das Overlay-Bild liegen in SlideView; hier Textzonen, Flächen und die
// Bilder von Diagonale/Randspalte. Alle nutzen dieselbe Typo-Skala (parts.tsx).

type OnImgDown = (e: React.PointerEvent, bx: number, by: number) => void;

type LProps = {
  slide: Slide;
  dimension: Dimension;
  headerMin: number;
  interactive: boolean;
  onImgDown?: OnImgDown;
};

// Verschiebbare Bildzone (Drag ⇒ imgOffX/Y). Nur in der Vorschau interaktiv.
function ImgZone({ slide, dimension, interactive, onImgDown, className, children }: LProps & { className: string; children: ReactNode }) {
  // Nur Position (Gruppen-Versatz); die Größe steuert jedes Bild einzeln.
  const style = {
    transform: `translate(${slide.imgOffX * dimension.width}px, ${slide.imgOffY * dimension.height}px)`,
  };
  const drag =
    interactive && onImgDown
      ? { onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); onImgDown(e, slide.imgOffX, slide.imgOffY); } }
      : {};
  return (
    <div className={`${className} cx-imgzone${interactive ? " cx-draggable" : ""}`} style={style} {...drag}>
      {children}
    </div>
  );
}

function Typo({ slide, dimension, headerMin }: LProps) {
  return (
    <div className="cx-fg cx-typo">
      <Header slide={slide} dimension={dimension} minHeight={headerMin} />
      <BodyText text={slide.body} dimension={dimension} />
    </div>
  );
}

function Overlay({ slide, dimension, headerMin }: LProps) {
  // Das Bild selbst liegt (tonal) im Hintergrund → SlideView.
  return (
    <div className="cx-fg cx-overlay">
      <div className="cx-overlay-scrim" />
      <div className="cx-overlay-text">
        <Header slide={slide} dimension={dimension} minHeight={headerMin} />
        <BodyText text={slide.body} dimension={dimension} />
      </div>
    </div>
  );
}

function Diagonal(props: LProps) {
  const { slide, dimension, headerMin } = props;
  const img = slide.images[0];
  return (
    <div className="cx-fg cx-diagonal">
      <div className="cx-diag-top">
        {img &&
          (slide.imageRough ? (
            <ImgZone {...props} className="cx-diag-rough">
              <RoughImage items={[{ url: img.url, scale: img.scale }]} thickness={fs(dimension, 0.012)} rough={fs(dimension, 0.01)} />
            </ImgZone>
          ) : (
            <ImgZone {...props} className="cx-diag-coverzone">
              <img className="cx-cover-img" src={img.url} alt="" draggable={false} style={{ transform: `scale(${img.scale})` }} />
            </ImgZone>
          ))}
      </div>
      <div className="cx-diag-surface" style={{ background: SURFACE_HEX[slide.surface] }} />
      <div className="cx-diag-content">
        <Header slide={slide} dimension={dimension} minHeight={headerMin} />
        <BodyText text={slide.body} dimension={dimension} />
      </div>
    </div>
  );
}

function Sidebar(props: LProps) {
  const { slide, dimension, headerMin } = props;
  const hasQuote = slide.attribution.trim().length > 0;
  const items = slide.images.map((im) => ({ url: im.url, scale: im.scale }));
  return (
    <div className="cx-fg cx-sidebar">
      <div className="cx-side-col" style={{ background: SURFACE_HEX[slide.surface] }}>
        {hasQuote && <span className="cx-quote-mark" style={{ fontSize: fs(dimension, TYPE.heading * 1.6) }}>„</span>}
        <Header slide={slide} dimension={dimension} minHeight={headerMin} />
        {hasQuote ? (
          <div className="cx-quote" style={{ fontSize: fs(dimension, TYPE.quote) }}>{slide.body}</div>
        ) : (
          <BodyText text={slide.body} dimension={dimension} />
        )}
        <Attribution text={slide.attribution} dimension={dimension} />
      </div>
      {items.length > 0 && (
        <ImgZone {...props} className="cx-side-img">
          <RoughImage items={items} thickness={fs(dimension, 0.012)} rough={fs(dimension, 0.01)} />
        </ImgZone>
      )}
    </div>
  );
}

export function LayoutForeground(props: LProps) {
  switch (props.slide.layout) {
    case "typo":
      return <Typo {...props} />;
    case "overlay":
      return <Overlay {...props} />;
    case "diagonal":
      return <Diagonal {...props} />;
    case "sidebar":
      return <Sidebar {...props} />;
  }
}
