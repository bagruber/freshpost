import { useRef, useCallback } from "react";
import { clampToSafe, type Insets } from "../lib/dimensions";

// Drag eines Stickers per Pointer (Maus + Touch). Positionen sind Bruchteile
// (0..1) relativ zur Stage, daher unabhängig von der Vorschau-Skalierung.

type Pos = { x: number; y: number };

export function useDrag(
  stageRef: React.RefObject<HTMLElement | null>,
  safe: Insets,
  onChange: (pos: Pos) => void,
) {
  // Offset zwischen Pointer und Sticker-Mittelpunkt beim Greifen.
  const grab = useRef<Pos>({ x: 0, y: 0 });

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - grab.current.x;
      const y = (e.clientY - rect.top) / rect.height - grab.current.y;
      onChange(clampToSafe(x, y, safe));
    },
    [stageRef, safe, onChange],
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
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      grab.current = { x: px - current.x, y: py - current.y };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [stageRef, onPointerMove, onPointerUp],
  );

  return onPointerDown;
}
