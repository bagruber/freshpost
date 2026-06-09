import { useRef } from "react";
import { usePointerDrag } from "./usePointerDrag";

// Drag eines Stickers per Pointer. Meldet die rohe Mittelpunkt-Position als
// Bruchteil (0..1) der Stage; das Clamping macht der Aufrufer.

type Pos = { x: number; y: number };

export function useDrag(
  stageRef: React.RefObject<HTMLElement | null>,
  onChange: (pos: Pos) => void,
) {
  // Offset zwischen Pointer und Sticker-Mittelpunkt beim Greifen.
  const grab = useRef<Pos>({ x: 0, y: 0 });

  const startDrag = usePointerDrag({
    onMove: (e) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      onChange({
        x: (e.clientX - rect.left) / rect.width - grab.current.x,
        y: (e.clientY - rect.top) / rect.height - grab.current.y,
      });
    },
  });

  return (e: React.PointerEvent, current: Pos) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    grab.current = {
      x: (e.clientX - rect.left) / rect.width - current.x,
      y: (e.clientY - rect.top) / rect.height - current.y,
    };
    startDrag(e);
  };
}
