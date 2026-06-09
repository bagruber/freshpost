import { useLayoutEffect, useRef } from "react";
import type { Dimension } from "../lib/dimensions";
import { useDrag } from "../hooks/useDrag";

// Ziehbare Illustration in einem Container mit Sticker-artigem Schatten.
// Position als Bruchteil der Stage, Breite als Bruchteil der Stage-Breite.

type Props = {
  src: string;
  x: number;
  y: number;
  scale: number;
  dimension: Dimension;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onDrag: (raw: { x: number; y: number }) => void;
  onMeasure: (size: { w: number; h: number }) => void;
};

export function IllustrationLayer({ src, x, y, scale, dimension, stageRef, onDrag, onMeasure }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onPointerDown = useDrag(stageRef, onDrag);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) onMeasure({ w: el.offsetWidth, h: el.offsetHeight });
  });

  return (
    <div
      ref={ref}
      className="illu"
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
      <img src={src} alt="" draggable={false} />
    </div>
  );
}
