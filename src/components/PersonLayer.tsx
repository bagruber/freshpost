import { useId, useLayoutEffect, useRef } from "react";
import type { Dimension } from "../core/canvas/dimension";
import { useDrag } from "../core/input/useDrag";

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

// === Frame-Tuning (rauer Sticker-Rand) ===
// Alpha-Schwelle: ab welcher Deckkraft zählt ein Pixel als "voll". 10 Werte →
// Grenze bei k/10; "...0 1 1 1" = ~0.7 (unscharfe Ränder/Halos fallen weg).
const ALPHA_STEP = "0 0 0 0 0 0 0 1 1 1";
const ROUND_STEP = "0 0 0 0 0 1 1 1 1 1"; // Re-Schwelle nach Blur (~0.5)
const ROUND_BLUR = 0.8; // minimale Glättung → Ecken bleiben kantig
const TURB_FREQ = 0.004; // sehr niedrig → wenige, große Auslenkungen (weniger Ecken)

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
        <filter id={fid} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
          {/* 1. Alpha hart schwellen → unscharfe Kanten/Halos entfernen */}
          <feComponentTransfer in="SourceAlpha" result="solid">
            <feFuncA type="discrete" tableValues={ALPHA_STEP} />
          </feComponentTransfer>
          {/* 2. dilatieren (Rahmendicke) */}
          <feMorphology in="solid" operator="dilate" radius={thickness} result="dil" />
          {/* 3. rough versetzen (gröbere, weiche Turbulenz) */}
          <feTurbulence type="fractalNoise" baseFrequency={TURB_FREQ} numOctaves="1" seed="7" result="noise" />
          <feDisplacementMap in="dil" in2="noise" scale={rough} result="disp" />
          {/* 4. Ecken runden: Blur + erneut schwellen */}
          <feGaussianBlur in="disp" stdDeviation={ROUND_BLUR} result="blur" />
          <feComponentTransfer in="blur" result="rounded">
            <feFuncA type="discrete" tableValues={ROUND_STEP} />
          </feComponentTransfer>
          {/* 5. einfärben, Original darüber */}
          <feFlood floodColor={frameColor} result="col" />
          <feComposite in="col" in2="rounded" operator="in" result="frame" />
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
