import { useLayoutEffect, useRef } from "react";
import type { Claim } from "../lib/types";
import { STYLE_BG, STYLE_FG } from "../lib/types";
import type { Dimension } from "../lib/dimensions";
import { buildBoxes, PAD_X, PAD_Y } from "../lib/boxes";
import { useDrag } from "../hooks/useDrag";

// Stack aus einzelnen Sticker-Boxen (upper / main / lower). Echte Zeilenumbrüche
// kommen aus dem Input. Boxen überlappen leicht; Oben/Unten können horizontal
// versetzt sein. Die ganze Gruppe wird gemeinsam geneigt und verschoben.

type Props = {
  claim: Claim;
  dimension: Dimension;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onDrag: (raw: { x: number; y: number }) => void;
  onMeasure: (size: { w: number; h: number }) => void;
};

export function ClaimGroup({ claim, dimension, stageRef, onDrag, onMeasure }: Props) {
  const groupRef = useRef<HTMLDivElement>(null);
  const onPointerDown = useDrag(stageRef, onDrag);

  const mainPx = claim.mainSize * dimension.width;
  const boxes = buildBoxes(claim, claim.secScale);
  const offsetPx = claim.secOffset * mainPx;

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
      {boxes.map((b, i) => {
        const fontPx = mainPx * b.ratio;
        const shift = b.segment === "main" ? 0 : offsetPx;
        return (
          <div
            key={i}
            className="claim-box"
            style={{
              background: STYLE_BG[b.style],
              color: STYLE_FG[b.style],
              fontSize: fontPx,
              fontWeight: b.weight,
              padding: `${fontPx * PAD_Y}px ${fontPx * PAD_X}px`,
              marginTop: i === 0 ? 0 : -fontPx * b.overlap,
              transform: shift ? `translateX(${shift}px)` : undefined,
              textTransform: b.cap ? "uppercase" : "none",
            }}
          >
            {b.text}
          </div>
        );
      })}
    </div>
  );
}
