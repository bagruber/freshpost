import { useLayoutEffect, useRef } from "react";
import type { Claim } from "../lib/types";
import { STYLE_BG, STYLE_FG, secondaryStyle } from "../lib/types";
import type { Dimension } from "../lib/dimensions";
import { PAD_X, PAD_Y, SEC_RATIO } from "../lib/layout";
import { splitLines } from "../lib/measure";
import { useDrag } from "../hooks/useDrag";

// Stack aus einzelnen Sticker-Boxen (upper / main / lower). Echte Zeilenumbrüche
// kommen aus dem Input — jede Zeile ist eine eigene Box, lückenlos gestapelt.
// Die ganze Gruppe wird gemeinsam geneigt und verschoben.

type Props = {
  claim: Claim;
  dimension: Dimension;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onDrag: (raw: { x: number; y: number }) => void;
  onMeasure: (size: { w: number; h: number }) => void;
};

function Box({
  text,
  fontPx,
  style,
  weight,
}: {
  text: string;
  fontPx: number;
  style: Claim["mainStyle"];
  weight: number;
}) {
  return (
    <div
      className="claim-box"
      style={{
        background: STYLE_BG[style],
        color: STYLE_FG[style],
        fontSize: fontPx,
        fontWeight: weight,
        padding: `${fontPx * PAD_Y}px ${fontPx * PAD_X}px`,
      }}
    >
      {text}
    </div>
  );
}

export function ClaimGroup({ claim, dimension, stageRef, onDrag, onMeasure }: Props) {
  const groupRef = useRef<HTMLDivElement>(null);
  const onPointerDown = useDrag(stageRef, onDrag);

  const mainPx = claim.mainSize * dimension.width;
  const secPx = mainPx * SEC_RATIO;
  const sec = secondaryStyle(claim.mainStyle);

  const upper = splitLines(claim.upper);
  const main = splitLines(claim.main);
  const lower = splitLines(claim.lower);

  // Unskalierte Layout-Größe melden (für Drag-Clamping + Safety-Warnung).
  useLayoutEffect(() => {
    const el = groupRef.current;
    if (el) onMeasure({ w: el.offsetWidth, h: el.offsetHeight });
  }, [
    claim.upper, claim.main, claim.lower, claim.caps, claim.mainSize,
    claim.mainStyle, dimension, onMeasure,
  ]);

  // upper/lower nur mit main.
  const hasMain = main.length > 0;
  const showSec = hasMain;

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
        textTransform: claim.caps ? "uppercase" : "none",
      }}
    >
      {showSec &&
        upper.map((t, i) => (
          <Box key={`u${i}`} text={t} fontPx={secPx} style={sec} weight={700} />
        ))}
      {hasMain ? (
        main.map((t, i) => (
          <Box key={`m${i}`} text={t} fontPx={mainPx} style={claim.mainStyle} weight={800} />
        ))
      ) : (
        <Box text="Dein Claim" fontPx={mainPx} style={claim.mainStyle} weight={800} />
      )}
      {showSec &&
        lower.map((t, i) => (
          <Box key={`l${i}`} text={t} fontPx={secPx} style={sec} weight={700} />
        ))}
    </div>
  );
}
