import { useRef, useCallback } from "react";

// Drag eines Stickers per Pointer (Maus + Touch). Meldet die rohe
// Mittelpunkt-Position als Bruchteil (0..1) der Stage; das Clamping
// (Canvas-Grenzen, Safety-Warnung) macht der Aufrufer.

type Pos = { x: number; y: number };

export function useDrag(
  stageRef: React.RefObject<HTMLElement | null>,
  onChange: (pos: Pos) => void,
) {
  // Offset zwischen Pointer und Sticker-Mittelpunkt beim Greifen.
  const grab = useRef<Pos>({ x: 0, y: 0 });

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      onChange({
        x: (e.clientX - rect.left) / rect.width - grab.current.x,
        y: (e.clientY - rect.top) / rect.height - grab.current.y,
      });
    },
    [stageRef, onChange],
  );

  const onPointerUp = useCallback(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, current: Pos) => {
      e.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      grab.current = {
        x: (e.clientX - rect.left) / rect.width - current.x,
        y: (e.clientY - rect.top) / rect.height - current.y,
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [stageRef, onPointerMove, onPointerUp],
  );

  return onPointerDown;
}
