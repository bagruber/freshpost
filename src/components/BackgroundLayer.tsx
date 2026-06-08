import { useRef } from "react";

// Hintergrundbild: füllt die Stage (cover) und lässt sich verschieben, falls es
// in einer Achse übersteht. Umsetzung über object-position (0..100 %).

type Pos = { x: number; y: number };

type Props = {
  src: string;
  pos: Pos;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onChange: (pos: Pos) => void;
};

export function BackgroundLayer({ src, pos, stageRef, onChange }: Props) {
  const start = useRef<{ px: number; py: number; pos: Pos }>({ px: 0, py: 0, pos });

  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  const onMove = (e: PointerEvent) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const dx = (e.clientX - start.current.px) / rect.width;
    const dy = (e.clientY - start.current.py) / rect.height;
    // Bild mit dem Finger mitziehen → object-position gegenläufig.
    onChange({
      x: clamp(start.current.pos.x - dx * 100),
      y: clamp(start.current.pos.y - dy * 100),
    });
  };

  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { px: e.clientX, py: e.clientY, pos };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <img
      className="bg-image"
      src={src}
      alt=""
      draggable={false}
      onPointerDown={onPointerDown}
      style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
    />
  );
}
