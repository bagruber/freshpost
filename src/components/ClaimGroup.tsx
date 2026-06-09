import { useLayoutEffect, useRef } from "react";
import type { Claim } from "../lib/types";
import { STYLE_BG, STYLE_FG } from "../lib/types";
import type { Dimension } from "../lib/dimensions";
import { buildSegments, PAD_X, PAD_Y, LINE_TIGHT } from "../lib/boxes";
import { useDrag } from "../hooks/useDrag";

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
  const groupRef = useRef<HTMLDivElement>(null);
  const onPointerDown = useDrag(stageRef, onDrag);

  const mainPx = mainSize * dimension.width;
  const segs = buildSegments(claim, claim.secScale);

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
            className="claim-box"
            style={{
              background: STYLE_BG[seg.style],
              color: STYLE_FG[seg.style],
              fontSize: fontPx,
              fontWeight: seg.weight,
              lineHeight: LINE_TIGHT,
              padding: `${fontPx * PAD_Y}px ${fontPx * PAD_X}px`,
              marginTop: i === 0 ? 0 : -fontPx * seg.overlapTop,
              transform: shift ? `translateX(${shift}px)` : undefined,
              textTransform: seg.cap ? "uppercase" : "none",
              zIndex: seg.segment === "main" ? 1 : 2,
            }}
          >
            {seg.lines.map((line, j) => (
              <div key={j}>{line}</div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
