import { useLayoutEffect, useRef } from "react";
import type { Claim } from "../core/doc/claim";
import type { Dimension } from "../core/canvas/dimension";
import { buildSegments } from "../core/text/boxes";
import { useDrag } from "../core/input/useDrag";
import { useBrand } from "../brand/context";
import { requireColors, requireSticker } from "../brand/contract";

// Stack aus Sektionsboxen (oben / main / unten). Jede Sektion ist eine Box mit
// durchgehendem Hintergrund; Zeilen darin eng gestapelt. Oben/Unten liegen
// optisch vor Main und können horizontal versetzt sein. Die ganze Gruppe wird
// gemeinsam geneigt und verschoben.

type Props = {
  claim: Claim;
  mainSize: number; // effektive Main-Größe (Standard: auto, Advanced: manuell)
  dimension: Dimension;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onDrag: (raw: { x: number; y: number }) => void;
  onMeasure: (size: { w: number; h: number }) => void;
};

export function ClaimGroup({ claim, mainSize, dimension, stageRef, onDrag, onMeasure }: Props) {
  const brand = useBrand();
  const st = requireSticker(brand);
  const palette = requireColors(brand).palette;
  const groupRef = useRef<HTMLDivElement>(null);
  const onPointerDown = useDrag(stageRef, onDrag);

  const mainPx = mainSize * dimension.width;
  const segs = buildSegments(claim, claim.secScale, st);

  useLayoutEffect(() => {
    const el = groupRef.current;
    if (el) onMeasure({ w: el.offsetWidth, h: el.offsetHeight });
  });

  return (
    <div
      ref={groupRef}
      className="claim-group"
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e, { x: claim.x, y: claim.y });
      }}
      style={{
        left: `${claim.x * 100}%`,
        top: `${claim.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${claim.tilt}deg)`,
      }}
    >
      {segs.map((seg, i) => {
        const fontPx = mainPx * seg.ratio;
        const shift = seg.offset * mainPx;
        return (
          <div
            key={seg.segment}
            className="claim-seg"
            style={{
              fontSize: fontPx,
              fontWeight: seg.weight,
              lineHeight: st.lineTight,
              marginTop: i === 0 ? 0 : -fontPx * seg.overlapTop,
              transform: shift ? `translateX(${shift}px)` : undefined,
              textTransform: seg.cap ? "uppercase" : "none",
              zIndex: seg.segment === "main" ? 1 : 2,
            }}
          >
            {seg.lines.map((line, j) => (
              <div
                key={j}
                className="claim-line"
                style={{
                  color: palette[seg.style].on,
                  padding: `${st.padY}em ${st.padX}em`,
                  marginTop: j === 0 ? 0 : `-${st.overlapWithin}em`,
                }}
              >
                {/* Hintergrund (z0) liegt unter ALLEM Text (z1) der Sektion —
                    so kann keine Box fremden Text verdecken. */}
                <span className="claim-bg" style={{ background: palette[seg.style].bg }} />
                <span className="claim-fg">{line}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
