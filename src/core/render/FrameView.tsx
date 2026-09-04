import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Brand, Surface } from "../../brand/contract";
import { getLayout, getSurface } from "../../brand/contract";
import type { Dimension } from "../canvas/dimension";
import type { Frame } from "../doc/composition";
import type { LogoCorner, LogoSize } from "../doc/logo";
import { TextStack } from "./TextStack";
import { tintedSvgUrl, svgAspect } from "./tintSvg";
import { bandGeometry } from "./bandGeometry";
import { Progress } from "./Progress";
import { RoughImage } from "./RoughImage";
import { useMediaDrag } from "./useMediaDrag";
import type { GroundLayer, GroundLayers } from "./useGroundLayers";

// Rendert einen Frame in echten Export-Pixeln. Was gerendert wird, steht im
// Marken-Paket: das Layout sagt, wo die Flaeche sitzt, wo das Bild liegt und
// welche Rollen in welcher Reihenfolge hinein; die Rollen sagen, wie sie
// aussehen.
//
// Die interessante Mechanik ist die INHALTSBEMESSENE Flaeche
// (bandSize: "auto"): bei SZ waechst das Farbfeld mit seinem Text, das Bild
// bekommt den Rest. Dafuer wird der Satz erst gemessen und dann platziert —
// ein Renderdurchlauf mehr.

// Was alle Frames einer Composition teilen. Wird einmal gebaut und an
// Vorschau, Miniaturen und Export gereicht.
export type FrameTheme = {
  // Durchlaufender Grund: eine Flaeche ueber alle Frames, sodass ein Verlauf
  // beim Wischen weiterlaeuft. null = jeder Frame malt seine eigene.
  ground: Surface | null;
  layers: GroundLayers;
  progress: "none" | "top" | "bottom";
  logoUrl: string | null;
  logoSvg?: string; // Rohtext, wenn das Logo eingefaerbt werden soll
  logoCorner: LogoCorner;
  logoSize: LogoSize;
  headMins: Record<string, number>; // Layout-Schluessel → gemessene Kopfhoehe
};

type Props = {
  frame: Frame;
  brand: Brand;
  dimension: Dimension;
  theme: FrameTheme;
  index?: number;
  total?: number;
  interactive?: boolean;
  onMediaMove?: (x: number, y: number) => void;
};

// Das Logo rastet in die Safety-Zone des Formats ein — dieselbe Regel wie im
// Einzelpost-Werkzeug, jetzt an einer Stelle.
function cornerStyle(corner: LogoCorner, dimension: Dimension, widthFraction: number): CSSProperties {
  const safe = dimension.safe;
  const s: CSSProperties = { width: Math.round(dimension.width * widthFraction) };
  if (corner === "tc") {
    s.top = `${safe.top * 100}%`;
    s.left = "50%";
    s.transform = "translateX(-50%)";
  } else {
    s.bottom = `${safe.bottom * 100}%`;
    if (corner === "bl") s.left = `${safe.left * 100}%`;
    else if (corner === "br") s.right = `${safe.right * 100}%`;
    else {
      s.left = "50%";
      s.transform = "translateX(-50%)";
    }
  }
  return s;
}

