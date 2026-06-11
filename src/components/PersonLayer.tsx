import { useId, useLayoutEffect, useRef } from "react";
import type { Dimension } from "../lib/dimensions";
import { useDrag } from "../hooks/useDrag";

// Freigestellte Person mit rauer, kantiger Sticker-Umrandung. Der Rahmen
// entsteht per SVG-Filter: Alpha dilatieren (Dicke) → per Turbulenz/Displacement
// zerklüften → in Rahmenfarbe füllen → Original darüber. Der Container trägt
// einen Dropshadow wie die anderen Sticker.

type Props = {
  src: string;
  lookFilter: string; // CSS-Farbfilter für die Person ("" = keiner)
  frameColor: string; // Hex
  thickness: number; // Stage-px
  rough: number; // Displacement-Stärke
  x: number;
  y: number;
  scale: number;
  dimension: Dimension;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onDrag: (raw: { x: number; y: number }) => void;
  onMeasure: (size: { w: number; h: number }) => void;
};

export function PersonLayer({
  src, lookFilter, frameColor, thickness, rough, x, y, scale, dimension, stageRef, onDrag, onMeasure,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onPointerDown = useDrag(stageRef, onDrag);
  const fid = `frame-${useId().replace(/:/g, "")}`;

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) onMeasure({ w: el.offsetWidth, h: el.offsetHeight });
  });

  const imgFilter = lookFilter ? `${lookFilter} url(#${fid})` : `url(#${fid})`;

  return (
    <div
      ref={ref}
      className="person"
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e, { x, y });
      }}
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
        width: scale * dimension.width,
      }}
    >
      <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
        <filter id={fid} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={thickness} result="dil" />
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="dil" in2="noise" scale={rough} result="rough" />
          <feFlood floodColor={frameColor} result="col" />
          <feComposite in="col" in2="rough" operator="in" result="frame" />
          <feMerge>
            <feMergeNode in="frame" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </svg>
      <img src={src} alt="" draggable={false} style={{ filter: imgFilter }} />
    </div>
  );
}
