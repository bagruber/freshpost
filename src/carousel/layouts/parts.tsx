import type { CSSProperties } from "react";
import type { Dimension } from "../../lib/dimensions";
import type { Slide } from "../model";
import { TYPE, fs, STICKER_BG, STICKER_TEXT, FLUSH_TEXT } from "../model";
import { parseMarkers, type MarkKind } from "../parseMarkers";

// Gemeinsame Textbausteine für ALLE Layouts — ein Satz Größen/Weights, damit
// die Slides zueinander passen. Farben immer hell auf River/dunkel.

// --- Kopf (Überzeile + Überschrift), je flush oder gekippter Sticker --------
// Sind BEIDE Sticker, überlappen sie leicht und sind parallel geneigt (wie die
// Claim-Sticker im Einzelpost-Tool).
// Wie im Claim-Stack (boxes.ts, OVERLAP_BETWEEN): die beiden Sticker überlappen
// leicht — nur im Padding, sodass die Boxen verschmelzen ohne Text zu verdecken.
// Als Bruchteil der Überschrift-Höhe, im lokalen Raum → nach der Neigung
// konstant (die ganze Gruppe wird gekippt, nicht jeder Sticker einzeln).
const STACK_OVERLAP = 0.1;

export function Header({ slide, dimension, minHeight }: { slide: Slide; dimension: Dimension; minHeight?: number }) {
  const hasK = slide.kicker.trim().length > 0;
  const hasH = slide.heading.trim().length > 0;
  if (!hasK && !hasH) return minHeight ? <div className="cx-header" style={{ minHeight }} /> : null;
  const both = hasK && hasH && slide.kickerSticker && slide.headingSticker;

  const kickerSize = fs(dimension, TYPE.kicker);
  const headingSize = fs(dimension, TYPE.heading);
  const bodyGap = fs(dimension, TYPE.body); // Abstand Kopf → Absatz

  const eyebrow = (rotate: boolean) => (
    <span
      className="cx-eyebrow-sticker"
      style={{ fontSize: kickerSize, transform: rotate ? `rotate(${slide.tilt}deg)` : undefined, background: STICKER_BG[slide.kickerColor], color: STICKER_TEXT[slide.kickerColor] }}
    >
      {slide.kicker}
    </span>
  );
  const headingStick = (rotate: boolean, extra?: CSSProperties) => (
    <span
      className="cx-heading-sticker"
      style={{ fontSize: headingSize, fontWeight: TYPE.headingWeight, transform: rotate ? `rotate(${slide.tilt}deg)` : undefined, background: STICKER_BG[slide.headingColor], color: STICKER_TEXT[slide.headingColor], ...extra }}
    >
      {slide.heading}
    </span>
  );

  // Zwei Sticker: als EINE Gruppe kippen → definierter, kippungs-unabhängiger
  // Abstand zwischen Überzeile und Überschrift.
  if (both) {
    return (
      <div className="cx-header both" style={{ minHeight }}>
        <div className="cx-sticker-stack" style={{ transform: `rotate(${slide.tilt}deg)`, marginBottom: bodyGap }}>
          {eyebrow(false)}
          {headingStick(false, { marginTop: -headingSize * STACK_OVERLAP })}
        </div>
      </div>
    );
  }

  // Gemischt / einzeln: Sticker einzeln kippen, flush gerade.
  const kickerMB = hasH ? headingSize * 0.14 : bodyGap;
  return (
    <div className="cx-header" style={{ minHeight }}>
      {hasK &&
        (slide.kickerSticker ? (
          <div className="cx-eyebrow-wrap" style={{ marginBottom: kickerMB }}>{eyebrow(true)}</div>
        ) : (
          <div className="cx-kicker" style={{ fontSize: kickerSize, letterSpacing: `${TYPE.kickerTrack}em`, color: FLUSH_TEXT[slide.kickerColor], marginBottom: kickerMB }}>
            {slide.kicker}
          </div>
        ))}

      {hasH &&
        (slide.headingSticker ? (
          <div className="cx-heading-wrap" style={{ marginBottom: bodyGap }}>{headingStick(true)}</div>
        ) : (
          <h2 className="cx-heading" style={{ fontSize: headingSize, fontWeight: TYPE.headingWeight, color: FLUSH_TEXT[slide.headingColor], marginBottom: bodyGap }}>
            {slide.heading}
          </h2>
        ))}
    </div>
  );
}

const MARK_CLASS: Record<MarkKind, string> = {
  none: "",
  rose: "cx-mark cx-mark-rose",
  wind: "cx-mark cx-mark-wind",
  white: "cx-mark cx-mark-white",
};

// Kleiner, stabiler Tilt pro Marker (deterministisch, nicht bei jedem Render neu).
function markTilt(text: string, i: number): number {
  let h = i * 7;
  for (let k = 0; k < text.length; k++) h = (h * 31 + text.charCodeAt(k)) % 997;
  return (h % 5) - 2; // -2..2°
}

export function BodyText({ text, dimension }: { text: string; dimension: Dimension }) {
  const paras = parseMarkers(text);
  if (paras.length === 0) return null;
  return (
    <div className="cx-body" style={{ fontSize: fs(dimension, TYPE.body), lineHeight: TYPE.bodyLine, fontWeight: TYPE.bodyWeight }}>
      {paras.map((runs, i) => (
        <p key={i}>
          {runs.map((r, j) =>
            r.mark === "none" ? (
              <span key={j}>{r.text}</span>
            ) : (
              <span key={j} className={MARK_CLASS[r.mark]} style={{ transform: `rotate(${markTilt(r.text, j)}deg)` }}>
                {r.text}
              </span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

export function Attribution({ text, dimension }: { text: string; dimension: Dimension }) {
  if (!text.trim()) return null;
  const [name, ...rest] = text.split(/\n/);
  return (
    <div className="cx-attr" style={{ fontSize: fs(dimension, TYPE.attribution) }}>
      <b>{name}</b>
      {rest.length > 0 && <span>{rest.join(" ")}</span>}
    </div>
  );
}