export function FrameView({ frame, brand, dimension, theme, index = 0, total = 1, interactive, onMediaMove }: Props) {
  const { width, height } = dimension;
  const layout = getLayout(brand, frame.layoutId);
  const surface = getSurface(brand, frame.surfaceKey);
  const spec = layout.media;

  const textRef = useRef<HTMLDivElement>(null);
  const [textH, setTextH] = useState(0);
  const startDrag = useMediaDrag(onMediaMove ?? (() => {}));

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
  const logoAspect = theme.logoSvg ? svgAspect(theme.logoSvg) : 0;
  const g = bandGeometry({ brand, layout, width, height, textHeight: textH, logoAspect });

  // --- Grund --------------------------------------------------------------
  // Ein Verlauf laeuft ueber alle Frames und wird je Frame ausgeschnitten;
  // eine glatte Farbe kann das nicht und braucht es auch nicht.
  const groundBg = theme.ground ? theme.ground.bg : surface.bg;
  const spans = !!theme.ground && /gradient\(/i.test(groundBg);
  const groundStyle: CSSProperties = spans
    ? {
        backgroundImage: groundBg,
        backgroundSize: `${total * width}px ${height}px`,
        backgroundPosition: `${-index * width}px 0`,
        backgroundRepeat: "no-repeat",
      }
    : { background: groundBg };

  // Textur laeuft als Blatt ueber `span` Frames oder kachelt.
  const layerStyle = (l: GroundLayer): CSSProperties =>
    l.place === "tile"
      ? { backgroundImage: `url(${l.url})`, backgroundRepeat: "repeat", mixBlendMode: l.blend as CSSProperties["mixBlendMode"], opacity: l.opacity }
      : {
          backgroundImage: `url(${l.url})`,
          backgroundSize: `${l.span * width}px ${height}px`,
          backgroundPosition: `${-(index % l.span) * width}px 0`,
          backgroundRepeat: "no-repeat",
          mixBlendMode: l.blend as CSSProperties["mixBlendMode"],
          opacity: l.opacity,
        };

  // --- Bild ---------------------------------------------------------------
  const items = frame.media.slice(0, spec.count);
  const first = items[0];
  const offset = `translate(${frame.mediaOffX * width}px, ${frame.mediaOffY * height}px)`;
  const dragProps = interactive && onMediaMove
    ? {
        className: "fp-draggable",
        onPointerDown: (e: React.PointerEvent) => {
          e.stopPropagation();
          startDrag(e, frame.mediaOffX, frame.mediaOffY);
        },
      }
    : {};

  const frameColor = brand.image?.frameColors[0].hex;
  const rough = frame.roughFrame && !!spec.frame && !!frameColor;

  const mediaBody =
    rough ? (
      <RoughImage
        items={items.map((m) => ({ url: m.url, scale: m.scale }))}
        frameColor={frameColor}
        thickness={Math.round(width * 0.012)}
        rough={Math.round(width * 0.01)}
      />
    ) : first ? (
      <img className="fp-media-img" src={first.url} alt="" draggable={false} style={{ transform: `scale(${first.scale})` }} />
    ) : null;

  const mediaRect: CSSProperties =
    spec.place === "fill"
      ? { inset: 0 }
      : { top: g.mediaTop, left: g.mediaLeft, width: g.mediaWidth, height: g.mediaHeight };

  const showMedia = spec.count > 0 && items.length > 0 && g.mediaHeight > 0;

  // --- Logo ---------------------------------------------------------------
  // Zwei Wege: eine Marke ohne waehlbare Positionen setzt es fest (SZ), sonst
  // waehlt der Beitrag eine Ecke aus den erlaubten.
  const fixed = brand.logo.placements.length === 0 ? brand.logo.fixed : undefined;
  const logoUrl = theme.logoSvg ? tintedSvgUrl(theme.logoSvg, surface.ink) : theme.logoUrl;
  const logoStyle: CSSProperties | null = !logoUrl
    ? null
    : fixed
      ? {
          width: Math.round(width * fixed.width),
          right: Math.round(width * fixed.right),
          bottom: Math.round(width * fixed.bottom),
          opacity: fixed.opacity,
        }
      : cornerStyle(theme.logoCorner, dimension, brand.logo.widths[theme.logoSize]);

  const creditLabel = first ? brand.creditLabel[first.kind] ?? "" : "";
  const showCredit = !!first && !!first.credit && !!creditLabel;

  return (
    <div className="fp-frame" style={{ width, height, ...groundStyle }}>
      {/* Randabfallendes Bild — liegt unter der Textur */}
      {showMedia && spec.place === "fill" && (
        <div className="fp-media fp-media-fill" style={mediaRect}>
          <div
            className="fp-media-group"
            style={{ transform: offset, mixBlendMode: frame.tone ? "luminosity" : undefined, filter: frame.tone ? "grayscale(1) contrast(1.05)" : undefined }}
            {...dragProps}
          >
            {mediaBody}
          </div>
          {spec.scrim && <div className="fp-scrim" />}
        </div>
      )}

      {theme.layers.back.map((l) => (
        <div key={l.key} className="fp-layer" style={layerStyle(l)} />
      ))}

      {/* Bild in der Restflaeche — unter der Farbflaeche, damit eine schraege
          Kante das Bild durchscheinen laesst */}
      {showMedia && spec.place === "zone" && (
        <div className="fp-media" style={mediaRect}>
          <div className="fp-media-group" style={{ transform: offset }} {...dragProps}>
            {mediaBody}
          </div>
          {spec.scrim && <div className="fp-scrim" />}
        </div>
      )}

      {/* Farbflaeche */}
      {layout.band !== "none" && (
        <div
          className="fp-band"
          style={{
            top: g.bandTop,
            left: g.bandLeft,
            width: g.bandWidth,
            height: g.bandHeight,
            background: surface.bg,
            clipPath: g.bandClip ?? undefined,
          }}
        />
      )}

      {/* Frei gesetztes Bild — darf die Farbflaeche ueberlappen */}
      {showMedia && spec.place === "float" && (
        <div className="fp-media fp-media-float" style={mediaRect}>
          <div className="fp-media-group" style={{ transform: offset }} {...dragProps}>
            {mediaBody}
          </div>
        </div>
      )}

      {/* Satz */}
      <div className="fp-text" ref={textRef} style={{ top: g.textTop, left: g.textLeft, width: g.textWidth }}>
        <TextStack
          frame={frame}
          brand={brand}
          surface={surface}
          layout={layout}
          width={width}
          headMin={theme.headMins[layout.key]}
        />
      </div>

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
          {creditLabel} {first.credit}
        </div>
      )}

      {theme.layers.front.map((l) => (
        <div key={l.key} className="fp-layer fp-layer-front" style={layerStyle(l)} />
      ))}

      {logoStyle && (
        <img
          className="fp-logo"
          src={logoUrl!}
          alt=""
          draggable={false}
          style={logoStyle}
        />
      )}

      {theme.progress !== "none" && brand.progress && (
        <Progress index={index} total={total} place={theme.progress} width={width} colors={brand.progress} />
      )}
    </div>
  );
}
