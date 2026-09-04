import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Brand } from "../../brand/contract";
import { getLayout, getSurface } from "../../brand/contract";
import type { Dimension } from "../canvas/dimension";
import type { Frame } from "../doc/composition";
import { TextStack } from "./TextStack";
import { tintedSvgUrl, svgAspect } from "./tintSvg";
import { bandGeometry } from "./bandGeometry";

// Rendert einen Frame in echten Export-Pixeln. Was gerendert wird, steht im
// Marken-Paket: das Layout sagt, wo die Flaeche sitzt und welche Rollen in
// welcher Reihenfolge hinein, die Rollen sagen, wie sie aussehen.
//
// Der interessante Teil ist die INHALTSBEMESSENE Flaeche (bandSize: "auto"):
// bei SZ waechst das Farbfeld mit seinem Text, das Bild bekommt den Rest.
// Dafuer wird der Satz erst gemessen und dann platziert — ein Renderdurchlauf
// mehr, denselben Weg geht `autoMainSize` beim Claim schon.

type Props = {
  frame: Frame;
  brand: Brand;
  dimension: Dimension;
  logoSvg?: string; // Rohtext des Marken-Logos
  interactive?: boolean;
};

export function FrameView({ frame, brand, dimension, logoSvg, interactive }: Props) {
  const { width, height } = dimension;
  const layout = getLayout(brand, frame.layoutId);
  const surface = getSurface(brand, frame.surfaceKey);
  const media = frame.media[0];

  const textRef = useRef<HTMLDivElement>(null);
  const [textH, setTextH] = useState(0);

  // Gemessene Satzhoehe. Dedupe wie ueberall sonst — sonst dreht sich der
  // Layout-Effekt endlos (React #185).
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const read = () => setTextH((p) => (Math.abs(p - el.offsetHeight) < 0.5 ? p : el.offsetHeight));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  });

  const margin = Math.round(width * brand.margin);
  const logoAspect = logoSvg ? svgAspect(logoSvg) : 0;

  // Die ganze Flaechenrechnung liegt in bandGeometry — dort ist sie pruefbar,
  // und der Test rechnet sie gegen gemessene Originale nach.
  const g = bandGeometry({ brand, layout, width, height, textHeight: textH, logoAspect });
  const fixed = brand.logo.fixed;

  const mediaStyle: CSSProperties = media
    ? {
        transform: `translate(${media.offX * width}px, ${media.offY * height}px) scale(${media.scale})`,
      }
    : {};

  const creditLabel = media ? brand.creditLabel[media.kind] ?? "" : "";
  const showCredit = !!media && !!media.credit && !!creditLabel;

  // Logo und Bildnachweis tragen die Textfarbe der Flaeche — auch bei einem
  // Layout ohne sichtbare Flaeche. Dort waehlt der Frame die Flaeche, die zum
  // Bild passt (dunkel → helle Schrift), statt dass der Kern eine Farbe raet.
  const logoUrl = logoSvg ? tintedSvgUrl(logoSvg, surface.ink) : null;

  return (
    <div className="fp-frame" style={{ width, height, background: surface.bg }}>
      {/* Bild, auf die Restflaeche beschnitten */}
      {media && layout.media > 0 && layout.band !== "full" && (
        <div className="fp-media" style={{ top: g.mediaTop, height: g.mediaHeight }}>
          <img
            className={`fp-media-img${interactive ? " fp-draggable" : ""}`}
            src={media.url}
            alt=""
            draggable={false}
            style={mediaStyle}
          />
          {layout.scrim && <div className="fp-scrim" />}
        </div>
      )}

      {/* Farbflaeche */}
      {layout.band !== "none" && (
        <div className="fp-band" style={{ top: g.bandTop, height: g.bandHeight, background: surface.bg }} />
      )}

      {/* Satz */}
      <div
        className="fp-text"
        ref={textRef}
        style={{ top: g.textTop, left: margin, width: Math.round(width * layout.textWidth) }}
      >
        <TextStack frame={frame} brand={brand} surface={surface} slots={layout.slots} width={width} />
      </div>

      {/* Bildnachweis */}
      {showCredit && (
        <div
          className="fp-credit"
          style={{
            top: Math.round(width * 0.014),
            right: margin,
            fontFamily: brand.type.display,
            fontSize: Math.round(width * 0.0165),
            color: surface.muted,
          }}
        >
          {creditLabel} {media.credit}
        </div>
      )}

      {/* Logo */}
      {logoUrl && fixed && (
        <img
          className="fp-logo"
          src={logoUrl}
          alt=""
          draggable={false}
          style={{
            width: Math.round(width * fixed.width),
            right: Math.round(width * fixed.right),
            bottom: Math.round(width * fixed.bottom),
            opacity: fixed.opacity,
          }}
        />
      )}
    </div>
  );
}
